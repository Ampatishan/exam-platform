import { db } from '@/lib/db';
import { GradingStatus, QuestionType } from '@prisma/client';

type GradeResult = { marksAwarded: number; gradingStatus: GradingStatus };

function isEmpty(response: unknown): boolean {
  if (response === null || response === undefined) return true;
  if (typeof response === 'string') return response.trim() === '';
  if (Array.isArray(response)) return response.length === 0;
  return false;
}

export function gradeQuestion(
  type: QuestionType,
  response: unknown,
  answerJson: unknown,
  acceptedJson: unknown,
  tolerance: number | null,
  marks: number,
): GradeResult {
  if (type === 'written') {
    return { marksAwarded: 0, gradingStatus: GradingStatus.PENDING };
  }

  // Empty response → always wrong
  if (isEmpty(response)) {
    return { marksAwarded: 0, gradingStatus: GradingStatus.AUTO_WRONG };
  }

  if (type === 'mcq') {
    const correct = String(answerJson) === String(response);
    return {
      marksAwarded: correct ? marks : 0,
      gradingStatus: correct ? GradingStatus.AUTO_CORRECT : GradingStatus.AUTO_WRONG,
    };
  }

  if (type === 'multi_select') {
    const expected = (answerJson as string[]).map(String).sort();
    const actual = ((response as string[]) ?? []).map(String).sort();
    const correct =
      expected.length === actual.length && expected.every((v, i) => v === actual[i]);
    return {
      marksAwarded: correct ? marks : 0,
      gradingStatus: correct ? GradingStatus.AUTO_CORRECT : GradingStatus.AUTO_WRONG,
    };
  }

  if (type === 'short_answer' || type === 'fill_blank') {
    const answer = String(answerJson).toLowerCase().trim();
    const resp = String(response).toLowerCase().trim();
    const accepted = ((acceptedJson as string[]) ?? []).map((a) => a.toLowerCase().trim());
    const correct = resp === answer || accepted.includes(resp);
    return {
      marksAwarded: correct ? marks : 0,
      gradingStatus: correct ? GradingStatus.AUTO_CORRECT : GradingStatus.AUTO_WRONG,
    };
  }

  if (type === 'numeric') {
    const answer = Number(answerJson);
    const resp = Number(response);
    if (isNaN(resp)) return { marksAwarded: 0, gradingStatus: GradingStatus.AUTO_WRONG };
    const tol = tolerance ?? 0;
    const correct = Math.abs(resp - answer) <= tol;
    return {
      marksAwarded: correct ? marks : 0,
      gradingStatus: correct ? GradingStatus.AUTO_CORRECT : GradingStatus.AUTO_WRONG,
    };
  }

  return { marksAwarded: 0, gradingStatus: GradingStatus.AUTO_WRONG };
}

export async function gradeSubmission(
  attemptId: string,
  userId: string,
  responses: { questionId: string; response: unknown }[],
  autoSubmitted: boolean,
) {
  const attempt = await db.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: { include: { questions: true } },
        },
      },
    },
  });

  if (attempt.userId !== userId) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  if (attempt.submittedAt) throw Object.assign(new Error('Already submitted'), { code: 'ALREADY_SUBMITTED' });

  const now = new Date();
  const expiresAt = new Date(attempt.startedAt.getTime() + attempt.test.durationMinutes * 60 * 1000);
  const isLate = now > new Date(expiresAt.getTime() + 30_000);

  // All questions in the test
  const allQuestions = attempt.test.sections.flatMap((s) => s.questions);
  const allQuestionMap = new Map(allQuestions.map((q) => [q.id, q]));

  // Index submitted responses by questionId
  const responseMap = new Map(responses.map((r) => [r.questionId, r.response]));

  // Grade every question — missing responses treated as empty (wrong)
  const answerData = allQuestions.map((q) => {
    const response = responseMap.has(q.id) ? responseMap.get(q.id) : null;
    const { marksAwarded, gradingStatus } = gradeQuestion(
      q.type,
      response,
      q.answerJson,
      q.acceptedJson,
      q.tolerance,
      q.marks,
    );
    return { questionId: q.id, response: response ?? null, marksAwarded, gradingStatus };
  });

  await db.$transaction([
    db.attempt.update({
      where: { id: attemptId },
      data: { submittedAt: now, autoSubmitted: autoSubmitted || isLate },
    }),
    ...answerData.map(({ questionId, response, marksAwarded, gradingStatus }) =>
      db.answer.create({
        data: {
          attemptId,
          questionId,
          responseJson: response as any,
          marksAwarded: gradingStatus === GradingStatus.PENDING ? null : marksAwarded,
          gradingStatus,
        },
      }),
    ),
  ]);

  const pendingWritten = answerData.some((a) => a.gradingStatus === GradingStatus.PENDING);

  return {
    results: answerData.map(({ questionId, marksAwarded, gradingStatus }) => ({
      questionId,
      marksAwarded: gradingStatus === GradingStatus.PENDING ? null : marksAwarded,
      gradingStatus,
      correctAnswer:
        gradingStatus === GradingStatus.AUTO_WRONG
          ? allQuestionMap.get(questionId)?.answerJson
          : undefined,
    })),
    pendingWritten,
  };
}

export async function getGradingQueue() {
  return db.answer.findMany({
    where: { gradingStatus: GradingStatus.PENDING },
    include: {
      question: { select: { text: true, marks: true } },
      attempt: { include: { user: { select: { username: true } }, test: { select: { title: true } } } },
    },
    orderBy: { attempt: { submittedAt: 'asc' } },
  });
}

export async function manualGrade(answerId: string, marksAwarded: number) {
  const answer = await db.answer.findUniqueOrThrow({
    where: { id: answerId },
    include: { question: true, attempt: true },
  });

  if (marksAwarded < 0 || marksAwarded > answer.question.marks) {
    throw Object.assign(new Error('Marks out of range'), { code: 'INVALID_MARKS' });
  }

  await db.answer.update({
    where: { id: answerId },
    data: { marksAwarded, gradingStatus: GradingStatus.MANUALLY_GRADED },
  });

  const pending = await db.answer.count({
    where: { attemptId: answer.attemptId, gradingStatus: GradingStatus.PENDING },
  });

  return { published: pending === 0 };
}

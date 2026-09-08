import { db } from '@/lib/db';
import { GradingStatus } from '@prisma/client';
import { gradeQuestion } from './grading';

export async function getPracticeQuestions(userId: string, subject?: string, sectionName?: string) {
  const wrongAnswers = await db.answer.findMany({
    where: {
      gradingStatus: GradingStatus.AUTO_WRONG,
      attempt: { userId },
    },
    include: {
      question: {
        include: {
          section: { include: { test: { select: { subject: true } } } },
        },
      },
    },
  });

  const seen = new Set<string>();
  const questions = [];

  for (const a of wrongAnswers) {
    const q = a.question;
    if (seen.has(q.id)) continue;
    seen.add(q.id);

    const testSubject = q.section.test.subject;
    if (subject && testSubject !== subject) continue;
    if (sectionName && q.section.name !== sectionName) continue;

    questions.push({
      id: q.id,
      type: q.type,
      text: q.text,
      marks: q.marks,
      difficulty: q.difficulty,
      options: q.optionsJson ?? undefined,
      answer: q.answerJson,
      accepted: q.acceptedJson ?? undefined,
      tolerance: q.tolerance ?? undefined,
      subject: testSubject,
      sectionName: q.section.name,
    });
  }

  return questions;
}

export async function checkPracticeAnswer(questionId: string, response: unknown) {
  const q = await db.question.findUniqueOrThrow({ where: { id: questionId } });
  const { marksAwarded, gradingStatus } = gradeQuestion(
    q.type,
    response,
    q.answerJson,
    q.acceptedJson,
    q.tolerance,
    q.marks,
  );
  return {
    correct: gradingStatus === GradingStatus.AUTO_CORRECT,
    correctAnswer: q.answerJson,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const attempt = await db.attempt.findUnique({
    where: { id: params.id },
    include: {
      answers: {
        include: { question: { select: { text: true, type: true, marks: true, optionsJson: true, sectionId: true } } },
      },
      test: { select: { title: true, subject: true } },
    },
  });

  if (!attempt) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  if (attempt.userId !== session.user.id && session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const pendingWritten = attempt.answers.some((a) => a.gradingStatus === 'PENDING');
  const totalAwarded = pendingWritten ? null : attempt.answers.reduce((s, a) => s + (a.marksAwarded ?? 0), 0);
  const totalPossible = attempt.answers.reduce((s, a) => s + a.question.marks, 0);

  return NextResponse.json({
    attemptId: attempt.id,
    testTitle: attempt.test.title,
    subject: attempt.test.subject,
    submittedAt: attempt.submittedAt,
    autoSubmitted: attempt.autoSubmitted,
    totalAwarded,
    totalPossible,
    pendingWritten,
    answers: attempt.answers.map((a) => ({
      questionId: a.questionId,
      questionText: a.question.text,
      questionType: a.question.type,
      marks: a.question.marks,
      response: a.responseJson,
      marksAwarded: a.marksAwarded,
      gradingStatus: a.gradingStatus,
    })),
  });
}

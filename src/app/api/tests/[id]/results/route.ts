import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const attempts = await db.attempt.findMany({
    where: { testId: params.id },
    orderBy: { submittedAt: 'desc' },
    include: {
      user: { select: { id: true, username: true } },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              text: true,
              marks: true,
              type: true,
              optionsJson: true,
              answerJson: true,
              section: { select: { name: true, order: true } },
              order: true,
            },
          },
        },
        orderBy: { question: { order: 'asc' } },
      },
    },
  });

  return NextResponse.json(
    attempts.map((a) => {
      const totalMarks = a.answers.reduce((sum, ans) => sum + (ans.question.marks ?? 0), 0);
      const earnedMarks = a.answers.reduce((sum, ans) => sum + (ans.marksAwarded ?? 0), 0);
      return {
        attemptId: a.id,
        student: a.user,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        autoSubmitted: a.autoSubmitted,
        totalMarks,
        earnedMarks,
        answers: a.answers.map((ans) => ({
          answerId: ans.id,
          questionText: ans.question.text,
          questionType: ans.question.type,
          maxMarks: ans.question.marks,
          optionsJson: ans.question.optionsJson,
          correctAnswer: ans.question.answerJson,
          section: ans.question.section.name,
          response: ans.responseJson,
          marksAwarded: ans.marksAwarded,
          gradingStatus: ans.gradingStatus,
        })),
      };
    }),
  );
}

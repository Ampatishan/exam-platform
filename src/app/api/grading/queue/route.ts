import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGradingQueue } from '@/lib/modules/grading';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  const queue = await getGradingQueue();
  return NextResponse.json(
    queue.map((a) => ({
      answerId: a.id,
      questionText: a.question.text,
      maxMarks: a.question.marks,
      studentResponse: a.responseJson,
      studentName: a.attempt.user.username,
      testTitle: a.attempt.test.title,
      submittedAt: a.attempt.submittedAt,
    })),
  );
}

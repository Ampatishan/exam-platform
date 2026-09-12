import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  if (session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const test = await db.test.findUnique({
    where: { id: params.id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!test) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json(test);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const attempts = await db.attempt.findMany({
    where: { testId: params.id },
    select: { id: true },
  });
  const attemptIds = attempts.map((a) => a.id);

  await db.$transaction([
    db.answer.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    db.attempt.deleteMany({ where: { testId: params.id } }),
    db.test.delete({ where: { id: params.id } }),
  ]);

  return new NextResponse(null, { status: 204 });
}

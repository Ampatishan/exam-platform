import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const PutSchema = z.object({ userIds: z.array(z.string()) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const assignments = await db.testAssignment.findMany({
    where: { testId: params.id },
    select: { userId: true },
  });

  return NextResponse.json({ userIds: assignments.map((a) => a.userId) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { userIds } = parsed.data;

  await db.$transaction([
    db.testAssignment.deleteMany({ where: { testId: params.id } }),
    ...(userIds.length > 0
      ? [db.testAssignment.createMany({
          data: userIds.map((userId) => ({ testId: params.id, userId })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  return NextResponse.json({ userIds });
}

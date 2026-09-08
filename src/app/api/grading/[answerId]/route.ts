import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { manualGrade } from '@/lib/modules/grading';
import { z } from 'zod';

const Schema = z.object({ marksAwarded: z.number().min(0) });

export async function POST(req: NextRequest, { params }: { params: { answerId: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  try {
    const result = await manualGrade(params.answerId, parsed.data.marksAwarded);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e.code === 'INVALID_MARKS') {
      return NextResponse.json({ error: 'Marks out of range', code: 'INVALID_MARKS' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkPracticeAnswer } from '@/lib/modules/practice';
import { z } from 'zod';

const Schema = z.object({ questionId: z.string(), response: z.unknown() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const result = await checkPracticeAnswer(parsed.data.questionId, parsed.data.response);
  return NextResponse.json(result);
}

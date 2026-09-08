import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { gradeSubmission } from '@/lib/modules/grading';
import { z } from 'zod';

const Schema = z.object({
  answers: z.array(z.object({ questionId: z.string(), response: z.unknown() })),
  autoSubmitted: z.boolean().default(false),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  try {
    const result = await gradeSubmission(
      params.id,
      session.user.id,
      parsed.data.answers as { questionId: string; response: unknown }[],
      parsed.data.autoSubmitted,
    );
    return NextResponse.json(result);
  } catch (e: any) {
    if (e.code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    if (e.code === 'ALREADY_SUBMITTED') return NextResponse.json({ error: 'Already submitted', code: 'ALREADY_SUBMITTED' }, { status: 409 });
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

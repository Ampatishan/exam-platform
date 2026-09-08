import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { startAttempt } from '@/lib/modules/test-delivery';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  if (session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const result = await startAttempt(session.user.id, params.id);
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e.code === 'WINDOW_CLOSED') {
      return NextResponse.json({ error: 'Test is not currently open', code: 'WINDOW_CLOSED' }, { status: 403 });
    }
    if (e.code === 'ALREADY_ATTEMPTED') {
      return NextResponse.json({ error: 'Already attempted', code: 'ALREADY_ATTEMPTED' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

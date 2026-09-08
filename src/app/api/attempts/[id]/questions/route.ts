import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAttemptQuestions } from '@/lib/modules/test-delivery';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const data = await getAttemptQuestions(params.id, session.user.id);
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

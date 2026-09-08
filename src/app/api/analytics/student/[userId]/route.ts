import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getStudentAnalytics } from '@/lib/modules/analytics';

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  // Students can only see their own analytics
  if (session.user.role === 'STUDENT' && session.user.id !== params.userId) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const data = await getStudentAnalytics(params.userId);
  return NextResponse.json(data);
}

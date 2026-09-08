import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTeacherAnalytics } from '@/lib/modules/analytics';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  const data = await getTeacherAnalytics();
  return NextResponse.json(data);
}

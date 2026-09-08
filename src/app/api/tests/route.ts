import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listTestsTeacher } from '@/lib/modules/test-ingestion';
import { listTestsStudent } from '@/lib/modules/test-delivery';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  if (session.user.role === 'TEACHER') {
    const tests = await listTestsTeacher();
    return NextResponse.json(tests);
  }

  const tests = await listTestsStudent(session.user.id);
  return NextResponse.json(tests);
}

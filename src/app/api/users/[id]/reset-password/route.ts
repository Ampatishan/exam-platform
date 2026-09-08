import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { resetStudentPassword } from '@/lib/modules/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const temporaryPassword = await resetStudentPassword(params.id);
    return NextResponse.json({ temporaryPassword });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteStudent } from '@/lib/modules/auth';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    await deleteStudent(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e.code === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Cannot delete non-student accounts', code: 'FORBIDDEN' }, { status: 403 });
    }
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'Student not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

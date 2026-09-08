import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createStudent, listStudents } from '@/lib/modules/auth';
import { z } from 'zod';

const CreateSchema = z.object({
  username: z.string().min(1).max(50),
  temporaryPassword: z.string().min(6),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  const students = await listStudents();
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const student = await createStudent(parsed.data.username, parsed.data.temporaryPassword);
    return NextResponse.json(student, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists', code: 'DUPLICATE_USERNAME' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

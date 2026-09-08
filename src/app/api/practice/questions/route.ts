import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPracticeQuestions } from '@/lib/modules/practice';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const subject = searchParams.get('subject') ?? undefined;
  const sectionName = searchParams.get('section') ?? undefined;

  const questions = await getPracticeQuestions(session.user.id, subject, sectionName);
  return NextResponse.json({ questions });
}

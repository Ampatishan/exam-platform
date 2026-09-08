import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseAndValidate, ingestTest } from '@/lib/modules/test-ingestion';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided', code: 'MISSING_FILE' }, { status: 400 });
  }

  let raw: unknown;
  try {
    const text = await file.text();
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON format', code: 'INVALID_JSON' }, { status: 400 });
  }

  try {
    const validated = parseAndValidate(raw);
    const testId = await ingestTest(validated);
    return NextResponse.json({ testId }, { status: 201 });
  } catch (e: any) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: 'Schema validation failed', code: 'SCHEMA_ERROR', details: e.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

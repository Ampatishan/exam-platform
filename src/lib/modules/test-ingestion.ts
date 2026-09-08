import { db } from '@/lib/db';
import { TestUploadSchema, TestUploadInput } from '@/lib/schemas/test-upload-schema';
import { Question } from '@prisma/client';

export function parseAndValidate(raw: unknown) {
  return TestUploadSchema.parse(raw);
}

export async function ingestTest(input: TestUploadInput): Promise<string> {
  const test = await db.test.create({
    data: {
      subject: input.subject,
      title: input.title,
      durationMinutes: input.duration_minutes,
      availableFrom: input.available_from ? new Date(input.available_from) : null,
      availableUntil: input.available_until ? new Date(input.available_until) : null,
      sections: {
        create: input.sections.map((section, si) => ({
          name: section.name,
          order: si,
          questions: {
            create: section.questions.map((q, qi) => {
              const base = {
                type: q.type,
                text: q.text,
                marks: q.marks,
                difficulty: q.difficulty,
                order: qi,
                optionsJson: null as any,
                answerJson: null as any,
                acceptedJson: null as any,
                tolerance: null as number | null,
              };
              if ('options' in q) base.optionsJson = q.options;
              if ('answer' in q) base.answerJson = q.answer;
              if ('accepted' in q && q.accepted) base.acceptedJson = q.accepted;
              if ('tolerance' in q) base.tolerance = q.tolerance ?? 0;
              return base;
            }),
          },
        })),
      },
    },
  });

  return test.id;
}

export function toStudentQuestion(q: Question) {
  const { answerJson, acceptedJson, tolerance, ...safe } = q;
  return safe;
}

export async function listTestsTeacher() {
  const tests = await db.test.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { _count: { select: { attempts: true } } },
  });
  return tests.map(({ _count, ...t }) => ({ ...t, attemptCount: _count.attempts }));
}

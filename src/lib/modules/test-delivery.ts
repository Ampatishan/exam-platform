import { db } from '@/lib/db';
import { toStudentQuestion } from './test-ingestion';

type TestStatus = 'open' | 'upcoming' | 'closed';

function getStatus(from: Date | null, until: Date | null, now: Date): TestStatus {
  if (!from && !until) return 'open';
  if (from && now < from) return 'upcoming';
  if (until && now > until) return 'closed';
  return 'open';
}

export async function listTestsStudent(userId: string) {
  const now = new Date();
  const tests = await db.test.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { attempts: { where: { userId }, select: { id: true } } },
  });

  return tests.map(({ attempts, ...t }) => ({
    id: t.id,
    subject: t.subject,
    title: t.title,
    durationMinutes: t.durationMinutes,
    availableFrom: t.availableFrom,
    availableUntil: t.availableUntil,
    status: getStatus(t.availableFrom, t.availableUntil, now),
    attempted: attempts.length > 0,
  }));
}

export async function startAttempt(userId: string, testId: string) {
  const now = new Date();
  const test = await db.test.findUniqueOrThrow({ where: { id: testId } });

  const status = getStatus(test.availableFrom, test.availableUntil, now);
  if (status !== 'open') {
    throw Object.assign(new Error('Test is not currently open'), { code: 'WINDOW_CLOSED' });
  }

  const existing = await db.attempt.findUnique({ where: { userId_testId: { userId, testId } } });
  if (existing) {
    throw Object.assign(new Error('Already attempted'), { code: 'ALREADY_ATTEMPTED' });
  }

  const attempt = await db.attempt.create({ data: { userId, testId } });
  const expiresAt = new Date(attempt.startedAt.getTime() + test.durationMinutes * 60 * 1000);

  return { attemptId: attempt.id, startedAt: attempt.startedAt, expiresAt };
}

export async function getAttemptQuestions(attemptId: string, userId: string) {
  const attempt = await db.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
            include: { questions: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  });

  if (attempt.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  }

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    startedAt: attempt.startedAt,
    expiresAt: new Date(attempt.startedAt.getTime() + attempt.test.durationMinutes * 60 * 1000),
    sections: attempt.test.sections.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      questions: s.questions.map(toStudentQuestion),
    })),
  };
}

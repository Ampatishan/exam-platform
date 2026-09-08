import { db } from '@/lib/db';
import { GradingStatus } from '@prisma/client';

export async function getStudentAnalytics(userId: string) {
  const attempts = await db.attempt.findMany({
    where: { userId, submittedAt: { not: null } },
    include: {
      test: { select: { subject: true, title: true, sections: { include: { questions: { select: { id: true, difficulty: true } } } } } },
      answers: { select: { questionId: true, marksAwarded: true, gradingStatus: true, question: { select: { marks: true, difficulty: true, sectionId: true } } } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  let totalAwarded = 0;
  let totalPossible = 0;
  const bySubject: Record<string, { awarded: number; possible: number }> = {};
  const bySection: Record<string, { name: string; awarded: number; possible: number }> = {};
  const byDifficulty: Record<string, { awarded: number; possible: number }> = {
    easy: { awarded: 0, possible: 0 },
    medium: { awarded: 0, possible: 0 },
    hard: { awarded: 0, possible: 0 },
  };

  const testHistory = attempts.map((attempt) => {
    const isGraded = attempt.answers.every((a) => a.gradingStatus !== GradingStatus.PENDING);
    const awarded = attempt.answers.reduce((s, a) => s + (a.marksAwarded ?? 0), 0);
    const possible = attempt.answers.reduce((s, a) => s + a.question.marks, 0);

    if (isGraded) {
      totalAwarded += awarded;
      totalPossible += possible;

      const subj = attempt.test.subject;
      bySubject[subj] = bySubject[subj] ?? { awarded: 0, possible: 0 };
      bySubject[subj].awarded += awarded;
      bySubject[subj].possible += possible;

      // Build section id→name map
      const sectionNames: Record<string, string> = {};
      for (const s of attempt.test.sections) {
        sectionNames[s.id] = s.name;
      }

      for (const a of attempt.answers) {
        const sId = a.question.sectionId;
        bySection[sId] = bySection[sId] ?? { name: sectionNames[sId] ?? sId, awarded: 0, possible: 0 };
        bySection[sId].awarded += a.marksAwarded ?? 0;
        bySection[sId].possible += a.question.marks;

        const diff = a.question.difficulty;
        byDifficulty[diff].awarded += a.marksAwarded ?? 0;
        byDifficulty[diff].possible += a.question.marks;
      }
    }

    return {
      attemptId: attempt.id,
      testTitle: attempt.test.title,
      subject: attempt.test.subject,
      submittedAt: attempt.submittedAt,
      score: isGraded ? awarded : null,
      possible,
      graded: isGraded,
    };
  });

  return {
    cumulative: { awarded: totalAwarded, possible: totalPossible },
    bySubject,
    bySection,
    byDifficulty,
    testHistory,
  };
}

export async function getTeacherAnalytics() {
  const students = await db.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, username: true },
  });

  const attempts = await db.attempt.findMany({
    where: { submittedAt: { not: null } },
    include: {
      test: { select: { subject: true, title: true } },
      user: { select: { username: true } },
      answers: {
        select: {
          marksAwarded: true,
          gradingStatus: true,
          questionId: true,
          question: { select: { marks: true, sectionId: true, section: { select: { name: true } } } },
        },
      },
    },
  });

  // Per-student scores
  const perStudent: Record<string, { username: string; tests: { title: string; subject: string; score: number | null; possible: number }[] }> = {};
  for (const s of students) perStudent[s.id] = { username: s.username, tests: [] };

  // Class averages per subject+section
  const subjectTotals: Record<string, { awarded: number; count: number }> = {};
  const sectionTotals: Record<string, { name: string; awarded: number; count: number }> = {};

  // Question correct rates
  const questionStats: Record<string, { correct: number; total: number }> = {};

  for (const attempt of attempts) {
    const isGraded = attempt.answers.every((a) => a.gradingStatus !== GradingStatus.PENDING);
    const awarded = attempt.answers.reduce((s, a) => s + (a.marksAwarded ?? 0), 0);
    const possible = attempt.answers.reduce((s, a) => s + a.question.marks, 0);

    if (perStudent[attempt.userId]) {
      perStudent[attempt.userId].tests.push({
        title: attempt.test.title,
        subject: attempt.test.subject,
        score: isGraded ? awarded : null,
        possible,
      });
    }

    if (isGraded) {
      const subj = attempt.test.subject;
      subjectTotals[subj] = subjectTotals[subj] ?? { awarded: 0, count: 0 };
      subjectTotals[subj].awarded += awarded;
      subjectTotals[subj].count += possible;

      for (const a of attempt.answers) {
        const sId = a.question.sectionId;
        sectionTotals[sId] = sectionTotals[sId] ?? { name: a.question.section.name, awarded: 0, count: 0 };
        sectionTotals[sId].awarded += a.marksAwarded ?? 0;
        sectionTotals[sId].count += a.question.marks;

        questionStats[a.questionId] = questionStats[a.questionId] ?? { correct: 0, total: 0 };
        questionStats[a.questionId].total++;
        if (a.gradingStatus === 'AUTO_CORRECT' || a.gradingStatus === 'MANUALLY_GRADED') {
          questionStats[a.questionId].correct++;
        }
      }
    }
  }

  const classAverages = {
    bySubject: Object.fromEntries(
      Object.entries(subjectTotals).map(([k, v]) => [k, v.count > 0 ? v.awarded / v.count : 0]),
    ),
    bySection: Object.fromEntries(
      Object.entries(sectionTotals).map(([k, v]) => [k, { name: v.name, rate: v.count > 0 ? v.awarded / v.count : 0 }]),
    ),
  };

  const questionRates = Object.fromEntries(
    Object.entries(questionStats).map(([k, v]) => [k, v.total > 0 ? v.correct / v.total : 0]),
  );

  return { perStudent, classAverages, questionRates };
}

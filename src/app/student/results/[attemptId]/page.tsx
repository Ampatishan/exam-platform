import { auth } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { KaTeXRenderer } from '@/components/KaTeXRenderer';

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const session = await auth();
  if (!session) redirect('/login');

  const attempt = await db.attempt.findUnique({
    where: { id: params.attemptId },
    include: {
      answers: {
        include: { question: { select: { text: true, type: true, marks: true, answerJson: true } } },
        orderBy: { question: { order: 'asc' } },
      },
      test: { select: { title: true, subject: true } },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) redirect('/student');

  const pendingWritten = attempt.answers.some((a) => a.gradingStatus === 'PENDING');
  const totalAwarded = attempt.answers.reduce((s, a) => s + (a.marksAwarded ?? 0), 0);
  const totalPossible = attempt.answers.reduce((s, a) => s + a.question.marks, 0);

  const statusColor = {
    AUTO_CORRECT: 'text-green-600',
    AUTO_WRONG: 'text-red-600',
    PENDING: 'text-orange-500',
    MANUALLY_GRADED: 'text-blue-600',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{attempt.test.title} — Results</h1>
        <p className="text-gray-500">{attempt.test.subject}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {pendingWritten ? (
          <div>
            <p className="text-lg font-semibold">Score pending</p>
            <p className="text-sm text-gray-500 mt-1">Some written answers are awaiting manual grading. Your final score will be available once all answers are graded.</p>
            <p className="text-sm mt-2">Auto-graded so far: <strong>{attempt.answers.filter((a) => a.gradingStatus !== 'PENDING').reduce((s, a) => s + (a.marksAwarded ?? 0), 0)}</strong> marks (excluding written)</p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-bold">{totalAwarded} / {totalPossible}</p>
            <p className="text-gray-500">{totalPossible > 0 ? Math.round((totalAwarded / totalPossible) * 100) : 0}%</p>
          </div>
        )}
        {attempt.autoSubmitted && <p className="text-xs text-orange-500 mt-2">Auto-submitted when time expired</p>}
      </div>

      <div className="space-y-4">
        {attempt.answers.map((a, i) => (
          <div key={a.questionId} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Q{i + 1} · {a.question.type.replace('_', ' ')}</span>
              <span className={statusColor[a.gradingStatus]}>
                {a.gradingStatus === 'PENDING' ? 'Pending grading' :
                 a.gradingStatus === 'MANUALLY_GRADED' ? `Graded: ${a.marksAwarded}/${a.question.marks}` :
                 a.gradingStatus === 'AUTO_CORRECT' ? `Correct: ${a.marksAwarded}/${a.question.marks}` :
                 `Wrong: 0/${a.question.marks}`}
              </span>
            </div>
            <p className="font-medium"><KaTeXRenderer text={a.question.text} /></p>
            <p className="text-sm mt-2 text-gray-600">Your answer: <em>{String(a.responseJson)}</em></p>
            {a.gradingStatus === 'AUTO_WRONG' && a.question.answerJson !== null && (
              <p className="text-sm mt-1 text-green-700">Correct answer: <em>{String(a.question.answerJson)}</em></p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

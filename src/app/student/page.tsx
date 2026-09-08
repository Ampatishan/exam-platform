import { auth } from '@/auth';
import { getStudentAnalytics } from '@/lib/modules/analytics';
import Link from 'next/link';

export default async function StudentDashboard() {
  const session = await auth();
  const analytics = await getStudentAnalytics(session!.user.id);

  const pct = (a: number, p: number) => (p > 0 ? Math.round((a / p) * 100) : 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">My Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 col-span-2">
          <div className="text-sm text-gray-500">Overall score</div>
          <div className="text-3xl font-bold">
            {analytics.cumulative.awarded} / {analytics.cumulative.possible}
          </div>
          <div className="text-gray-500 text-sm">{pct(analytics.cumulative.awarded, analytics.cumulative.possible)}%</div>
        </div>
        {Object.entries(analytics.byDifficulty).map(([diff, data]) => (
          <div key={diff} className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 capitalize">{diff}</div>
            <div className="text-xl font-bold">{pct((data as any).awarded, (data as any).possible)}%</div>
          </div>
        ))}
      </div>

      {Object.keys(analytics.bySubject).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">By subject</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics.bySubject).map(([subj, data]) => (
              <div key={subj} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">{subj}</div>
                <div className="text-xl font-bold">{pct((data as any).awarded, (data as any).possible)}%</div>
                <div className="text-xs text-gray-400">{(data as any).awarded} / {(data as any).possible}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Test history</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2">Test</th>
                <th className="text-left px-4 py-2">Subject</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Score</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {analytics.testHistory.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No tests taken yet</td></tr>
              )}
              {analytics.testHistory.map((t) => (
                <tr key={t.attemptId} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{t.testTitle}</td>
                  <td className="px-4 py-2">{t.subject}</td>
                  <td className="px-4 py-2">{t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2">{t.score !== null ? `${t.score} / ${t.possible}` : '—'}</td>
                  <td className="px-4 py-2">
                    {t.graded
                      ? <span className="text-green-600 text-xs">Graded</span>
                      : <span className="text-orange-500 text-xs">Pending</span>}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/student/results/${t.attemptId}`} className="text-blue-600 hover:underline text-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

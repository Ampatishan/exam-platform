import { getTeacherAnalytics } from '@/lib/modules/analytics';
import { getGradingQueue } from '@/lib/modules/grading';
import Link from 'next/link';

export default async function TeacherDashboard() {
  const [analytics, queue] = await Promise.all([getTeacherAnalytics(), getGradingQueue()]);

  const students = Object.values(analytics.perStudent);
  const subjectAverages = Object.entries(analytics.classAverages.bySubject);
  const questionRates = Object.entries(analytics.questionRates)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        {queue.length > 0 && (
          <Link href="/teacher/grading" className="bg-orange-500 text-white px-4 py-2 rounded font-medium hover:bg-orange-600">
            {queue.length} answer{queue.length !== 1 ? 's' : ''} pending grading
          </Link>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Student Performance</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2">Student</th>
                <th className="text-left px-4 py-2">Tests taken</th>
                <th className="text-left px-4 py-2">Tests graded</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No students yet</td></tr>
              )}
              {students.map((s) => (
                <tr key={s.username} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{s.username}</td>
                  <td className="px-4 py-2">{s.tests.length}</td>
                  <td className="px-4 py-2">{s.tests.filter((t) => t.score !== null).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Class Averages by Subject</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subjectAverages.length === 0 && <p className="text-gray-400 col-span-4">No graded tests yet</p>}
          {subjectAverages.map(([subject, rate]) => (
            <div key={subject} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{subject}</div>
              <div className="text-2xl font-bold">{Math.round((rate as number) * 100)}%</div>
            </div>
          ))}
        </div>
      </section>

      {questionRates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Hardest Questions (lowest correct rate)</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2">Question ID</th>
                  <th className="text-left px-4 py-2">Correct rate</th>
                </tr>
              </thead>
              <tbody>
                {questionRates.map(([qId, rate]) => (
                  <tr key={qId} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{qId}</td>
                    <td className="px-4 py-2">{Math.round((rate as number) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

import { auth } from '@/auth';
import { listTestsStudent } from '@/lib/modules/test-delivery';
import Link from 'next/link';

export default async function StudentTestsPage() {
  const session = await auth();
  const tests = await listTestsStudent(session!.user.id);

  const statusBadge = (status: string) => {
    if (status === 'open') return <span className="text-green-600 text-xs font-medium">Open</span>;
    if (status === 'upcoming') return <span className="text-blue-600 text-xs font-medium">Upcoming</span>;
    return <span className="text-gray-400 text-xs font-medium">Closed</span>;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Available Tests</h1>
      {tests.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No tests published yet</div>
      )}
      <div className="space-y-3">
        {tests.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-500">{t.subject} · {t.durationMinutes} min</div>
              <div className="mt-1">{statusBadge(t.status)}</div>
            </div>
            <div>
              {t.attempted ? (
                <span className="text-sm text-gray-400">Completed</span>
              ) : t.status === 'open' ? (
                <Link href={`/student/tests/${t.id}/take`} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                  Start test
                </Link>
              ) : (
                <span className="text-sm text-gray-400 capitalize">{t.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

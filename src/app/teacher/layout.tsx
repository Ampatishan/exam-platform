import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg">Exam Platform</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/teacher" className="hover:underline">Dashboard</Link>
          <Link href="/teacher/tests" className="hover:underline">Tests</Link>
          <Link href="/teacher/students" className="hover:underline">Students</Link>
          <Link href="/teacher/results" className="hover:underline">Results</Link>
          <Link href="/teacher/grading" className="hover:underline">Grading</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

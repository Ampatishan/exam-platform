import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== 'STUDENT') redirect('/login');
  if (session.user.mustChangePassword) redirect('/change-password');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-700 text-white px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg">Exam Platform</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/student" className="hover:underline">Dashboard</Link>
          <Link href="/student/tests" className="hover:underline">Tests</Link>
          <Link href="/student/practice" className="hover:underline">Practice</Link>
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

import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.mustChangePassword) redirect('/change-password');
  if (session.user.role === 'TEACHER') redirect('/teacher');
  redirect('/student');
}

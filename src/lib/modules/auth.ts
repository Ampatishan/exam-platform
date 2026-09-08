import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';

export async function createStudent(username: string, temporaryPassword: string) {
  const hash = await bcrypt.hash(temporaryPassword, 12);
  return db.user.create({
    data: { username, passwordHash: hash, role: Role.STUDENT, mustChangePassword: true },
    select: { id: true, username: true },
  });
}

export async function resetStudentPassword(id: string) {
  const raw = Math.random().toString(36).slice(2, 10);
  const hash = await bcrypt.hash(raw, 12);
  await db.user.update({
    where: { id },
    data: { passwordHash: hash, mustChangePassword: true },
  });
  return raw;
}

export async function changePassword(id: string, currentPassword: string, newPassword: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error('WRONG_PASSWORD');
  const hash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id }, data: { passwordHash: hash, mustChangePassword: false } });
}

export async function listStudents() {
  return db.user.findMany({
    where: { role: Role.STUDENT },
    select: { id: true, username: true, mustChangePassword: true },
    orderBy: { username: 'asc' },
  });
}

export async function deleteStudent(id: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (user.role !== Role.STUDENT) throw Object.assign(new Error('Not a student'), { code: 'FORBIDDEN' });
  await db.user.delete({ where: { id } });
}

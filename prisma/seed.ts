import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.TEACHER_PASSWORD ?? 'changeme123';
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username: 'teacher' },
    update: { passwordHash: hash },
    create: {
      username: 'teacher',
      passwordHash: hash,
      role: Role.TEACHER,
      mustChangePassword: false,
    },
  });

  console.log('Seeded teacher account (username: teacher)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

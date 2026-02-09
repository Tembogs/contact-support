import 'dotenv/config';
import { prisma } from '../../config/prisma';
import { Role } from "@prisma/client";
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🚀 Starting expert seeding...');

  // Optional: connection sanity check
  const ping = await prisma.$queryRaw`SELECT 1`;
  console.log('Ping result:', ping);

  const email = 'expert2@marketplace.com';
  const defaultName = email.split('@')[0];

  const passwordHash = await bcrypt.hash('ExpertPassword123', 10);

  const expert = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: Role.EXPERT,
      // make sure `name` exists in your User model
      name: defaultName,
      expertProfile: {
        create: {
          bio: 'I am a verified expert.',
          isAvailable: true,
          rating: 5.0,
        },
      },
    },
  });

  console.log(`✅ Expert ${expert.email} created successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
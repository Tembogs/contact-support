import 'dotenv/config';
import prisma from "../../config/prisma.js";
// Use Namespace Import for enums too
import * as EnumsModule from "../../../generated/prisma/enums";

const { Role } = EnumsModule as any;
import bcrypt from 'bcryptjs';
 async function main() {
  console.log("🚀 Starting admin seeding...");
  const email =  'admin@marketplace.com'
  const defaultName = email.split('@')[0];
  
  const passwordHash = await bcrypt.hash('AdminPassword123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email: email,
      passwordHash,
      role: Role.ADMIN,
      name: defaultName
    },
  })

  console.log(`✅ Admin ${admin.email} created/verified successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

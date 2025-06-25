import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const log = {
  info: (msg: string) => console.log(`[${new Date().toISOString()}] INFO  ${msg}`),
  success: (msg: string) => console.log(`[${new Date().toISOString()}] ✅    ${msg}`),
  error: (msg: string, err?: any) => console.error(`[${new Date().toISOString()}] ERROR ${msg}`, err)
};

async function main(): Promise<void> {
  log.info('🌱 Starting database seeding...');

  try {
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@goldensaas.com' },
      update: {},
      create: {
        email: 'admin@goldensaas.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    log.success(`Super admin created: ${superAdmin.email}`);

    const adminHashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'moderator@goldensaas.com' },
      update: {},
      create: {
        email: 'moderator@goldensaas.com',
        password: adminHashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true
      }
    });

    log.success(`Admin user created: ${admin.email}`);

    const userHashedPassword = await bcrypt.hash('User123!', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        password: userHashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isActive: true
      }
    });

    log.success(`Regular user created: ${user.email}`);
    log.success('🎉 Database seeding completed successfully!');
    log.info('\n📋 Default users created:');
    log.info('Super Admin: admin@goldensaas.com / SuperAdmin123!');
    log.info('Admin: moderator@goldensaas.com / Admin123!');
    log.info('User: user@example.com / User123!');

  } catch (error) {
    log.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    log.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 
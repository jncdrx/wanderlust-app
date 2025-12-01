try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  console.log('✅ Prisma client loaded successfully');
  
  // Test database connection
  prisma.$connect().then(() => {
    console.log('✅ Database connected successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Prisma client failed to load:', error);
  process.exit(1);
}

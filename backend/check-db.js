import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    const competencyProgress = await prisma.competencyProgress.findMany();
    console.log(`\nCompetencyProgress records: ${competencyProgress.length}`);
    
    if (competencyProgress.length > 0) {
      console.log('Sample CompetencyProgress records:');
      competencyProgress.slice(0, 3).forEach(cp => {
        console.log(`- Student ID: ${cp.studentId}, Competency ID: ${cp.competencyId}, Status: ${cp.status}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking database:', error);
    await prisma.$disconnect();
  }
}

checkDatabase();

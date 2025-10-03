import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employees = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@bartending2u.com',
      phone: '(713) 555-0114',
      role: 'Bar Lead',
    },
    {
      firstName: 'Priya',
      lastName: 'Singh',
      email: 'priya.singh@bartending2u.com',
      phone: '(713) 555-0172',
      role: 'Mixologist',
    },
    {
      firstName: 'Marcus',
      lastName: 'Allen',
      email: 'marcus.allen@bartending2u.com',
      phone: '(832) 555-0145',
      role: 'Support Bartender',
    },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { email: employee.email },
      update: employee,
      create: employee,
    });
  }
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

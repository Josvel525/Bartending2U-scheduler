import { PrismaClient, EmployeeStatus, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  await prisma.assignment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.employee.deleteMany();

  const employees = await prisma.$transaction(async (tx) => {
    const john = await tx.employee.create({
      data: {
        id: 'john-doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@bartending2u.com',
        phone: '+17135550114',
        role: 'Bar Lead',
        status: EmployeeStatus.active,
        skills: ['Flair certified', 'High-volume service'],
        certifications: ['TABC Certificate', 'Liability Waiver'],
        hourlyRate: 32.5,
        availability: {
          notes: 'Prefers evening activations. Trainer for new hires.',
          days: [
            { date: '2025-10-05', status: 'available', start: '17:00', end: '23:00' },
            { date: '2025-10-12', status: 'available', start: '16:00', end: '22:00' },
            { date: '2025-10-18', status: 'blocked' },
          ],
        },
        notes: 'Lead trainer for new hires. Loves crafting signature welcome cocktails.',
      },
    });

    const jane = await tx.employee.create({
      data: {
        id: 'jane-smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@bartending2u.com',
        phone: '+15125550199',
        role: 'Mixologist',
        status: EmployeeStatus.active,
        skills: ['Mocktail specialist', 'Low ABV menus'],
        certifications: ['TABC Certificate', 'Food Handler'],
        hourlyRate: 29,
        availability: {
          notes: 'On PTO until Oct 14. Available for design consultations.',
          days: [
            { date: '2025-10-10', status: 'blocked' },
            { date: '2025-10-16', status: 'available', start: '15:00', end: '21:00' },
            { date: '2025-10-22', status: 'available', start: '18:00', end: '22:00' },
          ],
        },
        notes: 'Certified sommelier. Currently on PTO returning Oct 14.',
      },
    });

    const marcus = await tx.employee.create({
      data: {
        id: 'marcus-allen',
        firstName: 'Marcus',
        lastName: 'Allen',
        email: 'marcus.allen@bartending2u.com',
        phone: '+17135550160',
        role: 'Barback',
        status: EmployeeStatus.active,
        skills: ['Inventory', 'Breakdown'],
        certifications: ['Food Handler'],
        hourlyRate: 24.5,
        availability: {
          notes: 'Prefers closing shifts. CDL certified for logistics support.',
          days: [
            { date: '2025-10-05', status: 'available', start: '17:00', end: '23:30' },
            { date: '2025-10-15', status: 'available', start: '17:00', end: '23:00' },
            { date: '2025-10-28', status: 'available', start: '18:00', end: '23:30' },
          ],
        },
        notes: 'Great with tight timelines and closing shifts. CDL certified.',
      },
    });

    return { john, jane, marcus };
  });

  const corporateParty = await prisma.event.create({
    data: {
      id: 'evt-1',
      title: 'Corporate Party',
      date: new Date('2025-10-05T19:00:00Z'),
      startTime: new Date('2025-10-05T17:00:00Z'),
      endTime: new Date('2025-10-05T23:00:00Z'),
      location: 'Downtown Houston',
      status: EventStatus.scheduled,
      clientName: 'Acme Corp',
      clientPhone: '+17135550000',
      notes: 'Celebrating quarterly milestone.',
    },
  });

  const weddingReception = await prisma.event.create({
    data: {
      id: 'evt-2',
      title: 'Wedding Reception',
      date: new Date('2025-10-15T18:30:00Z'),
      startTime: new Date('2025-10-15T17:30:00Z'),
      endTime: new Date('2025-10-15T23:30:00Z'),
      location: 'The Grand Hall',
      status: EventStatus.scheduled,
      clientName: 'Hannah & Luis',
      clientPhone: '+17135550012',
      notes: 'Signature his & hers cocktails requested.',
    },
  });

  const workshop = await prisma.event.create({
    data: {
      id: 'evt-3',
      title: 'Mixology Workshop',
      date: new Date('2025-10-22T17:30:00Z'),
      startTime: new Date('2025-10-22T17:30:00Z'),
      endTime: new Date('2025-10-22T21:30:00Z'),
      location: 'Private Residence',
      status: EventStatus.scheduled,
      clientName: 'Neighborhood HOA',
      clientPhone: '+17135550025',
      notes: 'Focus on fall flavors and mocktail options.',
    },
  });

  await prisma.assignment.createMany({
    data: [
      {
        id: 'assign-1',
        employeeId: employees.john.id,
        eventId: corporateParty.id,
        role: 'Lead bartender',
      },
      {
        id: 'assign-2',
        employeeId: employees.jane.id,
        eventId: workshop.id,
        role: 'Program designer',
      },
      {
        id: 'assign-3',
        employeeId: employees.marcus.id,
        eventId: weddingReception.id,
        role: 'Barback',
      },
    ],
  });
}

seed()
  .catch((error) => {
    console.error('Seed error', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

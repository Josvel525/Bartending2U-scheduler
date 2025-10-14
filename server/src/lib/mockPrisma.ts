type MockEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  status: string;
  skills: string;
  certifications: string;
  hourlyRate: number | null;
  availability?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockEvent = {
  id: string;
  title: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  status: string;
  clientName?: string | null;
  clientPhone?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockAssignment = {
  id: string;
  eventId: string;
  employeeId: string;
  role?: string | null;
  assignedAt: Date;
};

type FindManyArgs = {
  include?: { _count?: { select?: { assignments?: boolean } } };
  orderBy?: { createdAt?: 'asc' | 'desc' } | { createdAt?: 'asc' | 'desc' }[];
};

type FindUniqueArgs = {
  where?: { id?: string };
  include?: {
    assignments?: {
      include?: {
        event?: boolean;
      };
    };
  };
};

export class MockPrismaClient {
  private readonly employees: MockEmployee[];
  private readonly events: MockEvent[];
  private readonly assignments: MockAssignment[];

  constructor() {
    const now = new Date('2025-09-20T12:00:00Z');

    this.employees = [
      {
        id: 'john-doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@bartending2u.com',
        phone: '+17135550114',
        role: 'Bar Lead',
        status: 'active',
        skills: JSON.stringify(['Flair certified', 'High-volume service']),
        certifications: JSON.stringify(['TABC Certificate', 'Liability Waiver']),
        hourlyRate: 32.5,
        availability: JSON.stringify({
          notes: 'Prefers evening activations. Trainer for new hires.',
          days: [
            { date: '2025-10-05', status: 'available', start: '17:00', end: '23:00' },
            { date: '2025-10-12', status: 'available', start: '16:00', end: '22:00' },
            { date: '2025-10-18', status: 'blocked' },
          ],
        }),
        notes: 'Lead trainer for new hires. Loves crafting signature welcome cocktails.',
        createdAt: new Date('2025-08-01T09:00:00Z'),
        updatedAt: now,
      },
      {
        id: 'jane-smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@bartending2u.com',
        phone: '+15125550199',
        role: 'Mixologist',
        status: 'active',
        skills: JSON.stringify(['Mocktail specialist', 'Low ABV menus']),
        certifications: JSON.stringify(['TABC Certificate', 'Food Handler']),
        hourlyRate: 29,
        availability: JSON.stringify({
          notes: 'On PTO until Oct 14. Available for design consultations.',
          days: [
            { date: '2025-10-10', status: 'blocked' },
            { date: '2025-10-16', status: 'available', start: '15:00', end: '21:00' },
            { date: '2025-10-22', status: 'available', start: '18:00', end: '22:00' },
          ],
        }),
        notes: 'Certified sommelier. Currently on PTO returning Oct 14.',
        createdAt: new Date('2025-07-14T11:30:00Z'),
        updatedAt: now,
      },
      {
        id: 'marcus-allen',
        firstName: 'Marcus',
        lastName: 'Allen',
        email: 'marcus.allen@bartending2u.com',
        phone: '+17135550160',
        role: 'Barback',
        status: 'active',
        skills: JSON.stringify(['Inventory', 'Breakdown']),
        certifications: JSON.stringify(['Food Handler']),
        hourlyRate: 24.5,
        availability: JSON.stringify({
          notes: 'Prefers closing shifts. CDL certified for logistics support.',
          days: [
            { date: '2025-10-05', status: 'available', start: '17:00', end: '23:30' },
            { date: '2025-10-15', status: 'available', start: '17:00', end: '23:00' },
            { date: '2025-10-28', status: 'available', start: '18:00', end: '23:30' },
          ],
        }),
        notes: 'Great with tight timelines and closing shifts. CDL certified.',
        createdAt: new Date('2025-06-01T15:45:00Z'),
        updatedAt: now,
      },
    ];

    this.events = [
      {
        id: 'evt-1',
        title: 'Corporate Party',
        date: new Date('2025-10-05T19:00:00Z'),
        startTime: new Date('2025-10-05T17:00:00Z'),
        endTime: new Date('2025-10-05T23:00:00Z'),
        location: 'Downtown Houston',
        status: 'scheduled',
        clientName: 'Acme Corp',
        clientPhone: '+17135550000',
        notes: 'Celebrating quarterly milestone.',
        createdAt: new Date('2025-08-10T10:00:00Z'),
        updatedAt: now,
      },
      {
        id: 'evt-2',
        title: 'Wedding Reception',
        date: new Date('2025-10-15T18:30:00Z'),
        startTime: new Date('2025-10-15T17:30:00Z'),
        endTime: new Date('2025-10-15T23:30:00Z'),
        location: 'The Grand Hall',
        status: 'scheduled',
        clientName: 'Hannah & Luis',
        clientPhone: '+17135550012',
        notes: 'Signature his & hers cocktails requested.',
        createdAt: new Date('2025-08-18T12:45:00Z'),
        updatedAt: now,
      },
    ];

    this.assignments = [
      {
        id: 'assign-1',
        employeeId: 'john-doe',
        eventId: 'evt-1',
        role: 'Lead bartender',
        assignedAt: new Date('2025-09-20T12:00:00Z'),
      },
      {
        id: 'assign-2',
        employeeId: 'marcus-allen',
        eventId: 'evt-2',
        role: 'Barback',
        assignedAt: new Date('2025-09-22T14:15:00Z'),
      },
    ];
  }

  employee = {
    findMany: async (args: FindManyArgs = {}) => {
      const includeAssignmentsCount = Boolean(args.include?._count?.select?.assignments);
      const order = Array.isArray(args.orderBy) ? args.orderBy[0]?.createdAt : args.orderBy?.createdAt;
      const sorted = [...this.employees];

      if (order === 'desc') {
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else if (order === 'asc') {
        sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }

      return sorted.map((employee) => {
        const base: Record<string, unknown> = { ...employee };
        if (includeAssignmentsCount) {
          base._count = {
            assignments: this.assignments.filter((assignment) => assignment.employeeId === employee.id).length,
          };
        }
        return base as MockEmployee & { _count?: { assignments: number } };
      });
    },
    findUnique: async (args: FindUniqueArgs = {}) => {
      const id = args.where?.id;
      if (!id) {
        return null;
      }

      const record = this.employees.find((employee) => employee.id === id);
      if (!record) {
        return null;
      }

      const assignmentsInclude = args.include?.assignments;
      if (!assignmentsInclude) {
        return { ...record };
      }

      const includeEvent = Boolean(assignmentsInclude.include?.event);
      const assignments = this.assignments
        .filter((assignment) => assignment.employeeId === id)
        .map((assignment) => ({
          ...assignment,
          event: includeEvent ? this.cloneEvent(assignment.eventId) : undefined,
        }));

      return {
        ...record,
        assignments,
      };
    },
  };

  async $connect(): Promise<void> {
    // no-op for mock implementation
  }

  async $disconnect(): Promise<void> {
    // no-op for mock implementation
  }

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }

  event = {
    findMany: async () => {
      return this.events.map((event) => ({
        ...event,
        assignments: this.assignments
          .filter((assignment) => assignment.eventId === event.id)
          .map((assignment) => ({
            ...assignment,
            employee: this.cloneEmployee(assignment.employeeId),
          })),
      }));
    },
  };

  private cloneEvent(id: string): MockEvent | null {
    const event = this.events.find((item) => item.id === id);
    return event ? { ...event } : null;
  }

  private cloneEmployee(id: string): MockEmployee | null {
    const employee = this.employees.find((item) => item.id === id);
    return employee ? { ...employee } : null;
  }
}

export function createMockPrismaClient() {
  return new MockPrismaClient();
}


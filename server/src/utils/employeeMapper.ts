import { Assignment, Employee, Event } from '@prisma/client';

type EmployeeWithCount = Employee & { _count?: { assignments: number } };
type EmployeeWithAssignments = Employee & { assignments: (Assignment & { event: Event | null })[] };

type BaseEmployeeDto = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  status: 'active' | 'inactive';
  statusLabel: string;
  statusLevel: 'success' | 'warning' | 'danger';
  skills: string[];
  certifications: string[];
  hourlyRate?: number | null;
  availability?: unknown;
  notes?: string | null;
  assignmentsCount: number;
};

export type EmployeeListItem = BaseEmployeeDto & {
  teaser?: string | null;
};

export type EmployeeDetailDto = BaseEmployeeDto & {
  availabilitySummary?: string | null;
  upcomingAssignments: {
    id: string;
    title: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    role: string | null;
  }[];
};

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch (error) {
      console.warn('Failed to parse string array value', error);
    }
  }

  return [];
}

function parseAvailability(value: unknown): unknown {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse availability payload', error);
    }
  }

  return undefined;
}

function deriveStatus(rawStatus: Employee['status']) {
  const status = (rawStatus || 'inactive').toLowerCase() === 'active' ? 'active' : 'inactive';

  if (status === 'active') {
    return {
      status: 'active' as const,
      statusLabel: 'Active',
      statusLevel: 'success' as const,
    };
  }

  return {
    status: 'inactive' as const,
    statusLabel: 'Unavailable',
    statusLevel: 'danger' as const,
  };
}

function toNumber(value?: Employee['hourlyRate'] | null) {
  if (!value) {
    return null;
  }

  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function summariseAvailability(availability: unknown): string | null {
  if (!availability || typeof availability !== 'object') {
    return null;
  }

  const record = availability as { days?: { date?: string; status?: string }[] };
  if (!Array.isArray(record.days) || record.days.length === 0) {
    return null;
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() + 30);

  let available = 0;
  let unavailable = 0;
  record.days.forEach((day) => {
    if (!day?.date) return;
    const date = new Date(day.date);
    if (Number.isNaN(date.getTime()) || date < now || date > cutoff) {
      return;
    }

    const status = (day.status || '').toLowerCase();
    if (status === 'available' || status === 'open') {
      available += 1;
    } else if (status) {
      unavailable += 1;
    }
  });

  if (!available && !unavailable) {
    return null;
  }

  const bits = [] as string[];
  if (available) {
    bits.push(`${available} open day${available === 1 ? '' : 's'}`);
  }
  if (unavailable) {
    bits.push(`${unavailable} blocked`);
  }

  return bits.join(' · ');
}

function mapBase(employee: EmployeeWithCount): BaseEmployeeDto {
  const { status, statusLabel, statusLevel } = deriveStatus(employee.status);
  const skills = parseStringArray(employee.skills);
  const certifications = parseStringArray(employee.certifications);
  const availability = parseAvailability(employee.availability);

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    fullName: `${employee.firstName} ${employee.lastName}`.trim(),
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    status,
    statusLabel,
    statusLevel,
    skills,
    certifications,
    hourlyRate: toNumber(employee.hourlyRate),
    availability,
    notes: employee.notes,
    assignmentsCount: employee._count?.assignments ?? 0,
  };
}

export function mapEmployeeListItem(employee: EmployeeWithCount): EmployeeListItem {
  const base = mapBase(employee);
  const teaser = employee.notes ? employee.notes.split('\n').shift() : null;
  return {
    ...base,
    teaser,
  };
}

export function mapEmployeeDetail(employee: EmployeeWithAssignments): EmployeeDetailDto {
  const base = mapBase({ ...employee, _count: { assignments: employee.assignments.length } });
  const availabilitySummary = summariseAvailability(parseAvailability(employee.availability));

  const upcomingAssignments = employee.assignments
    .map((assignment) => {
      const event = assignment.event;
      return {
        id: assignment.id,
        title: event?.title ?? 'Scheduled event',
        date: event ? event.date.toISOString() : assignment.assignedAt.toISOString(),
        startTime: event?.startTime ? event.startTime.toISOString() : null,
        endTime: event?.endTime ? event.endTime.toISOString() : null,
        location: event?.location ?? null,
        role: assignment.role ?? null,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    ...base,
    availabilitySummary,
    upcomingAssignments,
  };
}

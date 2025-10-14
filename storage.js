(function (global) {
    const STORAGE_KEY = 'b2u-scheduler';
    const SEED_FLAG = 'b2u-scheduler-seeded';

    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    const isoDate = (yearOffset, month, day) => {
        const year = now.getUTCFullYear() + yearOffset;
        return `${year}-${pad(month)}-${pad(day)}`;
    };

    const sampleEmployees = [
        {
            id: 'john-doe',
            name: 'John Doe',
            role: 'Lead Bartender',
            phone: '(713) 555-0110',
            email: 'john.doe@example.com',
        },
        {
            id: 'alex-rivera',
            name: 'Alex Rivera',
            role: 'Bartender',
            phone: '(713) 555-0155',
            email: 'alex.rivera@example.com',
        },
        {
            id: 'priya-singh',
            name: 'Priya Singh',
            role: 'Mixologist',
            phone: '(713) 555-0199',
            email: 'priya.singh@example.com',
        },
        {
            id: 'marcus-allen',
            name: 'Marcus Allen',
            role: 'Bar-back',
            phone: '(713) 555-0123',
            email: 'marcus.allen@example.com',
        }
    ];

    const sampleEvents = [
        {
            id: 'evt-corporate',
            name: 'Corporate Cocktail Reception',
            date: isoDate(0, 10, 5),
            time: '19:00',
            endTime: '23:00',
            location: 'Downtown Houston',
            package: 'Signature Cocktail Bar',
            guestCount: 120,
            payout: 4200,
            requiredStaff: 4,
            assignedStaffIds: ['john-doe', 'alex-rivera', 'priya-singh'],
            status: 'scheduled',
            staffingStatus: 'Fully staffed',
            clientName: 'Brightway Financial',
            clientPhone: '(832) 555-0123',
            notes: 'Deposit received. Call time 6:00 PM.',
            updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
        },
        {
            id: 'evt-wedding',
            name: 'Autumn Wedding Celebration',
            date: isoDate(0, 10, 18),
            time: '18:30',
            endTime: '23:30',
            location: 'The Grand Hall',
            package: 'Premium Mixology',
            guestCount: 180,
            payout: 5600,
            requiredStaff: 5,
            assignedStaffIds: ['john-doe', 'priya-singh'],
            status: 'draft',
            staffingStatus: 'Needs 2 bartenders',
            clientName: 'Taylor & Morgan',
            clientPhone: '(281) 555-0198',
            notes: 'Awaiting signed contract. Couple requested espresso martini bar.',
            updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
            id: 'evt-gala',
            name: 'Holiday Gala',
            date: isoDate(0, 11, 30),
            time: '20:00',
            endTime: '01:00',
            location: 'Skyline Ballroom',
            package: 'Custom Experience',
            guestCount: 250,
            payout: 7800,
            requiredStaff: 7,
            assignedStaffIds: ['alex-rivera'],
            status: 'scheduled',
            staffingStatus: 'Needs 3 bartenders',
            clientName: 'Skyline Foundations',
            clientPhone: '(832) 555-0119',
            notes: 'Client reviewing seasonal menu. Follow up for tasting.',
            updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
            id: 'evt-workshop',
            name: 'Mixology Workshop',
            date: isoDate(0, 12, 3),
            time: '17:30',
            endTime: '20:30',
            location: 'Private Residence',
            package: 'Interactive Workshop',
            guestCount: 25,
            payout: 1500,
            requiredStaff: 2,
            assignedStaffIds: [],
            status: 'canceled',
            staffingStatus: 'Unassigned',
            clientName: 'Hannah Lee',
            clientPhone: '(713) 555-0144',
            notes: 'Client requested reschedule to January.',
            updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
        }
    ];

    const defaultState = {
        events: sampleEvents,
        employees: sampleEmployees,
        leads: [],
    };

    const hasLocalStorage = (() => {
        try {
            if (!('localStorage' in global)) {
                return false;
            }
            const testKey = '__b2u-test__';
            global.localStorage.setItem(testKey, '1');
            global.localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    })();

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function readState() {
        if (!hasLocalStorage) {
            return clone(defaultState);
        }

        const stored = global.localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return clone(defaultState);
        }

        try {
            const parsed = JSON.parse(stored);
            if (!parsed || typeof parsed !== 'object') {
                return clone(defaultState);
            }
            const merged = Object.assign({}, defaultState, parsed);
            merged.events = Array.isArray(parsed.events) ? parsed.events : clone(defaultState.events);
            merged.employees = Array.isArray(parsed.employees) ? parsed.employees : clone(defaultState.employees);
            merged.leads = Array.isArray(parsed.leads) ? parsed.leads : [];
            return merged;
        } catch (error) {
            console.warn('Failed to read stored scheduler data, falling back to defaults.', error);
            return clone(defaultState);
        }
    }

    function writeState(nextState) {
        state = clone(nextState);
        if (hasLocalStorage) {
            try {
                global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (error) {
                console.warn('Failed to persist scheduler data.', error);
            }
        }
    }

    function ensureSeeded() {
        if (!hasLocalStorage) {
            return;
        }
        if (!global.localStorage.getItem(SEED_FLAG)) {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
            global.localStorage.setItem(SEED_FLAG, 'true');
        }
    }

    ensureSeeded();

    let state = readState();

    function createId(prefix) {
        return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function toStatus(value) {
        if (!value) return 'draft';
        const normalised = value.toString().trim().toLowerCase();
        return ['draft', 'scheduled', 'completed', 'canceled'].includes(normalised) ? normalised : 'draft';
    }

    function normaliseEvent(payload) {
        const nowIso = new Date().toISOString();
        return {
            id: payload.id || createId('evt'),
            name: payload.name || 'Untitled event',
            date: payload.date || '',
            time: payload.time || '',
            endTime: payload.endTime || '',
            location: payload.location || '',
            package: payload.package || '',
            guestCount: payload.guestCount ?? '',
            payout: payload.payout ?? '',
            requiredStaff: payload.requiredStaff ?? '',
            assignedStaffIds: Array.isArray(payload.assignedStaffIds) ? payload.assignedStaffIds.slice() : [],
            staffingStatus: payload.staffingStatus || '',
            clientName: payload.clientName || '',
            clientPhone: payload.clientPhone || '',
            notes: payload.notes || '',
            status: toStatus(payload.status),
            updatedAt: payload.updatedAt || nowIso,
        };
    }

    function normaliseEmployee(payload) {
        return {
            id: payload.id || createId('emp'),
            name: payload.name || 'Unnamed employee',
            role: payload.role || '',
            phone: payload.phone || '',
            email: payload.email || '',
        };
    }

    function emit(eventName, detail) {
        if (typeof global.dispatchEvent !== 'function') {
            return;
        }
        const EventConstructor = typeof global.CustomEvent === 'function'
            ? global.CustomEvent
            : function CustomEvent(type, params) {
                const event = document.createEvent('CustomEvent');
                event.initCustomEvent(type, params?.bubbles || false, params?.cancelable || false, params?.detail);
                return event;
            };
        try {
            global.dispatchEvent(new EventConstructor(eventName, { detail }));
        } catch (error) {
            console.warn('Failed to dispatch event', eventName, error);
        }
    }

    function upsertEvent(event) {
        const events = state.events.slice();
        const index = events.findIndex(item => item.id === event.id);
        if (index === -1) {
            events.push(event);
        } else {
            events[index] = Object.assign({}, events[index], event, { updatedAt: event.updatedAt });
        }
        return events;
    }

    function persistEvents(events) {
        const nextState = Object.assign({}, state, { events });
        writeState(nextState);
        emit('b2u:events:updated', { events: clone(events) });
        return clone(events);
    }

    function persistEmployees(employees) {
        const nextState = Object.assign({}, state, { employees });
        writeState(nextState);
        emit('b2u:employees:updated', { employees: clone(employees) });
        return clone(employees);
    }

    const store = {
        getEvents() {
            return clone(state.events || []);
        },
        getEvent(id) {
            return clone((state.events || []).find(event => event.id === id) || null);
        },
        addEvent(payload) {
            const event = normaliseEvent(Object.assign({}, payload, { updatedAt: new Date().toISOString() }));
            const nextEvents = upsertEvent(event);
            persistEvents(nextEvents);
            return clone(event);
        },
        updateEvent(id, changes) {
            const existing = (state.events || []).find(event => event.id === id);
            if (!existing) {
                return null;
            }
            const merged = normaliseEvent(Object.assign({}, existing, changes, { id, updatedAt: new Date().toISOString() }));
            const nextEvents = upsertEvent(merged);
            persistEvents(nextEvents);
            return clone(merged);
        },
        removeEvent(id) {
            const nextEvents = (state.events || []).filter(event => event.id !== id);
            persistEvents(nextEvents);
            return true;
        },
        assignStaff(eventId, staff) {
            const ids = Array.isArray(staff)
                ? staff.slice()
                : Array.isArray(staff?.assignedStaffIds)
                    ? staff.assignedStaffIds.slice()
                    : [];
            return this.updateEvent(eventId, { assignedStaffIds: ids });
        },
        getEmployees() {
            return clone(state.employees || []);
        },
        addEmployee(payload) {
            const employee = normaliseEmployee(payload || {});
            const employees = (state.employees || []).slice();
            employees.push(employee);
            persistEmployees(employees);
            return clone(employee);
        },
        updateEmployee(id, changes) {
            const employees = (state.employees || []).slice();
            const index = employees.findIndex(employee => employee.id === id);
            if (index === -1) {
                return null;
            }
            employees[index] = Object.assign({}, employees[index], changes, { id });
            persistEmployees(employees);
            return clone(employees[index]);
        },
    };

    global.B2UStore = store;
    global.B2UStorage = store;
})(typeof window !== 'undefined' ? window : globalThis);

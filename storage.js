(function (global) {
    const STORAGE_KEY = 'bartending2u-scheduler';

    const defaultData = {
        events: [
            {
                id: 'evt-1',
                name: 'Corporate Party',
                date: '2025-10-05',
                time: '19:00',
                location: 'Downtown Houston',
                package: 'Signature Cocktail Bar',
                guestCount: 120,
                payout: 3800,
                status: 'Confirmed',
                statusLevel: 'success',
                staffingStatus: 'Fully staffed',
                staffingLevel: 'success',
                notes: 'Deposit received. Call time 6:00 PM.',
                createdAt: Date.now() - 1000 * 60 * 20,
            },
            {
                id: 'evt-2',
                name: 'Wedding Reception',
                date: '2025-10-15',
                time: '18:30',
                location: 'The Grand Hall',
                package: 'Premium Mixology',
                guestCount: 180,
                payout: 5200,
                status: 'Awaiting deposit',
                statusLevel: 'warning',
                staffingStatus: 'Needs 2 bartenders',
                staffingLevel: 'warning',
                notes: 'Send reminder for deposit. Discuss signature cocktail list.',
                createdAt: Date.now() - 1000 * 60 * 60 * 3,
            },
            {
                id: 'evt-3',
                name: 'Holiday Gala',
                date: '2025-11-30',
                time: '20:00',
                location: 'Skyline Ballroom',
                package: 'Craft Experience',
                guestCount: 250,
                payout: 7600,
                status: 'Contract overdue',
                statusLevel: 'danger',
                staffingStatus: 'Partial coverage',
                staffingLevel: 'warning',
                notes: 'Client reviewing updated package. Follow up Friday.',
                createdAt: Date.now() - 1000 * 60 * 60 * 10,
            },
            {
                id: 'evt-4',
                name: 'Mixology Workshop',
                date: '2025-12-03',
                time: '17:30',
                location: 'Private Residence',
                package: 'Interactive Workshop',
                guestCount: 25,
                payout: 1400,
                status: 'Confirmed',
                statusLevel: 'success',
                staffingStatus: 'Ready',
                staffingLevel: 'success',
                notes: 'Include mocktail options and allergy-friendly mixers.',
                createdAt: Date.now() - 1000 * 60 * 5,
            },
        ],
        employees: [
            {
                id: 'emp-1',
                name: 'John Doe',
                role: 'Bar Lead · Flair certified',
                email: 'john.doe@bartending2u.com',
                phone: '(555) 100-2000',
                status: 'Available',
                statusLevel: 'success',
                notes: 'Expert in corporate activations.',
                createdAt: Date.now() - 1000 * 60 * 60,
            },
            {
                id: 'emp-2',
                name: 'Jane Smith',
                role: 'Mixologist · Mocktail specialist',
                email: 'jane.smith@bartending2u.com',
                phone: '(555) 222-3333',
                status: 'On PTO',
                statusLevel: 'warning',
                notes: 'Out Oct 10 - Oct 16.',
                createdAt: Date.now() - 1000 * 60 * 60 * 2,
            },
            {
                id: 'emp-3',
                name: 'Alex Rivera',
                role: 'Bartender · Bilingual',
                email: 'alex.rivera@bartending2u.com',
                phone: '(555) 444-5555',
                status: 'Available',
                statusLevel: 'success',
                notes: 'Spanish/English. Comfortable with large crowds.',
                createdAt: Date.now() - 1000 * 60 * 25,
            },
            {
                id: 'emp-4',
                name: 'Priya Singh',
                role: 'Mixology Lead · Seasonal menu',
                email: 'priya.singh@bartending2u.com',
                phone: '(555) 777-8888',
                status: 'Available',
                statusLevel: 'success',
                notes: 'Specializes in custom experiences.',
                createdAt: Date.now() - 1000 * 60 * 15,
            },
            {
                id: 'emp-5',
                name: 'Jamie Lee',
                role: 'Support · Prep specialist',
                email: 'jamie.lee@bartending2u.com',
                phone: '(555) 999-1212',
                status: 'Limited hours',
                statusLevel: 'warning',
                notes: 'Available evenings only.',
                createdAt: Date.now() - 1000 * 60 * 10,
            },
            {
                id: 'emp-6',
                name: 'Marcus Allen',
                role: 'Barback',
                email: 'marcus.allen@bartending2u.com',
                phone: '(555) 313-1414',
                status: 'Available',
                statusLevel: 'success',
                notes: 'Strong with load-in/load-out logistics.',
                createdAt: Date.now() - 1000 * 60 * 45,
            },
        ],
    };

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function localStorageAvailable() {
        try {
            const storage = global.localStorage;
            if (!storage) {
                return false;
            }

            const testKey = `${STORAGE_KEY}__test`;
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    const hasLocalStorage = localStorageAvailable();
    let memoryStore = null;
    let cache = null;

    function readRaw() {
        if (cache) {
            return cache;
        }

        if (hasLocalStorage) {
            try {
                const raw = global.localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    cache = clone(defaultData);
                    return cache;
                }

                const parsed = JSON.parse(raw);
                cache = normalise(parsed);
                return cache;
            } catch (error) {
                console.warn('Unable to read scheduler data from localStorage. Using in-memory fallback.', error);
            }
        }

        if (!memoryStore) {
            memoryStore = clone(defaultData);
        }

        cache = clone(memoryStore);
        return cache;
    }

    function writeRaw(data) {
        const payload = normalise(data);
        cache = clone(payload);

        if (hasLocalStorage) {
            try {
                global.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                return;
            } catch (error) {
                console.warn('Unable to save scheduler data to localStorage. Persisting in memory only.', error);
            }
        }

        memoryStore = clone(payload);
    }

    function normalise(data) {
        if (!data || typeof data !== 'object') {
            return clone(defaultData);
        }

        const normalised = {
            events: Array.isArray(data.events) ? data.events : [],
            employees: Array.isArray(data.employees) ? data.employees : [],
        };

        if (normalised.events.length === 0 && normalised.employees.length === 0) {
            return clone(defaultData);
        }

        return normalised;
    }

    function generateId(prefix) {
        const randomPart = Math.random().toString(36).slice(2, 8);
        const timePart = Date.now().toString(36);
        return `${prefix}-${randomPart}-${timePart}`;
    }

    function mapStatusLevel(value) {
        if (!value) {
            return 'neutral';
        }

        const lower = value.toLowerCase();
        if (lower.includes('confirm') || lower.includes('ready') || lower.includes('available') || lower.includes('staffed')) {
            return 'success';
        }

        if (lower.includes('need') || lower.includes('limited') || lower.includes('await') || lower.includes('pto')) {
            return 'warning';
        }

        if (lower.includes('overdue') || lower.includes('unassign') || lower.includes('contract')) {
            return 'danger';
        }

        return 'info';
    }

    const store = {
        getSnapshot() {
            return clone(readRaw());
        },
        getEvents() {
            return clone(readRaw().events);
        },
        getEmployees() {
            return clone(readRaw().employees);
        },
        saveSnapshot(next) {
            writeRaw(next);
        },
        addEvent(eventInput) {
            const snapshot = readRaw();
            const event = Object.assign(
                {
                    id: generateId('evt'),
                    createdAt: Date.now(),
                },
                eventInput
            );

            if (!event.statusLevel) {
                event.statusLevel = mapStatusLevel(event.status);
            }
            if (!event.staffingLevel) {
                event.staffingLevel = mapStatusLevel(event.staffingStatus);
            }

            snapshot.events.push(event);
            writeRaw(snapshot);
            return event;
        },
        removeEvent(eventId) {
            const snapshot = readRaw();
            const nextEvents = snapshot.events.filter((event) => event.id !== eventId);
            snapshot.events = nextEvents;
            writeRaw(snapshot);
        },
        addEmployee(employeeInput) {
            const snapshot = readRaw();
            const employee = Object.assign(
                {
                    id: generateId('emp'),
                    createdAt: Date.now(),
                },
                employeeInput
            );

            if (!employee.statusLevel) {
                employee.statusLevel = mapStatusLevel(employee.status);
            }

            snapshot.employees.push(employee);
            writeRaw(snapshot);
            return employee;
        },
        removeEmployee(employeeId) {
            const snapshot = readRaw();
            const nextEmployees = snapshot.employees.filter((employee) => employee.id !== employeeId);
            snapshot.employees = nextEmployees;
            writeRaw(snapshot);
        },
        clearAll() {
            writeRaw(clone(defaultData));
        },
    };

    global.B2UStore = store;
})(typeof window !== 'undefined' ? window : globalThis);

(function () {
    const STORAGE_KEY = 'bartending2uScheduler';

    function createStorageAdapter() {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
            return null;
        }

        try {
            const testKey = `${STORAGE_KEY}__test__`;
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return window.localStorage;
        } catch (error) {
            console.warn('localStorage is not available. Falling back to in-memory storage.', error);
            return null;
        }
    }

    const storage = createStorageAdapter();
    let memoryStore;

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
                createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 8,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 12,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 6,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 10,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 5,
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
                createdAt: Date.now() - 1000 * 60 * 60 * 7,
            },
        ],
    };

    let cache;

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function normalizeData(data) {
        if (!data || typeof data !== 'object') {
            return clone(defaultData);
        }

        const normalized = {
            events: Array.isArray(data.events) ? data.events : [],
            employees: Array.isArray(data.employees) ? data.employees : [],
        };

        return normalized;
    }

    function loadFromStorage() {
        if (cache) {
            return cache;
        }

        if (!storage) {
            if (!memoryStore) {
                memoryStore = clone(defaultData);
            }

            cache = clone(memoryStore);
            return cache;
        }

        let storedValue;

        try {
            storedValue = storage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Unable to read from localStorage. Falling back to in-memory cache.', error);
            cache = clone(memoryStore || defaultData);
            return cache;
        }

        if (!storedValue) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            } catch (error) {
                console.warn('Unable to initialize localStorage. Using in-memory cache instead.', error);
                memoryStore = clone(defaultData);
            }
            cache = clone(defaultData);
            return cache;
        }

        try {
            const parsed = JSON.parse(storedValue);
            cache = normalizeData(parsed);
        } catch (error) {
            console.warn('Unable to parse stored scheduler data. Reverting to defaults.', error);
            cache = clone(defaultData);
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(cache));
            } catch (persistError) {
                console.warn('Unable to persist defaults to localStorage. Using in-memory cache instead.', persistError);
                memoryStore = clone(cache);
            }
        }

        return cache;
    }

    function persist(data) {
        cache = normalizeData(data);
        if (storage) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(cache));
            } catch (error) {
                console.warn('Unable to persist data to localStorage. Using in-memory cache instead.', error);
                memoryStore = clone(cache);
            }
        } else {
            memoryStore = clone(cache);
        }
        return cache;
    }

    function generateId(prefix) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return `${prefix}-${crypto.randomUUID()}`;
        }

        return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function addEvent(event) {
        const current = loadFromStorage();
        const newEvent = {
            id: generateId('evt'),
            createdAt: Date.now(),
            ...event,
        };

        current.events.push(newEvent);
        persist(current);
        return newEvent;
    }

    function removeEvent(eventId) {
        const current = loadFromStorage();
        current.events = current.events.filter((event) => event.id !== eventId);
        persist(current);
    }

    function addEmployee(employee) {
        const current = loadFromStorage();
        const newEmployee = {
            id: generateId('emp'),
            createdAt: Date.now(),
            ...employee,
        };

        current.employees.push(newEmployee);
        persist(current);
        return newEmployee;
    }

    function removeEmployee(employeeId) {
        const current = loadFromStorage();
        current.employees = current.employees.filter((employee) => employee.id !== employeeId);
        persist(current);
    }

    function getEvents() {
        const current = loadFromStorage();
        return clone(current.events);
    }

    function getEmployees() {
        const current = loadFromStorage();
        return clone(current.employees);
    }

    function saveData(data) {
        return clone(persist(data));
    }

    function clearAll() {
        cache = clone(defaultData);

        if (storage) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(cache));
            } catch (error) {
                console.warn('Unable to reset localStorage. Clearing in-memory cache instead.', error);
                memoryStore = clone(cache);
            }
        } else {
            memoryStore = clone(cache);
        }
    }

    const globalObject = typeof window !== 'undefined' ? window : globalThis;

    globalObject.B2UStore = {
        getData() {
            return clone(loadFromStorage());
        },
        saveData,
        getEvents,
        addEvent,
        removeEvent,
        getEmployees,
        addEmployee,
        removeEmployee,
        clearAll,
        defaultData: clone(defaultData),
    };
})();

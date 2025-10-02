(function (global) {
    const STORAGE_KEY = 'bartending2u-scheduler';

    const now = Date.now();

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
                requiredStaff: 4,
                assignedStaffIds: ['emp-1', 'emp-3', 'emp-4', 'emp-6'],
                status: 'Confirmed',
                statusLevel: 'success',
                staffingStatus: 'Fully staffed',
                staffingLevel: 'success',
                assignedTeam: ['emp-1', 'emp-3', 'emp-6'],
                notes: 'Deposit received. Call time 6:00 PM.',
                lastReminderSent: now - 1000 * 60 * 60 * 24,
                createdAt: now - 1000 * 60 * 20,
                lastReminderSent: Date.now() - 1000 * 60 * 60 * 24,
                createdAt: Date.now() - 1000 * 60 * 20,
                checklist: [
                    { id: 'chk-evt-1-1', label: 'Confirm final guest count', completed: true },
                    { id: 'chk-evt-1-2', label: 'Print bar menu cards', completed: false },
                ],
                prepSheet: {
                    menu: 'Seasonal welcome cocktail + corporate-branded old fashioned.',
                    equipment: '2 portable bars, branded napkins, 150 coupe glasses.',
                    staffing: 'Lead + 2 bartenders onsite by 5:30 PM.',
                },
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
                requiredStaff: 5,
                assignedStaffIds: ['emp-1', 'emp-4'],
                status: 'Awaiting deposit',
                statusLevel: 'warning',
                staffingStatus: 'Needs 2 bartenders',
                staffingLevel: 'warning',
                assignedTeam: [],
                notes: 'Send reminder for deposit. Discuss signature cocktail list.',
                lastReminderSent: null,
                createdAt: now - 1000 * 60 * 60 * 3,
                createdAt: Date.now() - 1000 * 60 * 60 * 3,
                checklist: [
                    { id: 'chk-evt-2-1', label: 'Follow up on deposit invoice', completed: false },
                    { id: 'chk-evt-2-2', label: 'Confirm champagne toast timing', completed: false },
                ],
                prepSheet: {
                    menu: 'Bride + groom his & hers cocktails, late-night espresso bar.',
                    equipment: 'Champagne tower, coffee urns, ice tubs.',
                    staffing: 'Need 2 more bartenders for reception coverage.',
                },
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
                requiredStaff: 8,
                assignedStaffIds: ['emp-2', 'emp-5'],
                status: 'Contract overdue',
                statusLevel: 'danger',
                staffingStatus: 'Partial coverage',
                staffingLevel: 'warning',
                assignedTeam: ['emp-5'],
                notes: 'Client reviewing updated package. Follow up Friday.',
                lastReminderSent: null,
                createdAt: now - 1000 * 60 * 60 * 10,
                createdAt: Date.now() - 1000 * 60 * 60 * 10,
                checklist: [
                    { id: 'chk-evt-3-1', label: 'Update proposal with vegan options', completed: false },
                    { id: 'chk-evt-3-2', label: 'Schedule tasting with chef partner', completed: false },
                ],
                prepSheet: {
                    menu: 'Craft martini flight + winter mocktails.',
                    equipment: 'Large ice sculptures, stage back-bar, 3 garnish trays.',
                    staffing: 'Pending confirmation of additional support staff.',
                },
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
                requiredStaff: 2,
                assignedStaffIds: ['emp-3', 'emp-6'],
                status: 'Confirmed',
                statusLevel: 'success',
                staffingStatus: 'Ready',
                staffingLevel: 'success',
                assignedTeam: ['emp-4'],
                notes: 'Include mocktail options and allergy-friendly mixers.',
                lastReminderSent: now - 1000 * 60 * 60 * 12,
                createdAt: now - 1000 * 60 * 5,
                lastReminderSent: Date.now() - 1000 * 60 * 60 * 12,
                createdAt: Date.now() - 1000 * 60 * 5,
                checklist: [
                    { id: 'chk-evt-4-1', label: 'Prepare ingredient kits', completed: true },
                    { id: 'chk-evt-4-2', label: 'Email pre-event survey', completed: false },
                ],
                prepSheet: {
                    menu: 'Hands-on margarita build + zero-proof paloma.',
                    equipment: 'Cutting boards, shakers for 15 stations, demo monitor.',
                    staffing: 'Priya onsite at 4:30 PM. Need 1 assistant for setup.',
                },
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
                createdAt: now - 1000 * 60 * 60,
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
                createdAt: now - 1000 * 60 * 60 * 2,
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
                createdAt: now - 1000 * 60 * 25,
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
                createdAt: now - 1000 * 60 * 15,
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
                createdAt: now - 1000 * 60 * 10,
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
                createdAt: now - 1000 * 60 * 45,
            },
        ],
        leads: [
            {
                id: 'lead-1',
                name: 'Alicia Martinez',
                company: 'Corporate Mixer',
                email: 'alicia@houstonmixers.com',
                phone: '(555) 410-8800',
                eventType: 'Corporate',
                eventDate: '2025-11-08',
                estimatedValue: 3500,
                status: 'Proposal sent',
                statusLevel: 'info',
                source: 'Referral',
                guestCount: 85,
                notes: 'Enjoyed the live tasting. Interested in a zero-proof welcome drink.',
                nextTouchpoint: 'Follow up on tasting preference',
                createdAt: now - 1000 * 60 * 60 * 24 * 4,
                lastFollowUpAt: now - 1000 * 60 * 60 * 20,
                lastFollowUpMethod: 'Email',
                activities: [
                    {
                        id: 'act-1',
                        type: 'note',
                        method: 'Email',
                        summary: 'Shared tasting recap',
                        message: 'Sent curated tasting recap with sample menu links.',
                        createdAt: now - 1000 * 60 * 60 * 20,
                    },
                    {
                        id: 'act-2',
                        type: 'call',
                        method: 'Phone',
                        summary: 'Discovery call',
                        message: 'Confirmed guest count and signature mocktail interest.',
                        createdAt: now - 1000 * 60 * 60 * 48,
                    },
                ],
            },
            {
                id: 'lead-2',
                name: 'Danielle & Marcus',
                company: 'Wedding',
                email: 'celebrate@danielleandmarcus.com',
                phone: '(555) 720-1099',
                eventType: 'Wedding',
                eventDate: '2026-05-17',
                estimatedValue: 4800,
                status: 'Awaiting deposit',
                statusLevel: 'warning',
                source: 'Website form',
                guestCount: 160,
                notes: 'Requested champagne tower and signature his & hers cocktails.',
                nextTouchpoint: 'Send deposit reminder',
                createdAt: now - 1000 * 60 * 60 * 24 * 8,
                lastFollowUpAt: now - 1000 * 60 * 60 * 36,
                lastFollowUpMethod: 'SMS',
                activities: [
                    {
                        id: 'act-3',
                        type: 'follow-up',
                        method: 'SMS',
                        summary: 'Sent deposit reminder',
                        message: 'Texted deposit reminder with secure payment link.',
                        createdAt: now - 1000 * 60 * 60 * 36,
                    },
                    {
                        id: 'act-4',
                        type: 'meeting',
                        method: 'Video call',
                        summary: 'Menu planning session',
                        message: 'Finalised signature cocktails and champagne tower logistics.',
                        createdAt: now - 1000 * 60 * 60 * 72,
                    },
                ],
            },
            {
                id: 'lead-3',
                name: 'Houston Startup Hub',
                company: 'Launch Party',
                email: 'events@houstonstartuphub.com',
                phone: '(555) 930-4412',
                eventType: 'Launch party',
                eventDate: '2026-01-12',
                estimatedValue: 2100,
                status: 'Discovery call',
                statusLevel: 'neutral',
                source: 'Venue partner',
                guestCount: 120,
                notes: 'Needs thematic cocktails named after startup founders.',
                nextTouchpoint: 'Confirm guest count',
                createdAt: now - 1000 * 60 * 60 * 24 * 2,
                lastFollowUpAt: now - 1000 * 60 * 60 * 8,
                lastFollowUpMethod: 'Phone',
                activities: [
                    {
                        id: 'act-5',
                        type: 'call',
                        method: 'Phone',
                        summary: 'Discovery call held',
                        message: 'Discussed vision and high-level budget. Awaiting guest count.',
                        createdAt: now - 1000 * 60 * 60 * 8,
                    },
                ],
            },
            {
                id: 'lead-4',
                name: 'Luxe Realty',
                company: 'Client Appreciation',
                email: 'events@luxerealty.com',
                phone: '(555) 640-7788',
                eventType: 'Private event',
                eventDate: '2025-12-09',
                estimatedValue: 2900,
                status: 'Ready to book',
                statusLevel: 'success',
                source: 'Referral',
                guestCount: 90,
                notes: 'Wants high-end whiskey tasting station and cigar pairing.',
                nextTouchpoint: 'Send contract draft',
                createdAt: now - 1000 * 60 * 60 * 24 * 5,
                lastFollowUpAt: now - 1000 * 60 * 60 * 18,
                lastFollowUpMethod: 'Email',
                activities: [
                    {
                        id: 'act-6',
                        type: 'follow-up',
                        method: 'Email',
                        summary: 'Sent proposal for approval',
                        message: 'Shared detailed proposal with whiskey tasting upgrades.',
                        createdAt: now - 1000 * 60 * 60 * 18,
                    },
                    {
                        id: 'act-7',
                        type: 'note',
                        method: 'Internal',
                        summary: 'Venue walkthrough complete',
                        message: 'Visited venue and confirmed back-of-house access.',
                        createdAt: now - 1000 * 60 * 60 * 30,
                    },
                ],
            },
        ],
    };

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function sanitisePrepSheet(prepSheet) {
        if (!prepSheet || typeof prepSheet !== 'object') {
            return {
                menu: '',
                equipment: '',
                staffing: '',
            };
        }

        return {
            menu: typeof prepSheet.menu === 'string' ? prepSheet.menu : '',
            equipment: typeof prepSheet.equipment === 'string' ? prepSheet.equipment : '',
            staffing: typeof prepSheet.staffing === 'string' ? prepSheet.staffing : '',
        };
    }

    function normaliseChecklist(checklist) {
        if (!Array.isArray(checklist)) {
            return [];
        }

        return checklist
            .filter((item) => item && typeof item === 'object' && item.label)
            .map((item) => ({
                id: item.id || generateId('chk'),
                label: String(item.label),
                completed: Boolean(item.completed),
            }));
    }

    function mapStatusLevel(value) {
        if (!value) {
            return 'neutral';
        }

        const lower = String(value).toLowerCase();

        if (lower.includes('unassign') || lower.includes('overdue') || lower.includes('contract')) {
            return 'danger';
        }

        if (
            lower.includes('confirm') ||
            lower.includes('ready') ||
            lower.includes('available') ||
            lower.includes('staffed') ||
            lower.includes('assign')
        ) {
            return 'success';
        }

        if (lower.includes('need') || lower.includes('limited') || lower.includes('await') || lower.includes('pto')) {
            return 'warning';
        }

        return 'info';
    }

    function normaliseEvent(event) {
        const base = Object.assign(
            {
                assignedStaffIds: [],
                assignedTeam: [],
                requiredStaff: 0,
                lastReminderSent: null,
                checklist: [],
                prepSheet: {},
            },
            event || {}
        );

        base.assignedStaffIds = Array.isArray(base.assignedStaffIds)
            ? base.assignedStaffIds.filter(Boolean)
            : [];
        base.assignedTeam = Array.isArray(base.assignedTeam) ? base.assignedTeam.filter(Boolean) : [];
        base.checklist = normaliseChecklist(base.checklist);
        base.prepSheet = sanitisePrepSheet(base.prepSheet);

        if (!base.statusLevel && base.status) {
            base.statusLevel = mapStatusLevel(base.status);
        }

        if (!base.staffingLevel && base.staffingStatus) {
            base.staffingLevel = mapStatusLevel(base.staffingStatus);
        }

        return base;
    }

    function normaliseEmployee(employee) {
        const base = Object.assign({}, employee || {});

        if (!base.statusLevel && base.status) {
            base.statusLevel = mapStatusLevel(base.status);
        }

        return base;
    }

    function normaliseData(data) {
        if (!data || typeof data !== 'object') {
            return clone(defaultData);
        }

        return {
            events: (Array.isArray(data.events) ? data.events : defaultData.events).map((event) => normaliseEvent(event)),
            employees: (Array.isArray(data.employees) ? data.employees : defaultData.employees).map((employee) =>
                normaliseEmployee(employee)
            ),
        };
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

    function mapStatusLevel(value) {
        if (!value) {
            return 'neutral';
        }

        const lower = String(value).toLowerCase();

        if (lower.includes('confirm') || lower.includes('ready') || lower.includes('won') || lower.includes('available')) {
            return 'success';
        }

        if (lower.includes('await') || lower.includes('limited') || lower.includes('need') || lower.includes('scheduled')) {
            return 'warning';
        if (hasLocalStorage) {
            try {
                const raw = global.localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    cache = normaliseData(JSON.parse(raw));
                    return cache;
                }

                const seeded = normaliseData(clone(defaultData));
                global.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
                cache = seeded;
                return cache;
            } catch (error) {
                console.warn('Unable to read scheduler data from localStorage. Using in-memory fallback.', error);
            }
        }

        if (!memoryStore) {
            memoryStore = normaliseData(clone(defaultData));
        }

        if (lower.includes('overdue') || lower.includes('behind') || lower.includes('lost')) {
            return 'danger';
        }

        return 'info';
    }

    function hydrateLead(lead) {
        const base = Object.assign(
            {
                activities: [],
                estimatedValue: 0,
            },
            lead
        );

        if (!Array.isArray(base.activities)) {
            base.activities = [];
        }

        base.activities = base.activities
            .map((activity) => {
                const activityBase = Object.assign(
                    {
                        id: generateId('act'),
                        type: 'note',
                        createdAt: Date.now(),
                    },
                    activity
                );

                if (!activityBase.method) {
                    activityBase.method = 'Email';
                }

                return activityBase;
            })
            .sort((a, b) => b.createdAt - a.createdAt);

        if (!base.statusLevel) {
            base.statusLevel = mapStatusLevel(base.status);
        }

        return base;
    }

    function normalise(data) {
        if (!data || typeof data !== 'object') {
            return clone(defaultData);
        }

        const events = Array.isArray(data.events) ? data.events : defaultData.events;
        const employees = Array.isArray(data.employees) ? data.employees : defaultData.employees;
        const leads = Array.isArray(data.leads) ? data.leads : defaultData.leads;

        const hydratedEvents = events.map((event) => {
            const base = Object.assign(
                {
                    assignedStaffIds: [],
                    assignedTeam: [],
                    requiredStaff: 0,
                    lastReminderSent: null,
                },
                event
            );

            if (!Array.isArray(base.assignedStaffIds)) {
                base.assignedStaffIds = [];
            }

            if (!Array.isArray(base.assignedTeam)) {
                base.assignedTeam = [];
            }

            if (!base.statusLevel) {
                base.statusLevel = mapStatusLevel(base.status);
            }

            if (!base.staffingLevel) {
                base.staffingLevel = mapStatusLevel(base.staffingStatus);
            }

            return base;
        });

        const hydratedEmployees = employees.map((employee) => {
            const base = Object.assign({}, employee);
            if (!base.statusLevel) {
                base.statusLevel = mapStatusLevel(base.status);
            }
            return base;
        });

        const hydratedLeads = leads.map((lead) => hydrateLead(lead));

        return {
            events: hydratedEvents,
            employees: hydratedEmployees,
            leads: hydratedLeads,
        };
    }

    function readRaw() {
        if (cache) {
            return cache;
        }

        if (hasLocalStorage) {
            try {
                const raw = global.localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    const seeded = clone(defaultData);
                    cache = seeded;
                    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
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
        const payload = normaliseData(data);
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

        const normalisedEvents = (Array.isArray(data.events) ? data.events : clone(defaultData.events)).map(normaliseEvent);

        const normalisedEmployees = (Array.isArray(data.employees) ? data.employees : clone(defaultData.employees)).map((employee) => {
            const next = Object.assign({}, employee);
            if (!next.statusLevel && next.status) {
                next.statusLevel = mapStatusLevel(next.status);
            }
            return next;
        });

        return {
            events: normalisedEvents,
            employees: normalisedEmployees,
        };
    }

    function generateId(prefix) {
        const randomPart = Math.random().toString(36).slice(2, 8);
        const timePart = Date.now().toString(36);
        return `${prefix}-${randomPart}-${timePart}`;
    }

    const store = {
        getSnapshot() {
            return clone(readRaw());
        },
        getEvents() {
            return clone(readRaw().events);
        },
        getEvent(eventId) {
            if (!eventId) {
                return null;
            }

            const event = readRaw().events.find((item) => item.id === eventId);
            return event ? clone(event) : null;
        },
        getEmployees() {
            return clone(readRaw().employees);
        },
        getLeads() {
            return clone(readRaw().leads);
        },
        getLead(leadId) {
            if (!leadId) {
                return null;
            }
            const lead = readRaw().leads.find((item) => item.id === leadId);
            return lead ? clone(lead) : null;
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
                    assignedStaffIds: [],
                    assignedTeam: [],
                    requiredStaff: 0,
                    lastReminderSent: null,
                },
                eventInput
            const event = normaliseEvent(
                Object.assign(
                    {
                        id: generateId('evt'),
                        createdAt: Date.now(),
                    },
                    eventInput || {}
                )
            );

            snapshot.events.push(event);
            writeRaw(snapshot);
            return clone(event);
        },
        removeEvent(eventId) {
            if (!eventId) {
                return;
            }

            const snapshot = readRaw();
            snapshot.events = snapshot.events.filter((event) => event.id !== eventId);
            writeRaw(snapshot);
        },
        updateEvent(eventId, updates) {
            if (!eventId) {
                return null;
            }

            const snapshot = readRaw();
            const index = snapshot.events.findIndex((event) => event.id === eventId);

            if (index === -1) {
                return null;
            }

            const current = snapshot.events[index];
            const patch = typeof updates === 'function' ? updates(clone(current)) : updates || {};
            const nextEvent = normaliseEvent(
                Object.assign({}, current, patch, {
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            const patch = typeof updates === 'function' ? updates(clone(current)) : updates;
            const nextEvent = Object.assign({}, current, patch, {
                updatedAt: Date.now(),
            });

            if (Object.prototype.hasOwnProperty.call(patch, 'status')) {
                nextEvent.statusLevel = mapStatusLevel(nextEvent.status);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'staffingStatus')) {
                nextEvent.staffingLevel = mapStatusLevel(nextEvent.staffingStatus);
            const nextEvent = Object.assign({}, current, patch);
            const normalisedEvent = normaliseEvent(nextEvent);
            snapshot.events[index] = normalisedEvent;
            writeRaw(snapshot);
            return clone(nextEvent);
        },
        addChecklistItem(eventId, label) {
            if (!label) {
                return null;
            }

            const trimmed = String(label).trim();
            if (!trimmed) {
                return null;
            }

            const snapshot = readRaw();
            const index = snapshot.events.findIndex((event) => event.id === eventId);
            if (index === -1) {
                return null;
            }

            const target = snapshot.events[index];
            const item = {
                id: generateId('chk'),
                label: trimmed,
                completed: false,
            };

            const nextEvent = normaliseEvent(
                Object.assign({}, target, {
                    checklist: normaliseChecklist((target.checklist || []).concat(item)),
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return clone(item);
        },
        updateChecklistItem(eventId, itemId, updates) {
            const snapshot = readRaw();
            const index = snapshot.events.findIndex((event) => event.id === eventId);
            if (index === -1) {
                return null;
            }

            const target = snapshot.events[index];
            const checklist = Array.isArray(target.checklist) ? target.checklist.slice() : [];
            const itemIndex = checklist.findIndex((item) => item.id === itemId);
            if (itemIndex === -1) {
                return null;
            }

            const current = checklist[itemIndex];
            const patch = typeof updates === 'function' ? updates(clone(current)) : updates || {};
            checklist[itemIndex] = Object.assign({}, current, patch);

            const nextEvent = normaliseEvent(
                Object.assign({}, target, {
                    checklist: normaliseChecklist(checklist),
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return clone(nextEvent.checklist[itemIndex]);
        },
        removeChecklistItem(eventId, itemId) {
            const snapshot = readRaw();
            const index = snapshot.events.findIndex((event) => event.id === eventId);
            if (index === -1) {
                return;
            }

            const target = snapshot.events[index];
            const checklist = Array.isArray(target.checklist)
                ? target.checklist.filter((item) => item.id !== itemId)
                : [];

            const nextEvent = normaliseEvent(
                Object.assign({}, target, {
                    checklist,
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
        },
        savePrepSheet(eventId, prepSheet) {
            const snapshot = readRaw();
            const index = snapshot.events.findIndex((event) => event.id === eventId);
            if (index === -1) {
                return null;
            }

            const target = snapshot.events[index];
            const nextEvent = normaliseEvent(
                Object.assign({}, target, {
                    prepSheet: sanitisePrepSheet(prepSheet),
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return clone(nextEvent.prepSheet);
        },
        assignStaff(eventId, staffIds) {
            const ids = Array.isArray(staffIds) ? staffIds.filter(Boolean) : [];
            const snapshot = readRaw();
            const index = snapshot.events.findIndex((event) => event.id === eventId);

            if (index === -1) {
                return null;
            }

            const current = snapshot.events[index];
            const required = typeof current.requiredStaff === 'number' ? current.requiredStaff : 0;
            const assignedCount = ids.length;

            let staffingStatus = 'Unassigned';
            if (assignedCount === 0) {
                staffingStatus = required > 0 ? `Needs ${required} staff` : 'Unassigned';
            } else if (required && assignedCount < required) {
                const remaining = required - assignedCount;
                staffingStatus = remaining === 0 ? 'Fully staffed' : `Needs ${remaining} more`;
            } else if (required && assignedCount >= required) {
                staffingStatus = 'Fully staffed';
            } else {
                staffingStatus = `Assigned ${assignedCount} team`;
            }

            const nextEvent = Object.assign({}, current, {
                assignedStaffIds: ids,
                staffingStatus,
                staffingLevel: mapStatusLevel(staffingStatus),
                updatedAt: Date.now(),
            });
            const nextEvent = normaliseEvent(
                Object.assign({}, current, {
                    assignedStaffIds: ids,
                    staffingStatus,
                    staffingLevel: mapStatusLevel(staffingStatus),
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return clone(nextEvent);
        },
        addEmployee(employeeInput) {
            const snapshot = readRaw();
            const employee = normaliseEmployee(
                Object.assign(
                    {
                        id: generateId('emp'),
                        createdAt: Date.now(),
                    },
                    employeeInput || {}
                )
            );

            snapshot.employees.push(employee);
            writeRaw(snapshot);
            return clone(employee);
        },
        removeEmployee(employeeId) {
            if (!employeeId) {
                return;
            }

            const snapshot = readRaw();
            snapshot.employees = snapshot.employees.filter((employee) => employee.id !== employeeId);
            writeRaw(snapshot);
        },
        addLead(leadInput) {
            const snapshot = readRaw();
            const lead = hydrateLead(
                Object.assign(
                    {
                        id: generateId('lead'),
                        createdAt: Date.now(),
                        activities: [],
                    },
                    leadInput
                )
            );

            if (!lead.nextTouchpoint && lead.notes) {
                lead.nextTouchpoint = 'Schedule follow-up';
            }

            snapshot.leads.push(lead);
            writeRaw(snapshot);
            return clone(lead);
        },
        updateLead(leadId, updates) {
            if (!leadId) {
                return null;
            }

            const snapshot = readRaw();
            const index = snapshot.leads.findIndex((lead) => lead.id === leadId);
            if (index === -1) {
                return null;
            }

            const current = snapshot.leads[index];
            const patch = typeof updates === 'function' ? updates(clone(current)) : updates;
            const nextLead = hydrateLead(
                Object.assign({}, current, patch, {
                    updatedAt: Date.now(),
                })
            );

            if (Object.prototype.hasOwnProperty.call(patch, 'status')) {
                nextLead.statusLevel = mapStatusLevel(nextLead.status);
            }

            snapshot.leads[index] = nextLead;
            writeRaw(snapshot);
            return clone(nextLead);
        },
        addLeadActivity(leadId, activityInput) {
            if (!leadId) {
                return null;
            }

            const snapshot = readRaw();
            const index = snapshot.leads.findIndex((lead) => lead.id === leadId);
            if (index === -1) {
                return null;
            }

            const current = snapshot.leads[index];
            const activity = Object.assign(
                {
                    id: generateId('act'),
                    type: 'follow-up',
                    method: 'Email',
                    summary: 'Follow-up logged',
                    createdAt: Date.now(),
                },
                activityInput
            );

            const nextLead = hydrateLead(
                Object.assign({}, current, {
                    activities: [activity, ...current.activities],
                    lastFollowUpAt: activity.createdAt,
                    lastFollowUpMethod: activity.method,
                    nextTouchpoint: activity.nextTouchpoint || current.nextTouchpoint,
                })
            );

            snapshot.leads[index] = nextLead;
            writeRaw(snapshot);
            return clone(nextLead);
        },
        clearAll() {
            writeRaw(clone(defaultData));
        },
    };

    global.B2UStore = store;
})(typeof window !== 'undefined' ? window : globalThis);

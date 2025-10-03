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
                assignedStaffIds: ['john-doe', 'alex-rivera', 'priya-singh', 'marcus-allen'],
                status: 'Confirmed',
                statusLevel: 'success',
                staffingStatus: 'Fully staffed',
                staffingLevel: 'success',
                assignedTeam: ['john-doe', 'alex-rivera', 'priya-singh'],
                notes: 'Deposit received. Call time 6:00 PM.',
                lastReminderSent: now - 1000 * 60 * 60 * 24,
                createdAt: now - 1000 * 60 * 20,
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
                assignedStaffIds: ['john-doe', 'priya-singh'],
                status: 'Awaiting deposit',
                statusLevel: 'warning',
                staffingStatus: 'Needs 2 bartenders',
                staffingLevel: 'warning',
                assignedTeam: [],
                notes: 'Send reminder for deposit. Discuss signature cocktail list.',
                lastReminderSent: null,
                createdAt: now - 1000 * 60 * 60 * 3,
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
                assignedStaffIds: ['jane-smith', 'jamie-lee'],
                status: 'Contract overdue',
                statusLevel: 'danger',
                staffingStatus: 'Partial coverage',
                staffingLevel: 'warning',
                assignedTeam: ['jamie-lee'],
                notes: 'Client reviewing updated package. Follow up Friday.',
                lastReminderSent: null,
                createdAt: now - 1000 * 60 * 60 * 10,
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
                assignedStaffIds: ['alex-rivera', 'marcus-allen'],
                status: 'Confirmed',
                statusLevel: 'success',
                staffingStatus: 'Ready',
                staffingLevel: 'success',
                assignedTeam: ['priya-singh'],
                notes: 'Include mocktail options and allergy-friendly mixers.',
                lastReminderSent: now - 1000 * 60 * 60 * 12,
                createdAt: now - 1000 * 60 * 5,
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
                id: 'john-doe',
                name: 'John Doe',
                role: 'Bar Lead',
                specialties: 'Flair certified · High-volume service',
                status: 'available',
                statusLabel: 'Available',
                location: 'Houston, TX',
                email: 'john.doe@bartending2u.com',
                phone: '(713) 555-0114',
                addressLine1: '1901 Market St',
                addressLine2: 'Suite 210',
                addressCity: 'Houston',
                addressState: 'TX',
                addressPostalCode: '77002',
                taxId: '123-45-6789',
                dob: '1984-07-19',
                dlNumber: 'TX12345678',
                dlState: 'TX',
                notes: 'Lead trainer for new hires. Loves crafting signature welcome cocktails.',
                assignments: [
                    'Corporate Party — Oct 5 (Lead bartender)',
                    'VIP Lounge — Oct 12 (Setup & close)'
                ],
                documents: [
                    {
                        type: 'TABC Certificate',
                        status: 'Active',
                        issued: '2023-05-12',
                        expires: '2025-05-12',
                        licenseNumber: 'TX-BC-4412',
                        url: '#',
                        attention: false
                    },
                    { type: 'Liability Waiver', status: 'On file', expires: '—', url: '#', attention: false }
                ],
                portal: {
                    status: 'active',
                    statusLabel: 'Active',
                    statusLevel: 'success',
                    accessLevel: 'Full portal access',
                    inviteSentAt: '2024-06-20T15:30:00',
                    lastLogin: '2025-10-01T09:42:00',
                    mfaEnabled: true,
                    canResetPassword: true,
                    canResendInvite: false,
                    loginActivity: [
                        { timestamp: '2025-10-01T09:42:00', action: 'Logged in on desktop', location: 'Houston, TX' },
                        { timestamp: '2025-09-28T17:22:00', action: 'Reviewed corporate party schedule', location: 'Houston, TX' },
                        { timestamp: '2025-09-26T11:08:00', action: 'Downloaded pay stub', location: 'Mobile · Austin, TX' }
                    ]
                }
            },
            {
                id: 'jane-smith',
                name: 'Jane Smith',
                role: 'Mixologist',
                specialties: 'Mocktail specialist · Low ABV menus',
                status: 'pto',
                statusLabel: 'On PTO',
                location: 'Austin, TX',
                email: 'jane.smith@bartending2u.com',
                phone: '(512) 555-0199',
                addressLine1: '501 Congress Ave',
                addressLine2: 'Apt 9B',
                addressCity: 'Austin',
                addressState: 'TX',
                addressPostalCode: '78701',
                taxId: '234-56-7890',
                dob: '1990-02-11',
                dlNumber: 'TX87654321',
                dlState: 'TX',
                notes: 'Certified sommelier. Currently on PTO returning Oct 14.',
                assignments: [
                    'Mocktail Workshop — Oct 22 (Program design)'
                ],
                documents: [
                    {
                        type: 'TABC Certificate',
                        status: 'Expiring soon',
                        issued: '2022-11-01',
                        expires: '2024-10-30',
                        licenseNumber: 'TX-ML-3008',
                        url: '#',
                        attention: true
                    },
                    { type: 'Food Handler', status: 'Submitted', expires: '2026-02-01', url: '#', attention: false }
                ],
                portal: {
                    status: 'invite-pending',
                    statusLabel: 'Invite pending',
                    statusLevel: 'warning',
                    accessLevel: 'Awaiting portal activation',
                    inviteSentAt: '2025-09-20T13:15:00',
                    lastLogin: null,
                    mfaEnabled: false,
                    canResetPassword: false,
                    canResendInvite: true,
                    loginActivity: []
                }
            },
            {
                id: 'alex-rivera',
                name: 'Alex Rivera',
                role: 'Bartender',
                specialties: 'Bilingual · Large format batching',
                status: 'available',
                statusLabel: 'Available',
                location: 'Dallas, TX',
                email: 'alex.rivera@bartending2u.com',
                phone: '(469) 555-0147',
                addressLine1: '1400 Elm St',
                addressLine2: '',
                addressCity: 'Dallas',
                addressState: 'TX',
                addressPostalCode: '75202',
                taxId: '345-67-8901',
                dob: '1988-11-03',
                dlNumber: 'TX44556677',
                dlState: 'TX',
                notes: 'Lead for sports stadium activations. Fluent in Spanish and English.',
                assignments: [
                    'Corporate Party — Oct 5 (Support)',
                    'Wedding Reception — Oct 15 (Bartender)'
                ],
                documents: [
                    {
                        type: 'TABC Certificate',
                        status: 'Active',
                        issued: '2024-01-19',
                        expires: '2026-01-19',
                        licenseNumber: 'TX-RV-7782',
                        url: '#',
                        attention: false
                    },
                    { type: 'Food Handler', status: 'Pending upload', expires: '—', url: '#', attention: true }
                ],
                portal: {
                    status: 'active',
                    statusLabel: 'Active',
                    statusLevel: 'success',
                    accessLevel: 'Schedule + pay stubs',
                    inviteSentAt: '2024-08-05T10:05:00',
                    lastLogin: '2025-09-30T18:10:00',
                    mfaEnabled: false,
                    canResetPassword: true,
                    canResendInvite: false,
                    loginActivity: [
                        { timestamp: '2025-09-30T18:10:00', action: 'Logged in on mobile', location: 'Dallas, TX' },
                        { timestamp: '2025-09-27T08:55:00', action: 'Confirmed shift availability', location: 'Dallas, TX' }
                    ]
                }
            },
            {
                id: 'priya-singh',
                name: 'Priya Singh',
                role: 'Mixology Lead',
                specialties: 'Seasonal menu design · Training',
                status: 'available',
                statusLabel: 'Available',
                location: 'Houston, TX',
                email: 'priya.singh@bartending2u.com',
                phone: '(832) 555-0177',
                addressLine1: '2220 Westheimer Rd',
                addressLine2: 'Unit 5',
                addressCity: 'Houston',
                addressState: 'TX',
                addressPostalCode: '77098',
                taxId: '456-78-9012',
                dob: '1986-05-27',
                dlNumber: 'TX99887766',
                dlState: 'TX',
                notes: 'Hosts quarterly workshops and champions zero-proof menu innovation.',
                assignments: [
                    'Mixology Workshop — Oct 18 (Instructor)',
                    'Holiday Menu Lab — Nov 2 (Designer)'
                ],
                documents: [
                    {
                        type: 'TABC Certificate',
                        status: 'Active',
                        issued: '2023-11-08',
                        expires: '2025-11-08',
                        licenseNumber: 'TX-PS-1150',
                        url: '#',
                        attention: false
                    },
                    { type: 'W-9', status: 'On file', expires: '—', url: '#', attention: false }
                ],
                portal: {
                    status: 'active',
                    statusLabel: 'Active',
                    statusLevel: 'success',
                    accessLevel: 'Manager access',
                    inviteSentAt: '2023-12-12T09:00:00',
                    lastLogin: '2025-09-29T07:30:00',
                    mfaEnabled: true,
                    canResetPassword: true,
                    canResendInvite: false,
                    loginActivity: [
                        { timestamp: '2025-09-29T07:30:00', action: 'Approved workshop roster', location: 'Houston, TX' },
                        { timestamp: '2025-09-25T19:05:00', action: 'Sent message to mixology team', location: 'Houston, TX' },
                        { timestamp: '2025-09-21T12:18:00', action: 'Updated availability', location: 'Mobile · Austin, TX' }
                    ]
                }
            },
            {
                id: 'jamie-lee',
                name: 'Jamie Lee',
                role: 'Support',
                specialties: 'Prep specialist · Logistics',
                status: 'limited',
                statusLabel: 'Limited hours',
                location: 'San Antonio, TX',
                email: 'jamie.lee@bartending2u.com',
                phone: '(210) 555-0188',
                addressLine1: '815 Avenue B',
                addressLine2: '',
                addressCity: 'San Antonio',
                addressState: 'TX',
                addressPostalCode: '78215',
                taxId: '567-89-0123',
                dob: '1992-09-14',
                dlNumber: 'TX11223344',
                dlState: 'TX',
                notes: 'Available for load-ins and barback duties Thursdays through Sundays.',
                assignments: [
                    'Mixology Workshop — Oct 18 (Support)'
                ],
                documents: [
                    {
                        type: 'TABC Certificate',
                        status: 'Needs renewal',
                        issued: '2022-09-25',
                        expires: '2024-09-25',
                        licenseNumber: 'TX-JL-8821',
                        url: '#',
                        attention: true
                    },
                    { type: 'Liability Waiver', status: 'On file', expires: '—', url: '#', attention: false }
                ],
                portal: {
                    status: 'disabled',
                    statusLabel: 'Access disabled',
                    statusLevel: 'danger',
                    accessLevel: 'Portal locked until renewal',
                    inviteSentAt: '2024-02-10T16:45:00',
                    lastLogin: '2024-08-18T14:05:00',
                    mfaEnabled: false,
                    canResetPassword: false,
                    canResendInvite: false,
                    loginActivity: [
                        { timestamp: '2024-08-18T14:05:00', action: 'Account locked after credential expiration', location: 'San Antonio, TX' }
                    ]
                }
            },
            {
                id: 'marcus-allen',
                name: 'Marcus Allen',
                role: 'Barback',
                specialties: 'Inventory & breakdown',
                status: 'available',
                statusLabel: 'Available',
                location: 'Houston, TX',
                email: 'marcus.allen@bartending2u.com',
                phone: '(713) 555-0160',
                addressLine1: '3710 Main St',
                addressLine2: '',
                addressCity: 'Houston',
                addressState: 'TX',
                addressPostalCode: '77002',
                taxId: '678-90-1234',
                dob: '1987-03-08',
                dlNumber: 'TX55667788',
                dlState: 'TX',
                notes: 'Great with tight timelines and closing shifts. CDL certified.',
                assignments: [
                    'Wedding Reception — Oct 15 (Barback)',
                    'Corporate Holiday Preview — Oct 28 (Inventory)'
                ],
                documents: [
                    { type: 'Food Handler', status: 'Active', expires: '2025-03-15', url: '#', attention: false }
                ],
                portal: {
                    status: 'active',
                    statusLabel: 'Active',
                    statusLevel: 'success',
                    accessLevel: 'Schedule access only',
                    inviteSentAt: '2025-01-12T08:30:00',
                    lastLogin: '2025-09-24T06:55:00',
                    mfaEnabled: false,
                    canResetPassword: true,
                    canResendInvite: false,
                    loginActivity: [
                        { timestamp: '2025-09-24T06:55:00', action: 'Checked load-in checklist', location: 'Houston, TX' },
                        { timestamp: '2025-09-18T20:40:00', action: 'Confirmed transportation availability', location: 'Mobile · Houston, TX' }
                    ]
                }
            }
        ],
        leads: [],
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toTitleCase(value) {
        if (!value) {
            return '';
        }
        return value.replace(/\b([a-z])/gi, (match) => match.toUpperCase());
    }

    function mapStatusLevel(value) {
        if (!value) {
            return 'neutral';
        }
        const lower = value.toLowerCase();
        if (lower.includes('confirm') || lower.includes('ready') || lower.includes('available') || lower.includes('staffed')) {
            return 'success';
        }
        if (lower.includes('need') || lower.includes('limited') || lower.includes('await') || lower.includes('pto') || lower.includes('pending')) {
            return 'warning';
        }
        if (lower.includes('overdue') || lower.includes('contract') || lower.includes('booked') || lower.includes('disabled') || lower.includes('locked')) {
            return 'danger';
        }
        return 'info';
    }

    function normaliseDocument(document) {
        const base = Object.assign(
            {
                type: 'Document',
                status: 'On file',
                attention: false,
                url: '#',
            },
            document || {}
        );
        return base;
    }

    function normalisePortal(portal) {
        const base = Object.assign(
            {
                status: 'invite-pending',
                statusLabel: 'Invite pending',
                statusLevel: 'warning',
                accessLevel: 'Awaiting activation',
                inviteSentAt: null,
                lastLogin: null,
                mfaEnabled: false,
                canResetPassword: false,
                canResendInvite: false,
                loginActivity: [],
            },
            portal || {}
        );

        if (!base.statusLabel) {
            base.statusLabel = toTitleCase(base.status);
        }
        if (!base.statusLevel) {
            base.statusLevel = mapStatusLevel(base.status);
        }

        base.loginActivity = Array.isArray(base.loginActivity) ? base.loginActivity.slice() : [];
        return base;
    }

    function normaliseEmployee(employee) {
        const base = Object.assign(
            {
                id: generateId('emp'),
                createdAt: Date.now(),
                status: 'available',
                statusLabel: 'Available',
                notes: '',
                assignments: [],
                documents: [],
                portal: {},
            },
            employee || {}
        );

        if (!base.statusLabel) {
            base.statusLabel = toTitleCase(base.status);
        }
        if (!base.statusLevel) {
            base.statusLevel = mapStatusLevel(base.statusLabel || base.status);
        }

        base.assignments = Array.isArray(base.assignments) ? base.assignments.slice() : [];
        base.documents = Array.isArray(base.documents) ? base.documents.map(normaliseDocument) : [];
        base.portal = normalisePortal(base.portal);

        return base;
    }

    function normaliseEvent(event) {
        const base = Object.assign(
            {
                id: generateId('evt'),
                createdAt: Date.now(),
                assignedStaffIds: [],
                assignedTeam: [],
                requiredStaff: 0,
                status: 'Draft',
                staffingStatus: 'Unassigned',
                lastReminderSent: null,
            },
            event || {}
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
    }

    function normalise(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            return clone(defaultData);
        }

        const events = Array.isArray(snapshot.events) ? snapshot.events.map(normaliseEvent) : clone(defaultData.events);
        const employees = Array.isArray(snapshot.employees) ? snapshot.employees.map(normaliseEmployee) : clone(defaultData.employees);

        return { events, employees };
    }

    function mapStatusLevel(value) {
        if (!value) {
            return 'neutral';
        }

        const lower = String(value).toLowerCase();

        if (lower.includes('confirm') || lower.includes('ready') || lower.includes('won') || lower.includes('staffed')) {
            return 'success';
        }

        if (lower.includes('await') || lower.includes('need') || lower.includes('limited') || lower.includes('pto')) {
            return 'warning';
        }

        if (lower.includes('overdue') || lower.includes('cancel') || lower.includes('lost')) {
            return 'danger';
        }

        return 'info';
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

    function normaliseEvent(event) {
        const base = Object.assign(
            {
                assignedStaffIds: [],
                assignedTeam: [],
                requiredStaff: 0,
                lastReminderSent: null,
                checklist: [],
                prepSheet: { menu: '', equipment: '', staffing: '' },
            },
            event || {}
        );

        base.assignedStaffIds = Array.isArray(base.assignedStaffIds)
            ? base.assignedStaffIds.filter(Boolean)
            : [];
        base.assignedTeam = Array.isArray(base.assignedTeam) ? base.assignedTeam.filter(Boolean) : [];
        base.checklist = normaliseChecklist(base.checklist);
        base.prepSheet = sanitisePrepSheet(base.prepSheet);

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

    function normaliseLead(lead) {
        const base = Object.assign({}, lead || {});

        if (!base.statusLevel && base.status) {
            base.statusLevel = mapStatusLevel(base.status);
        }

        if (!Array.isArray(base.activities)) {
            base.activities = [];
        }

        base.activities = base.activities
            .filter((activity) => activity && typeof activity === 'object')
            .map((activity) =>
                Object.assign(
                    {
                        id: generateId('act'),
                        type: 'note',
                        method: '',
                        summary: '',
                        message: '',
                        createdAt: Date.now(),
                    },
                    activity
                )
            );

        return base;
    }

    function normalise(data) {
        if (!data || typeof data !== 'object') {
            return clone(defaultData);
        }

        const eventsSource = Array.isArray(data.events) ? data.events : defaultData.events;
        const employeesSource = Array.isArray(data.employees) ? data.employees : defaultData.employees;
        const leadsSource = Array.isArray(data.leads) ? data.leads : defaultData.leads;

        return {
            events: eventsSource.map((event) => normaliseEvent(event)),
            employees: employeesSource.map((employee) => normaliseEmployee(employee)),
            leads: leadsSource.map((lead) => normaliseLead(lead)),
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
    let memoryStore = clone(defaultData);
    let cache = null;

    function readRaw() {
        if (hasLocalStorage) {
            try {
                const raw = global.localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    cache = normalise(JSON.parse(raw));
                    return cache;
                }
            } catch (error) {
                // Fall through to memory store
            }
        }

        if (!cache) {
            cache = normalise(memoryStore);
        }

        return cache;
    }

    function writeRaw(payload) {
        const normalised = normalise(payload);
        cache = normalised;

        if (hasLocalStorage) {
            try {
                global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised));
            } catch (error) {
                // Ignore writes that fail so the UI can keep working with the in-memory cache
            }
        }

        memoryStore = clone(payload);
    }

    function generateId(prefix) {
        const randomPart = Math.random().toString(36).slice(2, 8);
        const timePart = Date.now().toString(36);
        return `${prefix}-${randomPart}-${timePart}`;
    }

    function ensureEventIndex(snapshot, eventId) {
        if (!eventId) {
            return { index: -1, current: null };
        }

        const index = snapshot.events.findIndex((event) => event.id === eventId);
        if (index === -1) {
            return { index: -1, current: null };
        }

        return { index, current: snapshot.events[index] };
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
            const event = normaliseEvent(Object.assign({ id: generateId('evt'), createdAt: Date.now() }, eventInput));
            snapshot.events.push(event);
            writeRaw(snapshot);
            return clone(event);
        },
        removeEvent(eventId) {
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
            const patch = typeof updates === 'function' ? updates(clone(current)) : updates;
            const nextEvent = normaliseEvent(Object.assign({}, current, patch, { id: current.id, updatedAt: Date.now() }));
            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return clone(nextEvent);
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
        addChecklistItem(eventId, label) {
            const trimmed = typeof label === 'string' ? label.trim() : '';
            if (!eventId || !trimmed) {
                return null;
            }

            const snapshot = readRaw();
            const { index, current } = ensureEventIndex(snapshot, eventId);
            if (index === -1 || !current) {
                return null;
            }

            const nextChecklist = Array.isArray(current.checklist) ? current.checklist.slice() : [];
            const newItem = {
                id: generateId('chk'),
                label: trimmed,
                completed: false,
            };

            nextChecklist.push(newItem);

            const nextEvent = normaliseEvent(
                Object.assign({}, current, {
                    checklist: nextChecklist,
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);

            const savedItem = nextEvent.checklist.find((item) => item.id === newItem.id);
            return savedItem ? clone(savedItem) : clone(newItem);
        },
        updateChecklistItem(eventId, itemId, updates) {
            if (!eventId || !itemId) {
                return null;
            }

            const snapshot = readRaw();
            const { index, current } = ensureEventIndex(snapshot, eventId);
            if (index === -1 || !current) {
                return null;
            }

            const checklist = Array.isArray(current.checklist) ? current.checklist : [];
            let matched = false;

            const nextChecklist = checklist.map((item) => {
                if (item.id !== itemId) {
                    return item;
                }

                matched = true;
                const patch = typeof updates === 'function' ? updates(clone(item)) : updates || {};
                const nextItem = Object.assign({}, item, patch);

                if (patch.label !== undefined) {
                    const trimmed = String(patch.label).trim();
                    if (trimmed) {
                        nextItem.label = trimmed;
                    } else {
                        nextItem.label = item.label;
                    }
                }

                if (patch.completed !== undefined) {
                    nextItem.completed = Boolean(patch.completed);
                } else {
                    nextItem.completed = Boolean(nextItem.completed);
                }

                nextItem.id = item.id;
                return nextItem;
            });

            if (!matched) {
                return null;
            }

            const nextEvent = normaliseEvent(
                Object.assign({}, current, {
                    checklist: nextChecklist,
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);

            const savedItem = nextEvent.checklist.find((item) => item.id === itemId);
            return savedItem ? clone(savedItem) : null;
        },
        removeChecklistItem(eventId, itemId) {
            if (!eventId || !itemId) {
                return false;
            }

            const snapshot = readRaw();
            const { index, current } = ensureEventIndex(snapshot, eventId);
            if (index === -1 || !current) {
                return false;
            }

            const checklist = Array.isArray(current.checklist) ? current.checklist : [];
            const nextChecklist = checklist.filter((item) => item.id !== itemId);

            if (nextChecklist.length === checklist.length) {
                return false;
            }

            const nextEvent = normaliseEvent(
                Object.assign({}, current, {
                    checklist: nextChecklist,
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return true;
        },
        savePrepSheet(eventId, prepInput) {
            if (!eventId) {
                return null;
            }

            const snapshot = readRaw();
            const { index, current } = ensureEventIndex(snapshot, eventId);
            if (index === -1 || !current) {
                return null;
            }

            const patch = typeof prepInput === 'function' ? prepInput(clone(current.prepSheet || {})) : prepInput;
            const sanitised = sanitisePrepSheet(patch);

            const nextEvent = normaliseEvent(
                Object.assign({}, current, {
                    prepSheet: sanitised,
                    updatedAt: Date.now(),
                })
            );

            snapshot.events[index] = nextEvent;
            writeRaw(snapshot);
            return clone(nextEvent.prepSheet);
        },
        addEmployee(employeeInput) {
            const snapshot = readRaw();
            const employee = normaliseEmployee(
                Object.assign(
                    {
                        id: employeeInput && employeeInput.id ? employeeInput.id : generateId('emp'),
                        createdAt: Date.now(),
                    },
                    employeeInput
                )
            );
            snapshot.employees.push(employee);
            writeRaw(snapshot);
            return clone(employee);
        },
        updateEmployee(employeeId, updates) {
            if (!employeeId) {
                return null;
            }
            const snapshot = readRaw();
            const index = snapshot.employees.findIndex((employee) => employee.id === employeeId);
            if (index === -1) {
                return null;
            }
            const current = snapshot.employees[index];
            const patch = typeof updates === 'function' ? updates(clone(current)) : updates;
            const nextEmployee = normaliseEmployee(Object.assign({}, current, patch, { id: current.id, updatedAt: Date.now() }));
            snapshot.employees[index] = nextEmployee;
            writeRaw(snapshot);
            return clone(nextEmployee);
        },
        removeEmployee(employeeId) {
            const snapshot = readRaw();
            snapshot.employees = snapshot.employees.filter((employee) => employee.id !== employeeId);
            writeRaw(snapshot);
        },
    };

    writeRaw(readRaw());

    global.B2UStore = store;
})(typeof window !== 'undefined' ? window : globalThis);

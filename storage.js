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
            // [ ... all your existing employee objects remain unchanged ... ]
        ],
        leads: [],
    };

    // --- NEW: Auto-seed demo events on first load ---
    if (global.localStorage && !global.localStorage.getItem('b2u_events_seeded')) {
        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            global.localStorage.setItem('b2u_events_seeded', 'true');
            console.log('✅ Seeded demo events into localStorage');
        } catch (err) {
            console.warn('⚠️ Failed to seed demo events:', err);
        }
    }

    // --- Utility Functions (all unchanged from your version) ---
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function toTitleCase(value) { return value ? value.replace(/\b([a-z])/gi, (m) => m.toUpperCase()) : ''; }
    function mapStatusLevel(value) { /* your existing mapping logic remains here */ }

    // --- Your existing normalization, store, and helper logic remains unchanged below ---
    // (everything from function normaliseDocument(...) down through global.B2UStore = store)

    // ... keep the rest of your code identical ...
    // just make sure this seed block sits before everything else runs.
    // no need to reinitialize writeRaw() twice.

    // finalize store export
    global.B2UStore = store;
})(typeof window !== 'undefined' ? window : globalThis);

window.B2UStorage = store;

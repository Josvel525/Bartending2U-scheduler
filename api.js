(function (global) {
    const api = {
        // ---- Employees ----
        async listEmployees() {
            return global.B2UStore.getEmployees();
        },
        async createEmployee(payload) {
            return global.B2UStore.addEmployee(payload);
        },
        async updateEmployee(id, payload) {
            return global.B2UStore.updateEmployee(id, payload);
        },

        // ---- Events ----
        async listEvents(params) {
            let events = global.B2UStore.getEvents();

            // optional filtering
            if (params) {
                if (params.status && params.status !== 'all') {
                    events = events.filter(e => e.status.toLowerCase() === params.status.toLowerCase());
                }
                if (params.dateFrom) {
                    events = events.filter(e => new Date(e.date) >= new Date(params.dateFrom));
                }
                if (params.dateTo) {
                    events = events.filter(e => new Date(e.date) <= new Date(params.dateTo));
                }
            }

            return events;
        },
        async createEvent(payload) {
            return global.B2UStore.addEvent(payload);
        },
        async updateEvent(id, payload) {
            return global.B2UStore.updateEvent(id, payload);
        },
        async assignEmployee(eventId, payload) {
            return global.B2UStore.assignStaff(eventId, payload);
        },
        async removeAssignment(eventId, staffId) {
            const event = global.B2UStore.getEvent(eventId);
            if (!event) return null;
            const next = event.assignedStaffIds.filter(id => id !== staffId);
            return global.B2UStore.assignStaff(eventId, next);
        },

        // ---- Scheduler / Drafts ----
        async saveSchedulerDraft(payload) {
            return global.B2UStore.addEvent(Object.assign({}, payload, { status: 'Draft' }));
        },
        async fetchSchedulerDraft() {
            const events = global.B2UStore.getEvents();
            return events.filter(e => e.status.toLowerCase() === 'draft');
        },
        async deleteSchedulerDraft(id) {
            return global.B2UStore.removeEvent(id);
        },
        async submitScheduler(payload) {
            return global.B2UStore.addEvent(Object.assign({}, payload, { status: 'Scheduled' }));
        }
    };

    global.B2UApi = api;
})(window);

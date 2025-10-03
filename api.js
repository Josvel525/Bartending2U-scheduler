(function (global) {
    const API_BASE = '/api';

    async function request(path, options) {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            ...options,
        });

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            const message = isJson && data && typeof data === 'object' && 'error' in data
                ? data.error.message
                : response.statusText || 'Request failed';
            const error = new Error(message);
            error.status = response.status;
            error.payload = data;
            throw error;
        }

        if (isJson && data && typeof data === 'object' && 'ok' in data) {
            return data;
        }

        return { ok: true, data };
    }

    const api = {
        async listEmployees() {
            const result = await request('/employees');
            return result.data;
        },
        async createEmployee(payload) {
            const result = await request('/employees', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
        async updateEmployee(id, payload) {
            const result = await request(`/employees/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
        async listEvents(params) {
            const query = new URLSearchParams();
            if (params) {
                if (params.status) query.set('status', params.status);
                if (params.dateFrom) query.set('dateFrom', params.dateFrom);
                if (params.dateTo) query.set('dateTo', params.dateTo);
            }
            const result = await request(`/events${query.toString() ? `?${query}` : ''}`);
            return result.data;
        },
        async createEvent(payload) {
            const result = await request('/events', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
        async updateEvent(id, payload) {
            const result = await request(`/events/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
        async assignEmployee(eventId, payload) {
            const result = await request(`/events/${eventId}/assign`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
        async removeAssignment(eventId, assignmentId) {
            const result = await request(`/events/${eventId}/assign/${assignmentId}`, {
                method: 'DELETE',
            });
            return result.data;
        },
        async saveSchedulerDraft(payload) {
            const result = await request('/scheduler/save', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
        async fetchSchedulerDraft(formKey) {
            const result = await request(`/scheduler/saved?${new URLSearchParams({ formKey })}`);
            return result.data;
        },
        async deleteSchedulerDraft(id) {
            const result = await request(`/scheduler/saved/${id}`, {
                method: 'DELETE',
            });
            return result.data;
        },
        async submitScheduler(payload) {
            const result = await request('/scheduler/submit', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return result.data;
        },
    };

    global.B2UApi = api;
})(window);

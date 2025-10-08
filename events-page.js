(function () {
    const api = window.B2UApi;
    if (!api) {
        console.error('API helper is not available.');
        return;
    }

    const EVENTS_API_BASE = 'http://127.0.0.1:8000';
    const storage = window.B2UStorage || null;

    const form = document.getElementById('eventForm');
    const saveButton = document.getElementById('saveDraftButton');
    const submitButton = document.getElementById('submitSchedulerButton');
    const savedBadge = document.getElementById('draftStatusBadge');
    const savedTime = document.getElementById('draftStatusTime');
    const assignmentsSelect = document.getElementById('eventAssignments');
    const eventsTableBody = document.getElementById('eventsTableBody');
    const filterButtons = document.querySelectorAll('[data-filter]');
    const toast = document.getElementById('toast');
    const hiddenIdField = document.getElementById('eventId');

    if (!form || !saveButton || !submitButton || !assignmentsSelect || !eventsTableBody) {
        return;
    }

    const formKey = 'scheduler:events:default';
    const state = {
        employees: [],
        events: [],
        filter: 'all',
        draftId: null,
        isSaving: false,
        saveTimeout: null,
    };

    const statusBadgeMap = {
        draft: 'neutral',
        scheduled: 'info',
        completed: 'success',
        canceled: 'danger',
    };

    function formatDate(dateString, options) {
        if (!dateString) {
            return 'Date TBC';
        }
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return 'Date TBC';
        }
        return new Intl.DateTimeFormat('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    function formatTime(dateString) {
        if (!dateString) {
            return '';
        }
        if (/^([01]?\d|2[0-3]):([0-5]\d)$/.test(dateString)) {
            const [hours, minutes] = dateString.split(':').map((value) => Number.parseInt(value, 10));
            const date = new Date();
            date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
            return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
        }
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
    }

    function formatStatus(status) {
        if (!status) {
            return '—';
        }
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    function normaliseDateValue(value) {
        if (!value) {
            return '';
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().slice(0, 10);
    }

    function normaliseTimeValue(value) {
        if (!value) {
            return '';
        }
        if (/^([01]?\d|2[0-3]):([0-5]\d)$/.test(value)) {
            return value;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().slice(11, 16);
    }

    function showToast(message, variant) {
        if (!toast) {
            return;
        }
        toast.textContent = message;
        toast.dataset.variant = variant || 'info';
        toast.classList.remove('toast--visible');
        void toast.offsetWidth;
        toast.classList.add('toast--visible');
        setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, 3200);
    }

    function setSavedStatus(isSaved, timestamp) {
        if (!savedBadge || !savedTime) {
            return;
        }
        if (isSaved) {
            savedBadge.hidden = false;
            const date = timestamp ? new Date(timestamp) : new Date();
            savedTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            savedBadge.hidden = true;
            savedTime.textContent = '';
        }
    }

    function clearForm() {
        form.reset();
        if (assignmentsSelect) {
            Array.from(assignmentsSelect.options).forEach((option) => {
                option.selected = false;
            });
        }
        hiddenIdField.value = '';
        setSavedStatus(false);
    }

    function getFormValues() {
        const formData = new FormData(form);
        const assignments = Array.from(assignmentsSelect.selectedOptions).map((option) => ({
            employeeId: option.value,
            role: 'Staff',
        }));
        const payload = {
            event: {
                id: hiddenIdField.value || undefined,
                title: formData.get('name')?.toString().trim() || '',
                date: formData.get('date')?.toString() || '',
                startTime: formData.get('time')?.toString() || undefined,
                endTime: formData.get('endTime')?.toString() || undefined,
                location: formData.get('location')?.toString().trim() || undefined,
                clientName: formData.get('clientName')?.toString().trim() || undefined,
                clientPhone: formData.get('clientPhone')?.toString().trim() || undefined,
                notes: formData.get('notes')?.toString().trim() || undefined,
                status: formData.get('status')?.toString() || 'draft',
            },
            assignments,
            metadata: {
                package: formData.get('package')?.toString() || undefined,
                guestCount: formData.get('guestCount')?.toString() || undefined,
                payout: formData.get('payout')?.toString() || undefined,
                requiredStaff: formData.get('requiredStaff')?.toString() || undefined,
                staffingStatus: formData.get('staffingStatus')?.toString() || undefined,
            },
        };
        return payload;
    }

    function validateEventPayload(payload) {
        const errors = [];
        if (!payload.event.title) {
            errors.push('Event name is required');
        }
        if (!payload.event.date) {
            errors.push('Event date is required');
        }
        return errors;
    }

    function normaliseStatusValue(value) {
        if (!value) {
            return 'draft';
        }
        const status = String(value).trim().toLowerCase();
        switch (status) {
            case 'confirmed':
            case 'in progress':
                return 'scheduled';
            case 'awaiting deposit':
            case 'proposal':
            case 'pending':
                return 'draft';
            case 'cancelled':
                return 'canceled';
            default:
                return status;
        }
    }

    function toNumber(value) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function normaliseApiEvent(event) {
        if (!event || typeof event !== 'object') {
            return null;
        }
        const assignments = Array.isArray(event.assign_employees) ? event.assign_employees.map((item) => String(item)) : [];
        return {
            id: event.id,
            name: event.name || 'Untitled event',
            date: event.date || '',
            startTime: event.start_time || '',
            endTime: event.end_time || '',
            location: event.location || '',
            package: event.package || '',
            guestCount: event.guest_count ?? null,
            payout: event.payout ?? null,
            targetStaffCount: event.target_staff_count ?? null,
            assignEmployees: assignments,
            clientName: event.client_name || '',
            clientPhone: event.client_phone || '',
            status: normaliseStatusValue(event.status),
            staffingStatus: event.staffing_status || '',
            notes: event.notes || '',
            updatedAt: event.updated_at || new Date().toISOString(),
        };
    }

    function normaliseLocalEvent(event) {
        if (!event || typeof event !== 'object') {
            return null;
        }
        const assignedIds = Array.isArray(event.assignedStaffIds)
            ? event.assignedStaffIds
            : Array.isArray(event.assignEmployees)
            ? event.assignEmployees
            : [];
        const timestamp = event.updatedAt || event.createdAt || Date.now();
        return {
            id: event.id,
            name: event.name || event.title || 'Untitled event',
            date: event.date || '',
            startTime: event.time || event.startTime || '',
            endTime: event.endTime || '',
            location: event.location || '',
            package: event.package || '',
            guestCount: event.guestCount ?? null,
            payout: event.payout ?? null,
            targetStaffCount: event.requiredStaff ?? null,
            assignEmployees: assignedIds.map((id) => String(id)).filter(Boolean),
            clientName: event.clientName || '',
            clientPhone: event.clientPhone || '',
            status: normaliseStatusValue(event.status),
            staffingStatus: event.staffingStatus || '',
            notes: event.notes || '',
            updatedAt: new Date(timestamp).toISOString(),
        };
    }

    async function requestEventApi(path, options = {}) {
        const requestOptions = Object.assign({ method: 'GET' }, options || {});
        const headers = Object.assign({}, requestOptions.headers || {});
        if (requestOptions.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        requestOptions.headers = headers;

        const response = await fetch(`${EVENTS_API_BASE}${path}`, requestOptions);
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            const message = isJson && data && typeof data === 'object' && data.detail
                ? data.detail
                : response.statusText || 'Event request failed';
            const error = new Error(message);
            error.status = response.status;
            error.payload = data;
            throw error;
        }

        return data;
    }

    async function fetchEventsFromApi() {
        const data = await requestEventApi('/events');
        if (!Array.isArray(data)) {
            return [];
        }
        return data.map((event) => normaliseApiEvent(event)).filter(Boolean);
    }

    function buildEventPayload(payload) {
        const event = payload.event || {};
        const metadata = payload.metadata || {};
        const assignmentIds = Array.isArray(payload.assignments)
            ? payload.assignments.map((assignment) => assignment && assignment.employeeId).filter(Boolean)
            : [];

        const uniqueAssignments = Array.from(new Set(assignmentIds.map((id) => String(id))));

        return {
            name: event.title || 'Untitled event',
            date: event.date || null,
            start_time: event.startTime || null,
            end_time: event.endTime || null,
            location: event.location || null,
            package: metadata.package || null,
            guest_count: toNumber(metadata.guestCount),
            payout: toNumber(metadata.payout),
            target_staff_count: toNumber(metadata.requiredStaff),
            assign_employees: uniqueAssignments,
            client_name: event.clientName || null,
            client_phone: event.clientPhone || null,
            status: normaliseStatusValue(event.status),
            staffing_status: metadata.staffingStatus || null,
            notes: event.notes || null,
        };
    }

    async function saveDraft(options = { silent: false }) {
        const { silent } = options;
        if (state.saveTimeout) {
            clearTimeout(state.saveTimeout);
            state.saveTimeout = null;
        }
        const payload = getFormValues();
        const errors = validateEventPayload(payload);
        if (errors.length) {
            if (!silent) {
                showToast(errors[0], 'warning');
            }
            return;
        }

        state.isSaving = true;
        try {
            const data = await api.saveSchedulerDraft({
                formKey,
                formVersion: 'v1',
                eventId: payload.event.id,
                payload,
            });
            state.draftId = data.id;
            setSavedStatus(true, data.updatedAt);
        } catch (error) {
            console.error('Failed to save draft', error);
            showToast(error.message || 'Unable to save draft', 'danger');
        } finally {
            state.isSaving = false;
        }
    }

    function scheduleAutoSave() {
        if (state.saveTimeout) {
            clearTimeout(state.saveTimeout);
        }
        state.saveTimeout = setTimeout(() => saveDraft({ silent: true }), 800);
    }

    async function submitScheduler() {
        const payload = getFormValues();
        const errors = validateEventPayload(payload);
        if (errors.length) {
            showToast(errors[0], 'danger');
            return;
        }

        try {
            const eventPayload = buildEventPayload(payload);
            const eventId = payload.event.id || hiddenIdField.value;
            const isUpdate = Boolean(eventId);
            const endpoint = isUpdate ? `/events/${eventId}` : '/events';
            const method = isUpdate ? 'PUT' : 'POST';

            await requestEventApi(endpoint, {
                method,
                body: JSON.stringify(eventPayload),
            });

            showToast(isUpdate ? 'Event updated successfully' : 'Event submitted and scheduled', 'success');
            clearForm();
            hiddenIdField.value = '';
            state.draftId = null;
            await loadEvents();
        } catch (error) {
            console.error('Submit failed', error);
            showToast(error.message || 'Unable to submit event', 'danger');

            if (storage && typeof storage.addEvent === 'function') {
                const eventPayload = buildEventPayload(payload);
                const offlineEvent = storage.addEvent({
                    id: payload.event.id || undefined,
                    name: eventPayload.name,
                    date: eventPayload.date || undefined,
                    time: eventPayload.start_time || undefined,
                    endTime: eventPayload.end_time || undefined,
                    location: eventPayload.location || undefined,
                    package: eventPayload.package || undefined,
                    guestCount: eventPayload.guest_count || undefined,
                    payout: eventPayload.payout || undefined,
                    requiredStaff: eventPayload.target_staff_count || undefined,
                    assignedStaffIds: eventPayload.assign_employees,
                    clientName: eventPayload.client_name || undefined,
                    clientPhone: eventPayload.client_phone || undefined,
                    notes: eventPayload.notes || undefined,
                    status: eventPayload.status,
                    staffingStatus: eventPayload.staffing_status || undefined,
                });

                const normalisedOfflineEvent = normaliseLocalEvent(offlineEvent);
                if (normalisedOfflineEvent) {
                    state.events.push(normalisedOfflineEvent);
                    renderEvents();
                    showToast('Saved event offline. It will sync when the API is available.', 'warning');
                }
                clearForm();
                hiddenIdField.value = '';
            }
        }
    }

    function renderEvents() {
        const events = state.events.filter((event) => {
            if (state.filter === 'all') {
                return true;
            }
            return event.status === state.filter;
        });

        eventsTableBody.innerHTML = '';
        if (!events.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'No events found.';
            row.appendChild(cell);
            eventsTableBody.appendChild(row);
            return;
        }

        events.forEach((event) => {
            const row = document.createElement('tr');
            row.className = 'lead-row';

            const staffingNames = Array.isArray(event.assignEmployees)
                ? event.assignEmployees.filter(Boolean)
                : [];
            const staffingLabel = event.staffingStatus || (staffingNames.length ? staffingNames.join(', ') : 'Unassigned');

            row.innerHTML = `
                <td data-label="Event">${event.name}</td>
                <td data-label="Date">${formatDate(event.date, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })} ${formatTime(event.startTime)}</td>
                <td data-label="Location">${event.location || 'TBD'}</td>
                <td data-label="Status"><span class="badge ${statusBadgeMap[event.status] || 'neutral'}">${formatStatus(event.status)}</span></td>
                <td data-label="Client">${event.clientName || '—'}</td>
                <td data-label="Staffing">${staffingLabel}</td>
                <td data-label="Updated">${formatDate(event.updatedAt, {
                    month: 'short',
                    day: 'numeric',
                })}</td>
            `;

            eventsTableBody.appendChild(row);
        });
    }

    async function loadEmployees() {
        try {
            const employees = await api.listEmployees();
            state.employees = employees;
            assignmentsSelect.innerHTML = '';
            employees.forEach((employee) => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.firstName} ${employee.lastName}`;
                assignmentsSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load employees', error);
            showToast('Unable to load employees', 'danger');
        }
    }

    async function loadEvents() {
        try {
            const events = await fetchEventsFromApi();
            state.events = Array.isArray(events) ? events : [];
            renderEvents();
        } catch (error) {
            console.error('Failed to load events', error);
            if (storage && typeof storage.getEvents === 'function') {
                const offlineEvents = storage
                    .getEvents()
                    .map((event) => normaliseLocalEvent(event))
                    .filter(Boolean);
                state.events = offlineEvents;
                renderEvents();
                showToast('Showing offline events (API unavailable)', 'warning');
            } else {
                showToast(error.message || 'Unable to load events', 'danger');
            }
        }
    }

    async function loadDraft() {
        try {
            const draft = await api.fetchSchedulerDraft(formKey);
            if (draft && draft.payload) {
                const { event, assignments, metadata } = draft.payload;
                state.draftId = draft.id;
                if (event) {
                    if (event.id) {
                        hiddenIdField.value = event.id;
                    }
                    if (event.title && form.elements.name) form.elements.name.value = event.title;
                    if (event.date && form.elements.date) form.elements.date.value = normaliseDateValue(event.date);
                    if (event.startTime && form.elements.time) form.elements.time.value = normaliseTimeValue(event.startTime);
                    if (event.endTime && form.elements.endTime) {
                        form.elements.endTime.value = normaliseTimeValue(event.endTime);
                    }
                    if (event.location && form.elements.location) form.elements.location.value = event.location;
                    if (event.clientName && form.elements.clientName) {
                        form.elements.clientName.value = event.clientName;
                    }
                    if (event.clientPhone && form.elements.clientPhone) {
                        form.elements.clientPhone.value = event.clientPhone;
                    }
                    if (event.notes && form.elements.notes) form.elements.notes.value = event.notes;
                    if (event.status && form.elements.status) {
                        const option = form.elements.status.querySelector(`option[value="${event.status}"]`);
                        if (option) {
                            form.elements.status.value = event.status;
                        }
                    }
                }

                if (assignmentsSelect && Array.isArray(assignments)) {
                    const ids = new Set(assignments.map((assignment) => assignment.employeeId));
                    Array.from(assignmentsSelect.options).forEach((option) => {
                        option.selected = ids.has(option.value);
                    });
                }

                if (metadata) {
                    if (metadata.package) form.elements.package.value = metadata.package;
                    if (metadata.guestCount) form.elements.guestCount.value = metadata.guestCount;
                    if (metadata.payout) form.elements.payout.value = metadata.payout;
                    if (metadata.requiredStaff) form.elements.requiredStaff.value = metadata.requiredStaff;
                    if (metadata.staffingStatus) form.elements.staffingStatus.value = metadata.staffingStatus;
                }

                setSavedStatus(true, draft.updatedAt);
            }
        } catch (error) {
            console.error('Failed to load draft', error);
        }
    }

    form.addEventListener('input', () => {
        setSavedStatus(false);
        scheduleAutoSave();
    });

    form.addEventListener('change', () => {
        setSavedStatus(false);
        scheduleAutoSave();
    });

    form.addEventListener('reset', () => {
        if (state.saveTimeout) {
            clearTimeout(state.saveTimeout);
            state.saveTimeout = null;
        }
        hiddenIdField.value = '';
        setSavedStatus(false);
    });

    saveButton.addEventListener('click', (event) => {
        event.preventDefault();
        saveDraft({ silent: false });
    });

    submitButton.addEventListener('click', (event) => {
        event.preventDefault();
        submitScheduler();
    });

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            state.filter = button.dataset.filter || 'all';
            renderEvents();
        });
    });

    (async function init() {
        await loadEmployees();
        await loadEvents();
        await loadDraft();
    })();
})();

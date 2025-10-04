(function () {
    const api = window.B2UApi;
    if (!api) {
        console.error('API helper is not available.');
        return;
    }

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
            const result = await api.submitScheduler({ formKey, payload });
            showToast('Event submitted and scheduled', 'success');
            clearForm();
            await loadEvents();
            if (result && result.id) {
                hiddenIdField.value = '';
            }
            state.draftId = null;
        } catch (error) {
            console.error('Submit failed', error);
            showToast(error.message || 'Unable to submit event', 'danger');
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

            const staffingNames = Array.isArray(event.assignments)
                ? event.assignments
                      .map((assignment) => {
                          if (assignment.employee) {
                              return `${assignment.employee.firstName} ${assignment.employee.lastName}`.trim();
                          }
                          return assignment.employeeId;
                      })
                      .filter(Boolean)
                : [];

            row.innerHTML = `
                <td data-label="Event">${event.title}</td>
                <td data-label="Date">${formatDate(event.date, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })} ${formatTime(event.startTime)}</td>
                <td data-label="Location">${event.location || 'TBD'}</td>
                <td data-label="Status"><span class="badge ${statusBadgeMap[event.status] || 'neutral'}">${formatStatus(event.status)}</span></td>
                <td data-label="Client">${event.clientName || '—'}</td>
                <td data-label="Staffing">${staffingNames.length ? staffingNames.join(', ') : 'Unassigned'}</td>
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
            const events = await api.listEvents();
            state.events = Array.isArray(events) ? events : [];
            renderEvents();
        } catch (error) {
            console.error('Failed to load events', error);
            showToast('Unable to load events', 'danger');
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

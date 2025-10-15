(function () {
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
    const formModeIndicator = document.getElementById('eventFormModeIndicator');

    const eventModal = document.getElementById('eventDetailModal');
    const eventModalDialog = eventModal?.querySelector('.modal__dialog');
    const eventModalTitle = document.getElementById('eventDetailTitle');
    const eventModalSubtitle = document.getElementById('eventDetailSubtitle');
    const eventModalDetails = document.getElementById('eventDetailList');
    const eventModalNotes = document.getElementById('eventDetailNotes');
    const eventEditButton = document.getElementById('eventEditButton');
    const eventDeleteButton = document.getElementById('eventDeleteButton');

    const formFields = {
        name: document.getElementById('eventName'),
        date: document.getElementById('eventDate'),
        time: document.getElementById('eventTime'),
        endTime: document.getElementById('eventEndTime'),
        location: document.getElementById('eventLocation'),
        package: document.getElementById('eventPackage'),
        guestCount: document.getElementById('guestCount'),
        payout: document.getElementById('eventPayout'),
        requiredStaff: document.getElementById('requiredStaff'),
        clientName: document.getElementById('clientName'),
        clientPhone: document.getElementById('clientPhone'),
        status: document.getElementById('eventStatus'),
        staffingStatus: document.getElementById('eventStaffing'),
        notes: document.getElementById('eventNotes'),
    };

    if (!form || !saveButton || !submitButton || !assignmentsSelect || !eventsTableBody) {
        console.warn('Calendar form or elements missing.');
        return;
    }

    const state = {
        employees: [],
        events: [],
        filter: 'all',
        draftId: null,
        isSaving: false,
        saveTimeout: null,
        activeEventId: null,
        employeeLookup: new Map(),
    };

    const statusBadgeMap = {
        draft: 'neutral',
        scheduled: 'info',
        completed: 'success',
        canceled: 'danger',
    };

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });

    function showToast(message, variant) {
        if (!toast) return;
        toast.textContent = message;
        toast.dataset.variant = variant || 'info';
        toast.classList.remove('toast--visible');
        void toast.offsetWidth;
        toast.classList.add('toast--visible');
        setTimeout(() => toast.classList.remove('toast--visible'), 3000);
    }

    function setSavedStatus(isSaved, timestamp) {
        if (!savedBadge || !savedTime) return;
        if (isSaved) {
            savedBadge.hidden = false;
            const date = timestamp ? new Date(timestamp) : new Date();
            savedTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            savedBadge.hidden = true;
            savedTime.textContent = '';
        }
    }

    function formatDate(dateString, options) {
        if (!dateString) return 'Date TBC';
        const date = new Date(dateString);
        return Number.isNaN(date.getTime())
            ? 'Date TBC'
            : new Intl.DateTimeFormat('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    function formatTime(value) {
        if (!value) return '';
        const [h, m] = value.split(':');
        if (!h || !m) return '';
        const date = new Date();
        date.setHours(+h, +m);
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
    }

    function formatStatus(status) {
        if (!status) return '—';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    function formatCurrency(value) {
        if (value === '' || value === null || value === undefined) {
            return '—';
        }
        const number = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(number)) {
            return '—';
        }
        return currencyFormatter.format(number);
    }

    function formatTimeRange(start, end) {
        const startTime = formatTime(start);
        const endTime = formatTime(end);
        if (startTime && endTime) {
            return `${startTime} – ${endTime}`;
        }
        return startTime || endTime || '';
    }

    function setAssignmentsSelection(ids) {
        if (!assignmentsSelect) return;
        const selected = new Set(Array.isArray(ids) ? ids : []);
        Array.from(assignmentsSelect.options).forEach(option => {
            option.selected = selected.has(option.value);
        });
    }

    function updateEmployeeLookup() {
        state.employeeLookup = new Map((state.employees || []).map(employee => [employee.id, employee]));
    }

    function getEmployeeName(id) {
        if (!id) return '';
        const employee = state.employeeLookup.get(id);
        return employee?.name || '';
    }

    function getAssignedStaffNames(ids) {
        if (!Array.isArray(ids) || !ids.length) {
            return [];
        }
        return ids.map(getEmployeeName).filter(Boolean);
    }

    function renderEmployeeOptions() {
        if (!assignmentsSelect) return;
        const previouslySelected = new Set(Array.from(assignmentsSelect.selectedOptions).map(option => option.value));
        assignmentsSelect.innerHTML = '';

        state.employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.role ? `${employee.name} — ${employee.role}` : employee.name;
            if (previouslySelected.has(employee.id)) {
                option.selected = true;
            }
            assignmentsSelect.appendChild(option);
        });
    }

    function setFormMode(eventData) {
        if (!formModeIndicator) return;
        if (eventData) {
            form.dataset.mode = 'edit';
            formModeIndicator.textContent = `Editing “${eventData.name || 'Untitled event'}”`;
        } else {
            form.dataset.mode = 'create';
            formModeIndicator.textContent = '';
        }
    }

    function populateForm(eventData) {
        if (!eventData) return;

        if (formFields.name) formFields.name.value = eventData.name || '';
        if (formFields.date) formFields.date.value = eventData.date || '';
        if (formFields.time) formFields.time.value = eventData.time || '';
        if (formFields.endTime) formFields.endTime.value = eventData.endTime || '';
        if (formFields.location) formFields.location.value = eventData.location || '';
        if (formFields.package) formFields.package.value = eventData.package || '';
        if (formFields.guestCount) formFields.guestCount.value = eventData.guestCount ?? '';
        if (formFields.payout) formFields.payout.value = eventData.payout ?? '';
        if (formFields.requiredStaff) formFields.requiredStaff.value = eventData.requiredStaff ?? '';
        if (formFields.clientName) formFields.clientName.value = eventData.clientName || '';
        if (formFields.clientPhone) formFields.clientPhone.value = eventData.clientPhone || '';
        if (formFields.status) formFields.status.value = eventData.status || 'draft';
        if (formFields.staffingStatus) formFields.staffingStatus.value = eventData.staffingStatus || '';
        if (formFields.notes) formFields.notes.value = eventData.notes || '';

        renderEmployeeOptions();
        setAssignmentsSelection(eventData.assignedStaffIds);
        hiddenIdField.value = eventData.id || '';
        setSavedStatus(true, eventData.updatedAt);
        setFormMode(eventData);
    }

    function focusEventForm() {
        const section = document.getElementById('new-event');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        requestAnimationFrame(() => {
            if (formFields.name) {
                formFields.name.focus();
            }
        });
    }

    function renderEventModal(eventData) {
        if (!eventData || !eventModalDetails) {
            return;
        }

        if (eventModalTitle) {
            eventModalTitle.textContent = eventData.name || 'Untitled event';
        }

        if (eventModalSubtitle) {
            const subtitleParts = [];
            if (eventData.status) subtitleParts.push(formatStatus(eventData.status));
            if (eventData.date) subtitleParts.push(formatDate(eventData.date));
            const range = formatTimeRange(eventData.time, eventData.endTime);
            if (range) subtitleParts.push(range);
            eventModalSubtitle.textContent = subtitleParts.join(' • ');
        }

        const assignedStaffNames = getAssignedStaffNames(eventData.assignedStaffIds);
        const details = [
            { label: 'Date & time', value: [formatDate(eventData.date), formatTimeRange(eventData.time, eventData.endTime)].filter(Boolean).join(' • ') || 'Date TBC' },
            { label: 'Location', value: eventData.location || 'TBD' },
            { label: 'Status', value: formatStatus(eventData.status) },
            { label: 'Staffing status', value: eventData.staffingStatus || '—' },
            { label: 'Assigned staff', value: assignedStaffNames.length ? assignedStaffNames.join(', ') : 'None assigned' },
            { label: 'Service package', value: eventData.package || '—' },
            { label: 'Guest count', value: eventData.guestCount ? String(eventData.guestCount) : '—' },
            { label: 'Target staff', value: eventData.requiredStaff ? String(eventData.requiredStaff) : '—' },
            { label: 'Estimated payout', value: formatCurrency(eventData.payout) },
            { label: 'Client name', value: eventData.clientName || '—' },
            { label: 'Client phone', value: eventData.clientPhone || '—' },
            { label: 'Last updated', value: eventData.updatedAt ? formatDate(eventData.updatedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—' },
        ];

        eventModalDetails.innerHTML = '';
        details.forEach(detail => {
            const dt = document.createElement('dt');
            dt.textContent = detail.label;
            const dd = document.createElement('dd');
            dd.textContent = detail.value || '—';
            eventModalDetails.append(dt, dd);
        });

        if (eventModalNotes) {
            eventModalNotes.textContent = eventData.notes ? eventData.notes : 'No notes added yet.';
        }
    }

    function openEventModal(eventData) {
        if (!eventModal) return;
        renderEventModal(eventData);
        state.activeEventId = eventData.id;
        eventModal.classList.add('is-open');
        eventModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        requestAnimationFrame(() => {
            eventModalDialog?.focus();
        });
    }

    function closeEventModal() {
        if (!eventModal) return;
        eventModal.classList.remove('is-open');
        eventModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        state.activeEventId = null;
    }

    function showEventDetails(eventId) {
        const eventData = state.events.find(item => item.id === eventId);
        if (!eventData) {
            showToast('Event not found', 'warning');
            return;
        }
        openEventModal(eventData);
    }

    function clearForm() {
        form.reset();
        setAssignmentsSelection([]);
        hiddenIdField.value = '';
        setSavedStatus(false);
        setFormMode(null);
    }

    function getFormValues() {
        const formData = new FormData(form);
        const assignments = Array.from(assignmentsSelect.selectedOptions).map(opt => ({
            employeeId: opt.value,
            role: 'Staff'
        }));
        return {
            id: hiddenIdField.value || crypto.randomUUID(),
            name: formData.get('name')?.toString().trim() || '',
            date: formData.get('date')?.toString() || '',
            time: formData.get('time')?.toString() || '',
            endTime: formData.get('endTime')?.toString() || '',
            location: formData.get('location')?.toString().trim() || '',
            clientName: formData.get('clientName')?.toString().trim() || '',
            clientPhone: formData.get('clientPhone')?.toString().trim() || '',
            notes: formData.get('notes')?.toString().trim() || '',
            status: formData.get('status')?.toString() || 'draft',
            assignedStaffIds: assignments.map(a => a.employeeId),
            package: formData.get('package')?.toString() || '',
            guestCount: formData.get('guestCount')?.toString() || '',
            payout: formData.get('payout')?.toString() || '',
            requiredStaff: formData.get('requiredStaff')?.toString() || '',
            staffingStatus: formData.get('staffingStatus')?.toString() || '',
            updatedAt: new Date().toISOString()
        };
    }

    function loadEmployees() {
        if (!storage || typeof storage.getEmployees !== 'function') {
            return;
        }
        state.employees = storage.getEmployees() || [];
        updateEmployeeLookup();
        renderEmployeeOptions();
        renderEvents();
    }

    function renderEvents() {
        const events = state.events.filter(event => state.filter === 'all' || event.status === state.filter);
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

        events.forEach(event => {
            const row = document.createElement('tr');
            row.className = 'lead-row';
            const assignedStaffNames = getAssignedStaffNames(event.assignedStaffIds);
            const staffingLabel = event.staffingStatus
                || (assignedStaffNames.length ? assignedStaffNames.join(', ') : 'Unassigned');
            const dateDisplay = [formatDate(event.date), formatTime(event.time)].filter(Boolean).join(' ');
            row.innerHTML = `
                <td data-label="Event">${event.name}</td>
                <td data-label="Date">${dateDisplay || 'Date TBC'}</td>
                <td data-label="Location">${event.location || 'TBD'}</td>
                <td data-label="Status"><span class="badge ${statusBadgeMap[event.status] || 'neutral'}">${formatStatus(event.status)}</span></td>
                <td data-label="Client">${event.clientName || '—'}</td>
                <td data-label="Staffing">${staffingLabel}</td>
                <td data-label="Updated">${formatDate(event.updatedAt, { month: 'short', day: 'numeric' })}</td>
            `;
            row.dataset.eventId = event.id;
            row.tabIndex = 0;
            row.setAttribute('role', 'button');
            row.setAttribute('aria-label', `View details for ${event.name}`);
            row.addEventListener('click', () => showEventDetails(event.id));
            row.addEventListener('keydown', evt => {
                if (evt.key === 'Enter' || evt.key === ' ') {
                    evt.preventDefault();
                    showEventDetails(event.id);
                }
            });
            eventsTableBody.appendChild(row);
        });
    }

    function loadEvents() {
        if (!storage || typeof storage.getEvents !== 'function') {
            console.warn('No storage found.');
            return;
        }
        state.events = storage.getEvents() || [];
        renderEvents();
    }

    function subscribeToStoreEvents() {
        if (typeof window === 'undefined') {
            return;
        }
        window.addEventListener('b2u:events:updated', event => {
            const detail = event?.detail;
            if (detail && Array.isArray(detail.events)) {
                state.events = detail.events;
                renderEvents();
                if (state.activeEventId) {
                    const activeEvent = detail.events.find(item => item.id === state.activeEventId);
                    if (activeEvent) {
                        renderEventModal(activeEvent);
                    }
                }
            }
        });

        window.addEventListener('b2u:employees:updated', event => {
            const detail = event?.detail;
            if (detail && Array.isArray(detail.employees)) {
                state.employees = detail.employees;
                updateEmployeeLookup();
                renderEmployeeOptions();
                renderEvents();
                if (state.activeEventId) {
                    const activeEvent = state.events.find(item => item.id === state.activeEventId);
                    if (activeEvent) {
                        renderEventModal(activeEvent);
                    }
                }
            }
        });
    }

    function saveEvent() {
        const payload = getFormValues();
        if (!payload.name || !payload.date) {
            showToast('Event name and date required', 'warning');
            return;
        }

        if (!storage) {
            showToast('Local storage unavailable', 'danger');
            return;
        }

        const isUpdate = state.events.some(event => event.id === payload.id);
        storage.addEvent(payload);
        showToast(isUpdate ? 'Event updated' : 'Event saved locally', 'success');
        clearForm();
        loadEvents();
    }

    // Autosave Draft
    form.addEventListener('input', () => {
        setSavedStatus(false);
    });

    saveButton.addEventListener('click', e => {
        e.preventDefault();
        saveEvent();
    });

    submitButton.addEventListener('click', e => {
        e.preventDefault();
        saveEvent();
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            state.filter = button.dataset.filter || 'all';
            renderEvents();
        });
    });

    if (eventModal) {
        eventModal.addEventListener('click', event => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.dataset.modalClose !== undefined) {
                closeEventModal();
            }
        });
    }

    if (eventEditButton) {
        eventEditButton.addEventListener('click', () => {
            if (!state.activeEventId) return;
            const eventData = state.events.find(item => item.id === state.activeEventId);
            if (!eventData) return;
            closeEventModal();
            populateForm(eventData);
            focusEventForm();
        });
    }

    if (eventDeleteButton) {
        eventDeleteButton.addEventListener('click', () => {
            if (!state.activeEventId) return;
            const eventData = state.events.find(item => item.id === state.activeEventId);
            if (!eventData) return;
            const shouldDelete = window.confirm(`Delete "${eventData.name}"?`);
            if (!shouldDelete) return;
            if (!storage || typeof storage.removeEvent !== 'function') {
                showToast('Unable to delete event', 'danger');
                return;
            }
            storage.removeEvent(state.activeEventId);
            showToast('Event deleted', 'info');
            closeEventModal();
            if (hiddenIdField.value === state.activeEventId) {
                clearForm();
            }
            loadEvents();
        });
    }

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && eventModal?.classList.contains('is-open')) {
            closeEventModal();
        }
    });

    (function init() {
        subscribeToStoreEvents();
        loadEmployees();
        loadEvents();
        setFormMode(null);
        showToast('Loaded offline events', 'info');
    })();
})();

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
    };

    const statusBadgeMap = {
        draft: 'neutral',
        scheduled: 'info',
        completed: 'success',
        canceled: 'danger',
    };

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

    function clearForm() {
        form.reset();
        if (assignmentsSelect) Array.from(assignmentsSelect.options).forEach(opt => opt.selected = false);
        hiddenIdField.value = '';
        setSavedStatus(false);
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
            const staffingLabel =
                event.staffingStatus || (event.assignedStaffIds?.length ? event.assignedStaffIds.join(', ') : 'Unassigned');
            row.innerHTML = `
                <td data-label="Event">${event.name}</td>
                <td data-label="Date">${formatDate(event.date)} ${formatTime(event.time)}</td>
                <td data-label="Location">${event.location || 'TBD'}</td>
                <td data-label="Status"><span class="badge ${statusBadgeMap[event.status] || 'neutral'}">${formatStatus(event.status)}</span></td>
                <td data-label="Client">${event.clientName || '—'}</td>
                <td data-label="Staffing">${staffingLabel}</td>
                <td data-label="Updated">${formatDate(event.updatedAt, { month: 'short', day: 'numeric' })}</td>
            `;
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

        storage.addEvent(payload);
        showToast('Event saved locally', 'success');
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

    (function init() {
        loadEvents();
        showToast('Loaded offline events', 'info');
    })();
})();

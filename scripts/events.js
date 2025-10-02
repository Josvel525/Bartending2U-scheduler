(function () {
    function formatDate(dateString) {
        if (!dateString) {
            return 'TBD';
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    }

    function formatTime(timeString) {
        if (!timeString) {
            return 'TBD';
        }

        const [hours, minutes] = timeString.split(':').map(Number);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return timeString;
        }

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    }

    function formatCurrency(value) {
        if (value === undefined || value === null || value === '') {
            return '—';
        }

        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
            return value;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(numberValue);
    }

    function formatGuests(value) {
        if (value === undefined || value === null || value === '') {
            return '—';
        }

        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
            return value;
        }

        return new Intl.NumberFormat('en-US').format(numberValue);
    }

    function getBadgeClass(level) {
        if (!level) {
            return 'badge';
        }

        return `badge ${level}`;
    }

    function buildDetailsRow(event, columnCount) {
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'event-details';
        detailsRow.hidden = true;

        const detailsCell = document.createElement('td');
        detailsCell.colSpan = columnCount;

        const details = [];

        if (event.notes) {
            details.push(`<strong>Notes:</strong> ${event.notes}`);
        }

        const meta = [];

        if (event.payout !== undefined && event.payout !== null && event.payout !== '') {
            meta.push(`Payout ${formatCurrency(event.payout)}`);
        }

        if (event.guestCount !== undefined && event.guestCount !== null && event.guestCount !== '') {
            meta.push(`${formatGuests(event.guestCount)} guests`);
        }

        if (meta.length) {
            details.unshift(`<strong>Overview:</strong> ${meta.join(' · ')}`);
        }

        if (!details.length) {
            details.push('No additional details recorded yet.');
        }

        detailsCell.innerHTML = `<div class="event-details__inner">${details
            .map((item) => `<p>${item}</p>`)
            .join('')}</div>`;
        detailsRow.appendChild(detailsCell);

        return detailsRow;
    }

    function attachRowActions(row, detailsRow, eventId) {
        const viewButton = row.querySelector('.js-view-event');
        const deleteButton = row.querySelector('.js-delete-event');

        if (viewButton) {
            viewButton.addEventListener('click', () => {
                const isHidden = detailsRow.hidden;
                detailsRow.hidden = !isHidden;
                viewButton.textContent = isHidden ? 'Hide details' : 'View details';
            });
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                if (confirm('Remove this event from your schedule?')) {
                    window.B2UStore.removeEvent(eventId);
                    renderEvents();
                }
            });
        }
    }

    function renderEvents() {
        const tableBody = document.getElementById('eventsTableBody');

        if (!tableBody) {
            return;
        }

        const events = window.B2UStore.getEvents().sort((a, b) => {
            const first = new Date(`${a.date || ''}T${a.time || '00:00'}`);
            const second = new Date(`${b.date || ''}T${b.time || '00:00'}`);

            const firstTime = first.getTime();
            const secondTime = second.getTime();

            const safeFirst = Number.isNaN(firstTime) ? Number.MAX_SAFE_INTEGER : firstTime;
            const safeSecond = Number.isNaN(secondTime) ? Number.MAX_SAFE_INTEGER : secondTime;

            return safeFirst - safeSecond;
        });

        tableBody.innerHTML = '';

        if (!events.length) {
            const emptyRow = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 9;
            cell.className = 'empty-state';
            cell.textContent = 'No events logged yet. Add your first event to start tracking details.';
            emptyRow.appendChild(cell);
            tableBody.appendChild(emptyRow);
            return;
        }

        events.forEach((event) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Event">${event.name || 'Untitled event'}</td>
                <td data-label="Date">${formatDate(event.date)}<div class="table-meta">${formatTime(event.time)}</div></td>
                <td data-label="Location">${event.location || '—'}</td>
                <td data-label="Package">${event.package || '—'}</td>
                <td data-label="Guests">${formatGuests(event.guestCount)}</td>
                <td data-label="Payout">${formatCurrency(event.payout)}</td>
                <td data-label="Status"><span class="${getBadgeClass(event.statusLevel)}">${event.status || 'Pending'}</span></td>
                <td data-label="Staffing"><span class="${getBadgeClass(event.staffingLevel)}">${event.staffingStatus || 'Unassigned'}</span></td>
                <td class="table-actions" data-label="Actions">
                    <button type="button" class="card-action js-view-event">View details</button>
                    <button type="button" class="card-action js-delete-event">Remove</button>
                </td>
            `;

            const detailsRow = buildDetailsRow(event, 9);

            tableBody.appendChild(row);
            tableBody.appendChild(detailsRow);

            attachRowActions(row, detailsRow, event.id);
        });
    }

    function handleFormSubmission() {
        const form = document.getElementById('eventForm');

        if (!form) {
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const statusSelect = form.querySelector('#eventStatus');
            const staffingSelect = form.querySelector('#eventStaffing');

            const newEvent = {
                name: form.eventName.value.trim(),
                date: form.eventDate.value,
                time: form.eventTime.value,
                location: form.eventLocation.value.trim(),
                package: form.eventPackage.value,
                guestCount: form.guestCount.value ? Number(form.guestCount.value) : '',
                payout: form.eventPayout.value ? Number(form.eventPayout.value) : '',
                status: statusSelect ? statusSelect.value : 'Pending',
                statusLevel: statusSelect ? statusSelect.options[statusSelect.selectedIndex].dataset.level : 'info',
                staffingStatus: staffingSelect ? staffingSelect.value : 'Unassigned',
                staffingLevel: staffingSelect
                    ? staffingSelect.options[staffingSelect.selectedIndex].dataset.level
                    : 'warning',
                notes: form.eventNotes.value.trim(),
            };

            window.B2UStore.addEvent(newEvent);
            form.reset();
            renderEvents();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!window.B2UStore) {
            console.warn('B2UStore is not available. Unable to render events.');
            return;
        }

        renderEvents();
        handleFormSubmission();

        const tabs = document.querySelectorAll('.tab');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((button) => button.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    });
})();

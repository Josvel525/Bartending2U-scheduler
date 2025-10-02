(function () {
    const MONTH_NAMES = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    function formatNumber(value) {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
            return value || '—';
        }
        return new Intl.NumberFormat('en-US').format(numberValue);
    }

    function deriveTeamSize(event) {
        if (event.teamSize) {
            return event.teamSize;
        }

        if (!event.guestCount) {
            return 2;
        }

        return Math.max(2, Math.ceil(Number(event.guestCount) / 40));
    }

    function derivePrepHours(event) {
        if (event.prepHours) {
            return event.prepHours;
        }

        if (!event.guestCount) {
            return 3;
        }

        return Math.max(3, Math.ceil(Number(event.guestCount) / 50) * 2);
    }

    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const title = document.getElementById('calendarMonthTitle');

        if (!grid || !title) {
            return;
        }

        const eventsWithDates = window.B2UStore
            .getEvents()
            .map((event) => ({
                ...event,
                dateObject: new Date(event.date || ''),
            }))
            .filter((event) => !Number.isNaN(event.dateObject.getTime()))
            .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());

        const referenceDate = eventsWithDates.length ? eventsWithDates[0].dateObject : new Date();
        const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const month = monthStart.getMonth();
        const year = monthStart.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        title.textContent = `${MONTH_NAMES[month]} ${year} overview`;

        const events = eventsWithDates.filter(
            (event) => event.dateObject.getMonth() === month && event.dateObject.getFullYear() === year
        );

        grid.innerHTML = '';

        for (let day = 1; day <= daysInMonth; day += 1) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            const dateLabel = document.createElement('span');
            dateLabel.className = 'calendar-cell__date';
            const date = new Date(year, month, day);
            dateLabel.textContent = `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${day}`;
            cell.appendChild(dateLabel);

            const eventsForDay = events.filter((event) => event.dateObject.getDate() === day);

            eventsForDay.forEach((event) => {
                const eventTitle = document.createElement('div');
                eventTitle.className = 'calendar-event';
                eventTitle.textContent = event.name;
                cell.appendChild(eventTitle);

                const subtitle = document.createElement('p');
                subtitle.className = 'card-subtitle';
                subtitle.textContent = `${formatNumber(event.guestCount)} guests · ${deriveTeamSize(event)} staff`;
                cell.appendChild(subtitle);
            });

            grid.appendChild(cell);
        }
    }

    function renderWeekAtGlance() {
        const tableBody = document.getElementById('weekAtGlanceBody');

        if (!tableBody) {
            return;
        }

        const events = window.B2UStore
            .getEvents()
            .map((event) => ({
                ...event,
                dateObject: new Date(`${event.date || ''}T${event.time || '00:00'}`),
            }))
            .filter((event) => !Number.isNaN(event.dateObject.getTime()))
            .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime())
            .slice(0, 5);

        tableBody.innerHTML = '';

        if (!events.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.className = 'empty-state';
            cell.textContent = 'No upcoming events scheduled. Add events to populate the calendar.';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        events.forEach((event) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Event">${event.name}</td>
                <td data-label="Guests">${formatNumber(event.guestCount)}</td>
                <td data-label="Team">${deriveTeamSize(event)}</td>
                <td data-label="Prep hours">${derivePrepHours(event)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!window.B2UStore) {
            console.warn('B2UStore is not available. Calendar cannot be rendered.');
            return;
        }

        renderCalendar();
        renderWeekAtGlance();
    });
})();

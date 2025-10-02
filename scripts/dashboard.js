(function () {
    const root = typeof window !== 'undefined' ? window : globalThis;

    function getStore() {
        if (!root.B2UStore) {
            console.warn('B2UStore is not available. Dashboard metrics will not render.');
            return null;
        }

        return root.B2UStore;
    }
    function formatDate(dateString, timeString) {
        if (!dateString) {
            return { date: 'TBD', meta: '' };
        }

        const date = new Date(`${dateString}T${timeString || '00:00'}`);

        if (Number.isNaN(date.getTime())) {
            return { date: dateString, meta: timeString || '' };
        }

        const dateText = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
        }).format(date);

        const timeText = timeString
            ? new Intl.DateTimeFormat('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
              }).format(date)
            : '';

        return { date: dateText, meta: timeText };
    }

    function formatRelativeTime(timestamp) {
        if (!timestamp) {
            return 'Just now';
        }

        const deltaSeconds = Math.round((Date.now() - timestamp) / 1000);

        const intervals = [
            { label: 'day', seconds: 60 * 60 * 24 },
            { label: 'hour', seconds: 60 * 60 },
            { label: 'minute', seconds: 60 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(deltaSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    }

    function updateStats() {
        const store = getStore();

        if (!store) {
            return;
        }

        const events = store.getEvents();
        const employees = store.getEmployees();

        const totalEventsElement = document.getElementById('totalEventsStat');
        const teamAvailabilityElement = document.getElementById('teamAvailabilityStat');
        const nextEventNameElement = document.getElementById('nextEventName');
        const nextEventMetaElement = document.getElementById('nextEventMeta');
        const actionNeededElement = document.getElementById('actionNeededStat');

        if (totalEventsElement) {
            totalEventsElement.textContent = String(events.length);
        }

        if (teamAvailabilityElement) {
            const availableCount = employees.filter((employee) => employee.statusLevel === 'success').length;
            teamAvailabilityElement.textContent = `${availableCount} / ${employees.length || 0}`;

            const availabilityMeta = teamAvailabilityElement.nextElementSibling;
            if (availabilityMeta && availabilityMeta.classList.contains('stat-card__meta')) {
                availabilityMeta.textContent = `${availableCount} team members ready`;
            }
        }

        if (nextEventNameElement && nextEventMetaElement) {
            const upcoming = events
                .map((event) => ({
                    ...event,
                    dateObject: new Date(`${event.date || ''}T${event.time || '00:00'}`),
                }))
                .filter((event) => !Number.isNaN(event.dateObject.getTime()))
                .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());

            if (upcoming.length) {
                const next = upcoming[0];
                const formatted = formatDate(next.date, next.time);
                nextEventNameElement.textContent = next.name;
                nextEventMetaElement.textContent = `${formatted.date} · ${formatted.meta || 'Time TBD'}`;
            } else {
                nextEventNameElement.textContent = 'No events scheduled';
                nextEventMetaElement.textContent = 'Add an event to build your schedule.';
            }
        }

        if (actionNeededElement) {
            const riskyEvents = events.filter((event) => event.staffingLevel === 'warning' || event.staffingLevel === 'danger');
            actionNeededElement.textContent = String(riskyEvents.length);
        }
    }

    function renderActivityFeed() {
        const container = document.getElementById('activityFeed');

        if (!container) {
            return;
        }

        const store = getStore();

        if (!store) {
            return;
        }

        const events = store.getEvents().map((event) => ({
            type: 'event',
            title: `${event.name} scheduled`,
            subtitle: `${event.location || 'Location TBA'} · ${event.package || 'Package TBD'}`,
            createdAt: event.createdAt,
        }));

        const employees = store.getEmployees().map((employee) => ({
            type: 'employee',
            title: `${employee.name} joined the roster`,
            subtitle: `${employee.role || 'Role TBD'} · ${employee.status || 'Status pending'}`,
            createdAt: employee.createdAt,
        }));

        const combined = [...events, ...employees]
            .filter((item) => item.createdAt)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 6);

        container.innerHTML = '';

        if (!combined.length) {
            container.innerHTML = '<p class="empty-state">No activity yet. Add events or employees to see updates here.</p>';
            return;
        }

        combined.forEach((item) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            const icon = item.type === 'event' ? '📅' : '👤';

            timelineItem.innerHTML = `
                <div class="timeline-item__left">
                    <span class="timeline-icon">${icon}</span>
                    <div>
                        <h3 class="person-card__name">${item.title}</h3>
                        <p class="card-subtitle">${item.subtitle}</p>
                    </div>
                </div>
                <span class="timeline-item__meta">${formatRelativeTime(item.createdAt)}</span>
            `;

            container.appendChild(timelineItem);
        });
    }

    function renderStaffingAlerts() {
        const list = document.getElementById('staffingAlertsList');

        if (!list) {
            return;
        }

        const store = getStore();

        if (!store) {
            return;
        }

        const events = store
            .getEvents()
            .filter((event) => event.staffingLevel === 'warning' || event.staffingLevel === 'danger');

        list.innerHTML = '';

        if (!events.length) {
            list.innerHTML = '<li>All events are fully staffed. Great job!</li>';
            return;
        }

        events.forEach((event) => {
            const item = document.createElement('li');
            const formatted = formatDate(event.date, event.time);
            item.innerHTML = `<strong>${event.name}</strong> · ${event.staffingStatus || 'Needs attention'}<br /><span class="card-subtitle">${
                formatted.date
            } · ${formatted.meta || 'Time TBD'} · ${event.location || 'Location TBA'}</span>`;
            list.appendChild(item);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!root.B2UStore) {
            console.warn('B2UStore is not available. Dashboard data cannot be rendered.');
            return;
        }

        updateStats();
        renderActivityFeed();
        renderStaffingAlerts();
    });
})();

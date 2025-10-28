(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('dashboard-stats')) {
            return;
        }

        const store = window.B2UStore || null;

        function formatDateTime(dateStr, timeStr) {
            if (!dateStr) {
                return 'Date TBC';
            }

            const safeTime = timeStr ? timeStr : '12:00';
            const date = new Date(`${dateStr}T${safeTime}`);
            const dateFormatter = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            const timeFormatter = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
            });

            return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
        }

        function formatDateOnly(dateStr) {
            if (!dateStr) {
                return 'Date TBC';
            }
            const date = new Date(`${dateStr}T12:00`);
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }).format(date);
        }

        function formatCurrency(amount) {
            if (!amount && amount !== 0) {
                return '$0';
            }
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(amount);
        }

        function getEmployeeStatusLevel(employee) {
            if (!employee) {
                return 'neutral';
            }

            if (employee.statusLevel) {
                return employee.statusLevel;
            }

            const normalized = `${employee.status || ''} ${employee.statusLabel || ''}`.toLowerCase();
            if (!normalized.trim()) {
                return 'success';
            }

            if (normalized.includes('available') || normalized.includes('ready')) {
                return 'success';
            }

            if (normalized.includes('pto') || normalized.includes('limited')) {
                return 'warning';
            }

            if (
                normalized.includes('unavailable') ||
                normalized.includes('inactive') ||
                normalized.includes('booked') ||
                normalized.includes('out')
            ) {
                return 'danger';
            }

            return 'info';
        }

        const FALLBACK_STATS = Object.freeze({
            totalEvents: 4,
            teamAvailability: { available: 6, total: 8 },
            nextEvent: { name: 'Corporate Party', date: '2025-10-05', time: '19:00', payout: 3800 },
            actionNeeded: { count: 2, meta: 'Unassigned shifts' },
        });

        function applyFallbackStats() {
            const totalEvents = document.getElementById('totalEventsStat');
            if (totalEvents) {
                totalEvents.textContent = String(FALLBACK_STATS.totalEvents);
            }

            const teamAvailability = document.getElementById('teamAvailabilityStat');
            if (teamAvailability) {
                teamAvailability.textContent = `${FALLBACK_STATS.teamAvailability.available} / ${FALLBACK_STATS.teamAvailability.total}`;
            }

            const nextEventName = document.getElementById('nextEventName');
            if (nextEventName) {
                nextEventName.textContent = FALLBACK_STATS.nextEvent.name;
            }

            const nextEventMeta = document.getElementById('nextEventMeta');
            if (nextEventMeta) {
                nextEventMeta.textContent = `${formatDateTime(
                    FALLBACK_STATS.nextEvent.date,
                    FALLBACK_STATS.nextEvent.time
                )} · ${formatCurrency(FALLBACK_STATS.nextEvent.payout)}`;
            }

            const actionNeeded = document.getElementById('actionNeededStat');
            if (actionNeeded) {
                actionNeeded.textContent = String(FALLBACK_STATS.actionNeeded.count);
            }

            const actionNeededMeta = document.getElementById('actionNeededMeta');
            if (actionNeededMeta) {
                actionNeededMeta.textContent = FALLBACK_STATS.actionNeeded.meta;
                actionNeededMeta.classList.add('danger');
                actionNeededMeta.classList.remove('success');
            }
        }

        function formatRelativeTime(timestamp) {
            if (!timestamp) {
                return '';
            }

            const diffMs = Date.now() - timestamp;
            const minutes = Math.floor(diffMs / (1000 * 60));
            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes} min ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
            return formatDateOnly(new Date(timestamp).toISOString().slice(0, 10));
        }

        function getEventTimestamp(event) {
            if (!event || !event.date) {
                return Number.MAX_SAFE_INTEGER;
            }

            const timestamp = new Date(`${event.date}T${event.time || '00:00'}`).getTime();
            return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
        }

        function createBadge(text, level) {
            const badge = document.createElement('span');
            badge.className = `badge ${level || 'neutral'}`;
            badge.textContent = text;
            return badge;
        }

        function renderActivity(events, employees) {
            const feed = document.getElementById('activityFeed');
            if (!feed) {
                return;
            }

            feed.innerHTML = '';

            const activityItems = [
                ...events.map((event) => ({
                    id: event.id,
                    createdAt: event.createdAt || 0,
                    icon: '🍸',
                    title: `${event.name} saved`,
                    subtitle: `${formatDateTime(event.date, event.time)} · ${event.location || 'Location TBC'}`,
                })),
                ...employees.map((employee) => ({
                    id: employee.id,
                    createdAt: employee.createdAt || 0,
                    icon: '👤',
                    title: `${employee.name} added`,
                    subtitle: `${employee.role || 'Role pending'} · ${employee.status || 'Status pending'}`,
                })),
            ]
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, 6);

            if (activityItems.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'empty-state';
                empty.textContent = 'Activities will appear here after you add events or employees.';
                feed.appendChild(empty);
                return;
            }

            activityItems.forEach((item) => {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item';

                const left = document.createElement('div');
                left.className = 'timeline-item__left';

                const icon = document.createElement('span');
                icon.className = 'timeline-icon';
                icon.textContent = item.icon;
                left.appendChild(icon);

                const copy = document.createElement('div');
                const title = document.createElement('h3');
                title.className = 'person-card__name';
                title.textContent = item.title;
                const subtitle = document.createElement('p');
                subtitle.className = 'card-subtitle';
                subtitle.textContent = item.subtitle;
                copy.appendChild(title);
                copy.appendChild(subtitle);
                left.appendChild(copy);

                const meta = document.createElement('span');
                meta.className = 'timeline-item__meta';
                meta.textContent = formatRelativeTime(item.createdAt);

                timelineItem.appendChild(left);
                timelineItem.appendChild(meta);
                feed.appendChild(timelineItem);
            });
        }

        function renderDashboardEvents(events) {
            const tableBody = document.getElementById('dashboardEventsTable');
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = '';

            if (events.length === 0) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.className = 'empty-state';
                cell.textContent = 'Log your first event to build this view.';
                row.appendChild(cell);
                tableBody.appendChild(row);
                return;
            }

            events.slice(0, 5).forEach((event) => {
                const row = document.createElement('tr');

                const nameCell = document.createElement('td');
                nameCell.textContent = event.name;

                const dateCell = document.createElement('td');
                dateCell.textContent = formatDateTime(event.date, event.time);

                const locationCell = document.createElement('td');
                locationCell.textContent = event.location || 'Location TBC';

                const teamCell = document.createElement('td');
                teamCell.textContent = event.staffingStatus || 'Staffing pending';

                const statusCell = document.createElement('td');
                statusCell.appendChild(createBadge(event.status || 'Pending', event.statusLevel));

                const actionsCell = document.createElement('td');
                actionsCell.className = 'table-actions';
                const link = document.createElement('a');
                link.className = 'card-action';
                link.href = 'events.html';
                link.textContent = 'View details';
                actionsCell.appendChild(link);

                row.appendChild(nameCell);
                row.appendChild(dateCell);
                row.appendChild(locationCell);
                row.appendChild(teamCell);
                row.appendChild(statusCell);
                row.appendChild(actionsCell);
                tableBody.appendChild(row);
            });
        }

        function renderStaffingAlerts(events) {
            const alertsList = document.getElementById('staffingAlertsList');
            if (!alertsList) {
                return;
            }

            alertsList.innerHTML = '';
            const needsAttention = events.filter((event) => event.staffingLevel !== 'success');

            if (needsAttention.length === 0) {
                const item = document.createElement('li');
                item.textContent = 'All events are fully staffed. Great job!';
                alertsList.appendChild(item);
                return;
            }

            needsAttention.forEach((event) => {
                const item = document.createElement('li');
                item.innerHTML = `<strong>${event.name}</strong> · ${event.staffingStatus || 'Staffing pending'} · ${formatDateOnly(event.date)}`;
                alertsList.appendChild(item);
            });
        }

        function updateStats(events = [], employees = []) {
            const totalEvents = document.getElementById('totalEventsStat');
            const teamAvailability = document.getElementById('teamAvailabilityStat');
            const nextEventName = document.getElementById('nextEventName');
            const nextEventMeta = document.getElementById('nextEventMeta');
            const actionNeeded = document.getElementById('actionNeededStat');
            const actionNeededMeta = document.getElementById('actionNeededMeta');

            const hasEventData = Array.isArray(events) && events.length > 0;
            const hasEmployeeData = Array.isArray(employees) && employees.length > 0;

            if (!hasEventData && !hasEmployeeData) {
                applyFallbackStats();
                return;
            }

            if (totalEvents) {
                totalEvents.textContent = events.length;
            }

            if (teamAvailability) {
                const available = employees.filter((employee) => getEmployeeStatusLevel(employee) === 'success').length;
                teamAvailability.textContent = `${available} / ${employees.length}`;
            }

            if (actionNeeded) {
                const needsStaff = events.filter((event) => event.staffingLevel !== 'success').length;
                actionNeeded.textContent = needsStaff;

                if (actionNeededMeta) {
                    actionNeededMeta.textContent =
                        needsStaff === 0
                            ? 'All staffed'
                            : needsStaff === 1
                            ? 'Shift needs staffing'
                            : 'Unassigned shifts';

                    actionNeededMeta.classList.toggle('danger', needsStaff > 0);
                    actionNeededMeta.classList.toggle('success', needsStaff === 0);
                }
            }

            if (nextEventName && nextEventMeta) {
                const upcoming = events
                    .slice()
                    .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b))
                    .find((event) => getEventTimestamp(event) >= Date.now());

                if (upcoming) {
                    nextEventName.textContent = upcoming.name;
                    nextEventMeta.textContent = `${formatDateTime(upcoming.date, upcoming.time)} · ${formatCurrency(upcoming.payout || 0)}`;
                } else if (events.length > 0) {
                    const latest = events
                        .slice()
                        .sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a))[0];
                    nextEventName.textContent = latest.name;
                    nextEventMeta.textContent = `${formatDateTime(latest.date, latest.time)} · Completed`;
                } else {
                    nextEventName.textContent = 'No events scheduled';
                    nextEventMeta.textContent = 'Add an event to build your schedule.';
                }
            }
        }

        function renderActionNeededDrawer(events, employees) {
            const list = document.getElementById('actionNeededList');
            const emptyState = document.getElementById('actionNeededEmpty');

            if (!list || !emptyState) {
                return;
            }

            list.innerHTML = '';

            const needsStaff = events.filter((event) => event.staffingLevel !== 'success');
            const availableEmployees = employees.filter(
                (employee) => getEmployeeStatusLevel(employee) === 'success'
            );

            if (needsStaff.length === 0) {
                emptyState.hidden = false;
                return;
            }

            emptyState.hidden = true;

            needsStaff
                .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b))
                .forEach((event) => {
                    const card = document.createElement('section');
                    card.className = 'action-needed-item';

                    const header = document.createElement('header');
                    header.className = 'action-needed-item__header';

                    const title = document.createElement('h3');
                    title.className = 'action-needed-item__title';
                    title.textContent = event.name;

                    const date = document.createElement('p');
                    date.className = 'action-needed-item__date';
                    date.textContent = formatDateTime(event.date, event.time);

                    header.appendChild(title);
                    header.appendChild(date);
                    card.appendChild(header);

                    const status = document.createElement('p');
                    status.className = 'action-needed-item__status';
                    status.textContent = event.staffingStatus || 'Staffing pending';
                    card.appendChild(status);

                    const assignedNames = Array.isArray(event.assignedTeam)
                        ? event.assignedTeam
                              .map((id) => {
                                  const match = employees.find((employee) => employee.id === id);
                                  return match ? match.name : null;
                              })
                              .filter(Boolean)
                        : [];

                    if (assignedNames.length > 0) {
                        const assigned = document.createElement('p');
                        assigned.className = 'action-needed-item__assigned';
                        assigned.textContent = `Currently assigned: ${assignedNames.join(', ')}`;
                        card.appendChild(assigned);
                    }

                    const form = document.createElement('form');
                    form.className = 'action-needed-form';
                    form.dataset.eventId = event.id;

                    const description = document.createElement('p');
                    description.className = 'action-needed-form__help';
                    description.textContent = 'Assign available team members to cover this event.';
                    form.appendChild(description);

                    if (availableEmployees.length === 0) {
                        const noTeam = document.createElement('p');
                        noTeam.className = 'action-needed-form__empty';
                        noTeam.textContent = 'No team members are currently available. Update availability in the Employees tab.';
                        form.appendChild(noTeam);
                    } else {
                        const checklist = document.createElement('div');
                        checklist.className = 'action-needed-form__checklist';

                        availableEmployees.forEach((employee) => {
                            const wrapper = document.createElement('label');
                            wrapper.className = 'action-needed-form__option';

                            const input = document.createElement('input');
                            input.type = 'checkbox';
                            input.name = `assignment-${event.id}`;
                            input.value = employee.id;
                            input.checked = Array.isArray(event.assignedTeam) && event.assignedTeam.includes(employee.id);

                            const span = document.createElement('span');
                            span.innerHTML = `<strong>${employee.name}</strong><small>${employee.role}</small>`;

                            wrapper.appendChild(input);
                            wrapper.appendChild(span);
                            checklist.appendChild(wrapper);
                        });

                        form.appendChild(checklist);
                    }

                    const actions = document.createElement('div');
                    actions.className = 'action-needed-form__actions';

                    const submit = document.createElement('button');
                    submit.type = 'submit';
                    submit.className = 'button primary';
                    submit.textContent = 'Update staffing';
                    actions.appendChild(submit);

                    form.appendChild(actions);
                    card.appendChild(form);
                    list.appendChild(card);
                });
        }

        function attachActionNeededHandlers(state) {
            const trigger = document.getElementById('actionNeededTrigger');
            const drawer = document.getElementById('actionNeededDrawer');
            const overlay = document.getElementById('actionNeededOverlay');
            const closeButton = drawer?.querySelector('[data-action-needed-close]');
            const feedback = document.getElementById('actionNeededFeedback');

            if (!trigger || !drawer) {
                return;
            }

            let lastFocusedElement = null;

            const setOpenState = (isOpen) => {
                drawer.classList.toggle('open', isOpen);
                drawer.setAttribute('aria-hidden', String(!isOpen));
                if (overlay) {
                    overlay.hidden = !isOpen;
                }

                if (isOpen) {
                    const focusableSelectors = [
                        'button',
                        'a[href]',
                        'input',
                        'select',
                        'textarea',
                        '[tabindex]:not([tabindex="-1"])',
                    ].join(',');
                    const focusable = drawer.querySelectorAll(focusableSelectors);
                    if (focusable.length > 0) {
                        focusable[0].focus();
                    }
                } else if (lastFocusedElement) {
                    lastFocusedElement.focus();
                    lastFocusedElement = null;
                }
            };

            const openDrawer = () => {
                lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                if (feedback) {
                    feedback.textContent = '';
                }
                renderActionNeededDrawer(state.events, state.employees);
                setOpenState(true);
            };

            const closeDrawer = () => {
                setOpenState(false);
            };

            trigger.addEventListener('click', () => {
                if (trigger.disabled) {
                    return;
                }
                openDrawer();
            });

            if (overlay) {
                overlay.addEventListener('click', closeDrawer);
            }

            if (closeButton) {
                closeButton.addEventListener('click', closeDrawer);
            }

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && drawer.classList.contains('open')) {
                    closeDrawer();
                }
            });

            document.addEventListener('submit', (event) => {
                const form = event.target;
                if (!(form instanceof HTMLFormElement)) {
                    return;
                }

                if (!form.classList.contains('action-needed-form')) {
                    return;
                }

                event.preventDefault();
                const eventId = form.dataset.eventId;
                if (!eventId) {
                    return;
                }

                const checked = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'));
                const selectedIds = checked.map((input) => input.value);

                const assignedNames = state.employees
                    .filter((employee) => selectedIds.includes(employee.id))
                    .map((employee) => employee.name);

                const staffingStatus = assignedNames.length
                    ? `Assigned team: ${assignedNames.join(', ')}`
                    : 'Staffing pending';
                const staffingLevel = assignedNames.length ? 'success' : 'warning';

                if (store) {
                    store.updateEvent(eventId, {
                        assignedTeam: selectedIds,
                        staffingStatus,
                        staffingLevel,
                    });

                    state.events = store.getEvents();
                    state.employees = store.getEmployees();
                }

                renderActivity(state.events, state.employees);
                renderDashboardEvents(
                    state.events
                        .slice()
                        .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b))
                );
                renderStaffingAlerts(state.events);
                updateStats(state.events, state.employees);
                renderActionNeededDrawer(state.events, state.employees);

                if (feedback) {
                    const updatedEvent = state.events.find((item) => item.id === eventId);
                    feedback.textContent = assignedNames.length
                        ? `${updatedEvent ? updatedEvent.name : 'Event'} now has ${assignedNames.length} team member${assignedNames.length === 1 ? '' : 's'} assigned.`
                        : 'Assignment removed. This event still needs staffing.';
                }
            });
        }

        if (store) {
            const state = {
                events: store.getEvents(),
                employees: store.getEmployees(),
            };

            renderActivity(state.events, state.employees);
            renderDashboardEvents(
                state.events
                    .slice()
                    .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b))
            );
            renderStaffingAlerts(state.events);
            updateStats(state.events, state.employees);
            renderActionNeededDrawer(state.events, state.employees);
            attachActionNeededHandlers(state);
        } else {
            applyFallbackStats();
        }
    });
})();

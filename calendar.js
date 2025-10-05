(function () {
    const CALENDAR_STYLE = `
        .calendar-grid[data-calendar-ready="true"] {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 0.5rem;
        }
        .calendar-cell {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            padding: 0.75rem;
            border-radius: 0.75rem;
            border: 1px solid rgba(148, 163, 184, 0.35);
            background: #ffffff;
            min-height: 6rem;
            cursor: pointer;
            transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        }
        .calendar-cell:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 25px -18px rgba(15, 23, 42, 0.45);
            border-color: rgba(37, 99, 235, 0.4);
        }
        .calendar-cell:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
        }
        .calendar-cell--muted {
            background: linear-gradient(180deg, rgba(241, 245, 249, 0.7), rgba(248, 250, 252, 0.85));
            color: #94a3b8;
        }
        .calendar-cell--today {
            border-color: rgba(59, 130, 246, 0.8);
            box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
        }
        .calendar-cell--selected {
            border-color: #2563eb;
            background: linear-gradient(180deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.04));
        }
        .calendar-cell__date {
            font-weight: 600;
            font-size: 0.95rem;
        }
        .calendar-cell__events {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }
        .calendar-cell__event {
            font-size: 0.75rem;
            font-weight: 500;
            color: #1f2937;
            background: rgba(15, 23, 42, 0.08);
            border-radius: 999px;
            padding: 0.1rem 0.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .calendar-cell__count {
            font-size: 0.75rem;
            font-weight: 600;
            color: #475569;
        }
        .calendar-cell__more {
            font-size: 0.75rem;
            color: #2563eb;
        }
        .calendar-cell__lead-dots {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }
        .calendar-cell__lead-dot {
            width: 0.65rem;
            height: 0.65rem;
            border-radius: 999px;
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.15);
            cursor: pointer;
        }
        .calendar-cell__lead-dot:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
        }
    `;

    function ensureCalendarStyles() {
        if (document.getElementById('calendar-enhancements-style')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'calendar-enhancements-style';
        style.textContent = CALENDAR_STYLE;
        document.head.appendChild(style);
    }

    function toISODate(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().slice(0, 10);
    }

    function compareDates(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function formatDate(date, options) {
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    class CalendarView {
        constructor(root) {
            this.root = root;
            this.grid = root.querySelector('[data-calendar-grid]') || root.querySelector('#calendarGrid');
            this.monthHeading = root.querySelector('[data-calendar-heading]') || root.querySelector('#calendarMonthHeading');
            this.controlsLabel = root.querySelector('[data-calendar-controls-label]') || root.querySelector('#calendarControlsLabel');
            this.selectedHeading = root.querySelector('[data-calendar-selected-heading]') || root.querySelector('#calendarSelectedHeading');
            this.selectedSummary = root.querySelector('[data-calendar-selected-summary]') || root.querySelector('#calendarSelectedSummary');
            this.dayList = root.querySelector('[data-calendar-day-list]') || root.querySelector('#calendarDayList');
            this.weekSummary = root.querySelector('[data-calendar-week-summary]') || root.querySelector('#weekSummaryTable');
            this.navButtons = Array.from(root.querySelectorAll('[data-calendar-nav]'));
            this.today = new Date();
            this.store = window.B2UStore || null;
            this.leadStore = window.B2ULeadStore || null;
            this.leadsByDate = new Map();
            this.state = {
                events: [],
                employees: [],
                employeeMap: new Map(),
                currentMonth: new Date(this.today.getFullYear(), this.today.getMonth(), 1),
                selectedDate: new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate()),
            };
            this.handleLeadUpdate = this.handleLeadUpdate.bind(this);
            ensureCalendarStyles();
            if (this.grid) {
                this.grid.setAttribute('data-calendar-ready', 'true');
            }
        }

        init() {
            this.attachNavHandlers();
            this.refresh();
            if (this.leadStore && typeof this.leadStore.subscribe === 'function') {
                this.leadUnsubscribe = this.leadStore.subscribe((leads) => this.updateLeads(leads));
            } else {
                window.addEventListener('b2u:leads:updated', this.handleLeadUpdate);
                if (this.leadStore && typeof this.leadStore.getLeads === 'function') {
                    this.updateLeads(this.leadStore.getLeads());
                }
            }
        }

        destroy() {
            if (typeof this.leadUnsubscribe === 'function') {
                this.leadUnsubscribe();
            } else {
                window.removeEventListener('b2u:leads:updated', this.handleLeadUpdate);
            }
        }

        handleLeadUpdate(event) {
            const leads = event.detail?.leads || [];
            this.updateLeads(leads);
        }

        updateLeads(leads) {
            const grouped = new Map();
            if (Array.isArray(leads)) {
                leads.forEach((lead) => {
                    if (!lead || !lead.idealDate) {
                        return;
                    }
                    const iso = String(lead.idealDate).slice(0, 10);
                    if (!iso) return;
                    const list = grouped.get(iso) || [];
                    list.push(lead);
                    grouped.set(iso, list);
                });
                grouped.forEach((list, iso) => {
                    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    grouped.set(iso, list);
                });
            }
            this.leadsByDate = grouped;
            this.renderMonth();
        }

        attachNavHandlers() {
            if (!this.navButtons.length) {
                return;
            }
            this.navButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const action = button.dataset.calendarNav;
                    if (!action) {
                        return;
                    }
                    if (action === 'prev') {
                        this.state.currentMonth = new Date(
                            this.state.currentMonth.getFullYear(),
                            this.state.currentMonth.getMonth() - 1,
                            1
                        );
                    } else if (action === 'next') {
                        this.state.currentMonth = new Date(
                            this.state.currentMonth.getFullYear(),
                            this.state.currentMonth.getMonth() + 1,
                            1
                        );
                    } else if (action === 'today') {
                        this.state.currentMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
                        this.state.selectedDate = new Date(
                            this.today.getFullYear(),
                            this.today.getMonth(),
                            this.today.getDate()
                        );
                    }
                    this.renderMonth();
                    this.renderDayDetails();
                });
            });
        }

        refresh() {
            if (this.store && typeof this.store.getEvents === 'function') {
                this.state.events = this.store.getEvents();
            }
            if (this.store && typeof this.store.getEmployees === 'function') {
                this.state.employees = this.store.getEmployees();
            }
            this.buildEmployeeIndex();
            this.renderMonth();
            this.renderDayDetails();
            this.renderWeekSummary();
        }

        buildEmployeeIndex() {
            this.state.employeeMap.clear();
            this.state.employees.forEach((employee) => {
                this.state.employeeMap.set(employee.id, employee);
            });
        }

        getEventsByDate() {
            const grouped = new Map();
            this.state.events.forEach((event) => {
                if (!event || !event.date) {
                    return;
                }
                const iso = String(event.date).slice(0, 10);
                const list = grouped.get(iso) || [];
                list.push(event);
                grouped.set(iso, list);
            });
            grouped.forEach((list, key) => {
                list.sort((a, b) => this.getEventTimestamp(a) - this.getEventTimestamp(b));
                grouped.set(key, list);
            });
            return grouped;
        }

        getEventTimestamp(event) {
            if (!event || !event.date) {
                return Number.MAX_SAFE_INTEGER;
            }
            const timestamp = new Date(`${event.date}T${event.time || '00:00'}`).getTime();
            return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
        }

        getStaffNames(ids) {
            if (!Array.isArray(ids) || !ids.length) {
                return [];
            }
            return ids
                .map((id) => this.state.employeeMap.get(id))
                .filter(Boolean)
                .map((employee) => employee.name);
        }

        renderMonth() {
            if (!this.grid) {
                return;
            }
            this.grid.innerHTML = '';
            const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
            const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const headingText = monthFormatter.format(this.state.currentMonth);
            if (this.monthHeading) {
                this.monthHeading.textContent = headingText;
            }
            if (this.controlsLabel) {
                this.controlsLabel.textContent = headingText;
            }
            const firstDay = new Date(this.state.currentMonth.getFullYear(), this.state.currentMonth.getMonth(), 1);
            const startOffset = firstDay.getDay();
            const startDate = new Date(firstDay);
            startDate.setDate(1 - startOffset);
            const eventsByDate = this.getEventsByDate();
            const selectedIso = toISODate(this.state.selectedDate);
            const todayIso = toISODate(this.today);

            for (let index = 0; index < 42; index += 1) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + index);
                const iso = toISODate(cellDate);
                const cell = document.createElement('div');
                cell.className = 'calendar-cell';
                cell.setAttribute('role', 'gridcell');
                cell.tabIndex = iso === selectedIso ? 0 : -1;
                if (cellDate.getMonth() !== this.state.currentMonth.getMonth()) {
                    cell.classList.add('calendar-cell--muted');
                }
                if (iso === todayIso) {
                    cell.classList.add('calendar-cell--today');
                }
                if (iso === selectedIso) {
                    cell.classList.add('calendar-cell--selected');
                }

                const dateLabel = document.createElement('span');
                dateLabel.className = 'calendar-cell__date';
                dateLabel.textContent = String(cellDate.getDate());
                cell.appendChild(dateLabel);

                const dayEvents = eventsByDate.get(iso) || [];
                if (dayEvents.length) {
                    const countBadge = document.createElement('span');
                    countBadge.className = 'calendar-cell__count';
                    countBadge.textContent = `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`;
                    cell.appendChild(countBadge);
                    const list = document.createElement('ul');
                    list.className = 'calendar-cell__events';
                    dayEvents.slice(0, 3).forEach((event) => {
                        const item = document.createElement('li');
                        item.className = 'calendar-cell__event';
                        item.textContent = event.name;
                        item.title = `${event.name} · ${event.staffingStatus || 'Staffing pending'}`;
                        list.appendChild(item);
                    });
                    cell.appendChild(list);
                    if (dayEvents.length > 3) {
                        const more = document.createElement('span');
                        more.className = 'calendar-cell__more';
                        more.textContent = `+${dayEvents.length - 3} more`;
                        cell.appendChild(more);
                    }
                }

                const dayLeads = this.leadsByDate.get(iso) || [];
                if (dayLeads.length) {
                    const dots = document.createElement('div');
                    dots.className = 'calendar-cell__lead-dots';
                    dayLeads.slice(0, 6).forEach((lead) => {
                        const dot = document.createElement('button');
                        dot.type = 'button';
                        dot.className = 'calendar-cell__lead-dot';
                        const meta = this.leadStore?.getStatusMeta
                            ? this.leadStore.getStatusMeta(lead.status)
                            : { color: '#6b7280' };
                        dot.style.background = meta.color || '#6b7280';
                        dot.title = `${lead.name || 'Lead'}${lead.status ? ` · ${lead.status}` : ''}`;
                        dot.addEventListener('click', (event) => {
                            event.stopPropagation();
                            this.openLeadModal(lead.id);
                        });
                        dots.appendChild(dot);
                    });
                    if (dayLeads.length > 6) {
                        const overflow = document.createElement('span');
                        overflow.className = 'calendar-cell__more';
                        overflow.textContent = `+${dayLeads.length - 6}`;
                        dots.appendChild(overflow);
                    }
                    cell.appendChild(dots);
                }

                cell.addEventListener('click', () => {
                    this.state.selectedDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
                    if (cellDate.getMonth() !== this.state.currentMonth.getMonth()) {
                        this.state.currentMonth = new Date(cellDate.getFullYear(), cellDate.getMonth(), 1);
                    }
                    this.renderMonth();
                    this.renderDayDetails();
                });
                cell.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        cell.click();
                    }
                });

                cell.setAttribute('aria-label', dayFormatter.format(cellDate));
                this.grid.appendChild(cell);
            }
        }

        renderDayDetails() {
            if (!this.dayList || !this.selectedHeading || !this.selectedSummary) {
                return;
            }
            const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
            const eventsByDate = this.getEventsByDate();
            const iso = toISODate(this.state.selectedDate);
            const dayEvents = eventsByDate.get(iso) || [];
            this.dayList.innerHTML = '';
            this.selectedHeading.textContent = dayFormatter.format(this.state.selectedDate);
            if (!dayEvents.length) {
                this.selectedSummary.textContent = 'No events on the books for this day.';
                const empty = document.createElement('p');
                empty.className = 'empty-state';
                empty.textContent = 'Add an event from the Events page to see it here.';
                this.dayList.appendChild(empty);
                return;
            }
            const earliest = dayEvents.reduce((lowest, event) => Math.min(lowest, this.getEventTimestamp(event)), Number.MAX_SAFE_INTEGER);
            if (earliest && earliest !== Number.MAX_SAFE_INTEGER) {
                this.selectedSummary.textContent = `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'} scheduled. First call time ${timeFormatter.format(new Date(earliest))}.`;
            } else {
                this.selectedSummary.textContent = `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'} scheduled.`;
            }
            dayEvents.forEach((event) => {
                const item = document.createElement('article');
                item.className = 'calendar-detail__item';
                const title = document.createElement('h4');
                title.className = 'calendar-detail__item-title';
                title.textContent = event.name;
                const meta = document.createElement('p');
                meta.className = 'calendar-detail__item-meta';
                const location = event.location ? ` · ${event.location}` : '';
                meta.textContent = `${this.formatEventTime(event)}${location}`;
                const staffing = document.createElement('p');
                staffing.className = 'calendar-detail__item-staff';
                const staffNames = this.getStaffNames(event.assignedStaffIds);
                staffing.textContent = staffNames.length
                    ? `Assigned: ${staffNames.join(', ')}`
                    : event.staffingStatus || 'Staffing pending';
                const note = document.createElement('p');
                note.className = 'calendar-detail__item-note';
                note.textContent = event.notes || 'No notes yet.';
                const linkRow = document.createElement('div');
                linkRow.className = 'calendar-detail__item-actions';
                const link = document.createElement('a');
                link.href = 'events.html#event-pipeline';
                link.className = 'calendar-detail__link';
                link.textContent = 'Manage in Events';
                linkRow.appendChild(link);
                item.append(title, meta, staffing, note, linkRow);
                this.dayList.appendChild(item);
            });
        }

        formatEventTime(event) {
            if (!event || !event.time) {
                return 'Time TBC';
            }
            const date = new Date(`${event.date}T${event.time}`);
            if (Number.isNaN(date.getTime())) {
                return 'Time TBC';
            }
            return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
        }

        renderWeekSummary() {
            if (!this.weekSummary) {
                return;
            }
            this.weekSummary.innerHTML = '';
            const now = Date.now();
            const oneWeek = 1000 * 60 * 60 * 24 * 7;
            const upcoming = this.state.events
                .slice()
                .sort((a, b) => this.getEventTimestamp(a) - this.getEventTimestamp(b))
                .filter((event) => {
                    const timestamp = this.getEventTimestamp(event);
                    return timestamp >= now && timestamp <= now + oneWeek;
                })
                .slice(0, 6);
            if (!upcoming.length) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.className = 'empty-state';
                cell.textContent = 'Nothing booked for the next seven days.';
                row.appendChild(cell);
                this.weekSummary.appendChild(row);
                return;
            }
            upcoming.forEach((event) => {
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                nameCell.textContent = event.name;
                nameCell.setAttribute('data-label', 'Event');
                const dateCell = document.createElement('td');
                dateCell.textContent = formatDate(new Date(`${event.date}T12:00:00`), { month: 'short', day: 'numeric' });
                dateCell.setAttribute('data-label', 'Date');
                const guestCell = document.createElement('td');
                guestCell.textContent = event.guestCount ? event.guestCount : '—';
                guestCell.setAttribute('data-label', 'Guests');
                const teamCell = document.createElement('td');
                const staffNames = this.getStaffNames(event.assignedStaffIds);
                teamCell.textContent = staffNames.length
                    ? `Assigned: ${staffNames.join(', ')}`
                    : event.staffingStatus || 'Staffing pending';
                teamCell.setAttribute('data-label', 'Team');
                const prepCell = document.createElement('td');
                prepCell.textContent = this.estimatePrepHours(event);
                prepCell.setAttribute('data-label', 'Prep hours');
                row.append(nameCell, dateCell, guestCell, teamCell, prepCell);
                this.weekSummary.appendChild(row);
            });
        }

        estimatePrepHours(event) {
            if (!event) {
                return 0;
            }
            const guests = event.guestCount || 0;
            const base = guests ? Math.max(2, Math.ceil(guests / 40)) : 3;
            return event.staffingLevel === 'success' ? base : base + 1;
        }

        openLeadModal(leadId) {
            if (!leadId) {
                return;
            }
            window.dispatchEvent(
                new CustomEvent('b2u:lead:open', {
                    detail: { leadId },
                })
            );
        }
    }

    function initialiseCalendars() {
        const roots = document.querySelectorAll('[data-calendar-root]');
        if (roots.length === 0) {
            const legacyGrid = document.getElementById('calendarGrid');
            if (legacyGrid) {
                const fallbackRoot = legacyGrid.closest('[data-calendar-container]') || legacyGrid.parentElement;
                if (fallbackRoot) {
                    const view = new CalendarView(fallbackRoot);
                    view.init();
                }
            }
            return;
        }
        roots.forEach((root) => {
            const view = new CalendarView(root);
            view.init();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiseCalendars);
    } else {
        initialiseCalendars();
    }
})();

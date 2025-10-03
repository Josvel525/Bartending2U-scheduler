(function (global) {
    const api = global.B2UApi || {};
    const CACHE_TTL = 60 * 1000;

    const state = {
        modal: null,
        modalContent: null,
        previouslyFocused: null,
        isOpen: false,
        cache: new Map(),
        toast: null,
        openedFromHistory: false,
    };

    function createModal() {
        const overlay = document.createElement('div');
        overlay.id = 'employee-detail-modal';
        overlay.className = 'employee-modal hidden';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'employee-modal-title');

        const backdrop = document.createElement('div');
        backdrop.className = 'employee-modal__backdrop';

        const panel = document.createElement('div');
        panel.className = 'employee-modal__panel';
        panel.tabIndex = -1;

        panel.innerHTML = `
            <div class="employee-modal__scroll">
                <header class="employee-modal__header">
                    <div>
                        <p class="employee-modal__status" id="employee-modal-status"></p>
                        <h2 class="employee-modal__title" id="employee-modal-title"></h2>
                        <p class="employee-modal__role" id="employee-modal-role"></p>
                    </div>
                    <button type="button" class="employee-modal__close" data-modal-close>
                        <span aria-hidden="true">×</span>
                        <span class="sr-only">Close</span>
                    </button>
                </header>
                <div class="employee-modal__body" id="employee-modal-body"></div>
                <footer class="employee-modal__footer">
                    <div class="employee-modal__actions">
                        <a class="button secondary" data-view-profile href="#">View full profile</a>
                        <a class="button ghost" data-assign-employee href="events.html">Assign to Event</a>
                    </div>
                    <button type="button" class="button" data-modal-close>Close</button>
                </footer>
            </div>
        `;

        overlay.appendChild(backdrop);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        state.modal = overlay;
        state.modalContent = panel;

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay || event.target === backdrop) {
                closeModal();
            }
        });

        overlay.querySelectorAll('[data-modal-close]').forEach((button) => {
            button.addEventListener('click', () => closeModal());
        });

        document.addEventListener('keydown', (event) => {
            if (state.isOpen && event.key === 'Escape') {
                event.preventDefault();
                closeModal();
            }

            if (state.isOpen && event.key === 'Tab') {
                trapFocus(event);
            }
        });
    }

    function ensureModal() {
        if (!state.modal) {
            createModal();
        }
        return state.modal;
    }

    function trapFocus(event) {
        if (!state.modalContent) {
            return;
        }

        const focusable = state.modalContent.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
            if (active === first || active === state.modalContent) {
                event.preventDefault();
                last.focus();
            }
        } else if (active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function showToast(message, variant = 'error', action) {
        if (!message) {
            return;
        }

        if (!state.toast) {
            const toast = document.createElement('div');
            toast.className = 'employee-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
            state.toast = toast;
        }

        const toast = state.toast;
        toast.innerHTML = '';
        toast.classList.remove('employee-toast--visible', 'employee-toast--error', 'employee-toast--info', 'employee-toast--success');
        toast.classList.add('employee-toast--visible', `employee-toast--${variant}`);

        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);

        if (action) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'employee-toast__action';
            button.textContent = action.label;
            button.addEventListener('click', action.onClick);
            toast.appendChild(button);
        }

        setTimeout(() => {
            toast.classList.remove('employee-toast--visible');
        }, 4000);
    }

    function renderSkeleton() {
        if (!state.modalContent) {
            return;
        }

        state.modalContent.querySelector('#employee-modal-title').textContent = 'Loading…';
        state.modalContent.querySelector('#employee-modal-role').textContent = '';
        state.modalContent.querySelector('#employee-modal-status').innerHTML = '<span class="badge neutral">Fetching data</span>';
        state.modalContent.querySelector('[data-view-profile]').setAttribute('href', '#');
        state.modalContent.querySelector('[data-assign-employee]').setAttribute('href', 'events.html');

        const body = state.modalContent.querySelector('#employee-modal-body');
        if (body) {
            body.innerHTML = `
                <div class="employee-modal__skeleton">
                    <div class="employee-modal__skeleton-line"></div>
                    <div class="employee-modal__skeleton-line short"></div>
                    <div class="employee-modal__skeleton-grid">
                        <div class="employee-modal__skeleton-card"></div>
                        <div class="employee-modal__skeleton-card"></div>
                        <div class="employee-modal__skeleton-card"></div>
                    </div>
                </div>
            `;
        }
    }

    function formatPhone(phone) {
        if (!phone) {
            return '';
        }
        const digits = phone.replace(/[^0-9]/g, '');
        if (digits.length === 11 && digits.startsWith('1')) {
            return `+${digits}`;
        }
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        return phone;
    }

    function formatCurrency(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            return '—';
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    function formatDate(dateString) {
        if (!dateString) {
            return null;
        }
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
        }).format(date);
    }

    function formatTime(dateString) {
        if (!dateString) {
            return null;
        }
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    }

    function renderAssignments(assignments) {
        if (!assignments || !assignments.length) {
            return '<p class="employee-modal__empty">No upcoming assignments in the next month.</p>';
        }

        return `
            <ul class="employee-modal__list">
                ${assignments
                    .slice(0, 5)
                    .map((assignment) => {
                        const dateLabel = formatDate(assignment.date);
                        const timeLabel = formatTime(assignment.startTime);
                        const suffix = [dateLabel, timeLabel].filter(Boolean).join(' · ');
                        const location = assignment.location ? `<span class="employee-modal__muted">${assignment.location}</span>` : '';
                        const role = assignment.role ? `<span class="employee-modal__badge">${assignment.role}</span>` : '';
                        return `
                            <li>
                                <div>
                                    <p class="employee-modal__list-title">${assignment.title}</p>
                                    <p class="employee-modal__muted">${suffix || 'Timing TBC'}</p>
                                </div>
                                <div class="employee-modal__list-meta">
                                    ${role}
                                    ${location}
                                </div>
                            </li>
                        `;
                    })
                    .join('')}
            </ul>
        `;
    }

    function renderChips(label, values) {
        if (!values || !values.length) {
            return `<p class="employee-modal__empty">No ${label.toLowerCase()} recorded.</p>`;
        }

        return `
            <div class="employee-modal__chips">
                ${values.map((value) => `<span class="badge info">${value}</span>`).join('')}
            </div>
        `;
    }

    function renderEmployee(employee) {
        if (!state.modalContent) {
            return;
        }

        const allowedStatuses = ['success', 'warning', 'danger', 'info', 'neutral'];
        const statusClass = allowedStatuses.includes(employee.statusLevel) ? employee.statusLevel : 'neutral';
        state.modalContent.querySelector('#employee-modal-title').textContent = employee.fullName || 'Employee';
        state.modalContent.querySelector('#employee-modal-role').textContent = employee.role || '';
        state.modalContent
            .querySelector('#employee-modal-status')
            .innerHTML = `<span class="badge ${statusClass}">${employee.statusLabel || 'Status'}</span>`;

        const viewProfile = state.modalContent.querySelector('[data-view-profile]');
        if (viewProfile) {
            const url = new URL(window.location.href);
            url.searchParams.set('id', employee.id);
            viewProfile.setAttribute('href', url.toString());
        }

        const assignButton = state.modalContent.querySelector('[data-assign-employee]');
        if (assignButton) {
            assignButton.setAttribute('href', `events.html?employeeId=${encodeURIComponent(employee.id)}`);
        }

        const body = state.modalContent.querySelector('#employee-modal-body');
        if (!body) {
            return;
        }

        const emailLink = employee.email ? `<a href="mailto:${employee.email}">${employee.email}</a>` : '—';
        const phoneLink = employee.phone
            ? `<a href="tel:${employee.phone.replace(/[^0-9+]/g, '')}">${formatPhone(employee.phone)}</a>`
            : '—';

        body.innerHTML = `
            <section class="employee-modal__section">
                <h3>Contact</h3>
                <dl class="employee-modal__definition">
                    <div>
                        <dt>Email</dt>
                        <dd>${emailLink}</dd>
                    </div>
                    <div>
                        <dt>Phone</dt>
                        <dd>${phoneLink}</dd>
                    </div>
                </dl>
            </section>
            <section class="employee-modal__section">
                <h3>Skills</h3>
                ${renderChips('Skills', employee.skills)}
            </section>
            <section class="employee-modal__section">
                <h3>Certifications</h3>
                ${renderChips('Certifications', employee.certifications)}
            </section>
            <section class="employee-modal__section">
                <h3>Availability</h3>
                <p class="employee-modal__muted">${employee.availabilitySummary || 'Schedule data not yet recorded.'}</p>
            </section>
            <section class="employee-modal__section">
                <h3>Assignments</h3>
                <p class="employee-modal__muted">${employee.assignmentsCount || 0} total assignments</p>
                ${renderAssignments(employee.upcomingAssignments)}
            </section>
            <section class="employee-modal__section">
                <h3>Hourly rate</h3>
                <p>${formatCurrency(employee.hourlyRate ?? null)}</p>
            </section>
            <section class="employee-modal__section">
                <h3>Notes</h3>
                <p>${employee.notes || 'Add notes so dispatch knows their strengths.'}</p>
            </section>
        `;
    }

    function getCachedEmployee(id) {
        const cached = state.cache.get(id);
        if (!cached) {
            return null;
        }
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            state.cache.delete(id);
            return null;
        }
        return cached.employee;
    }

    function cacheEmployee(id, employee) {
        state.cache.set(id, { employee, timestamp: Date.now() });
    }

    function handleError(error, employeeId) {
        console.error(error);
        showToast("Couldn't load employee", 'error', {
            label: 'Retry',
            onClick: () => openModal(employeeId, { replaceState: true, skipCache: true }),
        });

        if (state.modalContent) {
            const body = state.modalContent.querySelector('#employee-modal-body');
            if (body) {
                body.innerHTML = `
                    <div class="employee-modal__error">
                        <p>We ran into a problem loading this teammate. Please try again.</p>
                        <button type="button" class="button" data-retry>Retry</button>
                    </div>
                `;
                const retry = body.querySelector('[data-retry]');
                if (retry) {
                    retry.addEventListener('click', () => openModal(employeeId, { replaceState: true, skipCache: true }));
                }
            }
        }
    }

    function setUrl(employeeId, { replaceState = false } = {}) {
        const url = new URL(window.location.href);
        url.searchParams.set('id', employeeId);
        const method = replaceState ? 'replaceState' : 'pushState';
        window.history[method]({ employeeModal: true, employeeId }, '', url.toString());
    }

    function removeUrlParam() {
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    function openModal(employeeId, { replaceState = false, skipHistory = false, skipCache = false } = {}) {
        if (!employeeId) {
            return;
        }

        ensureModal();
        state.isOpen = true;
        state.openedFromHistory = Boolean(skipHistory);

        if (!skipHistory) {
            setUrl(employeeId, { replaceState });
        }

        if (state.modal) {
            state.modal.classList.remove('hidden');
        }
        if (state.modalContent) {
            state.modalContent.focus();
        }

        state.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        renderSkeleton();

        if (!skipCache) {
            const cached = getCachedEmployee(employeeId);
            if (cached) {
                renderEmployee(cached);
            }
        }

        const fetchPromise =
            typeof api.getEmployee === 'function'
                ? api.getEmployee(employeeId)
                : Promise.reject(new Error('Employee API unavailable'));

        Promise.resolve(fetchPromise)
            .then((employee) => {
                cacheEmployee(employeeId, employee);
                renderEmployee(employee);
            })
            .catch((error) => handleError(error, employeeId));
    }

    function closeModal({ triggeredByPopState = false } = {}) {
        if (!state.isOpen) {
            return;
        }

        if (state.modal) {
            state.modal.classList.add('hidden');
        }

        state.isOpen = false;

        if (state.previouslyFocused) {
            state.previouslyFocused.focus();
            state.previouslyFocused = null;
        }

        if (!triggeredByPopState) {
            if (state.openedFromHistory) {
                removeUrlParam();
            } else {
                const url = new URL(window.location.href);
                if (url.searchParams.has('id')) {
                    window.history.back();
                    state.openedFromHistory = false;
                    return;
                }
            }
        }

        state.openedFromHistory = false;
    }

    function parseEmployeeIdFromLocation() {
        const url = new URL(window.location.href);
        const queryId = url.searchParams.get('id');
        if (queryId) {
            return queryId;
        }

        const segments = url.pathname.split('/').filter(Boolean);
        const employeesIndex = segments.indexOf('employees');
        if (employeesIndex !== -1 && segments.length > employeesIndex + 1) {
            return segments[employeesIndex + 1];
        }

        return null;
    }

    function initialiseClicks() {
        const container = document.querySelector('#teamList');
        if (!container) {
            return;
        }

        container.addEventListener('click', (event) => {
            const card = event.target instanceof Element ? event.target.closest('.employee-card[data-employee-id]') : null;
            if (!card) {
                return;
            }

            event.preventDefault();
            const employeeId = card.getAttribute('data-employee-id');
            openModal(employeeId || undefined);
        });
    }

    function initialiseDeepLink() {
        const employeeId = parseEmployeeIdFromLocation();
        if (employeeId) {
            ensureModal();
            openModal(employeeId, { replaceState: true, skipHistory: true });
        }
    }

    window.addEventListener('popstate', () => {
        const employeeId = parseEmployeeIdFromLocation();
        if (!employeeId) {
            closeModal({ triggeredByPopState: true });
            return;
        }

        openModal(employeeId, { replaceState: true, skipHistory: true, skipCache: false });
    });

    document.addEventListener('DOMContentLoaded', () => {
        initialiseClicks();
        initialiseDeepLink();
    });

    global.B2UEmployeeModal = {
        open: openModal,
        close: closeModal,
        getCached: getCachedEmployee,
    };
})(window);

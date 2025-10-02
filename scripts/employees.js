(function () {
    const root = typeof window !== 'undefined' ? window : globalThis;

    function getStore() {
        if (!root.B2UStore) {
            console.warn('B2UStore is not available. Employees cannot be rendered.');
            return null;
        }

        return root.B2UStore;
    }
    function getBadgeClass(level) {
        if (!level) {
            return 'badge';
        }

        return `badge ${level}`;
    }

    function renderEmployees() {
        const list = document.getElementById('employeeList');

        if (!list) {
            return;
        }

        const store = getStore();

        if (!store) {
            return;
        }

        const employees = store.getEmployees().sort((a, b) => a.name.localeCompare(b.name));
        list.innerHTML = '';

        if (!employees.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'No team members yet. Invite your first bartender to get started.';
            list.appendChild(empty);
            return;
        }

        employees.forEach((employee) => {
            const card = document.createElement('article');
            card.className = 'person-card';
            card.innerHTML = `
                <div class="person-card__top">
                    <div>
                        <h3 class="person-card__name">${employee.name || 'Unnamed teammate'}</h3>
                        <p class="person-card__role">${employee.role || ''}</p>
                    </div>
                    <button type="button" class="card-action person-card__remove" data-id="${employee.id}">Remove</button>
                </div>
                <div class="person-card__status"><span class="${getBadgeClass(employee.statusLevel)}">${employee.status || 'Available'}</span></div>
                <ul class="person-card__meta">
                    ${employee.email ? `<li>Email: <a href="mailto:${employee.email}">${employee.email}</a></li>` : ''}
                    ${employee.phone ? `<li>Phone: <a href="tel:${employee.phone}">${employee.phone}</a></li>` : ''}
                    ${employee.notes ? `<li>${employee.notes}</li>` : ''}
                </ul>
            `;

            list.appendChild(card);
        });

        list.querySelectorAll('.person-card__remove').forEach((button) => {
            button.addEventListener('click', (event) => {
                const { id } = event.currentTarget.dataset;

                if (confirm('Remove this team member from your roster?')) {
                    store.removeEmployee(id);
                    renderEmployees();
                    updateStats();
                }
            });
        });
    }

    function updateStats() {
        const totalElement = document.getElementById('activeStaffCount');
        const rolesElement = document.getElementById('rolesCovered');
        const ptoElement = document.getElementById('upcomingPto');

        const store = getStore();

        if (!store) {
            return;
        }

        const employees = store.getEmployees();
        const activeCount = employees.length;
        const availableCount = employees.filter((employee) => {
            const normalizedLevel = (employee.statusLevel || '').toLowerCase();
            if (normalizedLevel === 'success') {
                return true;
            }

            const normalizedStatus = (employee.status || '').toLowerCase();
            return normalizedStatus === 'available';
        }).length;
        const warningCount = employees.filter((employee) => employee.statusLevel === 'warning').length;
        const uniqueRoles = new Set(
            employees
                .map((employee) => employee.role || '')
                .filter((role) => role)
                .map((role) => role.split('·')[0].trim())
        );

        if (totalElement) {
            totalElement.textContent = String(activeCount);
            const meta = totalElement.nextElementSibling;

            if (meta && meta.classList.contains('stat-card__meta')) {
                meta.textContent = `${availableCount} available this week`;
            }
        }

        if (rolesElement) {
            rolesElement.textContent = String(uniqueRoles.size || '—');
        }

        if (ptoElement) {
            ptoElement.textContent = String(warningCount);
        }
    }

    function handleFormSubmission() {
        const form = document.getElementById('employeeForm');

        if (!form) {
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const statusSelect = form.querySelector('#teamStatus');

            const newEmployee = {
                name: form.teamName.value.trim(),
                role: form.teamRole.value,
                email: form.teamEmail.value.trim(),
                phone: form.teamPhone.value.trim(),
                notes: form.teamNotes.value.trim(),
                status: statusSelect ? statusSelect.value : 'Available',
                statusLevel: statusSelect ? statusSelect.options[statusSelect.selectedIndex].dataset.level : 'success',
            };

            const store = getStore();

            if (!store) {
                return;
            }

            store.addEmployee(newEmployee);
            form.reset();
            renderEmployees();
            updateStats();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!root.B2UStore) {
            console.warn('B2UStore is not available. Unable to manage employees.');
            return;
        }

        renderEmployees();
        updateStats();
        handleFormSubmission();
    });
})();

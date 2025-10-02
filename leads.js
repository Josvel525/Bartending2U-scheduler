(function () {
    const store = window.B2UStore;
    const tableBody = document.getElementById('leadTableBody');
    const detailPanel = document.getElementById('leadDetailPanel');

    if (!store || !tableBody || !detailPanel) {
        return;
    }

    const detailContent = detailPanel.querySelector('[data-lead-content]');
    const emptyState = detailPanel.querySelector('[data-lead-empty]');
    const activityList = document.getElementById('leadActivityList');
    const followUpForm = document.getElementById('leadFollowUpForm');
    const followUpFeedback = detailPanel.querySelector('[data-follow-up-feedback]');
    const closeButton = detailPanel.querySelector('[data-lead-close]');

    const fieldRefs = {};
    detailPanel.querySelectorAll('[data-lead-field]').forEach((element) => {
        const key = element.getAttribute('data-lead-field');
        if (!key) {
            return;
        }
        fieldRefs[key] = element;
    });

    const state = {
        leads: [],
        selectedLeadId: null,
        feedbackTimeoutId: null,
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });

    function formatDate(value) {
        if (!value) {
            return '—';
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '—';
        }

        return dateFormatter.format(date);
    }

    function formatDateTime(value) {
        if (!value) {
            return '—';
        }
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '—';
        }
        return dateTimeFormatter.format(date);
    }

    function formatCurrency(value) {
        const amount = Number(value);
        if (!Number.isFinite(amount)) {
            return '—';
        }
        return currencyFormatter.format(amount);
    }

    function formatLeadRowName(lead) {
        if (!lead) {
            return '';
        }
        return lead.company ? `${lead.name} · ${lead.company}` : lead.name;
    }

    function sortLeads(leads) {
        return leads
            .slice()
            .sort((a, b) => {
                const aTime = a && a.eventDate ? new Date(a.eventDate).getTime() : Number.POSITIVE_INFINITY;
                const bTime = b && b.eventDate ? new Date(b.eventDate).getTime() : Number.POSITIVE_INFINITY;
                if (aTime === bTime) {
                    const aCreated = a && a.createdAt ? a.createdAt : 0;
                    const bCreated = b && b.createdAt ? b.createdAt : 0;
                    return bCreated - aCreated;
                }
                return aTime - bTime;
            });
    }

    function renderTable() {
        tableBody.innerHTML = '';

        if (!state.leads.length) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'lead-table__empty';
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.textContent = 'No leads logged yet.';
            emptyRow.appendChild(cell);
            tableBody.appendChild(emptyRow);
            return;
        }

        state.leads.forEach((lead) => {
            const row = document.createElement('tr');
            row.className = 'lead-row';
            if (lead.id === state.selectedLeadId) {
                row.classList.add('is-selected');
            }
            row.dataset.leadId = lead.id;
            row.tabIndex = 0;

            const statusBadgeClass = ['badge'];
            if (lead.statusLevel) {
                statusBadgeClass.push(lead.statusLevel);
            }

            const valueBadgeClass = ['badge'];
            if (lead.statusLevel === 'danger') {
                valueBadgeClass.push('danger');
            } else if (lead.statusLevel === 'warning') {
                valueBadgeClass.push('warning');
            } else {
                valueBadgeClass.push('success');
            }

            row.innerHTML = `
                <td data-label="Lead">${formatLeadRowName(lead)}</td>
                <td data-label="Event type">${lead.eventType || '—'}</td>
                <td data-label="Ideal date">${formatDate(lead.eventDate)}</td>
                <td data-label="Estimated value"><span class="${valueBadgeClass.join(' ')}">${formatCurrency(
                    lead.estimatedValue
                )}</span></td>
                <td data-label="Status"><span class="${statusBadgeClass.join(' ')}">${lead.status || '—'}</span></td>
                <td data-label="Next touchpoint">${lead.nextTouchpoint || '—'}</td>
            `;

            row.addEventListener('click', () => {
                selectLead(lead.id);
            });

            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectLead(lead.id);
                }
            });

            tableBody.appendChild(row);
        });
    }

    function updateRowSelection() {
        tableBody.querySelectorAll('.lead-row').forEach((row) => {
            const leadId = row.dataset.leadId;
            if (!leadId) {
                return;
            }
            if (leadId === state.selectedLeadId) {
                row.classList.add('is-selected');
            } else {
                row.classList.remove('is-selected');
            }
        });
    }

    function renderActivities(lead) {
        if (!activityList) {
            return;
        }

        activityList.innerHTML = '';

        if (!lead.activities || lead.activities.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'lead-activity-list__empty';
            emptyItem.textContent = 'No activity logged yet. Log a follow-up to build momentum.';
            activityList.appendChild(emptyItem);
            return;
        }

        lead.activities.forEach((activity) => {
            const item = document.createElement('li');
            item.className = 'lead-activity-list__item';

            const header = document.createElement('div');
            header.className = 'lead-activity-list__item-header';

            const method = document.createElement('span');
            method.className = 'lead-activity-list__method';
            method.textContent = activity.method || activity.type || 'Follow-up';

            const time = document.createElement('time');
            time.className = 'lead-activity-list__time';
            time.dateTime = new Date(activity.createdAt).toISOString();
            time.textContent = formatDateTime(activity.createdAt);

            header.appendChild(method);
            header.appendChild(time);

            const summary = document.createElement('p');
            summary.className = 'lead-activity-list__summary';
            summary.textContent = activity.summary || activity.type || 'Update logged';

            const message = document.createElement('p');
            message.className = 'lead-activity-list__message';
            message.textContent = activity.message || '';

            item.appendChild(header);
            item.appendChild(summary);
            if (message.textContent) {
                item.appendChild(message);
            }

            if (activity.scheduledFor) {
                const scheduled = document.createElement('p');
                scheduled.className = 'lead-activity-list__scheduled';
                scheduled.textContent = `Next touchpoint scheduled for ${formatDateTime(activity.scheduledFor)}`;
                item.appendChild(scheduled);
            }

            activityList.appendChild(item);
        });
    }

    function renderDetail(lead) {
        if (!lead) {
            state.selectedLeadId = null;
            detailPanel.classList.remove('is-open');
            if (detailContent) {
                detailContent.hidden = true;
            }
            if (emptyState) {
                emptyState.hidden = false;
            }
            updateRowSelection();
            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }
        if (detailContent) {
            detailContent.hidden = false;
        }
        detailPanel.classList.add('is-open');

        if (fieldRefs.status) {
            fieldRefs.status.textContent = lead.status || '—';
            fieldRefs.status.className = `badge ${lead.statusLevel || 'info'}`;
        }
        if (fieldRefs.name) {
            fieldRefs.name.textContent = lead.name || 'Untitled lead';
        }
        if (fieldRefs.company) {
            fieldRefs.company.textContent = lead.company || lead.eventType || '';
        }
        if (fieldRefs.nextTouchpoint) {
            fieldRefs.nextTouchpoint.textContent = lead.nextTouchpoint || '—';
        }
        if (fieldRefs.eventDate) {
            fieldRefs.eventDate.textContent = formatDate(lead.eventDate);
        }
        if (fieldRefs.estimatedValue) {
            fieldRefs.estimatedValue.textContent = formatCurrency(lead.estimatedValue);
        }
        if (fieldRefs.lastFollowUp) {
            if (lead.lastFollowUpAt) {
                const method = lead.lastFollowUpMethod ? ` via ${lead.lastFollowUpMethod}` : '';
                fieldRefs.lastFollowUp.textContent = `${formatDateTime(lead.lastFollowUpAt)}${method}`;
            } else {
                fieldRefs.lastFollowUp.textContent = 'No follow-up logged yet';
            }
        }
        if (fieldRefs.email) {
            const email = lead.email || '';
            fieldRefs.email.textContent = email || '—';
            fieldRefs.email.href = email ? `mailto:${email}` : '#';
        }
        if (fieldRefs.phone) {
            const phone = lead.phone || '';
            fieldRefs.phone.textContent = phone || '—';
            fieldRefs.phone.href = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : '#';
        }
        if (fieldRefs.source) {
            fieldRefs.source.textContent = lead.source || '—';
        }
        if (fieldRefs.notes) {
            fieldRefs.notes.textContent = lead.notes || 'No notes captured yet.';
        }
        if (fieldRefs.activityCount) {
            const count = Array.isArray(lead.activities) ? lead.activities.length : 0;
            fieldRefs.activityCount.textContent = count ? `${count} touchpoint${count === 1 ? '' : 's'}` : 'No activity yet';
        }

        renderActivities(lead);
        updateRowSelection();
    }

    function refreshLeads(options = {}) {
        const previousSelection = options.preserveSelection ? state.selectedLeadId : null;
        state.leads = sortLeads(store.getLeads());
        renderTable();
        if (previousSelection) {
            state.selectedLeadId = previousSelection;
            const selected = state.leads.find((lead) => lead.id === previousSelection);
            renderDetail(selected || null);
        }
    }

    function selectLead(leadId) {
        if (!leadId) {
            renderDetail(null);
            return;
        }

        state.selectedLeadId = leadId;
        const lead = state.leads.find((item) => item.id === leadId) || store.getLead(leadId);
        renderDetail(lead || null);
    }

    function closeDetail() {
        renderDetail(null);
        if (emptyState) {
            emptyState.hidden = false;
        }
    }

    function showFeedback(message, tone = 'success') {
        if (!followUpFeedback) {
            return;
        }

        followUpFeedback.textContent = message;
        followUpFeedback.dataset.tone = tone;

        if (state.feedbackTimeoutId) {
            window.clearTimeout(state.feedbackTimeoutId);
        }

        state.feedbackTimeoutId = window.setTimeout(() => {
            if (followUpFeedback.dataset.tone === tone) {
                followUpFeedback.textContent = '';
                delete followUpFeedback.dataset.tone;
            }
        }, 4000);
    }

    function handleFollowUpSubmit(event) {
        event.preventDefault();
        if (!state.selectedLeadId) {
            showFeedback('Select a lead before logging a follow-up.', 'warning');
            return;
        }

        const methodField = document.getElementById('followUpMethod');
        const scheduleField = document.getElementById('followUpSchedule');
        const messageField = document.getElementById('followUpMessage');
        const nextStepField = document.getElementById('followUpNextStep');

        if (!messageField || !methodField) {
            return;
        }

        const message = (messageField.value || '').trim();
        if (!message) {
            showFeedback('Add a brief summary of the follow-up you sent.', 'warning');
            messageField.focus();
            return;
        }

        const method = methodField.value || 'Email';
        const nextStepRaw = nextStepField ? nextStepField.value.trim() : '';
        const scheduleValue = scheduleField ? scheduleField.value : '';

        let scheduledFor = null;
        if (scheduleValue) {
            const date = new Date(scheduleValue);
            if (!Number.isNaN(date.getTime())) {
                scheduledFor = date.toISOString();
            }
        }

        const activity = {
            method,
            summary: `${method} follow-up sent`,
            message,
        };

        if (scheduledFor) {
            activity.scheduledFor = scheduledFor;
        }

        if (nextStepRaw) {
            activity.nextTouchpoint = nextStepRaw;
        } else if (scheduledFor) {
            activity.nextTouchpoint = `Check in on ${formatDate(scheduledFor)}`;
        }

        const updatedLead = store.addLeadActivity(state.selectedLeadId, activity);
        if (!updatedLead) {
            showFeedback('Unable to record follow-up. Please try again.', 'danger');
            return;
        }

        refreshLeads({ preserveSelection: true });
        selectLead(updatedLead.id);

        if (followUpForm) {
            followUpForm.reset();
        }

        showFeedback('Follow-up logged and next step updated.');
    }

    refreshLeads();
    renderDetail(null);

    if (followUpForm) {
        followUpForm.addEventListener('submit', handleFollowUpSubmit);
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeDetail);
    }
})();

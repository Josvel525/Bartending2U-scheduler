(function () {
    const tableBody = document.getElementById('leadPipelineTableBody');
    if (!tableBody) {
        return;
    }

    const leads = [
        {
            id: 'lead-1',
            name: 'Alicia Martinez',
            company: 'Martinez & Co.',
            eventName: 'Corporate Mixer',
            eventType: 'Corporate',
            idealDate: '2025-11-08',
            estimatedValue: 3500,
            valueLevel: 'success',
            status: 'Proposal sent',
            statusLevel: 'info',
            nextTouchpoint: 'Follow up on tasting preference',
            email: 'alicia@martinezandco.com',
            phone: '(555) 431-2234',
            guests: 140,
            source: 'Referral – Velvet Lounge',
            location: 'Martinez & Co. HQ',
            notes: 'Prefers a signature mocktail flight for executives. Wants tasting recap slides by Tuesday.',
            actionItems: [
                'Share tasting recap with revised per-person pricing',
                'Confirm preference for zero-proof welcome cocktail',
                'Schedule deposit discussion once recap is delivered',
            ],
        },
        {
            id: 'lead-2',
            name: 'Danielle & Marcus',
            company: 'Private Client',
            eventName: 'Wedding Reception',
            eventType: 'Wedding',
            idealDate: '2026-05-17',
            estimatedValue: 4800,
            valueLevel: 'warning',
            status: 'Awaiting deposit',
            statusLevel: 'warning',
            nextTouchpoint: 'Send deposit reminder',
            email: 'hello@danielleplusmarcus.com',
            phone: '(555) 990-1177',
            guests: 185,
            source: 'Website inquiry',
            location: 'The Glass Garden',
            notes: 'Couple loved the espresso martini bar. Waiting on contract signature before holding staff.',
            actionItems: [
                'Email polite deposit reminder with payment link',
                'Hold conversation about late-night dessert pairing',
                'Confirm rental timeline with venue coordinator',
            ],
        },
        {
            id: 'lead-3',
            name: 'Houston Startup Hub',
            company: 'Houston Startup Hub',
            eventName: 'Launch Party',
            eventType: 'Launch party',
            idealDate: '2026-01-12',
            estimatedValue: 2100,
            valueLevel: 'success',
            status: 'Discovery call',
            statusLevel: 'neutral',
            nextTouchpoint: 'Confirm guest count',
            email: 'events@houstonstartups.com',
            phone: '(555) 212-7844',
            guests: 90,
            source: 'LinkedIn outreach',
            location: 'Innovation Lab Terrace',
            notes: 'Needs branded garnish station and optional mocktail for investors. Wants deck before end of week.',
            actionItems: [
                'Send sample deck featuring branded garnish station',
                'Clarify investor headcount split for bar planning',
                'Provide upgrade pricing for mocktail service',
            ],
        },
        {
            id: 'lead-4',
            name: 'Luxe Realty',
            company: 'Luxe Realty',
            eventName: 'Client Appreciation Night',
            eventType: 'Private event',
            idealDate: '2025-12-09',
            estimatedValue: 2900,
            valueLevel: 'success',
            status: 'Ready to book',
            statusLevel: 'success',
            nextTouchpoint: 'Send contract draft',
            email: 'events@luxerealty.com',
            phone: '(555) 822-4501',
            guests: 120,
            source: 'Venue partner referral',
            location: 'Skyline Clubhouse',
            notes: 'Approved signature cocktail list. Wants contract plus staffing overview for 3 stations.',
            actionItems: [
                'Email contract draft with staffing overview',
                'Outline add-on pricing for VIP welcome toast',
                'Confirm arrival window with venue concierge',
            ],
        },
    ];

    const leadMap = new Map(leads.map((lead) => [lead.id, lead]));

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    function formatCurrency(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            return '$0';
        }
        return currencyFormatter.format(value);
    }

    function formatDate(dateStr) {
        if (!dateStr) {
            return 'Date TBC';
        }

        const date = new Date(`${dateStr}T12:00:00`);
        if (Number.isNaN(date.getTime())) {
            return 'Date TBC';
        }

        return dateFormatter.format(date);
    }

    function createBadge(label, level) {
        const badge = document.createElement('span');
        badge.className = `badge ${level || 'neutral'}`;
        badge.textContent = label;
        return badge;
    }

    function createCell(label, content) {
        const cell = document.createElement('td');
        cell.dataset.label = label;
        if (content instanceof Node) {
            cell.appendChild(content);
        } else {
            cell.textContent = content;
        }
        return cell;
    }

    function getLeadDisplayName(lead) {
        const parts = [];
        if (lead.name) {
            parts.push(lead.name);
        }
        if (lead.eventName) {
            parts.push(lead.eventName);
        }
        return parts.join(' · ');
    }

    function renderLeadRow(lead) {
        const row = document.createElement('tr');
        row.className = 'lead-row';
        row.dataset.leadId = lead.id;
        row.tabIndex = 0;
        row.setAttribute('aria-label', `View details for ${getLeadDisplayName(lead)}`);

        const leadCell = createCell('Lead', getLeadDisplayName(lead));
        const typeCell = createCell('Event type', lead.eventType || '—');
        const dateCell = createCell('Ideal date', formatDate(lead.idealDate));
        const valueCell = createCell(
            'Estimated value',
            createBadge(formatCurrency(lead.estimatedValue), lead.valueLevel || 'success')
        );
        const statusCell = createCell('Status', createBadge(lead.status || 'Status TBC', lead.statusLevel));
        const touchpointCell = createCell('Next touchpoint', lead.nextTouchpoint || 'Set next action');

        row.append(leadCell, typeCell, dateCell, valueCell, statusCell, touchpointCell);
        return row;
    }

    function renderTable() {
        tableBody.innerHTML = '';
        leads.forEach((lead) => {
            tableBody.appendChild(renderLeadRow(lead));
        });
    }

    const modal = document.getElementById('leadModal');
    const modalTitle = document.getElementById('leadModalTitle');
    const modalSubtitle = document.getElementById('leadModalSubtitle');
    const modalContent = document.getElementById('leadModalContent');
    let activeLeadId = null;

    function closeModal() {
        if (!modal) {
            return;
        }

        modal.classList.remove('is-open');
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        activeLeadId = null;

        if (modalContent) {
            modalContent.innerHTML = '';
        }
    }

    function createSummaryRow(list, label, value) {
        if (!list) {
            return;
        }

        const dt = document.createElement('dt');
        dt.textContent = label;

        const dd = document.createElement('dd');
        if (value instanceof Node) {
            dd.appendChild(value);
        } else {
            dd.textContent = value || '—';
        }

        list.append(dt, dd);
    }

    function createActionList(items) {
        if (!Array.isArray(items) || !items.length) {
            return null;
        }

        const list = document.createElement('ul');
        list.className = 'lead-modal__actions';
        items.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
        return list;
    }

    function renderModalContent(lead) {
        if (!modalContent) {
            return;
        }

        const section = document.createElement('div');
        section.className = 'modal-section';

        const summary = document.createElement('dl');
        summary.className = 'modal-summary';

        createSummaryRow(summary, 'Event type', lead.eventType || '—');
        createSummaryRow(summary, 'Ideal date', formatDate(lead.idealDate));
        createSummaryRow(summary, 'Estimated value', formatCurrency(lead.estimatedValue));
        createSummaryRow(summary, 'Status', createBadge(lead.status || 'Status TBC', lead.statusLevel));
        createSummaryRow(summary, 'Source', lead.source || 'Unknown');
        createSummaryRow(summary, 'Next touchpoint', lead.nextTouchpoint || 'Set next action');
        createSummaryRow(summary, 'Guests', lead.guests ? `${lead.guests} expected` : 'TBC');

        if (lead.email) {
            const emailLink = document.createElement('a');
            emailLink.href = `mailto:${lead.email}`;
            emailLink.textContent = lead.email;
            emailLink.className = 'link-button';
            createSummaryRow(summary, 'Email', emailLink);
        }

        if (lead.phone) {
            const phoneLink = document.createElement('a');
            phoneLink.href = `tel:${lead.phone.replace(/[^0-9+]/g, '')}`;
            phoneLink.textContent = lead.phone;
            phoneLink.className = 'link-button';
            createSummaryRow(summary, 'Phone', phoneLink);
        }

        if (lead.location) {
            createSummaryRow(summary, 'Location', lead.location);
        }

        section.appendChild(summary);

        if (lead.notes) {
            const notesHeading = document.createElement('p');
            notesHeading.className = 'modal-subheading';
            notesHeading.textContent = 'Key notes';

            const notes = document.createElement('p');
            notes.className = 'modal-notes';
            notes.textContent = lead.notes;

            section.append(notesHeading, notes);
        }

        const actionList = createActionList(lead.actionItems);
        if (actionList) {
            const actionHeading = document.createElement('p');
            actionHeading.className = 'modal-subheading';
            actionHeading.textContent = 'Next steps';
            section.append(actionHeading, actionList);
        }

        modalContent.innerHTML = '';
        modalContent.appendChild(section);
    }

    function openModal(lead) {
        if (!modal) {
            return;
        }

        activeLeadId = lead.id;
        modal.hidden = false;
        modal.classList.add('is-open');
        document.body.classList.add('modal-open');

        if (modalTitle) {
            const titleParts = [lead.name];
            if (lead.company && lead.company !== lead.name) {
                titleParts.push(lead.company);
            }
            modalTitle.textContent = titleParts.filter(Boolean).join(' · ');
        }

        if (modalSubtitle) {
            const subtitleParts = [];
            if (lead.eventName) {
                subtitleParts.push(lead.eventName);
            }
            if (lead.idealDate) {
                subtitleParts.push(formatDate(lead.idealDate));
            }
            modalSubtitle.textContent = subtitleParts.join(' • ');
        }

        renderModalContent(lead);
    }

    function handleRowActivation(leadId) {
        const lead = leadMap.get(leadId);
        if (!lead) {
            return;
        }

        openModal(lead);
    }

    tableBody.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const row = target.closest('tr[data-lead-id]');
        if (!row) {
            return;
        }

        const { leadId } = row.dataset;
        if (leadId) {
            handleRowActivation(leadId);
        }
    });

    tableBody.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const row = target.closest('tr[data-lead-id]');
        if (!row) {
            return;
        }

        event.preventDefault();
        const { leadId } = row.dataset;
        if (leadId) {
            handleRowActivation(leadId);
        }
    });

    if (modal) {
        modal.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            if (target.matches('[data-lead-modal-dismiss]')) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal && !modal.hidden && activeLeadId) {
            closeModal();
        }
    });

    renderTable();
})();

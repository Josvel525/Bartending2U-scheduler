(function () {
    const STORAGE_KEY = 'b2u.leads.v1';
    const DEFAULT_LEADS = [
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

    const STATUS_META = {
        'Proposal sent': { level: 'info', color: '#3b82f6' },
        'Awaiting deposit': { level: 'warning', color: '#f59e0b' },
        'Discovery call': { level: 'neutral', color: '#6b7280' },
        'Ready to book': { level: 'success', color: '#10b981' },
    };

    const REQUIRED_COLUMNS = [
        'leadName',
        'eventType',
        'idealDate',
        'estimatedValue',
        'status',
        'nextTouchpoint',
    ];

    const leadStyles = `
        .lead-row.is-updated {
            animation: leadRowPulse 1.1s ease;
        }
        @keyframes leadRowPulse {
            0% { background-color: rgba(59, 130, 246, 0.15); }
            100% { background-color: transparent; }
        }
        .lead-row.is-dragging {
            opacity: 0.55;
        }
        .lead-row-placeholder {
            outline: 2px dashed #2563eb;
        }
        .lead-inline-editor {
            width: 100%;
            font: inherit;
            padding: 0.4rem 0.6rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            background: #fff;
            color: inherit;
        }
        .lead-inline-editor:focus {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
        }
        .lead-dot-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            margin-top: 0.3rem;
        }
        .lead-dot {
            width: 0.6rem;
            height: 0.6rem;
            border-radius: 9999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.75);
        }
    `;

    function ensureStylesInjected() {
        if (document.getElementById('lead-enhancements-style')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'lead-enhancements-style';
        style.textContent = leadStyles;
        document.head.appendChild(style);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    function normaliseLead(input) {
        const base = {
            id: input.id || generateId(),
            name: input.name || input.leadName || 'Untitled lead',
            company: input.company || '',
            eventName: input.eventName || '',
            eventType: input.eventType || '',
            idealDate: input.idealDate || '',
            estimatedValue: toNumber(input.estimatedValue),
            valueLevel: input.valueLevel || 'success',
            status: input.status || 'Discovery call',
            statusLevel: STATUS_META[input.status]?.level || input.statusLevel || 'neutral',
            nextTouchpoint: input.nextTouchpoint || '',
            email: input.email || '',
            phone: input.phone || '',
            guests: toNumber(input.guests),
            source: input.source || '',
            location: input.location || '',
            notes: input.notes || '',
            actionItems: Array.isArray(input.actionItems) ? input.actionItems.slice() : [],
            createdAt: input.createdAt || Date.now(),
            updatedAt: input.updatedAt || Date.now(),
        };

        if (!base.eventName && base.eventType) {
            base.eventName = `${base.eventType} event`;
        }

        const meta = STATUS_META[base.status];
        if (meta) {
            base.statusLevel = meta.level;
        }

        return base;
    }

    function generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `lead-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
    }

    function readLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return null;
            }
            return parsed.map(normaliseLead);
        } catch (error) {
            console.warn('Unable to read leads from storage', error);
            return null;
        }
    }

    function writeLocal(leads) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        } catch (error) {
            console.warn('Unable to persist leads to storage', error);
        }
    }

    function createApiClient() {
        const base = typeof window !== 'undefined' && window.BASE_API_URL ? window.BASE_API_URL.replace(/\/$/, '') : '';
        async function request(path, options) {
            const response = await fetch(`${base}${path}`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                ...options,
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || response.statusText);
            }
            if (response.status === 204) {
                return null;
            }
            return response.json();
        }
        return {
            async list() {
                if (!base) return null;
                return request('/leads');
            },
            async create(payload) {
                if (!base) return null;
                return request('/leads', { method: 'POST', body: JSON.stringify(payload) });
            },
            async update(id, payload) {
                if (!base) return null;
                return request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            },
            async remove(id) {
                if (!base) return null;
                return request(`/leads/${id}`, { method: 'DELETE' });
            },
            async reorder(order) {
                if (!base) return null;
                return request('/leads/order', { method: 'PUT', body: JSON.stringify({ order }) });
            },
            async import(payload) {
                if (!base) return null;
                return request('/leads/import', { method: 'POST', body: JSON.stringify(payload) });
            },
        };
    }

    function createLeadStore() {
        const subscribers = new Set();
        const api = createApiClient();
        let leads = [];
        let initialised = false;
        let initialising = null;

        function notify() {
            const snapshot = leads.map((lead) => ({ ...lead }));
            subscribers.forEach((callback) => {
                try {
                    callback(snapshot);
                } catch (error) {
                    console.error(error);
                }
            });
            window.dispatchEvent(
                new CustomEvent('b2u:leads:updated', {
                    detail: { leads: snapshot },
                })
            );
        }

        async function loadFromApi() {
            try {
                const result = await api.list();
                if (!result) {
                    return null;
                }
                const items = Array.isArray(result.data) ? result.data : result;
                if (!Array.isArray(items)) {
                    return null;
                }
                return items.map(normaliseLead);
            } catch (error) {
                console.warn('Falling back to local lead data', error);
                return null;
            }
        }

        async function init() {
            if (initialised) {
                return leads;
            }
            if (initialising) {
                return initialising;
            }

            initialising = (async () => {
                ensureStylesInjected();
                let loaded = null;
                if (typeof window !== 'undefined' && window.BASE_API_URL) {
                    loaded = await loadFromApi();
                }
                if (!loaded) {
                    loaded = readLocal();
                }
                if (!loaded) {
                    loaded = DEFAULT_LEADS.map(normaliseLead);
                }
                leads = loaded;
                initialised = true;
                notify();
                return leads;
            })();

            return initialising;
        }

        function getLeads() {
            return leads.map((lead) => ({ ...lead }));
        }

        function findIndex(id) {
            return leads.findIndex((lead) => lead.id === id);
        }

        async function persist() {
            if (typeof window !== 'undefined' && window.BASE_API_URL) {
                try {
                    await api.reorder(leads.map((lead) => lead.id));
                } catch (error) {
                    console.warn('Unable to persist lead order to API', error);
                }
            } else {
                writeLocal(leads);
            }
        }

        async function saveLead(lead) {
            if (typeof window !== 'undefined' && window.BASE_API_URL) {
                try {
                    if (findIndex(lead.id) === -1) {
                        await api.create(lead);
                    } else {
                        await api.update(lead.id, lead);
                    }
                } catch (error) {
                    console.warn('Unable to persist lead to API', error);
                }
            } else {
                writeLocal(leads);
            }
        }

        return {
            init,
            getLeads,
            getStatusMeta(status) {
                return STATUS_META[status] || { level: 'neutral', color: '#6b7280' };
            },
            subscribe(callback) {
                subscribers.add(callback);
                if (initialised) {
                    callback(getLeads());
                }
                return () => subscribers.delete(callback);
            },
            async createLead(input) {
                await init();
                const lead = normaliseLead({ ...input, createdAt: Date.now(), updatedAt: Date.now() });
                leads.push(lead);
                await saveLead(lead);
                await persist();
                notify();
                return lead;
            },
            async updateLead(id, patch) {
                await init();
                const index = findIndex(id);
                if (index === -1) {
                    return null;
                }
                const nextLead = normaliseLead({ ...leads[index], ...patch, id, updatedAt: Date.now() });
                leads[index] = nextLead;
                await saveLead(nextLead);
                await persist();
                notify();
                return nextLead;
            },
            async deleteLead(id) {
                await init();
                const index = findIndex(id);
                if (index === -1) {
                    return;
                }
                leads.splice(index, 1);
                if (typeof window !== 'undefined' && window.BASE_API_URL) {
                    try {
                        await api.remove(id);
                    } catch (error) {
                        console.warn('Unable to delete lead in API', error);
                    }
                } else {
                    writeLocal(leads);
                }
                await persist();
                notify();
            },
            async reorder(orderIds) {
                await init();
                const idSet = new Set(orderIds);
                leads.sort((a, b) => {
                    const aIndex = orderIds.indexOf(a.id);
                    const bIndex = orderIds.indexOf(b.id);
                    return aIndex - bIndex;
                });
                const missing = leads.filter((lead) => !idSet.has(lead.id));
                if (missing.length) {
                    leads = leads.filter((lead) => idSet.has(lead.id));
                    leads.push(...missing);
                }
                await persist();
                notify();
            },
            async importLeads(newLeads) {
                await init();
                const existingKeys = new Set(
                    leads.map((lead) => `${(lead.name || '').toLowerCase()}|${lead.idealDate || ''}`)
                );
                const additions = [];
                newLeads.forEach((lead) => {
                    const key = `${(lead.name || '').toLowerCase()}|${lead.idealDate || ''}`;
                    if (!existingKeys.has(key)) {
                        const entry = normaliseLead(lead);
                        additions.push(entry);
                        existingKeys.add(key);
                    }
                });
                if (additions.length === 0) {
                    return { imported: 0 };
                }
                leads.push(...additions);
                if (typeof window !== 'undefined' && window.BASE_API_URL) {
                    try {
                        await api.import({ leads: additions });
                    } catch (error) {
                        console.warn('Unable to import leads via API', error);
                    }
                } else {
                    writeLocal(leads);
                }
                await persist();
                notify();
                return { imported: additions.length };
            },
            toCSV() {
                const headers = [
                    'leadName',
                    'eventType',
                    'idealDate',
                    'estimatedValue',
                    'status',
                    'nextTouchpoint',
                    'email',
                    'phone',
                    'company',
                    'eventName',
                    'source',
                    'location',
                    'notes',
                ];
                const rows = [headers.join(',')];
                getLeads().forEach((lead) => {
                    const values = headers.map((header) => {
                        const value = lead[header] || lead[header === 'leadName' ? 'name' : header] || '';
                        const safe = String(value ?? '');
                        if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
                            return `"${safe.replace(/"/g, '""')}"`;
                        }
                        return safe;
                    });
                    rows.push(values.join(','));
                });
                return rows.join('\n');
            },
            getStatusMetaMap() {
                return STATUS_META;
            },
        };
    }

    function parseCSV(text) {
        const rows = [];
        let current = '';
        let inQuotes = false;
        const cells = [];

        function pushCell() {
            const value = current.trim();
            cells.push(value.replace(/^"|"$/g, '').replace(/""/g, '"'));
            current = '';
        }

        function pushRow() {
            pushCell();
            rows.push(cells.slice());
            cells.length = 0;
        }

        for (let i = 0; i < text.length; i += 1) {
            const char = text[i];
            const next = text[i + 1];
            if (char === '"') {
                if (inQuotes && next === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                pushCell();
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') {
                    i += 1;
                }
                pushRow();
            } else {
                current += char;
            }
        }

        if (current.length > 0 || cells.length) {
            pushRow();
        }

        return rows;
    }

    function buildLeadFromRow(headers, row) {
        const lead = {};
        headers.forEach((header, index) => {
            const value = row[index] ?? '';
            switch (header) {
                case 'leadName':
                    lead.name = value;
                    break;
                case 'estimatedValue':
                case 'guests':
                    lead[header] = Number(value);
                    break;
                default:
                    lead[header] = value;
            }
        });
        return lead;
    }

    const leadStore = createLeadStore();
    window.B2ULeadStore = leadStore;
    leadStore.init();

    let lastTouchedLeadId = null;

    function formatCurrency(value) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        });
        return formatter.format(Number.isFinite(value) ? value : 0);
    }

    function formatDate(dateStr) {
        if (!dateStr) {
            return 'Date TBC';
        }
        const date = new Date(`${dateStr}T12:00:00`);
        if (Number.isNaN(date.getTime())) {
            return 'Date TBC';
        }
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    function createBadge(label, level) {
        const badge = document.createElement('span');
        badge.className = `badge ${level || 'neutral'}`;
        badge.textContent = label;
        badge.title = label;
        return badge;
    }

    function buildTooltipText(lead) {
        const parts = [];
        if (lead.name) parts.push(lead.name);
        if (lead.eventName) parts.push(`for ${lead.eventName}`);
        return parts.join(' ');
    }

    function createLeadRow(lead) {
        const row = document.createElement('tr');
        row.className = 'lead-row';
        row.dataset.leadId = lead.id;
        row.draggable = true;

        const leadCell = document.createElement('td');
        leadCell.dataset.label = 'Lead';
        leadCell.dataset.field = 'name';
        leadCell.dataset.type = 'text';
        leadCell.dataset.value = lead.name || '';
        const leadName = document.createElement('span');
        leadName.className = 'lead-inline-text';
        leadName.textContent = lead.name || 'Untitled lead';
        leadCell.appendChild(leadName);
        if (lead.eventName) {
            const subtitle = document.createElement('div');
            subtitle.className = 'table-subtitle';
            subtitle.textContent = lead.eventName;
            leadCell.appendChild(subtitle);
        }

        const typeCell = document.createElement('td');
        typeCell.dataset.label = 'Event type';
        typeCell.dataset.field = 'eventType';
        typeCell.dataset.type = 'text';
        typeCell.dataset.value = lead.eventType || '';
        typeCell.textContent = lead.eventType || '—';

        const dateCell = document.createElement('td');
        dateCell.dataset.label = 'Ideal date';
        dateCell.dataset.field = 'idealDate';
        dateCell.dataset.type = 'date';
        dateCell.dataset.value = lead.idealDate || '';
        dateCell.textContent = formatDate(lead.idealDate);

        const valueCell = document.createElement('td');
        valueCell.dataset.label = 'Estimated value';
        valueCell.dataset.field = 'estimatedValue';
        valueCell.dataset.type = 'number';
        valueCell.dataset.value = lead.estimatedValue != null ? String(lead.estimatedValue) : '';
        valueCell.appendChild(createBadge(formatCurrency(lead.estimatedValue), lead.valueLevel || 'success'));

        const statusCell = document.createElement('td');
        statusCell.dataset.label = 'Status';
        statusCell.dataset.field = 'status';
        statusCell.dataset.type = 'select';
        statusCell.dataset.value = lead.status || 'Discovery call';
        const statusMeta = leadStore.getStatusMeta(lead.status);
        const badge = createBadge(lead.status, statusMeta.level);
        badge.title = `${lead.status} · ${lead.nextTouchpoint || 'Next touchpoint pending'}`;
        statusCell.appendChild(badge);

        const touchpointCell = document.createElement('td');
        touchpointCell.dataset.label = 'Next touchpoint';
        touchpointCell.dataset.field = 'nextTouchpoint';
        touchpointCell.dataset.type = 'text';
        touchpointCell.dataset.value = lead.nextTouchpoint || '';
        const touchpointText = document.createElement('span');
        touchpointText.className = 'lead-inline-text';
        touchpointText.textContent = lead.nextTouchpoint || 'Set next action';
        touchpointCell.appendChild(touchpointText);

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'table-actions';
        const editButton = document.createElement('button');
        editButton.className = 'button ghost';
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            openModal(lead.id);
        });
        const deleteButton = document.createElement('button');
        deleteButton.className = 'button ghost';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => confirmDelete(lead.id));
        actionsWrapper.appendChild(editButton);
        actionsWrapper.appendChild(deleteButton);
        touchpointCell.appendChild(actionsWrapper);

        row.appendChild(leadCell);
        row.appendChild(typeCell);
        row.appendChild(dateCell);
        row.appendChild(valueCell);
        row.appendChild(statusCell);
        row.appendChild(touchpointCell);

        row.addEventListener('dblclick', (event) => {
            if (event.target.closest('button')) {
                return;
            }
            const target = event.target.closest('td');
            if (!target) {
                return;
            }
            beginInlineEdit(target, lead.id);
        });

        return row;
    }

    function beginInlineEdit(cell, leadId) {
        if (!cell || cell.querySelector('.lead-inline-editor')) {
            return;
        }

        const field = cell.dataset.field;
        const type = cell.dataset.type || 'text';
        if (!field) {
            return;
        }

        const valueNode = cell.querySelector('.lead-inline-text');
        const originalValue = valueNode ? valueNode.textContent.trim() : cell.textContent.trim();
        const editor =
            type === 'select'
                ? createStatusSelect(originalValue, { inline: true })
                : document.createElement('input');

        if (type !== 'select') {
            editor.type = type === 'date' ? 'date' : type === 'number' ? 'number' : 'text';
        }
        editor.className = 'lead-inline-editor';
        const rawValue = cell.dataset.value ?? originalValue;
        if (type === 'date') {
            editor.value = rawValue || '';
        } else if (type === 'number') {
            editor.value = rawValue || '';
        } else {
            editor.value = rawValue;
        }
        cell.innerHTML = '';
        cell.appendChild(editor);
        editor.focus();
        editor.select?.();

        function cancel() {
            renderPipeline(leadStore.getLeads());
        }

        editor.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cancel();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                commit(editor.value);
            }
        });

        editor.addEventListener('blur', () => {
            commit(editor.value);
        });

        function commit(value) {
            let nextValue = value;
            if (type === 'date') {
                nextValue = value;
            } else if (type === 'number') {
                nextValue = Number(value);
            }
            const payload = {};
            payload[field] = nextValue;
            leadStore.updateLead(leadId, payload).then((updated) => {
                lastTouchedLeadId = updated?.id || leadId;
            });
        }
    }

    function createStatusSelect(current, options = {}) {
        const select = document.createElement('select');
        if (options.inline) {
            select.className = 'lead-inline-editor';
        }
        if (options.name) {
            select.name = options.name;
        }
        Object.keys(leadStore.getStatusMetaMap()).forEach((status) => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            if (status === current) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        return select;
    }

    function toISODate(label) {
        const parsed = new Date(label);
        if (Number.isNaN(parsed.getTime())) {
            return '';
        }
        return parsed.toISOString().slice(0, 10);
    }

    const modal = document.getElementById('leadModal');
    const modalTitle = document.getElementById('leadModalTitle');
    const modalSubtitle = document.getElementById('leadModalSubtitle');
    const modalContent = document.getElementById('leadModalContent');

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.hidden = true;
        document.body.classList.remove('modal-open');
    }

    function openModal(leadId) {
        if (!modal) {
            return;
        }
        document.body.classList.add('modal-open');
        modal.hidden = false;
        modal.classList.add('is-open');
        renderModal(leadId);
    }

    function confirmDelete(leadId) {
        if (!window.confirm('Delete this lead? This cannot be undone.')) {
            return;
        }
        lastTouchedLeadId = null;
        leadStore.deleteLead(leadId);
    }

    function buildInputField({ label, name, type = 'text', value = '', required = false, min }) {
        const wrapper = document.createElement('label');
        wrapper.className = 'form-field';
        const span = document.createElement('span');
        span.textContent = label;
        wrapper.appendChild(span);
        const input = document.createElement('input');
        input.name = name;
        input.type = type;
        if (value !== undefined && value !== null) {
            input.value = value;
        }
        if (required) {
            input.required = true;
        }
        if (min !== undefined) {
            input.min = min;
        }
        wrapper.appendChild(input);
        return { wrapper, input };
    }

    function buildTextareaField({ label, name, value = '', rows = 4 }) {
        const wrapper = document.createElement('label');
        wrapper.className = 'form-field';
        const span = document.createElement('span');
        span.textContent = label;
        wrapper.appendChild(span);
        const textarea = document.createElement('textarea');
        textarea.name = name;
        textarea.rows = rows;
        textarea.value = value;
        wrapper.appendChild(textarea);
        return { wrapper, textarea };
    }

    function buildStatusField(current) {
        const wrapper = document.createElement('label');
        wrapper.className = 'form-field';
        const span = document.createElement('span');
        span.textContent = 'Status';
        wrapper.appendChild(span);
        const select = createStatusSelect(current, { name: 'status' });
        wrapper.appendChild(select);
        return { wrapper, select };
    }

    function renderModal(leadId) {
        if (!modalContent) {
            return;
        }
        modalContent.innerHTML = '';
        const isNew = !leadId;
        const lead = leadStore.getLeads().find((entry) => entry.id === leadId) || {};
        modalTitle.textContent = isNew ? 'Add lead' : lead.name || 'Edit lead';
        modalSubtitle.textContent = isNew ? 'Log a new opportunity in your pipeline.' : buildTooltipText(lead);

        const form = document.createElement('form');
        form.className = 'modal-form';

        const firstRow = document.createElement('div');
        firstRow.className = 'form-grid';
        const nameField = buildInputField({ label: 'Lead name', name: 'name', value: lead.name || '', required: true });
        const companyField = buildInputField({ label: 'Company', name: 'company', value: lead.company || '' });
        const eventNameField = buildInputField({ label: 'Event name', name: 'eventName', value: lead.eventName || '' });
        firstRow.append(nameField.wrapper, companyField.wrapper, eventNameField.wrapper);

        const secondRow = document.createElement('div');
        secondRow.className = 'form-grid';
        const eventTypeField = buildInputField({ label: 'Event type', name: 'eventType', value: lead.eventType || '' });
        const idealDateField = buildInputField({ label: 'Ideal date', name: 'idealDate', type: 'date', value: lead.idealDate || '' });
        const estimatedField = buildInputField({
            label: 'Estimated value',
            name: 'estimatedValue',
            type: 'number',
            value: lead.estimatedValue != null ? lead.estimatedValue : '',
            min: 0,
        });
        secondRow.append(eventTypeField.wrapper, idealDateField.wrapper, estimatedField.wrapper);

        const thirdRow = document.createElement('div');
        thirdRow.className = 'form-grid';
        const statusField = buildStatusField(lead.status || 'Discovery call');
        const touchpointField = buildInputField({
            label: 'Next touchpoint',
            name: 'nextTouchpoint',
            value: lead.nextTouchpoint || '',
        });
        const guestsField = buildInputField({
            label: 'Guests',
            name: 'guests',
            type: 'number',
            value: lead.guests != null ? lead.guests : '',
            min: 0,
        });
        thirdRow.append(statusField.wrapper, touchpointField.wrapper, guestsField.wrapper);

        const fourthRow = document.createElement('div');
        fourthRow.className = 'form-grid';
        const emailField = buildInputField({ label: 'Email', name: 'email', type: 'email', value: lead.email || '' });
        const phoneField = buildInputField({ label: 'Phone', name: 'phone', value: lead.phone || '' });
        const sourceField = buildInputField({ label: 'Source', name: 'source', value: lead.source || '' });
        fourthRow.append(emailField.wrapper, phoneField.wrapper, sourceField.wrapper);

        const locationField = buildInputField({ label: 'Location', name: 'location', value: lead.location || '' });
        const notesField = buildTextareaField({ label: 'Notes', name: 'notes', value: lead.notes || '' });

        form.append(firstRow, secondRow, thirdRow, fourthRow, locationField.wrapper, notesField.wrapper);

        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        if (!isNew) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'button ghost';
            deleteButton.textContent = 'Delete lead';
            deleteButton.addEventListener('click', () => {
                confirmDelete(leadId);
                closeModal();
            });
            actions.appendChild(deleteButton);
        }

        const rightActions = document.createElement('div');
        rightActions.className = 'modal-actions__right';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'button ghost';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', closeModal);
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'button primary';
        submitButton.textContent = isNew ? 'Add lead' : 'Save changes';
        rightActions.append(cancelButton, submitButton);
        actions.appendChild(rightActions);
        form.appendChild(actions);

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            if (leadId) {
                leadStore.updateLead(leadId, payload).then((updated) => {
                    lastTouchedLeadId = updated?.id || leadId;
                });
            } else {
                leadStore.createLead(payload).then((created) => {
                    lastTouchedLeadId = created?.id || null;
                });
            }
            closeModal();
        });

        modalContent.appendChild(form);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target.dataset.leadModalDismiss !== undefined) {
                closeModal();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.hidden) {
                closeModal();
            }
        });
    }

    function renderPipeline(leads) {
        const tableBody = document.getElementById('leadPipelineTableBody');
        if (!tableBody) {
            return;
        }
        tableBody.innerHTML = '';
        if (!leads.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'empty-state';
            cell.textContent = 'No leads yet. Import or add one to get started.';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        leads.forEach((lead) => {
            const row = createLeadRow(lead);
            if (lead.id === lastTouchedLeadId) {
                requestAnimationFrame(() => {
                    row.classList.add('is-updated');
                });
            }
            tableBody.appendChild(row);
        });
        lastTouchedLeadId = null;
    }

    function setupDragAndDrop() {
        const tableBody = document.getElementById('leadPipelineTableBody');
        if (!tableBody) {
            return;
        }
        let draggingId = null;
        let placeholder = null;

        function clearPlaceholder() {
            if (placeholder) {
                placeholder.remove();
                placeholder = null;
            }
        }

        function handleDrop(event) {
            event.preventDefault();
            if (!draggingId) {
                return;
            }
            const order = Array.from(tableBody.querySelectorAll('tr'))
                .filter((row) => row.dataset.leadId)
                .map((row) => row.dataset.leadId);
            leadStore.reorder(order);
            clearPlaceholder();
            draggingId = null;
        }

        tableBody.addEventListener('dragstart', (event) => {
            const row = event.target.closest('tr');
            if (!row) return;
            draggingId = row.dataset.leadId;
            row.classList.add('is-dragging');
            event.dataTransfer.effectAllowed = 'move';
        });

        tableBody.addEventListener('dragend', (event) => {
            const row = event.target.closest('tr');
            if (row) {
                row.classList.remove('is-dragging');
            }
            draggingId = null;
            clearPlaceholder();
        });

        tableBody.addEventListener('dragover', (event) => {
            event.preventDefault();
            const afterElement = getDragAfterElement(tableBody, event.clientY);
            if (!placeholder) {
                placeholder = document.createElement('tr');
                placeholder.className = 'lead-row-placeholder';
                const cell = document.createElement('td');
                cell.colSpan = 6;
                placeholder.appendChild(cell);
            }
            if (afterElement == null) {
                tableBody.appendChild(placeholder);
            } else {
                tableBody.insertBefore(placeholder, afterElement);
            }
        });

        tableBody.addEventListener('drop', handleDrop);
    }

    function getDragAfterElement(container, y) {
        const rows = [...container.querySelectorAll('tr:not(.is-dragging):not(.lead-row-placeholder)')];
        return rows.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset, element: child };
                }
                return closest;
            },
            { offset: Number.NEGATIVE_INFINITY, element: null }
        ).element;
    }

    function setupActions() {
        let addLeadTriggers = Array.from(document.querySelectorAll('#lead-pipeline [data-lead-modal-trigger]'));
        if (addLeadTriggers.length === 0) {
            const fallback = document.querySelector('#lead-pipeline .card-actions .card-action');
            if (fallback) {
                addLeadTriggers = [fallback];
            }
        }

        addLeadTriggers.forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                openModal();
            });
        });

        const actionsContainer = document.querySelector('#lead-pipeline .card-actions');
        if (actionsContainer && !actionsContainer.querySelector('[data-action="import-csv"]')) {
            const importButton = document.createElement('button');
            importButton.type = 'button';
            importButton.className = 'button ghost';
            importButton.textContent = 'Import CSV';
            importButton.dataset.action = 'import-csv';

            const exportButton = document.createElement('button');
            exportButton.type = 'button';
            exportButton.className = 'button ghost';
            exportButton.textContent = 'Export CSV';
            exportButton.dataset.action = 'export-csv';

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv';
            fileInput.hidden = true;

            importButton.addEventListener('click', () => {
                fileInput.click();
            });

            exportButton.addEventListener('click', () => {
                const csv = leadStore.toCSV();
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'leads.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });

            fileInput.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) {
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (loadEvent) => {
                    const text = loadEvent.target?.result;
                    if (typeof text !== 'string') {
                        return;
                    }
                    const rows = parseCSV(text).filter((row) => row.some((cell) => cell.trim() !== ''));
                    if (rows.length <= 1) {
                        alert('CSV appears empty.');
                        return;
                    }
                    const headers = rows[0];
                    const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
                    if (missing.length) {
                        alert(`Missing required columns: ${missing.join(', ')}`);
                        return;
                    }
                    const imported = rows.slice(1).map((row) => buildLeadFromRow(headers, row));
                    const result = await leadStore.importLeads(imported);
                    alert(`Imported ${result.imported} new lead${result.imported === 1 ? '' : 's'}.`);
                };
                reader.readAsText(file);
                event.target.value = '';
            });

            actionsContainer.appendChild(importButton);
            actionsContainer.appendChild(exportButton);
            actionsContainer.appendChild(fileInput);
        }

        window.addEventListener('b2u:lead:open', (event) => {
            const leadId = event.detail?.leadId;
            if (leadId) {
                openModal(leadId);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const tableBody = document.getElementById('leadPipelineTableBody');
        if (!tableBody) {
            return;
        }
        setupActions();
        setupDragAndDrop();
        leadStore.subscribe((leads) => {
            renderPipeline(leads);
        });
    });
})();

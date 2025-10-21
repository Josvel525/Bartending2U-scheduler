(function () {
    const navToggle = document.querySelector('[data-mobile-nav-toggle]');
    const nav = document.getElementById('primaryNav');

    if (navToggle && nav && nav.dataset.navInitialized !== 'true') {
        nav.dataset.navInitialized = 'true';
        const lockScroll = (shouldLock) => {
            document.body.classList.toggle('nav-open', shouldLock);
        };

        const closeNav = () => {
            nav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            lockScroll(false);
        };

        const openNav = () => {
            nav.classList.add('open');
            navToggle.setAttribute('aria-expanded', 'true');
            lockScroll(true);
        };

        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.contains('open');
            if (isOpen) {
                closeNav();
            } else {
                openNav();
            }
        });

        nav.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            if (target.matches('a')) {
                closeNav();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeNav();
            }
        });

        document.addEventListener('click', (event) => {
            if (!nav.classList.contains('open')) {
                return;
            }

            if (!(event.target instanceof Element)) {
                return;
            }

            if (nav.contains(event.target)) {
                return;
            }

            if (event.target === navToggle || navToggle.contains(event.target)) {
                return;
            }

            closeNav();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 960) {
                closeNav();
            }
        });
    }

    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    accordionTriggers.forEach((trigger) => {
        const targetId = trigger.getAttribute('data-accordion-target');
        if (!targetId) {
            return;
        }

        const content = document.getElementById(targetId);
        if (!content) {
            return;
        }

        const initialOpen = trigger.getAttribute('aria-expanded') === 'true' || content.dataset.open === 'true';
        if (initialOpen) {
            content.style.maxHeight = content.scrollHeight + 'px';
            trigger.setAttribute('aria-expanded', 'true');
        } else {
            content.style.maxHeight = '0px';
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', String(!isExpanded));

            if (!isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0px';
            }
        });
    });
})();

/* Seed employees ONCE if the store is empty (safe no-op otherwise) */
(function (w) {
    w.B2U = w.B2U || {};
    w.B2U.seedEmployeesIfEmpty = function () {
        const store = w.B2UStore;
        if (!store || typeof store.getSnapshot !== 'function') return;

        try {
            const snap = store.getSnapshot();
            const hasEmployees = Array.isArray(snap.employees) && snap.employees.length > 0;
            if (hasEmployees) return;

            // Minimal, sane defaults (add more if you like)
            const seed = [
                {
                    id: 'john-doe',
                    name: 'John Doe',
                    role: 'Bar Lead',
                    status: 'available',
                    statusLabel: 'Available',
                    email: 'john.doe@bartending2u.com',
                    phone: '(713) 555-0114'
                },
                {
                    id: 'priya-singh',
                    name: 'Priya Singh',
                    role: 'Mixology Lead',
                    status: 'available',
                    statusLabel: 'Available',
                    email: 'priya.singh@bartending2u.com',
                    phone: '(832) 555-0177'
                }
            ];

            snap.employees = seed;
            store.saveSnapshot(snap);
            console.info('[B2U] Seeded employees into local store.');
        } catch (e) {
            console.warn('[B2U] Could not seed employees:', e);
        }
    };
})(window);

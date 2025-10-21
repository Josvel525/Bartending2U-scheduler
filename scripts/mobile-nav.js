(function () {
    const navToggle = document.querySelector('[data-mobile-nav-toggle]') || document.getElementById('mobileNavToggle');
    const nav = document.getElementById('primaryNav');

    if (navToggle && nav && nav.dataset.navInitialized !== 'true') {
        nav.dataset.navInitialized = 'true';

        const lockScroll = (shouldLock) => {
            document.body.classList.toggle('nav-open', shouldLock);
        };

        const closeNav = () => {
            nav.classList.remove('open');
            try { navToggle.setAttribute('aria-expanded', 'false'); } catch (e) {}
            lockScroll(false);
        };

        const openNav = () => {
            nav.classList.add('open');
            try { navToggle.setAttribute('aria-expanded', 'true'); } catch (e) {}
            lockScroll(true);
        };

        navToggle.addEventListener('click', (e) => {
            const isOpen = nav.classList.contains('open');
            if (isOpen) {
                closeNav();
            } else {
                openNav();
            }
        });

        nav.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            // Close when a nav link is clicked
            if (target.closest && target.closest('a')) {
                closeNav();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeNav();
            }
        });

        document.addEventListener('click', (event) => {
            if (!nav.classList.contains('open')) return;
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (nav.contains(target)) return;
            if (target === navToggle || (navToggle.contains && navToggle.contains(target))) return;
            closeNav();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 960) {
                closeNav();
            }
        });
    }

    // Tabs: toggle .active on click
    const tabs = document.querySelectorAll('.tab');
    if (tabs.length) {
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((button) => button.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    // Accordions: data-accordion-target -> content element id
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    if (accordionTriggers.length) {
        accordionTriggers.forEach((trigger) => {
            const targetId = trigger.getAttribute('data-accordion-target');
            const content = targetId ? document.getElementById(targetId) : null;
            if (!content) return;

            // Initialize if marked open
            if (content.dataset.open === 'true') {
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
                    content.dataset.open = 'true';
                } else {
                    content.style.maxHeight = '0px';
                    content.dataset.open = 'false';
                }
            });
        });
    }
})();
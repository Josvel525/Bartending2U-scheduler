(function () {
    const navToggle = document.getElementById('mobileNavToggle');
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
            if (nav.classList.contains('open')) {
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

    const tabs = document.querySelectorAll('.tab');
    if (tabs.length) {
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((button) => button.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    if (accordionTriggers.length) {
        accordionTriggers.forEach((trigger) => {
            const targetId = trigger.getAttribute('data-accordion-target');
            const content = targetId ? document.getElementById(targetId) : null;
            if (!content) return;

            if (content.dataset.open === 'true') {
                content.style.maxHeight = content.scrollHeight + 'px';
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
    }

    const subsectionElements = Array.from(document.querySelectorAll('[data-subsection]'));
    if (subsectionElements.length > 1) {
        const pageContent = document.querySelector('.page-content');
        const allowEmptyState = pageContent && pageContent.dataset.subsectionAllowEmpty === 'true';
        const header = pageContent ? pageContent.querySelector('.page-header') : null;
        const sectionToButton = new Map();

        function showSection(sectionToShow) {
            subsectionElements.forEach((section) => {
                section.classList.add('is-hidden');
            });

            sectionToShow.classList.remove('is-hidden');

            sectionToButton.forEach((button, section) => {
                if (section === sectionToShow) {
                    button.classList.add('is-active');
                } else {
                    button.classList.remove('is-active');
                }
            });

            const parent = sectionToShow.parentElement;
            if (parent && parent.classList.contains('split-layout')) {
                Array.from(parent.children).forEach((child) => {
                    if (child.hasAttribute('data-subsection') && child !== sectionToShow) {
                        child.classList.add('is-hidden');
                    }
                });
            }

            sectionToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const navWrapper = document.createElement('div');
        navWrapper.className = 'subsection-nav';

        subsectionElements.forEach((section, index) => {
            if (!section.id) {
                section.id = `section-${index + 1}`;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'subsection-nav__button';
            button.textContent = section.dataset.subsection || `Section ${index + 1}`;
            button.setAttribute('aria-controls', section.id);

            if (!allowEmptyState && index === 0) {
                button.classList.add('is-active');
            }

            if (allowEmptyState || index !== 0) {
                section.classList.add('is-hidden');
            }

            button.addEventListener('click', () => {
                showSection(section);
            });

            navWrapper.appendChild(button);
            sectionToButton.set(section, button);
        });

        if (header && navWrapper.childElementCount) {
            header.insertAdjacentElement('afterend', navWrapper);
        } else if (pageContent) {
            pageContent.insertAdjacentElement('afterbegin', navWrapper);
        }

        document.querySelectorAll('[data-subsection-target]').forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                const targetId = trigger.getAttribute('data-subsection-target');
                if (!targetId) {
                    return;
                }

                const targetSection = document.getElementById(targetId);
                if (!targetSection || !sectionToButton.has(targetSection)) {
                    return;
                }

                event.preventDefault();
                showSection(targetSection);
            });
        });
    }
})();

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const navToggle = document.getElementById('mobileNavToggle');
        const nav = document.getElementById('primaryNav');

        if (navToggle && nav) {
            navToggle.addEventListener('click', () => {
                nav.classList.toggle('open');
            });
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Countdown Timer Logic
    // Target: June 9, 2026 at 20:00:00
    const targetDate = new Date('June 9, 2026 20:00:00').getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            // Live started
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minutesEl.innerText = "00";
            secondsEl.innerText = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Add leading zero
        daysEl.innerText = days < 10 ? '0' + days : days;
        hoursEl.innerText = hours < 10 ? '0' + hours : hours;
        minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
        secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    }

    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Mouse movement effect on background glow
    const glowTop = document.querySelector('.glow-effect.top-left');
    const glowBottom = document.querySelector('.glow-effect.bottom-right');

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        if (glowTop && glowBottom) {
            glowTop.style.transform = `translate(${x * 50}px, ${y * 50}px)`;
            glowBottom.style.transform = `translate(-${x * 50}px, -${y * 50}px)`;
        }
    });

    // Form logic for "Formação" field
    const formadoSelect = document.getElementById('formado');
    const formacaoContainer = document.getElementById('formacao-container');
    const formacaoInput = document.getElementById('formacao');

    if(formadoSelect && formacaoContainer) {
        formadoSelect.addEventListener('change', function() {
            if(this.value === 'sim') {
                formacaoContainer.style.display = 'block';
                formacaoInput.setAttribute('required', 'required');
            } else {
                formacaoContainer.style.display = 'none';
                formacaoInput.removeAttribute('required');
                formacaoInput.value = ''; // clear if not graduated
            }
        });
    }
});

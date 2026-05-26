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
    try {
        // Target: June 9, 2026 at 20:00:00 (Brasília time GMT-3)
        // Usando Date.UTC para ser 100% à prova de falhas (sem parse de string)
        const targetDate = new Date(Date.UTC(2026, 5, 9, 23, 0, 0)).getTime();

        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        function updateCountdown() {
            if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0 || isNaN(distance)) {
                // Live started or invalid date
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
    } catch (error) {
        console.error("Erro no cronômetro:", error);
    }

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

    // Email format validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Real-time phone input masking & character limiting (max 11 digits / 15 chars formatted)
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.setAttribute('maxlength', '15');
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            
            // Format phone number dynamically: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
            if (value.length > 6) {
                const isNineDigit = value.length > 10;
                const ddd = value.slice(0, 2);
                const part1 = value.slice(2, isNineDigit ? 7 : 6);
                const part2 = value.slice(isNineDigit ? 7 : 6);
                e.target.value = `(${ddd}) ${part1}-${part2}`;
            } else if (value.length > 2) {
                const ddd = value.slice(0, 2);
                const part1 = value.slice(2);
                e.target.value = `(${ddd}) ${part1}`;
            } else if (value.length > 0) {
                e.target.value = `(${value}`;
            } else {
                e.target.value = '';
            }
            
            // Remove invalid style if complete or empty
            if (value.length >= 10 || value.length === 0) {
                phoneInput.classList.remove('is-invalid');
            }
        });

        phoneInput.addEventListener('blur', function (e) {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length > 0 && value.length < 10) {
                phoneInput.classList.add('is-invalid');
            } else {
                phoneInput.classList.remove('is-invalid');
            }
        });
    }

    // Real-time email validation on blur & input
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            const value = emailInput.value.trim();
            if (value.length > 0 && !emailRegex.test(value)) {
                emailInput.classList.add('is-invalid');
            } else {
                emailInput.classList.remove('is-invalid');
            }
        });

        emailInput.addEventListener('input', function () {
            const value = emailInput.value.trim();
            if (value.length === 0 || emailRegex.test(value)) {
                emailInput.classList.remove('is-invalid');
            }
        });
    }

    // ============================================================
    // ACTIVE CAMPAIGN INTEGRATION
    // ============================================================
    const TALLY_REDIRECT = 'https://tally.so/r/81R28O';

    const UTM_KEYS = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'L01ACAODEVITALICIO_UTM_SOURCE', 'L01ACAODEVITALICIO_UTM_MEDIUM', 'L01ACAODEVITALICIO_UTM_CAMPAIGN', 'L01ACAODEVITALICIO_UTM_CONTENT', 'L01ACAODEVITALICIO_UTM_TERM'
    ];

    // Helper: get all UTM params from the current URL (trimmed and sanitized)
    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        const utms = {};
        UTM_KEYS.forEach(key => {
            if (params.get(key)) utms[key] = params.get(key).trim();
        });
        // Fuzzy search matching trimmed/spaced keys
        for (const [key, value] of params.entries()) {
            const cleanKey = key.trim();
            if (UTM_KEYS.includes(cleanKey)) {
                utms[cleanKey] = value.trim();
            }
        }
        return utms;
    }

    // Persist UTMs to sessionStorage so they survive redirects
    (function persistUTMs() {
        const params = new URLSearchParams(window.location.search);
        for (const [key, value] of params.entries()) {
            const cleanKey = key.trim();
            if (UTM_KEYS.includes(cleanKey) || cleanKey.startsWith('utm_') || cleanKey.includes('UTM_')) {
                sessionStorage.setItem(cleanKey, value.trim());
            }
        }
    })();

    // Helper: get UTMs from sessionStorage (fallback for persisted values)
    function getPersistedUTMs() {
        const utms = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (UTM_KEYS.includes(key) || key.startsWith('utm_') || key.includes('UTM_')) {
                utms[key] = sessionStorage.getItem(key).trim();
            }
        }
        return utms;
    }

    // Helper function to perform fetch with a timeout
    async function fetchWithTimeout(resource, options = {}) {
        const { timeout = 3000 } = options; // Default 3 seconds timeout
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }



    // Form Submission Logic
    const captureForm = document.getElementById('capture-form');
    if (captureForm) {
        captureForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const btn = captureForm.querySelector('button[type="submit"]');
            btn.textContent = 'Enviando...';
            btn.disabled = true;

            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const telefone = document.getElementById('telefone').value;
            const formadoSelectEl = document.getElementById('formado');
            const formado = formadoSelectEl ? formadoSelectEl.value : '';
            const formacaoEl = document.getElementById('formacao');
            const formacao = formacaoEl ? formacaoEl.value : '';

            // Validation
            let hasError = false;

            // Validate email format
            const emailVal = email.trim();
            if (!emailVal || !emailRegex.test(emailVal)) {
                if (emailInput) emailInput.classList.add('is-invalid');
                hasError = true;
            } else {
                if (emailInput) emailInput.classList.remove('is-invalid');
            }

            // Validate phone format (must be 10 or 11 digits)
            const phoneDigits = telefone.replace(/\D/g, '');
            if (!phoneDigits || phoneDigits.length < 10) {
                if (phoneInput) phoneInput.classList.add('is-invalid');
                hasError = true;
            } else {
                if (phoneInput) phoneInput.classList.remove('is-invalid');
            }

            if (hasError) {
                btn.textContent = 'INSCREVER-SE GRATUITAMENTE';
                btn.disabled = false;
                const firstInvalid = captureForm.querySelector('.is-invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // Merge URL UTMs with persisted session UTMs
            const utms = { ...getPersistedUTMs(), ...getUTMParams() };

            const utmSourceVal = utms['L01ACAODEVITALICIO_UTM_SOURCE'] || utms['utm_source'] || '';
            const utmMediumVal = utms['L01ACAODEVITALICIO_UTM_MEDIUM'] || utms['utm_medium'] || '';
            const utmCampaignVal = utms['L01ACAODEVITALICIO_UTM_CAMPAIGN'] || utms['utm_campaign'] || '';
            const utmContentVal = utms['L01ACAODEVITALICIO_UTM_CONTENT'] || utms['utm_content'] || '';
            const utmTermVal = utms['L01ACAODEVITALICIO_UTM_TERM'] || utms['utm_term'] || '';

            // Record start time to ensure tracking has time to fire before redirect
            const submitStartTime = Date.now();

            // 1. Meta Pixel Lead Tracking
            try {
                if (typeof fbq === 'function') {
                    fbq('track', 'Lead');
                }
            } catch (pixErr) {
                console.error('Meta Pixel Lead event error:', pixErr);
            }

            // 2. GTM lead event tracking
            try {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'lead',
                    'lead_email': email,
                    'lead_name': nome,
                    'lead_phone': telefone,
                    'formacao': formacao,
                    'L01ACAODEVITALICIO_UTM_SOURCE': utmSourceVal,
                    'L01ACAODEVITALICIO_UTM_MEDIUM': utmMediumVal,
                    'L01ACAODEVITALICIO_UTM_CAMPAIGN': utmCampaignVal,
                    'L01ACAODEVITALICIO_UTM_CONTENT': utmContentVal,
                    'L01ACAODEVITALICIO_UTM_TERM': utmTermVal
                });
            } catch (gtmErr) {
                console.error('GTM Lead event error:', gtmErr);
            }

            try {
                // 3. Send lead to Vercel API Route (which forwards to ActiveCampaign on the server side)
                const apiRes = await fetchWithTimeout('/api/activecampaign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, telefone, utms, formado, formacao }),
                    timeout: 4000
                });
                if (!apiRes.ok) {
                    console.error('Failed to sync via API route:', await apiRes.text());
                }
            } catch (err) {
                console.error('ActiveCampaign sync error:', err);
                // Fail silently: still redirect the user
            }

            // Build Tally redirection URL passing the UTM values
            // Build Tally redirection URL passing the UTM values (various cases to match Tally hidden fields)
            const queryParams = new URLSearchParams();
            
            // Uppercase Custom UTMs
            if (utmSourceVal) queryParams.set('L01ACAODEVITALICIO_UTM_SOURCE', utmSourceVal);
            if (utmMediumVal) queryParams.set('L01ACAODEVITALICIO_UTM_MEDIUM', utmMediumVal);
            if (utmCampaignVal) queryParams.set('L01ACAODEVITALICIO_UTM_CAMPAIGN', utmCampaignVal);
            if (utmContentVal) queryParams.set('L01ACAODEVITALICIO_UTM_CONTENT', utmContentVal);
            if (utmTermVal) queryParams.set('L01ACAODEVITALICIO_UTM_TERM', utmTermVal);

            // Lowercase Custom UTMs
            if (utmSourceVal) queryParams.set('l01acaodevitalicio_utm_source', utmSourceVal);
            if (utmMediumVal) queryParams.set('l01acaodevitalicio_utm_medium', utmMediumVal);
            if (utmCampaignVal) queryParams.set('l01acaodevitalicio_utm_campaign', utmCampaignVal);
            if (utmContentVal) queryParams.set('l01acaodevitalicio_utm_content', utmContentVal);
            if (utmTermVal) queryParams.set('l01acaodevitalicio_utm_term', utmTermVal);

            // Standard UTMs
            if (utmSourceVal) queryParams.set('utm_source', utmSourceVal);
            if (utmMediumVal) queryParams.set('utm_medium', utmMediumVal);
            if (utmCampaignVal) queryParams.set('utm_campaign', utmCampaignVal);
            if (utmContentVal) queryParams.set('utm_content', utmContentVal);
            if (utmTermVal) queryParams.set('utm_term', utmTermVal);

            // Prefilled Lead Fields (multiple variations to match Tally hidden fields/labels)
            queryParams.set('nome', nome);
            queryParams.set('Nome', nome);
            queryParams.set('name', nome);
            queryParams.set('Name', nome);

            queryParams.set('email', email);
            queryParams.set('Email', email);
            queryParams.set('e-mail', email);
            queryParams.set('E-mail', email);

            queryParams.set('telefone', telefone);
            queryParams.set('Telefone', telefone);
            queryParams.set('whatsapp', telefone);
            queryParams.set('Whatsapp', telefone);
            queryParams.set('WhatsApp', telefone);
            queryParams.set('phone', telefone);
            queryParams.set('Phone', telefone);

            if (formacao) {
                queryParams.set('formacao', formacao);
                queryParams.set('Formacao', formacao);
                queryParams.set('formação', formacao);
                queryParams.set('Formação', formacao);
            }

            const finalRedirectUrl = `${TALLY_REDIRECT}?${queryParams.toString()}`;

            // Calculate elapsed time and enforce a minimum delay of 1200ms to allow tracking events to fire completely
            const elapsed = Date.now() - submitStartTime;
            const remainingDelay = Math.max(0, 1200 - elapsed);

            setTimeout(() => {
                btn.textContent = 'Redirecionando...';
                window.location.href = finalRedirectUrl;
            }, remainingDelay);
        });
    }


    // Lightbox Logic
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    function openLightbox(src) {
        if (!lightboxModal || !lightboxImg) return;
        lightboxImg.src = src;
        lightboxModal.classList.add('show');
    }

    if (lightboxModal && lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightboxModal.classList.remove('show');
        });

        // Close on background click
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                lightboxModal.classList.remove('show');
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxModal.classList.contains('show')) {
                lightboxModal.classList.remove('show');
            }
        });
    }

    // Carousels Logic (Supports Multiple)
    const carousels = document.querySelectorAll('.carousel-container');
    
    carousels.forEach(container => {
        const track = container.querySelector('.carousel-track');
        const slides = track ? Array.from(track.children) : [];
        const nextButton = container.querySelector('.next-btn');
        const prevButton = container.querySelector('.prev-btn');

        let currentIndex = 0;

        function updateCarousel() {
            if (!track || slides.length === 0) return;
            
            slides.forEach((slide, index) => {
                slide.classList.remove('active-slide');
                if (index === currentIndex) {
                    slide.classList.add('active-slide');
                }
            });

            // Calculate offset to center the active slide
            const wrapper = container.querySelector('.carousel-track-wrapper');
            const wrapperCenter = wrapper.getBoundingClientRect().width / 2;
            
            const activeSlide = slides[currentIndex];
            // Calculate the center of the active slide relative to the track's left edge
            const activeSlideCenter = activeSlide.offsetLeft + activeSlide.offsetWidth / 2;
            
            const trackOffset = wrapperCenter - activeSlideCenter;
            track.style.transform = `translateX(${trackOffset}px)`;
        }

        if (track && nextButton && prevButton && slides.length > 0) {
            // Start in the middle
            currentIndex = Math.floor(slides.length / 2);
            
            // Wait a small delay to ensure DOM layout is complete for calculation
            setTimeout(updateCarousel, 100);

            nextButton.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateCarousel();
            });

            prevButton.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                updateCarousel();
            });

            slides.forEach((slide, index) => {
                slide.addEventListener('click', () => {
                    if (currentIndex === index) {
                        // If it's already the active slide, open the lightbox
                        const img = slide.querySelector('img');
                        if (img) openLightbox(img.src);
                    } else {
                        // If it's not active, make it active
                        currentIndex = index;
                        updateCarousel();
                    }
                });
            });
            
            window.addEventListener('resize', updateCarousel);
        }
    });

    // FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        btn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Open clicked if it wasn't active
            if(!isActive) {
                item.classList.add('active');
            }
        });
    });
});

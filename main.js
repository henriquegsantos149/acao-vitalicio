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

    // Real-time phone input masking & character limiting (max 11 digits)
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.setAttribute('maxlength', '11');
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            e.target.value = value;
            
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

    // Helper: get all UTM params from the current URL (trimmed, handles standard key=value and concatenated value formats)
    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        const utms = {};
        
        const targetKeys = {
            'L01ACAODEVITALICIO_UTM_SOURCE': '',
            'L01ACAODEVITALICIO_UTM_MEDIUM': '',
            'L01ACAODEVITALICIO_UTM_CAMPAIGN': '',
            'L01ACAODEVITALICIO_UTM_CONTENT': '',
            'L01ACAODEVITALICIO_UTM_TERM': '',
            'utm_source': '',
            'utm_medium': '',
            'utm_campaign': '',
            'utm_content': '',
            'utm_term': ''
        };

        // Parse search params
        for (const [key, value] of params.entries()) {
            const cleanKey = key.trim();
            const cleanVal = value.trim();

            if (cleanVal !== '') {
                // Case 1: Standard key=value
                for (const targetKey in targetKeys) {
                    if (cleanKey === targetKey || cleanKey.toLowerCase() === targetKey.toLowerCase()) {
                        utms[targetKey] = cleanVal;
                    }
                }
            } else {
                // Case 2: Concatenated key (e.g. L01ACAODEVITALICIO_UTM_SOURCEEmail)
                for (const targetKey in targetKeys) {
                    if (cleanKey.startsWith(targetKey)) {
                        const extractedVal = cleanKey.slice(targetKey.length).trim();
                        if (extractedVal) {
                            utms[targetKey] = extractedVal;
                        }
                    }
                }
            }
        }
        
        // Direct fallback for any standard formats
        UTM_KEYS.forEach(key => {
            if (!utms[key] && params.get(key)) {
                utms[key] = params.get(key).trim();
            }
        });
        
        return utms;
    }

    // Persist UTMs to sessionStorage so they survive redirects
    (function persistUTMs() {
        const utms = getUTMParams();
        for (const key in utms) {
            if (utms[key]) {
                sessionStorage.setItem(key, utms[key]);
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

            // Capture UTMs
            const utms = { ...getPersistedUTMs(), ...getUTMParams() };

            const utmSourceVal = utms['L01ACAODEVITALICIO_UTM_SOURCE'] || utms['utm_source'] || '';
            const utmMediumVal = utms['L01ACAODEVITALICIO_UTM_MEDIUM'] || utms['utm_medium'] || '';
            const utmCampaignVal = utms['L01ACAODEVITALICIO_UTM_CAMPAIGN'] || utms['utm_campaign'] || '';
            const utmContentVal = utms['L01ACAODEVITALICIO_UTM_CONTENT'] || utms['utm_content'] || '';
            const utmTermVal = utms['L01ACAODEVITALICIO_UTM_TERM'] || utms['utm_term'] || '';

            const submitStartTime = Date.now();

            // 1. Meta Pixel Lead Tracking
            try {
                if (typeof fbq === 'function') {
                    fbq('track', 'Lead');
                    if (formado === 'sim') {
                        fbq('trackCustom', 'lead_qualificado');
                    }
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

            // 3. Send lead data to local serverless API route securely
            try {
                const apiRes = await fetchWithTimeout('/api/activecampaign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, telefone, utms, formado, formacao }),
                    timeout: 5000
                });
                if (!apiRes.ok) {
                    console.error('Failed to sync via API route:', await apiRes.text());
                }
            } catch (err) {
                console.error('ActiveCampaign sync error:', err);
            }

            // Wait until remaining delay is complete (enforcing a minimum of 1200ms) then redirect to Tally
            const elapsed = Date.now() - submitStartTime;
            const remainingDelay = Math.max(0, 1200 - elapsed);

            setTimeout(() => {
                btn.textContent = 'Redirecionando...';
                window.location.href = TALLY_REDIRECT;
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

    // Ementa Modal Slider Logic
    const btnEmenta = document.getElementById('btn-ementa');
    const ementaModal = document.getElementById('ementa-modal');
    const ementaImg = document.getElementById('ementa-img');
    const ementaIndicator = document.getElementById('ementa-page-indicator');
    const ementaClose = document.querySelector('.ementa-close');
    const ementaPrevBtn = ementaModal ? ementaModal.querySelector('.prev-btn') : null;
    const ementaNextBtn = ementaModal ? ementaModal.querySelector('.next-btn') : null;

    let currentEmentaPage = 1;
    const totalEmentaPages = 37;

    function showEmentaPage(page) {
        if (!ementaImg || !ementaIndicator) return;
        
        if (page < 1) {
            page = totalEmentaPages;
        } else if (page > totalEmentaPages) {
            page = 1;
        }
        
        currentEmentaPage = page;
        ementaImg.src = `/Ementa/${currentEmentaPage}.png`;
        ementaIndicator.textContent = `${currentEmentaPage} / ${totalEmentaPages}`;
    }

    function openEmentaModal() {
        if (!ementaModal) return;
        showEmentaPage(1);
        ementaModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Disable page scrolling
    }

    function closeEmentaModal() {
        if (!ementaModal) return;
        ementaModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore page scrolling
    }

    if (btnEmenta) {
        btnEmenta.addEventListener('click', openEmentaModal);
    }

    if (ementaClose) {
        ementaClose.addEventListener('click', closeEmentaModal);
    }

    if (ementaModal) {
        ementaModal.addEventListener('click', (e) => {
            if (e.target === ementaModal) {
                closeEmentaModal();
            }
        });
    }

    if (ementaPrevBtn) {
        ementaPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEmentaPage(currentEmentaPage - 1);
        });
    }

    if (ementaNextBtn) {
        ementaNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEmentaPage(currentEmentaPage + 1);
        });
    }

    // Keyboard navigation for Ementa Modal
    document.addEventListener('keydown', (e) => {
        if (!ementaModal || !ementaModal.classList.contains('show')) return;

        if (e.key === 'ArrowLeft') {
            showEmentaPage(currentEmentaPage - 1);
        } else if (e.key === 'ArrowRight') {
            showEmentaPage(currentEmentaPage + 1);
        } else if (e.key === 'Escape') {
            closeEmentaModal();
        }
    });

    // Touch/Swipe navigation for mobile users
    let touchStartX = 0;
    let touchEndX = 0;

    if (ementaImg) {
        ementaImg.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        ementaImg.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const threshold = 50; // swipe detection sensitivity
        if (touchEndX < touchStartX - threshold) {
            // Swipe Left -> Next Page
            showEmentaPage(currentEmentaPage + 1);
        } else if (touchEndX > touchStartX + threshold) {
            // Swipe Right -> Previous Page
            showEmentaPage(currentEmentaPage - 1);
        }
    }
});

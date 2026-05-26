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

    // ============================================================
    // ACTIVE CAMPAIGN INTEGRATION
    // ============================================================
    const AC_API_URL = 'https://ambientalpro.api-us1.com'; // <-- URL base da conta ActiveCampaign
    const AC_API_KEY = '9617e0716b9a89bc87a2d382d9aeedc19df5bb57f5fd0af5278e9d788fe96c711fa0ebe6';
    const AC_TAG_NAME = '[L01][ACAODEVITALICIO]';
    const TALLY_REDIRECT = 'https://tally.so/r/81R28O';

    // Helper: get all UTM params from the current URL
    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        const utms = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
            if (params.get(key)) utms[key] = params.get(key);
        });
        return utms;
    }

    // Persist UTMs to sessionStorage so they survive redirects
    (function persistUTMs() {
        const params = new URLSearchParams(window.location.search);
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
            if (params.get(key)) sessionStorage.setItem(key, params.get(key));
        });
    })();

    // Helper: get UTMs from sessionStorage (fallback for persisted values)
    function getPersistedUTMs() {
        const utms = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
            const val = sessionStorage.getItem(key);
            if (val) utms[key] = val;
        });
        return utms;
    }

    // AC API: get tag ID by name, create if not exists
    async function getOrCreateTagId(tagName) {
        // Search for the tag
        const searchRes = await fetch(`${AC_API_URL}/api/3/tags?search=${encodeURIComponent(tagName)}`, {
            headers: { 'Api-Token': AC_API_KEY }
        });
        const searchData = await searchRes.json();
        if (searchData.tags && searchData.tags.length > 0) {
            return searchData.tags[0].id;
        }
        // Create if not found
        const createRes = await fetch(`${AC_API_URL}/api/3/tags`, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact', description: '' } })
        });
        const createData = await createRes.json();
        return createData.tag.id;
    }

    // AC API: create or update contact, returns contact ID
    async function upsertContact(nome, email, telefone, utms, formacao) {
        const fieldValues = [];

        // Map UTMs to AC custom fields (you can update IDs from AC account)
        const utmFieldMap = {
            utm_source:   'UTM Source',
            utm_medium:   'UTM Medium',
            utm_campaign: 'UTM Campaign',
            utm_content:  'UTM Content',
            utm_term:     'UTM Term',
        };

        // Build the contact payload
        const nameParts = nome.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const payload = {
            contact: {
                email: email,
                firstName: firstName,
                lastName: lastName,
                phone: telefone,
                fieldValues: fieldValues
            }
        };

        const res = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data.contact ? data.contact.id : null;
    }

    // AC API: apply tag to contact
    async function applyTagToContact(contactId, tagId) {
        await fetch(`${AC_API_URL}/api/3/contactTags`, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
        });
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
            const formacaoEl = document.getElementById('formacao');
            const formacao = formacaoEl ? formacaoEl.value : '';

            // Merge URL UTMs with persisted session UTMs
            const utms = { ...getPersistedUTMs(), ...getUTMParams() };

            try {
                // 1. Create or update the contact
                const contactId = await upsertContact(nome, email, telefone, utms, formacao);

                if (contactId) {
                    // 2. Get or create the tag
                    const tagId = await getOrCreateTagId(AC_TAG_NAME);
                    // 3. Apply tag to contact
                    await applyTagToContact(contactId, tagId);
                }
            } catch (err) {
                console.error('ActiveCampaign integration error:', err);
                // Fail silently: still redirect the user
            }

            // Always redirect to Tally after attempting AC sync
            btn.textContent = 'Redirecionando...';
            window.location.href = TALLY_REDIRECT;
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

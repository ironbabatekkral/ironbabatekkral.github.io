// ============================================
// IRON'S PORTFOLIO - SCRIPT
// ============================================

// 1. PRELOADER
const preloader = document.getElementById('preloader');
window.addEventListener('load', () => {
    preloader.classList.add('loaded');
});

// 2. PARTICLES CONFIG
document.addEventListener('DOMContentLoaded', () => {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 60, "density": { "enable": true, "value_area": 900 } },
            "color": { "value": "#bb0000" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.4, "random": true },
            "size": { "value": 2, "random": true },
            "line_linked": { "enable": true, "distance": 130, "color": "#bb0000", "opacity": 0.12, "width": 1 },
            "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": false }, "resize": true },
            "modes": {
                "grab": { "distance": 140, "line_linked": { "opacity": 0.4 } }
            }
        },
        "retina_detect": true
    });
});


// 3. INITIAL HIDE
document.getElementById('mainContent').style.display = 'none';
document.getElementById('audioControls').style.display = 'none';
document.getElementById('socialButtons').style.display = 'none';
document.getElementById('navbar').style.display = 'none';

// 4. MAIN INIT
document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const startButton = document.getElementById('startButton');
    const music = document.getElementById('backgroundMusic');
    const audioControls = document.getElementById('audioControls');
    const volumeSlider = document.getElementById('volumeSlider');
    const socialButtons = document.getElementById('socialButtons');
    const navbar = document.getElementById('navbar');

    const trackCover = document.getElementById('trackCover');
    const trackTitle = document.getElementById('trackTitle');
    const prevTrackBtn = document.getElementById('prevTrackBtn');
    const nextTrackBtn = document.getElementById('nextTrackBtn');

    // Progress Bar
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    
    // Profile Slider
    const mainProfilePic = document.getElementById('mainProfilePic');
    const prevPicBtn = document.getElementById('prevPicBtn');
    const nextPicBtn = document.getElementById('nextPicBtn');

    const profilePics = [
        "assets/images/iron.jpg",
        "assets/images/kali-prompt.jpg",
        "img/asd (2).jpeg",
        "img/asd (2).jpg",
        "img/asd (3).jpeg",
        "img/asd.jpeg",
        "img/asd.jpg",
        "img/c5.jpg",
        "img/dcpp (2).jpeg",
        "img/dcpp (3).jpeg",
        "img/ferrari.jpg",
        "img/godfather.jpg",
        "img/mrrobot.jpg",
        "img/sdd.jpeg"
    ];
    let currentPicIndex = 0;

    prevPicBtn.addEventListener('click', () => {
        currentPicIndex = (currentPicIndex - 1 + profilePics.length) % profilePics.length;
        mainProfilePic.src = profilePics[currentPicIndex];
    });

    nextPicBtn.addEventListener('click', () => {
        currentPicIndex = (currentPicIndex + 1) % profilePics.length;
        mainProfilePic.src = profilePics[currentPicIndex];
    });

    const playlist = [
        { src: "playlist/MR. Robot Main Theme  (What's Your Ask-16374     Mac Quayle )-EN.mp4" },
        { src: "playlist/Aslar Less - Nasıl Kurtulurum Senden.mp3" },
        { src: "playlist/BATMOBILE.mp3" },
        { src: "playlist/EGE! & Lil Zey - ketojenik .mp4" },
        { src: "playlist/EGE! – jordan logosu - live.mp4" },
        { src: "playlist/ERA7CAPONE-GODFATHER .mp4", cover: "img/godfather.jpg" },
        { src: "playlist/Hermès 2.0.mp3" },
        { src: "playlist/Jeff Redd - Topic – GAME OVER FREESTYLE.mp3" },
        { src: "playlist/LVBELC5.mp3" },
        { src: "playlist/Motive - Topic – YIN YANG.mp3" },
        { src: "playlist/NABER.mp3" },
        { src: "playlist/PHANTOM X PARA YAPMAKTA.mp3" },
        { src: "playlist/Yung Ouzo - %23işbirliği.mp3" },
        { src: "playlist/salıncak.mp3" },
        { src: "playlist/tara tokel - EGE! .mp4" },
        { src: "playlist/versin.mp3" },
        { src: "playlist/yanarortalik.mp4" },
        { src: "playlist/Çağatay Akman - Çek Kafalarıda Yarasın (Cover) (Uzun Versiyon Edit).mp3" }
    ];

    let currentTrackIndex = 0;

    function loadTrack(index) {
        if (!playlist[index]) return;
        const track = playlist[index];
        
        if (track.src) {
            music.src = track.src;

            const isVideo = track.src.toLowerCase().endsWith('.mp4');
            
            if (isVideo) {
                // Video ise görsel olarak video elementini aç
                trackCover.classList.add('hidden');
                music.classList.remove('hidden');
                
                trackTitle.textContent = "Yükleniyor...";
                
                if (track.cover) {
                    music.poster = track.cover;
                } else {
                    music.poster = "assets/images/iron.jpg";
                }
                
                trackTitle.textContent = track.title ? track.title : decodeURIComponent(track.src.split('/').pop().replace(/\.[^/.]+$/, ""));
            } else {
                // Ses ise eski kapak fotoğrafı sistemini kullan
                trackCover.classList.remove('hidden');
                music.classList.add('hidden');
                
                trackTitle.textContent = "Yükleniyor...";
                trackCover.src = "assets/images/iron.jpg";

                if (track.cover) {
                    trackCover.src = track.cover;
                    trackTitle.textContent = track.title ? track.title : decodeURIComponent(track.src.split('/').pop().replace(/\.[^/.]+$/, ""));
                } else {
                    // Metadata Oku (Kapak fotoğrafı ve Şarkı Adı)
                    if (window.jsmediatags) {
                        try {
                            window.jsmediatags.read(track.src, {
                                onSuccess: function(tag) {
                                    const tags = tag.tags;
                                    if (tags.title) {
                                        trackTitle.textContent = tags.title;
                                    } else {
                                        trackTitle.textContent = decodeURIComponent(track.src.split('/').pop().replace(/\.[^/.]+$/, ""));
                                    }

                                    if (tags.picture) {
                                        let base64String = "";
                                        for (let i = 0; i < tags.picture.data.length; i++) {
                                            base64String += String.fromCharCode(tags.picture.data[i]);
                                        }
                                        const base64 = "data:" + tags.picture.format + ";base64," + window.btoa(base64String);
                                        trackCover.src = base64;
                                    }
                                },
                                onError: function(error) {
                                    console.log("Etiketler okunamadı:", error);
                                    trackTitle.textContent = decodeURIComponent(track.src.split('/').pop().replace(/\.[^/.]+$/, ""));
                                }
                            });
                        } catch (e) {
                            console.error("jsmediatags hatası (muhtemelen local dosya CORS sorunu):", e);
                            trackTitle.textContent = decodeURIComponent(track.src.split('/').pop().replace(/\.[^/.]+$/, ""));
                        }
                    } else {
                        trackTitle.textContent = decodeURIComponent(track.src.split('/').pop().replace(/\.[^/.]+$/, ""));
                    }
                }
            }
        } else {
            music.src = '';
            trackTitle.textContent = "Şarkı Yok";
        }
    }

    // İlk şarkıyı yükle
    loadTrack(currentTrackIndex);
    music.volume = volumeSlider.value / 100;

    startButton.addEventListener('click', () => {
        music.play().catch(error => console.log("Müzik başlatılamadı:", error));
        updatePlayPauseBtn(true);
        startScreen.classList.add('hidden');
        startScreen.style.display = 'none';
        mainContent.classList.remove('hidden');
        mainContent.style.display = 'block';
        audioControls.classList.remove('hidden');
        audioControls.style.display = 'flex';
        socialButtons.classList.remove('hidden');
        socialButtons.style.display = 'flex';
        navbar.classList.remove('hidden');
        navbar.style.display = 'block';

        // Kısa gecikme ile scroll animasyonlarını tetikle
        setTimeout(() => {
            window.dispatchEvent(new Event('scroll'));
        }, 100);

        // Init all features
        initScrollAnimations();
        initTypingEffect();
        loadProjects();
        initNavbar();
        initMobileMenu();
        initDraggable(audioControls);
    });

    // Volume slider
    const volumeValueEl = document.getElementById('volumeValue');
    const audioIcon = document.querySelector('.audio-icon');

    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        music.volume = val / 100;
        volumeValueEl.textContent = val + '%';
        // Mute icon
        if (val == 0) audioIcon.textContent = '🔇';
        else if (val < 40) audioIcon.textContent = '🔈';
        else if (val < 70) audioIcon.textContent = '🔉';
        else audioIcon.textContent = '🔊';
    });

    // Play / Pause button
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', () => {
        if (music.paused) {
            music.play();
            updatePlayPauseBtn(true);
        } else {
            music.pause();
            updatePlayPauseBtn(false);
        }
    });

    function updatePlayPauseBtn(playing) {
        playPauseBtn.textContent = playing ? '⏸' : '▶';
    }

    music.addEventListener('play', () => updatePlayPauseBtn(true));
    music.addEventListener('pause', () => updatePlayPauseBtn(false));

    // Previous / Next buttons
    prevTrackBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
        if (playlist[currentTrackIndex].src) {
            music.play().catch(e => console.log("Müzik başlatılamadı:", e));
            updatePlayPauseBtn(true);
        } else {
            updatePlayPauseBtn(false);
        }
    });

    nextTrackBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        if (playlist[currentTrackIndex].src) {
            music.play().catch(e => console.log("Müzik başlatılamadı:", e));
            updatePlayPauseBtn(true);
        } else {
            updatePlayPauseBtn(false);
        }
    });

    // Otomatik sonraki şarkıya geç
    music.addEventListener('ended', () => {
        nextTrackBtn.click();
    });

    // Ses ilerletme / Progress bar
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    music.addEventListener('timeupdate', () => {
        if (!music.duration) return;
        const progressPercent = (music.currentTime / music.duration) * 100;
        progressBar.value = progressPercent;
        currentTimeEl.textContent = formatTime(music.currentTime);
    });

    music.addEventListener('loadedmetadata', () => {
        if (isFinite(music.duration)) {
            durationTimeEl.textContent = formatTime(music.duration);
        } else {
            durationTimeEl.textContent = "∞";
        }
        progressBar.value = 0;
        currentTimeEl.textContent = "0:00";
    });

    progressBar.addEventListener('input', (e) => {
        const seekTime = (e.target.value / 100) * music.duration;
        if (!isNaN(seekTime) && isFinite(seekTime)) {
            music.currentTime = seekTime;
        }
    });

    // Tilt effect
    const tiltCard = document.querySelector('.profile-container');
    if (tiltCard) {
        VanillaTilt.init(tiltCard, {
            max: 12,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
            perspective: 1000
        });
    }
});

// 5. SOCIAL MEDIA BUTTONS
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('instaBtn')?.addEventListener('click', () => {
        window.open('https://www.instagram.com/ironmid.d', '_blank');
    });

    document.getElementById('githubBtn')?.addEventListener('click', () => {
        window.open('https://github.com/ironbabatekkral', '_blank');
    });

    document.getElementById('discordBtn')?.addEventListener('click', () => {
        window.open('https://discord.com/users/ironbabatekkral', '_blank');
    });
});

// ============================================
// TYPING EFFECT
// ============================================
function initTypingEffect() {
    const texts = [
        'Cyber Security Enthusiast',
        'Full Stack Developer',
        'Vibe Coder 🎵',
        'AI-Powered Dev',
        'Penetration Tester',
        'ironbabatekkral was here'
    ];
    const typingEl = document.getElementById('typingText');
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
        const currentText = texts[textIndex];

        if (isDeleting) {
            typingEl.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            typingEl.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === currentText.length) {
            typingSpeed = 2000; // pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 400; // pause before next word
        }

        setTimeout(type, typingSpeed);
    }

    type();
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    // Küçük gecikme: DOM layout tamamlansın
    setTimeout(() => {
        const sections = document.querySelectorAll('.content-section');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Animate skill bars if in skills section
                    if (entry.target.classList.contains('skills-section')) {
                        animateSkillBars();
                    }
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => observer.observe(section));

        // Stats counter animation
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            const statsObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounters();
                        statsObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });

            statsObserver.observe(statsSection);
        }
    }, 200);
}

// ============================================
// SKILL BARS ANIMATION
// ============================================
function animateSkillBars() {
    const progressBars = document.querySelectorAll('.skill-progress');
    progressBars.forEach((bar, index) => {
        setTimeout(() => {
            bar.style.width = bar.dataset.width + '%';
        }, index * 150);
    });
}

// ============================================
// STATS COUNTER ANIMATION
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });
}

// ============================================
// NAVBAR
// ============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link tracking
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    toggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            mobileMenu.classList.remove('open');
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// GITHUB PROJECTS
// ============================================
async function loadProjects() {
    try {
        const response = await fetch('https://api.github.com/users/ironbabatekkral/repos?sort=updated&per_page=6');
        const repos = await response.json();
        const container = document.getElementById('projectsGrid');

        repos.slice(0, 6).forEach((repo, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.animationDelay = (index * 0.1) + 's';

            const langColors = {
                'JavaScript': '#f7df1e',
                'Python': '#3776ab',
                'HTML': '#e34c26',
                'CSS': '#264de4',
                'TypeScript': '#3178c6',
                'C++': '#00599c',
                'C': '#555555'
            };

            const langColor = langColors[repo.language] || '#bb0000';

            card.innerHTML = `
                <h3>${repo.name || 'Unnamed'}</h3>
                <p>${repo.description || 'No description available'}</p>
                ${repo.language ? `<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.8em;color:var(--text-muted);margin-top:6px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${langColor};display:inline-block;"></span>
                    ${repo.language}
                </span>` : ''}
                <a href="${repo.html_url}" target="_blank">View on GitHub →</a>
            `;

            container.appendChild(card);
        });
    } catch (err) {
        console.error('GitHub projeleri yüklenemedi:', err);
        const container = document.getElementById('projectsGrid');
        container.innerHTML = '<p style="color: var(--text-secondary);">Projeler yüklenemedi.</p>';
    }
}

// ============================================
// DRAGGABLE ELEMENT
// ============================================
function initDraggable(element) {
    const handle = element.querySelector('.drag-handle');
    if (!handle) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function onStart(clientX, clientY) {
        isDragging = true;
        // İlk konumu hesapla
        const rect = element.getBoundingClientRect();
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        // CSS transform/left/bottom'u kaldır, mutlak pozisyona geç
        element.style.transform = 'none';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        element.style.bottom = 'auto';
        element.classList.add('dragging');
    }

    function onMove(clientX, clientY) {
        if (!isDragging) return;

        let newX = clientX - offsetX;
        let newY = clientY - offsetY;

        // Sınır kontrolü
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        newX = Math.max(0, Math.min(window.innerWidth - w, newX));
        newY = Math.max(0, Math.min(window.innerHeight - h, newY));

        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
    }

    function onEnd() {
        isDragging = false;
        element.classList.remove('dragging');
    }

    // Mouse events
    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onStart(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            onMove(e.clientX, e.clientY);
        }
    });

    document.addEventListener('mouseup', onEnd);

    // Touch events
    handle.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        onStart(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const t = e.touches[0];
            onMove(t.clientX, t.clientY);
        }
    }, { passive: true });

    document.addEventListener('touchend', onEnd);
}
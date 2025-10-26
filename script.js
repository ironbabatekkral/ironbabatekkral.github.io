// --- YENİ EKLENEN ÖZELLİKLER ---

// 1. YÜKLEME EKRANI (PRELOADER)
const preloader = document.getElementById('preloader');
window.addEventListener('load', () => {
    preloader.classList.add('loaded');
});

// 2. PARÇACIK EFEKTİ AYARLARI
document.addEventListener('DOMContentLoaded', () => {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#bb0000" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": false },
            "size": { "value": 3, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.2, "width": 1 },
            "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false, "mode": "push" }, "resize": true },
            "modes": {
                "repulse": { "distance": 100, "duration": 0.4 },
                "push": { "particles_nb": 4 }
            }
        },
        "retina_detect": true
    });
});


// --- ESKİ KODLARIMIZ (ÇALIŞMAYA DEVAM EDİYOR) ---

// KABA KUVVET: Sayfa açılır açılmaz, CSS'e güvenmeden biz kendimiz gizleyelim.
document.getElementById('mainContent').style.display = 'none';
document.getElementById('audioControls').style.display = 'none';
document.getElementById('socialButtons').style.display = 'none';

document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const startButton = document.getElementById('startButton');
    const music = document.getElementById('backgroundMusic');
    const audioControls = document.getElementById('audioControls');
    const volumeSlider = document.getElementById('volumeSlider');
    const socialButtons = document.getElementById('socialButtons');

    music.src = 'MR. Robot Main Theme  (What\'s Your Ask-16374     Mac Quayle )-EN.mp4';
    music.volume = volumeSlider.value / 100;

    startButton.addEventListener('click', () => {
        music.play().catch(error => console.log("Müzik başlatılamadı:", error));
        startScreen.classList.add('hidden');
        startScreen.style.display = 'none';
        mainContent.style.display = 'block';
        audioControls.style.display = 'flex';
        socialButtons.style.display = 'flex';
        
        // Telegram tracking: Start butonu tıklandı
        if (window.telegramLogger) {
            telegramLogger.trackButtonClick('startButton', 'Hazır mısın - Butona Bas');
        }
        
        // Scroll animasyonlarını başlat
        initScrollAnimations();
        // GitHub projelerini yükle
        loadProjects();
        // Log animasyonunu başlat
        startLogAnimation();
    });

    volumeSlider.addEventListener('input', (e) => {
        music.volume = e.target.value / 100;
    });

    const tiltCard = document.querySelector('.profile-container');
    if (tiltCard) {
        VanillaTilt.init(tiltCard, {
            max: 20,
            speed: 400,
            glare: true,
            "max-glare": 0.4
        });
    }
});

// --- YENİ EKLENMİŞ ÖZELLİKLER ---

// SOSYAL MEDYA BUTONLARI
document.addEventListener('DOMContentLoaded', () => {
    // Instagram butonu
    document.getElementById('instaBtn')?.addEventListener('click', () => {
        // Telegram tracking
        if (window.telegramLogger) {
            telegramLogger.trackSocialClick('Instagram', 'https://www.instagram.com/ironmid.d');
        }
        window.open('https://www.instagram.com/ironmid.d', '_blank');
    });

    // GitHub butonu
    document.getElementById('githubBtn')?.addEventListener('click', () => {
        // Telegram tracking
        if (window.telegramLogger) {
            telegramLogger.trackSocialClick('GitHub', 'https://github.com/ironbabatekkral');
        }
        window.open('https://github.com/ironbabatekkral', '_blank');
    });

    // Discord butonu - Discord profil linki
    document.getElementById('discordBtn')?.addEventListener('click', () => {
        // Telegram tracking
        if (window.telegramLogger) {
            telegramLogger.trackSocialClick('Discord', 'https://discord.com/users/ironbabatekkral');
        }
        // Discord kullanıcı adı: ironbabatekkral
        window.open('https://discord.com/users/ironbabatekkral', '_blank');
    });
});

// SCROLL ANİMASYONLARI
function initScrollAnimations() {
    const sections = document.querySelectorAll('.content-section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(section => observer.observe(section));
}

// GITHUB PROJELERİNİ YÜKLEME
async function loadProjects() {
    try {
        const response = await fetch('https://api.github.com/users/ironbabatekkral/repos');
        const repos = await response.json();
        const container = document.getElementById('projects');
        
        // İlk 6 projeyi göster
        repos.slice(0, 6).forEach(repo => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            const h3 = document.createElement('h3');
            h3.textContent = repo.name || 'Unnamed';
            
            const p = document.createElement('p');
            p.textContent = repo.description || 'No description available';
            
            const a = document.createElement('a');
            a.href = repo.html_url;
            a.target = '_blank';
            a.textContent = '🔗 View on GitHub';
            
            // Telegram tracking: Proje kartı tıklama
            a.addEventListener('click', () => {
                if (window.telegramLogger) {
                    telegramLogger.trackProjectClick(repo.name, repo.html_url);
                }
            });
            
            card.appendChild(h3);
            card.appendChild(p);
            card.appendChild(a);
            container.appendChild(card);
        });
    } catch (err) {
        console.error('GitHub projeleri yüklenemedi:', err);
        const container = document.getElementById('projects');
        container.innerHTML = '<p style="color: #ccc;">Projeler yüklenemedi.</p>';
    }
}

// LOG ANİMASYONU
function startLogAnimation() {
    const logContent = document.getElementById('logContent');
    const logLines = logContent.querySelectorAll('.log-line');
    
    // Tüm logları gizle
    logLines.forEach(line => {
        line.style.opacity = '0';
        line.style.display = 'none';
    });
    
    // Logları sırayla göster
    logLines.forEach((line, index) => {
        setTimeout(() => {
            line.style.display = 'block';
            setTimeout(() => {
                line.style.opacity = '1';
            }, 50);
        }, index * 300); // Her log 300ms arayla
    });
    
    // Sürekli yeni log ekle (opsiyonel)
    setInterval(() => {
        addRandomLog();
    }, 5000); // Her 5 saniyede bir yeni log
}

function addRandomLog() {
    const logContent = document.getElementById('logContent');
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
    
    const logTypes = [
        { type: 'info', class: 'log-info', messages: [
            'Monitoring system status...',
            'Checking network connections...',
            'Analyzing incoming traffic...',
            'Performing security audit...'
        ]},
        { type: 'success', class: 'log-success', messages: [
            'All systems operational',
            'Security update applied successfully',
            'Backup completed successfully',
            'Connection secured with TLS 1.3'
        ]},
        { type: 'warning', class: 'log-warning', messages: [
            'High memory usage detected',
            'Unusual login pattern detected',
            'SSL certificate expires in 30 days',
            'Rate limit approaching threshold'
        ]}
    ];
    
    const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
    const randomMessage = randomType.messages[Math.floor(Math.random() * randomType.messages.length)];
    
    const newLog = document.createElement('div');
    newLog.className = 'log-line';
    newLog.innerHTML = `[<span class="log-time">${timestamp}</span>] <span class="${randomType.class}">${randomType.type.toUpperCase()}</span> ${randomMessage}`;
    
    logContent.appendChild(newLog);
    
    // Scroll to bottom
    const terminalLog = document.querySelector('.terminal-log');
    terminalLog.scrollTop = terminalLog.scrollHeight;
    
    // Max 20 log tut
    const allLogs = logContent.querySelectorAll('.log-line');
    if (allLogs.length > 20) {
        allLogs[0].remove();
    }
}

// SEÇİM VE SAĞ TIKLAMA KORUMASI (İSTEĞE BAĞLI)
// İsterseniz bu kısmı açabilirsiniz
/*
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey && (e.key === 'a' || e.key === 'A')) || 
        (e.ctrlKey && (e.key === 'c' || e.key === 'C'))) {
        e.preventDefault();
        return false;
    }
});

document.addEventListener('contextmenu', function(e) { 
    e.preventDefault(); 
});

document.addEventListener('selectstart', function(e) { 
    e.preventDefault(); 
});
*/
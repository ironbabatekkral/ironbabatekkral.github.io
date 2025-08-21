// --- YENİ EKLENEN ÖZELLİKLER ---

// 1. YÜKLEME EKRANI (PRELOADER)
const preloader = document.getElementById('preloader');
window.addEventListener('load', () => {
    preloader.classList.add('loaded');
});

// 2. ÖZEL MOUSE İMLECİ (DÜZELTİLMİŞ VERSİYON)
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    cursorOutline.style.left = `${posX}px`;
    cursorOutline.style.top = `${posY}px`;
});

// 3. PARÇACIK EFEKTİ AYARLARI
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

document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const startButton = document.getElementById('startButton');
    const music = document.getElementById('backgroundMusic');
    const audioControls = document.getElementById('audioControls');
    const volumeSlider = document.getElementById('volumeSlider');

    music.src = 'yanarortalik.mp4';
    music.volume = volumeSlider.value / 100;

    startButton.addEventListener('click', () => {
        music.play().catch(error => console.log("Müzik başlatılamadı:", error));
        startScreen.style.display = 'none';
        mainContent.style.display = 'block';
        audioControls.style.display = 'flex';
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
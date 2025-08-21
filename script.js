// YÜKLEME EKRANI
const preloader = document.getElementById('preloader');
window.addEventListener('load', () => {
    preloader.classList.add('loaded');
});

// ÖZEL MOUSE İMLECİ
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

// ANA MANTIK
document.addEventListener('DOMContentLoaded', () => {

    // PARÇACIK EFEKTİ
    particlesJS("particles-js", {
        "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#bb0000" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": false }, "size": { "value": 3, "random": true }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.2, "width": 1 }, "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false } },
        "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 } } }, "retina_detect": true
    });

    // GİZLEME MANTIĞI
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('audioControls').style.display = 'none';
    
    // ELEMENTLERİ SEÇME
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const startButton = document.getElementById('startButton');
    const music = document.getElementById('backgroundMusic');
    const audioControls = document.getElementById('audioControls');
    const volumeSlider = document.getElementById('volumeSlider');

    music.src = 'yanarortalik.mp4';
    music.volume = volumeSlider.value / 100;

    // BUTON İMLEÇ EFEKTİ
    startButton.addEventListener('mouseenter', () => {
        cursorOutline.classList.add('hover-effect');
    });
    startButton.addEventListener('mouseleave', () => {
        cursorOutline.classList.remove('hover-effect');
    });

    // BUTONA TIKLAMA OLAYI
    startButton.addEventListener('click', () => {
        music.play().catch(error => console.log("Müzik başlatılamadı:", error));
        startScreen.style.display = 'none';
        mainContent.style.display = 'block';
        audioControls.style.display = 'flex';
    });

    // SES AYARI
    volumeSlider.addEventListener('input', (e) => {
        music.volume = e.target.value / 100;
    });

    // 3D TILT EFEKTİ
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
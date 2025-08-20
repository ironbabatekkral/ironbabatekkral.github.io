document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const startButton = document.getElementById('startButton');
    const music = document.getElementById('backgroundMusic');
    const audioControls = document.getElementById('audioControls');
    const volumeSlider = document.getElementById('volumeSlider');

    // Müziğin dosya yolunu burada belirt
    music.src = 'yanarortalik.mp4';

    // Sayfa yüklenince ses ayarını yap
    music.volume = volumeSlider.value / 100;

    // Butona tıklama olayı
    startButton.addEventListener('click', () => {
        // Müziği başlat
        music.play().catch(error => {
            console.log("Müzik başlatılamadı:", error);
        });

        // Ekranları değiştir
        startScreen.style.display = 'none';
        mainContent.classList.remove('hidden');
        audioControls.classList.remove('hidden'); // Ses kontrolünü görünür yap
    });

    // Ses ayar çubuğu olayı
    volumeSlider.addEventListener('input', (e) => {
        music.volume = e.target.value / 100;
    });
});
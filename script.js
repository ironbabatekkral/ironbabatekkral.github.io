document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const startButton = document.getElementById('startButton');
    const music = document.getElementById('backgroundMusic');

    startButton.addEventListener('click', () => {
        // Müziği başlat
        music.play().catch(error => {
            console.log("Müzik başlatılamadı, kullanıcı etkileşimi gerekiyor olabilir:", error);
        });

        // Başlangıç ekranını gizle
        startScreen.style.display = 'none';

        // Ana içeriği göster
        mainContent.classList.remove('hidden');
    });
});
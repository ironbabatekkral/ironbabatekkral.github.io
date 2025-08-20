// --- KABA KUVVET KISMI ---
// Sayfa açılır açılmaz, CSS'e güvenmeden biz kendimiz gizleyelim.
document.getElementById('mainContent').style.display = 'none';
document.getElementById('audioControls').style.display = 'none';


// --- ESKİ KODLARIMIZ ---
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
        music.play().catch(error => {
            console.log("Müzik başlatılamadı:", error);
        });

        startScreen.style.display = 'none';
        
        // Gizlediğimiz elemanları şimdi görünür yapalım
        mainContent.style.display = 'block'; // veya 'flex' vs. ama block iş görür
        audioControls.style.display = 'flex';
    });

    volumeSlider.addEventListener('input', (e) => {
        music.volume = e.target.value / 100;
    });
});
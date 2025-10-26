// 📊 Telegram Logger - Advanced Frontend Tracking Script
// Bu script site olaylarını yakalayıp güvenli backend'e gönderir.
// Token'lar asla bu dosyada görünmez!
// GDPR/KVKK Uyumlu - Consent kontrolü dahil

class TelegramLogger {
    constructor(config = {}) {
        // Backend endpoint (Vercel serverless function)
        this.endpoint = config.endpoint || 'https://ironbabatekkral.vercel.app/api/telegram-log';
        
        // Rate limiting (5 dakika)
        this.rateLimitMs = config.rateLimitMs || 300000; // 5 dakika = 300000ms
        this.lastSentEvents = {};
        
        // Debug mode
        this.debug = config.debug || false;
        
        // Otomatik tracking aktif mi?
        this.autoTrack = config.autoTrack !== false;
        
        // Consent kontrolü
        this.consentGiven = localStorage.getItem('tracking_consent') === 'true';
        this.consentChecked = false;
        
        // Session bilgileri
        this.sessionId = this.generateSessionId();
        this.sessionStart = new Date().toISOString();
        this.scrollDepth = 0;
        this.maxScrollDepth = 0;
        
        // Cihaz bilgileri (ilerleyen fonksiyonlarda kullanılacak)
        this.deviceInfo = {};
        
        // Consent kontrolü yap
        this.initConsentControl();
    }

    // Consent kontrolü başlat
    initConsentControl() {
        const consentBanner = document.getElementById('consentBanner');
        const acceptBtn = document.getElementById('consentAccept');
        const rejectBtn = document.getElementById('consentReject');

        // Daha önce consent verilmişse banner'ı gizle
        if (this.consentGiven) {
            if (consentBanner) consentBanner.classList.add('hidden');
            this.consentChecked = true;
            
            // Auto tracking başlat
            if (this.autoTrack) {
                this.initAutoTracking();
            }
            return;
        }

        // Accept butonuna tıklanırsa
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.consentGiven = true;
                this.consentChecked = true;
                localStorage.setItem('tracking_consent', 'true');
                
                if (consentBanner) consentBanner.classList.add('hidden');
                
                // Tracking'i başlat
                if (this.autoTrack) {
                    this.initAutoTracking();
                }
                
                // İlk consent log'u gönder
                this.sendLog('consent_granted', {
                    consent_type: 'full',
                    consent_method: 'explicit_accept'
                });
            });
        }

        // Reject butonuna tıklanırsa
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                this.consentGiven = false;
                this.consentChecked = true;
                localStorage.setItem('tracking_consent', 'false');
                
                if (consentBanner) consentBanner.classList.add('hidden');
                
                // Minimal log (sadece ret bilgisi)
                this.sendLog('consent_rejected', {
                    consent_method: 'explicit_reject'
                });
            });
        }
    }

    // Benzersiz session ID oluştur
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Rate limiting kontrolü (IP bazlı simülasyon - backend'de gerçek IP kontrolü yapılacak)
    canSendEvent(eventType) {
        if (!this.consentGiven && eventType !== 'consent_rejected' && eventType !== 'consent_granted') {
            if (this.debug) {
                console.log('[TelegramLogger] Consent not given, event blocked:', eventType);
            }
            return false;
        }

        const now = Date.now();
        const lastSent = this.lastSentEvents[eventType];
        
        if (lastSent && (now - lastSent < this.rateLimitMs)) {
            if (this.debug) {
                console.log(`[TelegramLogger] Rate limit: ${eventType} event skipped`);
            }
            return false;
        }
        
        this.lastSentEvents[eventType] = now;
        return true;
    }

    // Cihaz bilgilerini topla (gelişmiş)
    async collectDeviceInfo() {
        const info = {
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            color_depth: `${screen.colorDepth}-bit`,
            pixel_ratio: window.devicePixelRatio || 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            languages: navigator.languages.join(', '),
            platform: navigator.platform,
            hardware_concurrency: navigator.hardwareConcurrency || 'Unknown',
            device_memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown',
            online: navigator.onLine ? 'Online' : 'Offline'
        };

        // Network bilgisi (varsa)
        if (navigator.connection) {
            info.connection_type = navigator.connection.effectiveType || 'Unknown';
            info.downlink = navigator.connection.downlink ? `${navigator.connection.downlink}Mbps` : 'Unknown';
        }

        // Batarya bilgisi (varsa - asenkron)
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                info.battery_level = `${Math.round(battery.level * 100)}%`;
                info.battery_charging = battery.charging ? 'Charging' : 'Not Charging';
            }
        } catch (e) {
            // Batarya API desteklenmiyorsa
        }

        // Kamera/Mikrofon erişimi kontrolü
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            info.has_camera = devices.some(d => d.kind === 'videoinput') ? 'Yes' : 'No';
            info.has_microphone = devices.some(d => d.kind === 'audioinput') ? 'Yes' : 'No';
            info.media_devices_count = devices.length;
        } catch (e) {
            // Media devices API desteklenmiyorsa
        }

        return info;
    }

    // Log gönderme fonksiyonu (gelişmiş)
    async sendLog(eventType, additionalData = {}) {
        // Consent kontrolü
        if (!this.canSendEvent(eventType)) {
            return { success: false, reason: 'consent_required_or_rate_limited' };
        }

        try {
            // Cihaz bilgilerini topla
            const deviceInfo = await this.collectDeviceInfo();

            const logData = {
                event_type: eventType,
                page_url: window.location.href,
                page_title: document.title,
                user_agent: navigator.userAgent,
                referrer: document.referrer || '',
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                scroll_depth: `${this.maxScrollDepth}%`,
                device_info: deviceInfo,
                additional_data: additionalData
            };

            if (this.debug) {
                console.log('[TelegramLogger] Sending log:', logData);
            }

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });

            const result = await response.json();

            if (this.debug) {
                console.log('[TelegramLogger] Response:', result);
            }

            return result;

        } catch (error) {
            if (this.debug) {
                console.error('[TelegramLogger] Error:', error);
            }
            return { success: false, error: error.message };
        }
    }

    // Otomatik tracking başlat (gelişmiş)
    initAutoTracking() {
        // Sayfa yükleme
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.trackPageView();
            });
        } else {
            this.trackPageView();
        }

        // Sayfa çıkış
        window.addEventListener('beforeunload', () => {
            this.trackPageExit();
        });

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { scroll_depth: `${this.maxScrollDepth}%` });
            } else {
                this.trackEvent('page_visible');
            }
        });

        // Scroll tracking
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            this.scrollDepth = Math.round((scrollTop / scrollHeight) * 100);
            
            if (this.scrollDepth > this.maxScrollDepth) {
                this.maxScrollDepth = this.scrollDepth;
            }

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.maxScrollDepth >= 25 && !this.scrollMilestones?.['25']) {
                    this.scrollMilestones = this.scrollMilestones || {};
                    this.scrollMilestones['25'] = true;
                    this.trackEvent('scroll_milestone', { milestone: '25%' });
                }
                if (this.maxScrollDepth >= 50 && !this.scrollMilestones?.['50']) {
                    this.scrollMilestones['50'] = true;
                    this.trackEvent('scroll_milestone', { milestone: '50%' });
                }
                if (this.maxScrollDepth >= 75 && !this.scrollMilestones?.['75']) {
                    this.scrollMilestones['75'] = true;
                    this.trackEvent('scroll_milestone', { milestone: '75%' });
                }
                if (this.maxScrollDepth >= 100 && !this.scrollMilestones?.['100']) {
                    this.scrollMilestones['100'] = true;
                    this.trackEvent('scroll_milestone', { milestone: '100% (Bottom)' });
                }
            }, 500);
        });

        // Copy/Paste tracking
        document.addEventListener('copy', (e) => {
            const copiedText = window.getSelection().toString();
            if (copiedText && copiedText.length > 0) {
                this.trackEvent('text_copied', {
                    text_length: copiedText.length,
                    text_preview: copiedText.substring(0, 50) + (copiedText.length > 50 ? '...' : '')
                });
            }
        });

        // Mouse leave tracking
        document.addEventListener('mouseleave', () => {
            this.trackEvent('mouse_left_page');
        });

        // Idle tracking (5 dakika hareketsizlik)
        let idleTimeout;
        const resetIdleTimer = () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(() => {
                this.trackEvent('user_idle', { idle_duration: '5 minutes' });
            }, 300000); // 5 dakika
        };
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, true);
        });
        resetIdleTimer();
    }

    // Sayfa görüntüleme
    async trackPageView() {
        const deviceInfo = await this.collectDeviceInfo();
        this.sendLog('page_view', {
            session_start: this.sessionStart,
            ...deviceInfo
        });
    }

    // Sayfa çıkış
    trackPageExit() {
        const sessionDuration = Date.now() - new Date(this.sessionStart).getTime();
        
        const logData = {
            event_type: 'page_exit',
            page_url: window.location.href,
            page_title: document.title,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            additional_data: {
                session_duration_ms: sessionDuration,
                session_duration_formatted: this.formatDuration(sessionDuration),
                max_scroll_depth: `${this.maxScrollDepth}%`
            }
        };

        if (navigator.sendBeacon) {
            navigator.sendBeacon(this.endpoint, JSON.stringify(logData));
        }
    }

    // Generic event tracking
    trackEvent(eventType, data = {}) {
        return this.sendLog(eventType, data);
    }

    // Buton tıklama tracking
    trackButtonClick(buttonId, buttonText) {
        return this.sendLog('button_click', {
            button_id: buttonId,
            button_text: buttonText
        });
    }

    // Form gönderme tracking
    trackFormSubmit(formName, formData = {}) {
        return this.sendLog('form_submit', {
            form_name: formName,
            ...formData
        });
    }

    // Proje tıklama tracking
    trackProjectClick(projectName, projectUrl) {
        return this.sendLog('project_click', {
            project_name: projectName,
            project_url: projectUrl
        });
    }

    // Sosyal medya tıklama tracking
    trackSocialClick(platform, profileUrl) {
        return this.sendLog('social_click', {
            platform: platform,
            profile_url: profileUrl
        });
    }

    // İndirme tracking
    trackDownload(fileName, fileUrl) {
        return this.sendLog('download', {
            file_name: fileName,
            file_url: fileUrl
        });
    }

    // Kamera izni iste ve track et
    async requestCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // İzin verildi
            this.trackEvent('camera_permission_granted', {
                permission_type: 'camera',
                permission_status: 'granted'
            });

            // Stream'i kapat (sadece izin kontrolü için)
            stream.getTracks().forEach(track => track.stop());
            
            return { success: true, granted: true };
        } catch (error) {
            // İzin reddedildi veya hata
            this.trackEvent('camera_permission_denied', {
                permission_type: 'camera',
                permission_status: 'denied',
                error: error.message
            });
            
            return { success: false, granted: false, error: error.message };
        }
    }

    // Mikrofon izni iste ve track et
    async requestMicrophoneAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // İzin verildi
            this.trackEvent('microphone_permission_granted', {
                permission_type: 'microphone',
                permission_status: 'granted'
            });

            // Stream'i kapat (sadece izin kontrolü için)
            stream.getTracks().forEach(track => track.stop());
            
            return { success: true, granted: true };
        } catch (error) {
            // İzin reddedildi veya hata
            this.trackEvent('microphone_permission_denied', {
                permission_type: 'microphone',
                permission_status: 'denied',
                error: error.message
            });
            
            return { success: false, granted: false, error: error.message };
        }
    }

    // Duration formatla (ms -> "5m 30s")
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// Global instance (consent kontrolü dahil)
const telegramLogger = new TelegramLogger({
    debug: false, // Production'da false olmalı
    autoTrack: true // Otomatik tracking (consent sonrası)
});

// Global scope'a ekle
window.telegramLogger = telegramLogger;

// Export (ES6 module kullanılıyorsa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramLogger;
}

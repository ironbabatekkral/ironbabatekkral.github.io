// 📊 Telegram Logger - Frontend Tracking Script
// Bu script site olaylarını yakalayıp güvenli backend'e gönderir.
// Token'lar asla bu dosyada görünmez!

class TelegramLogger {
    constructor(config = {}) {
        // Backend endpoint (Vercel serverless function)
        // Token'lar burada DEĞİL, Vercel environment variables'da!
        this.endpoint = config.endpoint || 'https://ironbabatekkral.vercel.app/api/telegram-log';
        
        // Rate limiting (aynı event 5 saniye içinde tekrar gönderilmez)
        this.rateLimitMs = config.rateLimitMs || 5000;
        this.lastSentEvents = {};
        
        // Debug mode
        this.debug = config.debug || false;
        
        // Otomatik tracking aktif mi?
        this.autoTrack = config.autoTrack !== false; // Default: true
        
        // Session bilgileri
        this.sessionId = this.generateSessionId();
        this.sessionStart = new Date().toISOString();
        
        if (this.autoTrack) {
            this.initAutoTracking();
        }
    }

    // Benzersiz session ID oluştur
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Rate limiting kontrolü
    canSendEvent(eventType) {
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

    // Log gönderme fonksiyonu
    async sendLog(eventType, additionalData = {}) {
        // Rate limiting kontrolü
        if (!this.canSendEvent(eventType)) {
            return { success: false, reason: 'rate_limited' };
        }

        try {
            const logData = {
                event_type: eventType,
                page_url: window.location.href,
                page_title: document.title,
                user_agent: navigator.userAgent,
                referrer: document.referrer || '',
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
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

    // Otomatik tracking başlat
    initAutoTracking() {
        // Sayfa yükleme (DOMContentLoaded)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.trackPageView();
            });
        } else {
            // Sayfa zaten yüklüyse hemen gönder
            this.trackPageView();
        }

        // Sayfa çıkış (beforeunload)
        window.addEventListener('beforeunload', () => {
            this.trackPageExit();
        });

        // Visibility change (tab değiştirme)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });
    }

    // Sayfa görüntüleme
    trackPageView() {
        this.sendLog('page_view', {
            session_start: this.sessionStart,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            screen: `${screen.width}x${screen.height}`
        });
    }

    // Sayfa çıkış
    trackPageExit() {
        const sessionDuration = Date.now() - new Date(this.sessionStart).getTime();
        
        // sendBeacon kullan (daha güvenilir)
        const logData = {
            event_type: 'page_exit',
            page_url: window.location.href,
            page_title: document.title,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            additional_data: {
                session_duration_ms: sessionDuration,
                session_duration_formatted: this.formatDuration(sessionDuration)
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

// Global instance (otomatik tracking ile)
const telegramLogger = new TelegramLogger({
    debug: false, // Production'da false olmalı
    autoTrack: true // Otomatik sayfa tracking
});

// Global scope'a ekle (diğer scriptlerden erişilebilir)
window.telegramLogger = telegramLogger;

// Export (ES6 module kullanılıyorsa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramLogger;
}


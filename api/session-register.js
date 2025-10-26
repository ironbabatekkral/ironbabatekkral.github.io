// 🔐 Session Registration API
// Cihazlar bağlandığında session'larını kaydeder

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Aktif session'lar (memory - production'da Redis/KV kullan)
const activeSessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 dakika

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { session_id, device_info, action } = req.body;

        if (!session_id) {
            return res.status(400).json({ success: false, error: 'session_id required' });
        }

        const now = Date.now();

        // Session kaydet/güncelle
        if (action === 'register' || action === 'heartbeat') {
            activeSessions.set(session_id, {
                session_id: session_id,
                device_info: device_info || {},
                last_seen: now,
                registered_at: activeSessions.get(session_id)?.registered_at || now
            });

            // Eski session'ları temizle
            cleanOldSessions();

            return res.status(200).json({
                success: true,
                message: 'Session registered',
                session_id: session_id,
                active_sessions: activeSessions.size
            });
        }

        // Session sil
        if (action === 'unregister') {
            activeSessions.delete(session_id);
            return res.status(200).json({
                success: true,
                message: 'Session removed'
            });
        }

        return res.status(400).json({ success: false, error: 'Invalid action' });

    } catch (error) {
        console.error('Error in session-register:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Eski session'ları temizle
function cleanOldSessions() {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions.entries()) {
        if (now - session.last_seen > SESSION_TIMEOUT) {
            activeSessions.delete(sessionId);
        }
    }
}

// Export active sessions (diğer API'ler için)
export { activeSessions };


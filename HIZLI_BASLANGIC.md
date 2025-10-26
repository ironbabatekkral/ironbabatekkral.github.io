# ⚡ HIZLI BAŞLANGIÇ - Telegram Log Sistemi

## 🎯 HEDEF: Token'ları Gizli Tut, Sistemi Çalıştır!

---

## 📝 ADIM 1: Lokal `.env` Dosyası Oluştur (1 dakika)

Proje kök dizininde **`.env`** dosyası oluştur:

**Windows (PowerShell)**:

```powershell
New-Item -Path ".env" -ItemType File
notepad .env
```

**Aşağıdaki içeriği yapıştır (kendi token'larınla değiştir) ve kaydet**:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
ALLOWED_ORIGIN=https://ironbabatekkral.github.io
```

**⚠️ ÖNEMLİ**: `your_bot_token_here` ve `your_chat_id_here` yerine **kendi token'larını yaz**!

✅ **Kontrol**: `.env` dosyası oluşturuldu mu?

---

## 🚀 ADIM 2: GitHub'a Commit ve Push (2 dakika)

```bash
git status
# .env dosyası LİSTEDE OLMAMALI (.gitignore'da)

git add .
git commit -m "feat: Güvenli Telegram log sistemi eklendi"
git push
```

✅ **Kontrol**: GitHub'da `.env` dosyası YOK mu?

- GitHub'da repo'ya git
- `.env` dosyasını arama
- Görünmüyorsa ✅ BAŞARILI!

---

## 🌐 ADIM 3: Vercel'e Deploy (5 dakika)

### 3.1. Vercel'e Git

[vercel.com](https://vercel.com) → GitHub ile giriş yap

### 3.2. Import Repository

1. "Add New..." > "Project"
2. **ironbabatekkral.github.io** seç
3. "Import" tıkla

### 3.3. Environment Variables Ekle

**⚠️ ÖNEMLİ: Deploy'dan ÖNCE ekle!**

"Environment Variables" bölümünde:

| Name                 | Value                               |
| -------------------- | ----------------------------------- |
| `TELEGRAM_BOT_TOKEN` | **[Senin bot token'ın]**            |
| `TELEGRAM_CHAT_ID`   | **[Senin chat ID'n]**               |
| `ALLOWED_ORIGIN`     | `https://ironbabatekkral.github.io` |

Her birini ekle ("Add" butonuna bas)

### 3.4. Deploy Et

"Deploy" butonuna tıkla → 1-2 dakika bekle

✅ **Deploy tamamlandı!** URL'i kopyala (örn: `https://ironbabatekkral.vercel.app`)

---

## 🔧 ADIM 4: Frontend Endpoint Güncelle (1 dakika)

`telegram-logger.js` dosyasını aç ve 10. satırı güncelle:

**ÖNCE** (relative path):

```javascript
this.endpoint = config.endpoint || "/api/telegram-log";
```

**SONRA** (Vercel URL):

```javascript
this.endpoint =
  config.endpoint || "https://ironbabatekkral.vercel.app/api/telegram-log";
```

Kaydet ve commit:

```bash
git add telegram-logger.js
git commit -m "fix: Vercel endpoint URL eklendi"
git push
```

---

## 🧪 ADIM 5: Test Et (2 dakika)

### Test 1: Backend Endpoint

Tarayıcı console'u aç ve şunu çalıştır:

```javascript
fetch("https://ironbabatekkral.vercel.app/api/telegram-log", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event_type: "test",
    page_url: "https://test.com",
    page_title: "Test Page",
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  }),
})
  .then((r) => r.json())
  .then((d) => console.log(d));
```

**Telegram'ı kontrol et** → "🌐 YENİ ZİYARET" mesajı gelmeli! 🎉

### Test 2: Frontend Logger

Siteyi aç (https://ironbabatekkral.github.io) ve console'da:

```javascript
telegramLogger.trackButtonClick("test", "Test Button");
```

**Telegram'da** "🖱️ BUTON TIKLAMA" mesajı gelmeli! 🎉

### Test 3: Otomatik Tracking

1. Siteyi ziyaret et
2. 2-3 saniye bekle
3. **Telegram'da** "🌐 YENİ ZİYARET" mesajı gelmeli! 🎉

---

## ✅ BAŞARILI KURULUM KONTROL LİSTESİ

- [x] `.env` dosyası oluşturuldu (lokal)
- [x] GitHub'a commit edildi (`.env` hariç)
- [x] Vercel'e import edildi
- [x] Environment variables eklendi (Vercel dashboard)
- [x] Deploy tamamlandı
- [x] Frontend endpoint güncellendi
- [x] Backend test edildi ✅
- [x] Frontend test edildi ✅
- [x] Telegram'da mesaj geldi ✅

---

## 🔒 GÜVENLİK KONTROL

### Token'lar Gizli mi?

**GitHub'da**:

```bash
# GitHub'da repo'ya git ve ara:
Ctrl+F → [Senin bot token'ın]
```

❌ **Bulunmamalı!**

**Sayfa Kaynağında**:

```bash
# Siteyi aç, sağ tık > Kaynağı Göster
Ctrl+F → [Senin bot token'ın]
```

❌ **Bulunmamalı!**

**Vercel'de**:

```bash
# Vercel Dashboard > Settings > Environment Variables
TELEGRAM_BOT_TOKEN → Görünüyor mu?
```

✅ **Görünmeli!**

---

## 📊 TELEGRAM MESAJ ÖRNEKLERİ

Artık şu mesajları alacaksın:

### Sayfa Ziyareti:

```
🌐 YENİ ZİYARET
━━━━━━━━━━━━━━━━
📅 Tarih: 26.10.2024 18:32:19
📄 Sayfa: Iron's Page
🔗 URL: https://ironbabatekkral.github.io/
🎯 Olay: PAGE VIEW
🌍 IP: 185.123.xxx.xxx
💻 Desktop (Chrome)
━━━━━━━━━━━━━━━━
```

### Buton Tıklama:

```
🖱️ BUTON TIKLAMA
━━━━━━━━━━━━━━━━
📅 Tarih: 26.10.2024 18:33:05
🎯 Olay: BUTTON CLICK
📊 Ek Bilgiler:
  • button_id: startButton
  • button_text: Hazır mısın - Butona Bas
━━━━━━━━━━━━━━━━
```

### Sosyal Medya:

```
📱 SOSYAL MEDYA
━━━━━━━━━━━━━━━━
🎯 Olay: SOCIAL CLICK
📊 Ek Bilgiler:
  • platform: GitHub
  • profile_url: https://github.com/ironbabatekkral
━━━━━━━━━━━━━━━━
```

---

## 🎉 TAMAMLANDI!

**Token'ların güvenli, sistem çalışıyor!** 🚀

### Artık şunlar oluyor:

- ✅ Her sayfa ziyareti Telegram'a bildiriliyor
- ✅ Her buton tıklama loglanıyor
- ✅ Sosyal medya tıklamaları izleniyor
- ✅ Proje görüntülemeleri takip ediliyor
- ✅ Token'lar tamamen gizli
- ✅ GitHub'da görünmüyor
- ✅ Sayfa kaynağında görünmüyor

---

## 🆘 Sorun mu Var?

### "Missing environment variables"

→ Vercel dashboard'da environment variables var mı kontrol et

### Telegram'a mesaj gelmiyor

→ Bot token ve chat ID doğru mu? Vercel'de env var'ları kontrol et

### CORS hatası

→ ALLOWED_ORIGIN doğru mu? `https://ironbabatekkral.github.io`

### Debug mode

`telegram-logger.js` içinde:

```javascript
const telegramLogger = new TelegramLogger({
  debug: true, // Console'da logları görmek için
});
```

---

## 📚 Detaylı Dokümantasyon

- **SECURITY_SETUP.md** - Güvenlik detayları
- **TELEGRAM_DEPLOYMENT_GUIDE.md** - Deployment rehberi
- **TELEGRAM_README.md** - Genel bilgiler

---

**Başarılar!** 🔥

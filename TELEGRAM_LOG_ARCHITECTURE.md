# 🔐 Telegram Log Sistemi - Güvenli Mimari Dokümantasyonu

## 📋 Genel Bakış

Web sitesine yapılan tüm ziyaretleri ve önemli olayları (sayfa görüntüleme, form gönderme, buton tıklama) güvenli bir şekilde Telegram'a loglayan sistem.

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐
│  İstemci (Web)  │
│   GitHub Pages  │
│  (Frontend JS)  │
└────────┬────────┘
         │
         │ HTTPS POST
         │ (log data)
         ▼
┌────────────────────────┐
│  Serverless Function   │
│  (Vercel/Netlify)      │
│  - Token Güvenliği     │
│  - Environment Vars    │
└────────┬───────────────┘
         │
         │ HTTPS POST
         │ (with BOT_TOKEN)
         ▼
┌────────────────────────┐
│   Telegram Bot API     │
│  api.telegram.org      │
└────────────────────────┘
```

## 🔒 Güvenlik Stratejisi

### ❌ YAPILMAMASI GEREKENLER

- ❌ Bot token'ı frontend JavaScript kodunda saklamak
- ❌ Chat ID'yi HTML'de hardcode etmek
- ❌ Token'ları GitHub repository'de paylaşmak
- ❌ Doğrudan frontend'den Telegram API'ye istek atmak

### ✅ GÜVENLİ YAKLAŞIM

1. **Token Saklamak**: Environment variables (Vercel/Netlify dashboard)
2. **İstek Akışı**: Frontend → Serverless Function → Telegram
3. **CORS Koruması**: Sadece kendi domain'den gelen istekleri kabul et
4. **Rate Limiting**: Spam koruması için istek sınırlaması

## 📦 Bileşenler

### 1. Frontend (Client-Side)

**Dosya**: `telegram-logger.js`

**Görevleri**:

- Sayfa yükleme, form gönderme, buton tıklama gibi olayları yakala
- Ziyaretçi bilgilerini topla (IP'yi backend alacak)
- Serverless endpoint'e POST isteği gönder

**Güvenlik**: Token içermeyen, sadece log verisi gönderen kod.

### 2. Serverless Function (Backend)

**Dosya**: `api/telegram-log.js` (Vercel) veya `functions/telegram-log.js` (Netlify)

**Görevleri**:

- Environment variables'dan `BOT_TOKEN` ve `CHAT_ID` al
- İstemciden gelen log verisini al
- Ziyaretçi IP adresini güvenli şekilde yakala
- Telegram Bot API'ye POST isteği gönder
- CORS başlıklarını ayarla

**Güvenlik**: Token'lar asla client'a iletilmez.

### 3. Environment Variables

**Platform**: Vercel/Netlify Dashboard

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
ALLOWED_ORIGIN=https://ironbabatekkral.github.io
```

## 📊 Log Veri Yapısı

### Frontend'den Gönderilen Veri

```json
{
  "event_type": "page_view",
  "page_url": "https://ironbabatekkral.github.io/",
  "page_title": "Iron's Page",
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "timestamp": "2024-10-26T15:32:19Z",
  "additional_data": {
    "button_id": "startButton",
    "form_name": "contact"
  }
}
```

### Telegram'a Gönderilen Mesaj

```
🌐 YENİ ZİYARET
━━━━━━━━━━━━━━━━
📅 Tarih: 26.10.2024 18:32:19
📄 Sayfa: Iron's Page
🔗 URL: https://ironbabatekkral.github.io/
🎯 Olay: Sayfa Görüntüleme
🌍 IP: 185.xxx.xxx.xxx
💻 Cihaz: Desktop (Chrome)
🔙 Kaynak: Google
━━━━━━━━━━━━━━━━
```

## 🚀 Deployment Platformları

### A. Vercel (Önerilen)

**Avantajlar**:

- ✅ Ücretsiz 100GB bant genişliği
- ✅ Otomatik HTTPS
- ✅ GitHub entegrasyonu
- ✅ Hızlı edge network

**Kurulum**:

1. GitHub repo'yu Vercel'e bağla
2. Environment variables ekle
3. Otomatik deploy

### B. Netlify

**Avantajlar**:

- ✅ Ücretsiz 100GB bant genişliği
- ✅ Form handling built-in
- ✅ GitHub entegrasyonu

**Kurulum**:

1. GitHub repo'yu Netlify'ye bağla
2. Environment variables ekle
3. Otomatik deploy

### C. AWS Lambda + API Gateway

**Avantajlar**:

- ✅ Yüksek ölçeklenebilirlik
- ✅ 1M ücretsiz istek/ay

**Not**: Daha karmaşık kurulum gerektirir.

## 🛡️ Gizlilik ve GDPR Uyumluluğu

### Toplanan Veriler

- ✅ IP Adresi (anonim hale getirilebilir)
- ✅ User Agent
- ✅ Sayfa URL'i
- ✅ Referrer
- ❌ Kişisel kimlik bilgileri (adı, e-posta vb. kullanıcı izni olmadan toplanmaz)

### Öneriler

1. **Privacy Policy**: Siteye gizlilik politikası ekle
2. **Cookie Banner**: "Bu site analitik amaçlı çerezler kullanır"
3. **IP Anonimizasyonu**: Son okteti sil (örn: 185.xxx.xxx.xxx)

## 🔧 Loglanabilecek Olaylar

### Otomatik Olaylar

- ✅ Sayfa yükleme (`page_view`)
- ✅ Sayfa çıkış (`page_exit`)
- ✅ Session başlangıç/bitiş

### Manuel Olaylar (Kod ile tetiklenebilir)

- ✅ Form gönderme (`form_submit`)
- ✅ Buton tıklama (`button_click`)
- ✅ Proje kartı tıklama (`project_click`)
- ✅ Sosyal medya buton tıklama (`social_click`)
- ✅ CV indirme (`download_cv`)
- ✅ İletişim formu (`contact_form`)

## 📈 Rate Limiting ve Spam Koruması

### Frontend Tarafı

```javascript
// Aynı olay 5 saniye içinde birden fazla gönderilmez
const lastSent = {};
const RATE_LIMIT = 5000; // 5 saniye

function canSendLog(eventType) {
  const now = Date.now();
  if (lastSent[eventType] && now - lastSent[eventType] < RATE_LIMIT) {
    return false;
  }
  lastSent[eventType] = now;
  return true;
}
```

### Backend Tarafı (Opsiyonel)

- IP bazlı rate limiting (örn: 10 istek/dakika)
- Vercel/Netlify'nin built-in rate limiting'i

## 🧪 Test Etme

### 1. Test Bot Oluştur

```bash
# BotFather ile yeni bot oluştur
/newbot
# Bot token'ı al
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Chat ID Bul

```bash
# Bota mesaj at, sonra:
curl https://api.telegram.org/bot<TOKEN>/getUpdates
```

### 3. Lokal Test (Vercel)

```bash
npm install -g vercel
vercel dev
```

## 🎯 Performans Optimizasyonu

1. **Async İstekler**: Log istekleri sayfa yüklemeyi engellemez
2. **Batch Logging**: Çok sayıda olay varsa toplu gönder
3. **Error Handling**: Log başarısız olursa sessizce devam et (kullanıcı deneyimini bozma)

## 📝 Örnek Kullanım Senaryoları

### Senaryo 1: Sayfa Ziyareti

```
Kullanıcı siteyi açar
→ Frontend: page_view olayı tetiklenir
→ Serverless Function: Log verisi Telegram'a gönderilir
→ Telegram: "🌐 YENİ ZİYARET" mesajı alırsın
```

### Senaryo 2: Proje Tıklama

```
Kullanıcı GitHub projesine tıklar
→ Frontend: project_click olayı tetiklenir
→ Serverless Function: Log verisi ile Telegram'a mesaj
→ Telegram: "📂 Proje Görüntülendi: My-Repo" mesajı
```

### Senaryo 3: İletişim Formu

```
Kullanıcı formu doldurur ve gönderir
→ Frontend: form_submit olayı
→ Serverless Function: Form verileri ile Telegram'a bildirim
→ Telegram: "📧 YENİ İLETİŞİM FORMU" detaylı mesaj
```

## ⚠️ Önemli Notlar

1. **Bot Token Güvenliği**: Token'ı asla Git'e commit etme
2. **GDPR Uyumluluğu**: AB ziyaretçileri için gizlilik bildirimi ekle
3. **Rate Limiting**: Telegram API limitlerine dikkat et (30 mesaj/saniye)
4. **Error Logging**: Backend'de hataları logla (console.error)

## 🔗 Faydalı Linkler

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [GDPR Compliance Guide](https://gdpr.eu/)

---

## 🎉 Sonuç

Bu mimari sayesinde:

- ✅ Token'lar tamamen güvenli
- ✅ Gerçek zamanlı log bildirimleri
- ✅ Ücretsiz ve ölçeklenebilir
- ✅ GitHub Pages ile uyumlu
- ✅ Kolay kurulum ve yönetim

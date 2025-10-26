# 🚀 Telegram Log Sistemi - Deployment Rehberi

Bu rehber, Telegram log sistemini adım adım kurmanız için hazırlanmıştır.

## 📋 İçindekiler

1. [Telegram Bot Oluşturma](#1-telegram-bot-oluşturma)
2. [Chat ID Bulma](#2-chat-id-bulma)
3. [Vercel'e Deploy](#3-vercele-deploy)
4. [Netlify'e Deploy (Alternatif)](#4-netlifye-deploy-alternatif)
5. [Test Etme](#5-test-etme)
6. [Sorun Giderme](#6-sorun-giderme)

---

## 1️⃣ Telegram Bot Oluşturma

### Adım 1.1: BotFather'ı Aç

1. Telegram'da **@BotFather** kullanıcısını ara ve aç
2. `/start` komutunu gönder

### Adım 1.2: Yeni Bot Oluştur

```
Gönder: /newbot

BotFather soracak: "What name would you like?"
Cevap ver: Iron Logger Bot (veya istediğin isim)

BotFather soracak: "What username would you like?"
Cevap ver: iron_logger_bot (benzersiz olmalı, "_bot" ile bitmeli)
```

### Adım 1.3: Token'ı Kaydet

BotFather sana şöyle bir mesaj gönderecek:

```
Done! Your bot token:
123456789:ABCdefGHIjklMNOpqrsTUVwxyz

Keep your token secure and store it safely!
```

⚠️ **ÖNEMLİ**: Bu token'ı güvenli bir yere kaydet! Asla paylaşma!

---

## 2️⃣ Chat ID Bulma

Bot'un mesaj göndereceği chat/kanal ID'sini bulmalısın.

### Seçenek A: Kişisel Chat (Kendine Gönder)

1. Telegram'da **@userinfobot** kullanıcısını ara
2. `/start` komutunu gönder
3. Bot sana ID'ni gönderecek (örn: `123456789`)

### Seçenek B: Özel Kanal/Grup

1. Bir kanal veya grup oluştur (örn: "Site Logs")
2. Bot'unu bu kanala/gruba ekle
3. Bot'a **admin yetkisi ver**
4. Kanala bir mesaj gönder
5. Tarayıcıda şu URL'yi aç:
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   (BOT_TOKEN yerine gerçek token'ı yaz)
6. JSON'da `"chat":{"id":-1001234567890}` şeklinde chat ID'yi göreceksin
7. Negatif değeri kaydet (örn: `-1001234567890`)

---

## 3️⃣ Vercel'e Deploy

### Adım 3.1: Vercel Hesabı Oluştur

1. [vercel.com](https://vercel.com) adresine git
2. "Sign Up" ile GitHub hesabınla giriş yap

### Adım 3.2: GitHub Repository'yi Bağla

1. Vercel dashboard'da "Add New..." > "Project" tıkla
2. GitHub repository'ni seç (ironbabatekkral.github.io)
3. "Import" butonuna tıkla

### Adım 3.3: Environment Variables Ekle

1. "Environment Variables" bölümünde şunları ekle:

   **TELEGRAM_BOT_TOKEN**

   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

   (BotFather'dan aldığın token)

   **TELEGRAM_CHAT_ID**

   ```
   -1001234567890
   ```

   (Adım 2'de bulduğun chat ID)

   **ALLOWED_ORIGIN**

   ```
   https://ironbabatekkral.github.io
   ```

   (Kendi GitHub Pages URL'n)

2. Her bir variable için "Add" butonuna tıkla

### Adım 3.4: Deploy Et

1. "Deploy" butonuna tıkla
2. 1-2 dakika bekle
3. Deploy tamamlandığında Vercel sana bir URL verecek (örn: `https://your-project.vercel.app`)

### Adım 3.5: Custom Domain (Opsiyonel)

Eğer GitHub Pages kullanmaya devam etmek istiyorsan:

1. Site dosyalarını GitHub Pages'da tut
2. Sadece `/api` endpoint'leri Vercel'de çalışsın

---

## 4️⃣ Netlify'e Deploy (Alternatif)

### Adım 4.1: Dosya Yapısını Düzenle

Netlify için `api/` klasörünü `functions/` olarak yeniden adlandır:

```bash
mv api/ functions/
```

### Adım 4.2: netlify.toml Oluştur

Proje kök dizinine `netlify.toml` dosyası ekle:

```toml
[build]
  functions = "functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Adım 4.3: Netlify'e Deploy

1. [netlify.com](https://netlify.com) adresine git
2. "Add new site" > "Import an existing project"
3. GitHub repository'ni seç
4. Environment Variables ekle (Vercel'dekiyle aynı)
5. Deploy et

---

## 5️⃣ Test Etme

### Test 1: Backend Endpoint Kontrolü

Tarayıcı console'da:

```javascript
fetch("https://your-project.vercel.app/api/telegram-log", {
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

Telegram'da mesaj gelmelidir!

### Test 2: Frontend Logger Kontrolü

`index.html` dosyanızı açıp console'da:

```javascript
// Manuel log gönder
telegramLogger.trackButtonClick("test-button", "Test Button");
```

Telegram'da "🖱️ BUTON TIKLAMA" mesajı gelmelidir!

### Test 3: Otomatik Tracking

1. Siteyi ziyaret et
2. 2-3 saniye bekle
3. Telegram'da "🌐 YENİ ZİYARET" mesajı gelmelidir

---

## 6️⃣ index.html'e Entegrasyon

Mevcut `index.html` dosyanıza şunları ekleyin:

### HTML (`<head>` içine):

```html
<!-- Telegram Logger -->
<script src="telegram-logger.js"></script>
```

### JavaScript (Özel olaylar için):

```javascript
// Örnek: Start butonuna tracking ekle
document.getElementById("startButton").addEventListener("click", () => {
  telegramLogger.trackButtonClick("startButton", "Hazır mısın - Start");
});

// Örnek: Sosyal medya butonlarına tracking ekle
document.getElementById("githubBtn").addEventListener("click", () => {
  telegramLogger.trackSocialClick(
    "GitHub",
    "https://github.com/ironbabatekkral"
  );
});

document.getElementById("instaBtn").addEventListener("click", () => {
  telegramLogger.trackSocialClick(
    "Instagram",
    "https://instagram.com/ironmid.d"
  );
});

document.getElementById("discordBtn").addEventListener("click", () => {
  telegramLogger.trackSocialClick(
    "Discord",
    "discord.com/users/ironbabatekkral"
  );
});

// Örnek: Proje kartlarına tracking ekle
document.querySelectorAll(".project-card a").forEach((link) => {
  link.addEventListener("click", (e) => {
    const projectName = link
      .closest(".project-card")
      .querySelector("h3").textContent;
    const projectUrl = link.href;
    telegramLogger.trackProjectClick(projectName, projectUrl);
  });
});
```

---

## 7️⃣ Sorun Giderme

### Hata: "Missing environment variables"

**Çözüm**: Vercel/Netlify dashboard'da environment variables'ı doğru eklediğinizden emin olun.

### Hata: "CORS error"

**Çözüm**: `ALLOWED_ORIGIN` değişkenini GitHub Pages URL'nize ayarlayın.

### Mesaj gelmiyor

**Kontrol listesi**:

- ✅ Bot token doğru mu?
- ✅ Chat ID doğru mu? (Negatif/Pozitif)
- ✅ Bot kanala/gruba ekli mi?
- ✅ Bot admin yetkisine sahip mi?
- ✅ Vercel/Netlify'de environment variables var mı?
- ✅ Deploy başarılı mı?
- ✅ Frontend endpoint URL'i doğru mu?

### Debug Mode Açma

`telegram-logger.js` içinde:

```javascript
const telegramLogger = new TelegramLogger({
  debug: true, // Console'da logları görmek için
  autoTrack: true,
});
```

---

## 8️⃣ Production Önerileri

### Güvenlik

- ✅ `.env` dosyasını `.gitignore`'a ekle
- ✅ Token'ları asla frontend kodunda tutma
- ✅ CORS'u sadece kendi domain'ine ayarla

### Performans

- ✅ Rate limiting aktif (5 saniye)
- ✅ Log mesajlarını batch olarak gönderebilirsin (çok trafik varsa)

### Gizlilik

- ✅ IP anonimizasyonu aktif (son 2 oktet gizli)
- ✅ Kişisel veri toplama konusunda gizlilik politikası ekle

---

## ✅ Kontrol Listesi

- [ ] Telegram botu oluşturuldu
- [ ] Bot token alındı ve güvenli yere kaydedildi
- [ ] Chat ID bulundu
- [ ] GitHub repository oluşturuldu/güncellendi
- [ ] Vercel/Netlify hesabı açıldı
- [ ] Repository import edildi
- [ ] Environment variables eklendi
- [ ] İlk deploy yapıldı
- [ ] Backend endpoint test edildi
- [ ] Frontend logger test edildi
- [ ] index.html'e entegre edildi
- [ ] Production'da test edildi

---

## 🎉 Tebrikler!

Telegram log sisteminiz çalışıyor! Artık tüm site ziyaretlerini Telegram'dan takip edebilirsiniz.

### Faydalı Komutlar

```bash
# Lokal development (Vercel)
npm install -g vercel
vercel dev

# Production deploy
vercel --prod

# Logs görüntüle
vercel logs
```

---

## 📚 Ek Kaynaklar

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

---

**Sorularınız için**: [GitHub Issues](https://github.com/ironbabatekkral/ironbabatekkral.github.io/issues)

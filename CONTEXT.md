# 101 Yaz-Boz — Proje bağlamı

2026-09-24 yerel incelemesi. Kök: C:\Projelerim\101-Yaz-Boz.

101 oyunları için skor/el/ceza kaydı, oyun geçmişi, turnuva ve istatistik ekranları içeren mobil uygulama. Paket bildirimi Expo ~54, React 19.1, React Native 0.81.5 ve TypeScript kullanır.

- App.tsx ekran state'i ve akışları birleştirir; src/engine saf puanlama katmanıdır.
- src/app, src/domain ve src/persistence içinde kalıcılık ve domain kodu vardır; SQLite kullanılır.
- docs/101-Yaz-Boz-v2-teknik-tasarim.md tarihi tasarım belgesidir. “Uygulama kodu yok / kalıcılık yok” ifadeleri güncel yerel durum olarak alınmamalıdır.
- AGENTS.md içindeki Expo 57 doküman talimatı korunmuştur; package.json Expo ~54 bildirir. Çelişki OPEN_TASKS.md içinde doğrulanacak olarak kaydedildi.
- docs/store ve store-site mağaza/destek materyallerini içerir; mevcut kuralları korunur. Yayın yapılmış olduğu varsayılmaz.
- Yerel ağaçta çok sayıda önceden mevcut değişiklik vardır. Harita commit edilmemiş dosyaları da içerir.
- YouTube/video ve geçici çıktı klasörleri mobil context kapsamı dışındadır; taranmaz ve değiştirilmez.
- Git inceleme anında main ve origin/main 9a91386 üzerinde; remote tolgaoguzz-pro/101-Yaz-Boz. Güncel durumu işlem öncesi yeniden kontrol et.

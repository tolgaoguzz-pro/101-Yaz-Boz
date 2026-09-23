# Çalışma akışı — Project Context / Token Saver

1. Her yeni görevde önce [HANDOFF.md](HANDOFF.md) ve [WORKFLOW.md](WORKFLOW.md) oku.
2. Amaç ve sınırlar için gerektiğinde [CONTEXT.md](CONTEXT.md), kararlar için [DECISIONS.md](DECISIONS.md), açık işler için [OPEN_TASKS.md](OPEN_TASKS.md) kullan. Mimari değişiklik gerekiyorsa [ARCHITECTURE.md](ARCHITECTURE.md) oku.
3. [repo-map.md](repo-map.md) üzerinden ilgili modüle git; yalnız o modülün dosyalarını ve geçerli yerel yönergelerini incele. Tüm repo/dosya dökümünü veya eski sohbetleri başlangıç bağlamı olarak yükleme.
4. Önce salt okunur hedefli inceleme ve Git durum kontrolü yap. Kullanıcının mevcut değişikliklerini koru. Karmaşık işte kısa plan çıkar; kapsam büyüyecekse önce bildir.
5. Yalnız istenen kapsamı uygula. Belge bir dosyayı tarif etse de dosyanın güncel varlığını ve Git durumunu kontrol et; bu harita yerel, commit edilmemiş yollar da içerir.
6. İşe uygun doğrulama yap. UI değişirse referansı esas al, uygulamayı çalıştır ve gerçek ekran görüntüsünü karşılaştır; yalnız bulunan farkları düzelt. Dokümantasyon-only işte bağlantı/yol ve diff doğrulaması yeterlidir; production deploy başlatma.
7. Mevcut production/deploy/güvenlik kurallarını ve alt proje sözleşmelerini aynen koru. Bulunmayan bir yayın politikasını varsayma. Yıkıcı, geri alınamaz, güvenlik açısından hassas, veri kaybı riski taşıyan veya kapsamı değiştiren adım öncesinde onay iste.
8. Commit istendiğinde yalnız görev dosyalarını açık adlarıyla seç; önceden var olan değişiklikleri commit'e katma. Mevcut repo politikasını uygula; remote yoksa uydurma. Push öncesinde hedef dalı ve gönderilecek commit'leri kontrol et; force push yapma.
9. İş sonunda HANDOFF'u kısa güncelle; yalnız kanıtlı açık işleri OPEN_TASKS'a yaz. Kapanışı bilinmeyene “doğrulanacak” de; eski tasarım listesini güncel backlog sayma. Karar ve haritayı yalnız değişen alanlarda güncelle.
10. Son rapor: ne değişti, doğrulama, kalan sorun/risk, önerilen sonraki adım. Yapılmayan testi yapılmış gösterme.

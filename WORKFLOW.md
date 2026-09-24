# Çalışma akışı — Project Context / Token Saver

1. Her yeni görevde zorunlu başlangıç okuması yalnız HANDOFF.md → WORKFLOW.md → repo-map.md sırasıdır (minimum-context-first). Geçerli AGENTS ve güvenlik yönergelerini koru.
   repo-map.md üzerinden yalnız görevle ilgili modüle git. İlgili ana dosyadan bağlantılı dosyaları gerektiği kadar aç; zinciri görev kapsamıyla sınırla. Tüm repoyu veya tüm context setini gereksiz yere okuma. UI-only görevde backend dosyalarını gereksiz yere açma; backend/iş kuralı görevinde DECISIONS.md ve ARCHITECTURE.md içinden yalnız ihtiyaç duyulan bölümleri oku.
2. Diğer belgeleri yalnız ihtiyaç halinde ve ilgili bölümü kadar oku: CONTEXT.md → genel proje bağlamı; DECISIONS.md → kalıcı iş kuralı / geçmiş karar; OPEN_TASKS.md → açık iş / son durum; ARCHITECTURE.md → mimari / altyapı / entegrasyon / deploy işi.
3. [repo-map.md](repo-map.md) üzerinden ilgili modüle git; yalnız o modülün dosyalarını ve geçerli yerel yönergelerini incele. Tüm repo/dosya dökümünü veya eski sohbetleri başlangıç bağlamı olarak yükleme.
4. Önce salt okunur hedefli inceleme ve Git durum kontrolü yap. Kullanıcının mevcut değişikliklerini koru. Karmaşık işte kısa plan çıkar; kapsam büyüyecekse önce bildir.
5. Yalnız istenen kapsamı uygula. Belge bir dosyayı tarif etse de dosyanın güncel varlığını ve Git durumunu kontrol et; bu harita yerel, commit edilmemiş yollar da içerir.
6. İşe uygun doğrulama yap. UI değişirse referansı esas al, uygulamayı çalıştır ve gerçek ekran görüntüsünü karşılaştır; yalnız bulunan farkları düzelt. Dokümantasyon-only işte bağlantı/yol ve diff doğrulaması yeterlidir; production deploy başlatma.
7. Mevcut production/deploy/güvenlik kurallarını ve alt proje sözleşmelerini aynen koru. Bulunmayan bir yayın politikasını varsayma. Yıkıcı, geri alınamaz, güvenlik açısından hassas, veri kaybı riski taşıyan veya kapsamı değiştiren adım öncesinde onay iste.
8. Commit istendiğinde yalnız görev dosyalarını açık adlarıyla seç; önceden var olan değişiklikleri commit'e katma. Mevcut repo politikasını uygula; remote yoksa uydurma. Push öncesinde hedef dalı ve gönderilecek commit'leri kontrol et; force push yapma.
9. Görev sonunda yalnız içeriği gerçekten değişmesi gereken context belgelerini güncelle; HANDOFF.md dahil tüm context belgelerini her görevde otomatik güncelleme. Değişiklik gerekiyorsa HANDOFF kısa kalsın; kapanışı bilinmeyen açık işe “doğrulanacak” de.
10. Son rapor: ne değişti, doğrulama, kalan sorun/risk, önerilen sonraki adım. Yapılmayan testi yapılmış gösterme.

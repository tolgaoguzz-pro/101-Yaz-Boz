# Mimari

## Yerel kodda görülen yapı

- index.ts / App.tsx: uygulama girişi, Screen union ile ekran seçimi, kullanıcı akışlarının birleştirilmesi.
- src/engine: calculateRound, modeller, kurallar, validasyon ve saf skor hesapları.
- src/ui: ekranlar, ortak bileşenler, el girişi adaptörleri, yaşam döngüsü, skor tablosu, geri alma, sonuç paylaşımı ve ayarlar.
- src/app/usePersistedActiveGame.ts: aktif oyun kalıcılığına uygulama bağlantısı.
- src/domain: tamamlanmış oyun ve turnuva hesapları.
- src/persistence: SQLite veritabanı, şema, migration ve aktif/tamamlanmış oyun repository'leri; yerelde kayıtlı oyuncu repository'si de bulunur.
- Testler ilgili engine/domain/persistence/UI alanlarının __tests__ klasörlerindedir.
- store-site: kendi README ve paket tanımı olan destek sitesi. Mobil runtime'dan ayrı incelenir.

## Mevcut tasarım sınırları

docs/101-Yaz-Boz-v2-teknik-tasarim.md içindeki calculateRound imzası ve giriş/çıkış semantiği, engine'in React/IO içermemesi ve UI/kalıcılık ayrımı korunur. Eski v1 durum anlatımı güncel implementasyon kanıtı değildir; geleceğe yönelik PDF/yedek/bulut tasarımları uygulanmış kabul edilmez.

Mağaza yayın kontrolleri docs/store/release-checklist.md içindedir. store-site/README.md auth ve hosting sınırları aynen geçerlidir. Burada yeni production politikası tanımlanmaz.

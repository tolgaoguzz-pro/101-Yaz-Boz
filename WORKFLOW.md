# Çalışma akışı — Project Context

## Beş çalışma ilkesi

1. Her ayrı geliştirme işi yeni, temiz bir Work görevinde başlar.
2. Güncel ana dal (`main`; proje `master` kullanıyorsa `master`) doğrulanır;
   `HANDOFF.md`, `WORKFLOW.md`, `CONVERSATION_CONTEXT.md` ve `repo-map.md`
   içinden kısa checkpoint okunur. Eski uzun sohbet taşınmaz; kullanıcı geçmiş
   kararları yeniden anlatmaz. Remote yoksa mevcut yerel ana dal esas alınır.
3. Yalnız ilgili dosya ve bölümler hedefli okunur; gereksiz tekrar yapılmaz.
4. Gerekiyorsa tek preview, gerekli minimum testler ve mevcut yetki kapsamındaki
   deploy/QA tamamlanır. Projenin zorunlu güvenlik ve kalite kontrolleri korunur.
5. Görev bitince kısa `HANDOFF.md`/checkpoint güncellenir.

## Project Context ve kapsam

`CONTEXT.md` genel bağlam, `DECISIONS.md` kalıcı kararlar, `OPEN_TASKS.md` açık
çalışmalar, `ARCHITECTURE.md` mimari için gerektiği kadar okunur. Bu belgeler,
modül haritası ve konuşma tercihleri korunur; yalnız ilgili bilgi değiştiğinde
güncellenir. Tarihli kayıtlar güncel kabul/yayın kanıtı değildir.

Kullanıcı değişikliklerini koru; yalnız istenen kapsamı uygula. Karmaşık işte
kısa plan hazırla. UI değiştiğinde referans ve gerçek ekranla doğrula. Belgeler
için içerik, yol ve diff kontrolleri yeterlidir; gereksiz build veya deploy yoktur.
Secret, kişisel veri, büyük log veya eski sohbet dökümünü checkpoint'e ekleme.
Mevcut proje güvenlik, veri, onay ve yayın kuralları geçerlidir; başka projeden
yayın yetkisi aktarılmaz. Açık deploy yapmama sınırına uy.

## 101-Yaz-Boz proje kuralları

`AGENTS.md` içindeki Expo talimatını ve mevcut sürüm uyuşmazlığı kaydını koru;
bu belge işi sürüm yükseltmez. İlgili oyun/puanlama/kayıt/UI akışını etkiye uygun
test et. Mağaza işinde mevcut başvuru ve inceleme durumunu doğrula; gereksiz
build/submit tekrarı yapma. Belge işi mağaza yayın yetkisi değildir.
YouTube/video klasörleri kapsam dışıdır. Remote/dal uydurma; force push yapma.

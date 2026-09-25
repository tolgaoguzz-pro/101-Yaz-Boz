# 101-Yaz-Boz — konuşma bağlamı

Doğrulama: 24 Eylül 2026. İncelenen sohbetin son bölümü mağaza hazırlığı ve Apple inceleme takibine odaklanıyor; daha eski tercihler için eksik kanıt doldurulmaz.

## Bu projede çalışma biçimi
- Kullanıcı mağaza işlemlerinde somut yönlendirme istiyor: “nasıl soracağım, ne yazacağım, nereye yazacağım” sorusunu açıkça sordu. Gerekli ekranda hangi adımı izleyeceğini ve kullanılacak metni anlaşılır biçimde sun.
- Kullanıcı başvurunun durumunu kendisi de kontrol edebilmek istiyor; kontrol edilen yer ve görülen durum açık olsun.
- Yeni sürümlerde her şeyi yeniden başlatma yükünü sorguladı. Önce mevcut başvuru/belge/kabul durumunu doğrula; gereksiz yeniden kurulum veya tekrar iş üretme.

## Kullanıcının istemediği davranışlar
- Eski başvuru durumunu bugün de geçerliymiş gibi aktarma; bekleme, ret, onay ve yayın durumlarını kanıtsız eşitleme.
- Eski v2 teknik tasarımındaki “kod/kalıcılık yok” ifadelerini güncel yerel uygulama durumu sayma.
- Mobil uygulama görevi içinde aynı klasördeki YouTube/video/geçici çıktıları tarama veya değiştirme.

## Özel onay/önizleme kuralları
- İncelenen konuşmalarda proje genelinde özel bir tasarım-preview onay sırası için yeterli kanıt yok: **doğrulanacak**. CRM veya Team_Başbuğ'a özgü kuralları buraya taşıma.
- Mevcut AGENTS.md ve mağaza checklist'i korunur. Belge güncellemesi build/submit veya mağazaya yayın yetkisi değildir.
- Gerçek cihaz testinin yapıldığını yalnız ilgili kabul kanıtıyla söyle; checklist'te işaretli/boş satır tek başına bugünkü cihaz veya mağaza durumu değildir.

## Güncel çalışma akışı
- Beş sade ilke WORKFLOW.md içindedir: temiz Work görevi, güncel ana dal + kısa checkpoint, hedefli tekrarsız okuma, gerekli minimum preview/test/yetkili deploy/QA ve görev sonunda kısa HANDOFF.
- HANDOFF.md → WORKFLOW.md → CONVERSATION_CONTEXT.md → repo-map.md.
- Puanlama, kalıcılık, ekran veya mağaza alanından yalnız ilgili modüle git; saf puanlama/UI ayrımını koru.
- UI değişikliğini gerçek ekranla, oyun ve kayıt akışını etkiye uygun testle doğrula.
- Mağaza görevinde mevcut başvuru ve inceleme mesajını doğrulayıp sonraki somut adımı anlat; gereksiz yeni build/başvuru başlatma.

## Son önemli dersler/yanlış anlaşılmalar
- AGENTS.md Expo 57 dokümanını isterken mevcut context paket sürümünü Expo ~54 olarak kaydediyor. Bu uyuşmazlık **doğrulanacak**; context işiyle talimatı silme veya runtime yükseltme.
- Tarihli mağaza sohbetiyle release-checklist kapanışları farklı zamanlara ait olabilir; birini diğerinin güncel kanıtı sayma.

## Güncel aktif durum
- Erişilen son ilgili kullanıcı mesajlarında Apple incelemesi/ret nedeni ve destek mesajının nasıl gönderileceği soruluyor. Güncel mağaza sonucu **doğrulanacak**; bu görev mağazaya erişmedi.
- main üzerinde mevcut kullanıcı değişiklikleri korunur; belge commit'ine yalnız görev dosyaları girer.

Kaynaklar: “101_Apple Store Hazırlığı” kullanıcı mesajları (019fbfa8-3195-73e0-af80-190f9125b223); AGENTS.md, HANDOFF.md, WORKFLOW.md, CONTEXT.md, DECISIONS.md ve docs/store/release-checklist.md.

Bakım: Bu dosyayı yalnız yeni ve kalıcı bir çalışma kuralı, tercih veya yanlış anlaşılma ortaya çıkarsa güncelle; her görev sonunda otomatik yazma. Kısa tut, tekrarları kaldır; 300–700 kelimeyi aşmamayı hedefle. Tarihli durum kayıtları güncel çalıştırma/yayın kanıtı değildir.

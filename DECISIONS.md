# Kararlar ve korunan sınırlar

- 2026-09-24 — Context katmanı eski v2 tasarımını kopyalamaz; güncel yerel dosyalar ile tarihsel planlar ayrılır.
- Saf puanlama sözleşmesi ve UI/engine ayrımı korunur. Kaynak: docs/101-Yaz-Boz-v2-teknik-tasarim.md.
- Yerel SQLite kodu mevcut mimarinin parçasıdır. Kaynak: src/persistence/database.ts ve App.tsx bağlantıları; gerçek cihaz kalıcılık testi yapıldığı anlamına gelmez.
- AGENTS.md içindeki mevcut Expo 57 talimatı silinmedi/değiştirilmedi. package.json Expo ~54 olduğundan sürüm politikası doğrulanmadan runtime yükseltmesi yapılmaz.
- CLAUDE.md mevcut @AGENTS.md yönlendirmesini korur.
- Mağaza checklist'i ve destek sitesi auth kuralları korunur. Bu görev yalnız dokümantasyondur; EAS build/submit, migration veya production deploy yapılmaz.
- YouTube/video dosyaları bu mobil dokümantasyon işinin kapsamına alınmaz.

# Modül navigasyon haritası

2026-09-24: yerel çalışma ağacı üzerinden doğrulandı. Bazı yollar henüz commit edilmemiştir; temiz checkout'ta bulunmaları garanti değildir. Bu bir dosya dökümü değildir. Göreve uygun satırdan başla.

| Modül | İlgili dosya / klasör |
| --- | --- |
| Uygulama / ekran geçişi | `App.tsx`, `index.ts`, `src/app/usePersistedActiveGame.ts` |
| Saf puanlama / kurallar | `src/engine/calculateRound.ts`, `src/engine/models.ts`, `src/engine/rules.ts`, `src/engine/validateRoundInput.ts` |
| El girişi / hızlı ceza | `src/ui/roundEntry`, `src/ui/applyGameUpdates.ts`, `src/ui/screens/RoundEntryScreen.tsx`, `src/ui/screens/QuickPenaltyScreen.tsx` |
| Oyun yaşam döngüsü / geri alma | `src/ui/gameLifecycle.ts`, `src/ui/gameResult.ts`, `src/ui/undo-game-action.ts` |
| SQLite / migration / kayıt | `src/persistence/database.ts`, `src/persistence/migrations.ts`, `src/persistence/schema.ts`, `src/persistence/activeGameRepository.ts`, `src/persistence/completedGameRepository.ts`, `src/persistence/saved-player-repository.ts` |
| Turnuva / tamamlanan oyun / istatistik | `src/domain`, `src/ui/tournamentPresentation.ts`, `src/ui/screens/TournamentListScreen.tsx`, `src/ui/screens/StatsScreen.tsx` |
| Ayarlar / tema / bileşenler | `src/ui/app-settings.ts`, `src/ui/app-theme.ts`, `src/ui/theme.ts`, `src/ui/components` |
| Sonuç paylaşımı | `src/ui/game-result-share.ts`, `src/ui/components/game-result-share-modal.tsx` |
| Testler | `src/engine/__tests__`, `src/domain/__tests__`, `src/persistence/__tests__`, `src/ui/__tests__` |
| Mağaza / destek sitesi | `docs/store/release-checklist.md`, `docs/store/privacy-policy-tr.md`, `docs/store/store-listing-tr.md`, `store-site/README.md`, `store-site/app` |
| Paket / yapılandırma / tasarım kaynağı | `package.json`, `app.json`, `eas.json`, `src/config/appInfo.ts`, `docs/101-Yaz-Boz-v2-teknik-tasarim.md` |

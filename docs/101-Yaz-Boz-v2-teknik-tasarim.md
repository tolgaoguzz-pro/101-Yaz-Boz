# 101 Yaz-Boz v2 — Teknik Tasarım ve Yol Haritası

**Belge durumu:** Tasarım (uygulama kodu yok)  
**Tarih:** 2026-07-23  
**Kapsam:** Kalıcı veri, turnuva, otomatik kayıt, istatistik, liderlik, PDF, yedekleme, buluta hazır mimari  
**Kısıt:** Mevcut `src/engine` puanlama sözleşmesi ve UI ekran/state ayrımı bozulmayacak

---

## 0. Mevcut mimari özeti (v1 gerçekliği)

### 0.1 Stack

| Katman | Durum |
|--------|--------|
| Expo | `~54` (runtime); `AGENTS.md` Expo 57 dokümanına işaret eder — v2’de versiyon politikası netleştirilmeli |
| React / RN | `19.1.0` / `0.81.5` |
| Navigasyon | Kütüphane yok; `App.tsx` içinde `Screen` union + koşullu render |
| Kalıcılık | Yok (AsyncStorage / SQLite / dosya yok) |
| Ağ / bulut | Yok |
| Test | Jest + jest-expo; engine 34 + UI helper testleri |

### 0.2 Katmanlar (korunacak sınırlar)

```
┌─────────────────────────────────────────────────────────┐
│  App.tsx                                                │
│  screen state + session reducers                        │
│  (applyRoundResultToGame, applyPenaltyToGame, …)        │
└─────────────────────┬───────────────────────────────────┘
                      │ callbacks / props
┌─────────────────────▼───────────────────────────────────┐
│  src/ui                                                 │
│  screens, theme, adapters (roundEntry, gameRoster)      │
│  saf yardımcılar (gameResult, targetRoundCount)         │
└─────────────────────┬───────────────────────────────────┘
                      │ RoundInput + roster + ScoreRules
┌─────────────────────▼───────────────────────────────────┐
│  src/engine  (PURE)                                     │
│  calculateRound(input, rules, roster) → result          │
│  React / RN / IO YOK                                    │
└─────────────────────────────────────────────────────────┘
```

**Değiştirilmemesi gerekenler**

1. `calculateRound` imzası ve dönüş şekli (`CalculateRoundResult`).
2. `RoundInput` / `PlayerRoundInput` / `FinishType` / `OpenType` semantiği.
3. Validasyon: 4 oyuncu, 2×2 takım, finish tutarlılığı.
4. Engine’in UI/kalıcılık/yan etki taşımaması.
5. İki skor yolu ayrımı:
   - El → engine (`calculateRound`)
   - Hızlı ceza → toplam skorlara doğrudan ekleme (`lastAction`; `rounds`’a yazılmaz)

### 0.3 Bugünkü oturum modeli (UI)

`ActiveGameData` (`src/ui/screens/ActiveGameScreen.tsx`):

- `teams` (isim + `totalScore` + oyuncu `totalScore`)
- `roundNumber` (sonraki el)
- `rounds: SavedRoundSummary[]` (yalnızca skor özeti; tam `RoundInput` yok)
- `lastAction`
- `targetRoundCount?` (fallback 12)

Engine’de kullanılmayan ama ileriyi işaret eden tip: `Game` (`src/engine/models.ts`) — `id`, `createdAt`, `teams`, `players`, `rounds: RoundInput[]`.

### 0.4 Hazır yapı taşları (v2 üzerine bina edilecek)

| Yapı taşı | Konum | v2 kullanımı |
|-----------|--------|--------------|
| Saf skor motoru + testler | `src/engine` | Replay, denetim, PDF el detayı |
| `targetRoundCount` / `isGameComplete` | `targetRoundCount.ts`, `gameResult.ts` | Maç uzunluğu, turnuva slotu |
| `calculateGameResult` / `createRematchGame` | `gameResult.ts` | Sonuç ekranı, rematch, seri |
| Sabit koltuk ID’leri | `gameRoster.ts` | Kalıcı oyuncu eşlemesi, istatistik anahtarları |
| El geçmişi UI | `ActiveGameScreen` | PDF / geçmiş detay |
| Home “Geçmiş” / “Ayarlar” stub | `HomeScreen` | Gerçek ekranlara bağlanacak |

### 0.5 Kritik boşluklar

- Uygulama kapanınca aktif oyun silinir.
- `SavedRoundSummary` tam el girdisini saklamaz → zengin replay/istatistik sınırlı.
- Hızlı cezalar geçmişte yok → v2’de ayrı olay kaydı şart.
- Turnuva, liderlik, PDF, yedek, bulut yok.

---

## 1. Mimari ilkeler (v2)

### 1.1 Üç katman + bir depo

| Katman | Sorumluluk | Yasaklar |
|--------|------------|----------|
| **Domain / Engine** | Puanlama, kurallar, saf hesap | IO, React, depolama |
| **Application / Domain services** | Oyun yaşam döngüsü, turnuva kuralları, istatistik türetme, export DTO | RN bileşenleri; doğrudan AsyncStorage çağrısı ekranlardan |
| **Infrastructure** | Repository implementasyonları, dosya, PDF, paylaşım, (ileride) sync | Puanlama mantığı |
| **UI** | Ekranlar, formlar, sunum | Engine’e IO sızdırmak; skor formülü kopyalamak |

### 1.2 Kaynak doğruluğu (source of truth)

- **Skor hesabı:** yalnız `calculateRound` (+ mevcut hızlı ceza uygulaması; ileride `PenaltyEvent` olarak kaydedilir).
- **Oturum gösterimi:** `ActiveGameProjection` (bugünkü `ActiveGameData`’nın evrimleşmiş hali) — toplamlar projection; olay geçmişi append-only.
- **Kalıcı kayıt:** `GameRecord` + olaylar; projection her yüklemede veya kaydetmede yeniden üretilebilir (veya denormalize cache + event log).

### 1.3 Event-sourced hafif model (önerilen)

Tam CQRS şart değil. Pratik yaklaşım:

1. Append-only **event log** (el kaydı, ceza, undo, maç bitişi).
2. Denormalize **snapshot** (hızlı UI: toplam skorlar, `rounds` özeti).
3. Snapshot bozulursa event’lerden rebuild.

Bu, ceza geçmişi + el geçmişi tutarsızlığını çözer ve bulut sync için doğal birim sağlar.

### 1.4 Kimlik stratejisi

| Varlık | ID |
|--------|-----|
| Oyuncu (kalıcı kişi) | `playerId` UUID |
| Takım şablonu / turnuva takımı | `teamId` UUID |
| Oyun (maç) | `gameId` UUID |
| Turnuva | `tournamentId` UUID |
| El / olay | `roundId` / `eventId` UUID |

**Koltuk ID’leri** (`player-1`…`player-4`) oturum içi engine uyumu için kalır; kalıcı oyuncuya `seatBinding: { seatId → playerId }` ile bağlanır. Engine API değişmez.

### 1.5 Şema versiyonlama

Tüm persist edilen kök belgeler:

```ts
{ schemaVersion: number; ... }
```

Migrasyonlar: `src/persistence/migrations/vN.ts` — sıralı, idempotent. Bulut sync aynı `schemaVersion` ile konuşur.

---

## 2. Kalıcı veri saklama

### 2.1 Teknoloji seçimi

| Seçenek | Artı | Eksi | Karar |
|---------|------|------|--------|
| AsyncStorage | Basit | Büyük JSON, sorgu yok | Yalnızca ayarlar / küçük meta için |
| **expo-sqlite** | İlişkisel, sorgu, yedeklenebilir | Biraz boilerplate | **Birincil depo (önerilen)** |
| Dosya (DocumentDirectory) | Export/import kolay | Ad-hoc sorgu | Yedek/PDF çıktısı |

**Öneri:** SQLite birincil; JSON export dosyası yedek/paylaşım; AsyncStorage yalnızca `app_settings` ve “aktif oyun id” gibi küçük anahtarlar için (isteğe bağlı).

### 2.2 Mantıksal tablolar / koleksiyonlar

1. `players` — kalıcı oyuncu profili  
2. `games` — maç meta + durum + snapshot JSON  
3. `game_events` — append-only olaylar  
4. `tournaments` — turnuva meta  
5. `tournament_entries` — oyuncu/takım katılımı + kümülatif skor  
6. `settings` — uygulama ayarları (kurallar tercihi ileride)  
7. `sync_outbox` (ileride) — henüz gönderilmemiş değişiklikler  

### 2.3 Temel domain modelleri (yeni; UI tiplerinden ayrı)

Konum önerisi: `src/domain/` (engine’den ayrı; engine’i import edebilir, tersi yok).

```
PlayerProfile {
  id, displayName, createdAt, updatedAt, archivedAt?
}

SeatId = 'player-1' | 'player-2' | 'player-3' | 'player-4'

GameStatus = 'in_progress' | 'completed' | 'abandoned'

GameRecord {
  id, schemaVersion,
  status,
  createdAt, updatedAt, completedAt?,
  targetRoundCount,
  rulesSnapshot: ScoreRules,   // oynandığı andaki kurallar
  seats: { seatId, playerId, displayNameAtTime }[],
  teams: { teamKey: 'team-1'|'team-2', name, playerSeatIds }[],
  snapshot: ActiveGameProjection,  // UI’nin bugün kullandığına yakın
}

GameEvent =
  | { type: 'round_saved'; roundNumber; input: RoundInput; result: CalculateRoundResult; at }
  | { type: 'penalty_applied'; seatId|playerId; kind; amount; label; at }
  | { type: 'game_completed'; resultSummary; at }
  | { type: 'game_abandoned'; at }

TournamentRecord {
  id, name, status, createdAt, completedAt?,
  scoringMode: 'lowest_wins' | 'highest_wins', // 101’de düşük genelde iyi — ürün kararı
  memberPlayerIds[],
  gameIds[],
}
```

**Not — skor yönü:** Klasik 101’de düşük ceza puanı daha iyidir. Mevcut UI “yüksek skor = skorer” dilini kullanıyor; turnuva/liderlik dilini ürün kararıyla sabitleyin (`scoringMode`). Tasarım her iki moda izin verir; varsayılanı sprintte netleştirin.

### 2.4 Repository arayüzleri (UI’dan soyut)

```
src/persistence/
  repositories/
    PlayerRepository.ts
    GameRepository.ts
    TournamentRepository.ts
    SettingsRepository.ts
  sqlite/
    db.ts
    migrations/
  mappers/
    activeGameMapper.ts   // GameRecord ↔ ActiveGameData
```

Ekranlar repository’yi doğrudan çağırmaz; `src/app/` (veya `src/services/`) use-case fonksiyonları çağırır. `App.tsx` use-case’leri orchestrate eder.

### 2.5 ActiveGameData ile ilişki

- Kısa vadede: `ActiveGameData` kalır; `gameId` + `seatBindings` eklenir.
- Mapper: `toActiveGameData(record)` / `fromActiveGameData(data, meta)`.
- Engine `Game` tipi: uzun vadede event’lerdeki `RoundInput[]` ile hizalanır; UI snapshot’ı ayrı kalır.

---

## 3. Turnuva sistemi

### 3.1 Tanım (v2 MVP)

Turnuva = aynı oyuncu havuzu / takım eşleşmeleriyle oynanan **birden fazla tamamlanmış maç**ın kümülatif skor tablosu.

Kapsam dışı (sonraki faz): eleme bracket, Swiss, online eşleşme.

### 3.2 Kullanıcı akışları

1. **Turnuva oluştur** → isim, oyuncular (4 veya daha fazla havuz?), takım eşleşmeleri, hedef el sayısı varsayılanı, skor modu.
2. **Maç başlat** → turnuvaya bağlı `GameRecord` (`tournamentId` FK).
3. **Maç bitince** → `calculateGameResult` → turnuva standings güncelle → GameResultScreen’de “Turnuva tablosu” özeti.
4. **Turnuva geçmişi** → maç listesi + kümülatif tablo.
5. **Turnuva bitir** → status `completed`; PDF/paylaşım.

### 3.3 Kümülatif hesap (saf fonksiyon)

`src/domain/tournament/standings.ts` (engine değil):

- Girdi: tamamlanmış `GameResultSummary[]` (+ isteğe bağlı ceza toplamları).
- Çıktı: takım/oyuncu kümülatif skor, maç galibiyeti sayısı, berabere sayısı.
- Test: saf birim testleri (mevcut `gameResult` test stili).

Rematch (`createRematchGame`) turnuva içinde “aynı kadroyla sonraki maç” için reuse edilir; `tournamentId` ve `playerId` bağları korunur.

### 3.4 UI ekranları (yeni)

| Ekran | Amaç |
|-------|------|
| `TournamentListScreen` | Aktif / geçmiş turnuvalar |
| `TournamentSetupScreen` | Oluşturma |
| `TournamentDetailScreen` | Standings + maç listesi + “Yeni Maç” |
| `GameResultScreen` genişlemesi | “Turnuvaya dön” CTA |

`App.tsx` `Screen` union genişler; React Navigation hâlâ zorunlu değil (sprint 4’te opsiyonel).

---

## 4. Devam eden oyunu otomatik kaydetme

### 4.1 Tetikleyiciler

| Olay | Persist |
|------|---------|
| Yeni oyun oluşturma | `games.insert` + `status=in_progress` |
| El kaydı | event append + snapshot update |
| Hızlı ceza | event append + snapshot update |
| Rematch | yeni `gameId`; eski completed kalır |
| App background / inactive | debounce’lu flush (React Native `AppState`) |
| Crash güvenliği | her mutasyonda sync write (SQLite transaction) |

### 4.2 “Devam Et” davranışı

- Açılışta: `GameRepository.findInProgress()` → varsa Home “Devam Et”.
- Birden fazla in-progress engellenir (ürün kuralı): yeni oyun başlatmadan önce mevcut tamamlanır / terk edilir.
- Terk: `abandoned` + isteğe bağlı soft-delete.

### 4.3 Performans

- Snapshot JSON güncellemesi yeterli (oyun başına ~KB).
- Event log büyürse: completed oyunlarda event’ler arşivlenebilir; in-progress her zaman tam tutulur.

---

## 5. İstatistik altyapısı

### 5.1 İlkeler

- İstatistikler **ham olaylardan türetilir**; skor motoru kopyalanmaz.
- `round_saved` event’inde hem `RoundInput` hem `CalculateRoundResult` saklanır → el tipi, finisher, ceza dağılımı analiz edilebilir.
- Hızlı cezalar `penalty_applied` ile sayılır.

### 5.2 Metrik katalogu (MVP → gelişmiş)

**Oyuncu**

- Oynanan maç / el sayısı
- Toplam / ortalama el puanı
- Finisher sayısı (finishType kırılımı)
- Hızlı ceza toplamı
- “En skorer” frekansı (mevcut dil)
- Takım arkadaşına göre win rate (ileri)

**Takım / masa**

- Galibiyet / beraberlik
- Ortalama maç skoru
- Hedef el sayısı dağılımı

**Zaman**

- Son 7/30 gün aktivite (yerel takvim)

### 5.3 Hesaplama stratejisi

| Faz | Yaklaşım |
|-----|----------|
| Sprint 3–4 | On-demand aggregation (SQLite sorguları / JS reduce) |
| Sprint 6+ | Materialized `stats_player_daily` tabloları (opsiyonel) |

Saf fonksiyonlar: `src/domain/stats/*` — UI sadece DTO gösterir.

---

## 6. Liderlik tablosu

### 6.1 Kapsamlar

1. **Turnuva liderliği** — turnuva içi (zorunlu MVP).  
2. **Cihaz genel liderliği** — tüm completed maçlar (oyuncu profili).  
3. **Dönemsel** — ay/hafta filtresi (sonra).

### 6.2 Sıralama kuralları (yapılandırılabilir)

```
LeaderboardConfig {
  scope: 'tournament' | 'device' | 'period',
  entity: 'player' | 'team',
  metric: 'total_score' | 'avg_score' | 'wins' | 'finishes',
  order: 'asc' | 'desc',  // 101 için total_score genelde asc
}
```

UI: `LeaderboardScreen` + filtre chips. Veri: `StatsService.getLeaderboard(config)`.

### 6.3 Eşitlik

Stabil sıra: metrik eşitse `displayName` / `playerId` (deterministik). Mevcut `calculateGameResult` eşit puan roster sırası kuralıyla uyumlu tutun.

---

## 7. PDF paylaşımı

### 7.1 İçerik şablonları

1. **Maç özeti PDF** — takım skorları, oyuncu sıralaması, el geçmişi tablosu, cezalar.  
2. **Turnuva PDF** — standings + maç listesi.  

### 7.2 Teknik yaklaşım

| Seçenek | Not |
|---------|-----|
| `expo-print` + HTML şablon | Expo ekosistemine uyumlu; önerilen |
| `react-native-html-to-pdf` | Ek native bağımlılık |
| Saf canvas | Bakım maliyeti yüksek |

Akış:

1. `ExportService.buildMatchHtml(gameId)` — saf DTO → HTML string.  
2. `Print.printToFileAsync` → URI.  
3. `expo-sharing` / `Share` ile paylaş.

**Önemli:** HTML üretimi domain DTO kullanır; `calculateRound` tekrar çağrılmaz (sonuçlar event’te).

### 7.3 Gizlilik

PDF’te yalnızca yerel isimler; bulut yokken cihaz dışı paylaşım kullanıcı bilinciyle (Ayarlar’da kısa uyarı).

---

## 8. Yedekleme / geri yükleme

### 8.1 Export formatı

Tek dosya JSON (veya `.yazboz` uzantılı JSON):

```
YazBozBackup {
  format: '101-yaz-boz-backup',
  formatVersion: 1,
  exportedAt: ISO,
  appVersion: string,
  players: PlayerProfile[],
  games: GameRecord[],
  gameEvents: GameEvent[],
  tournaments: TournamentRecord[],
  settings: AppSettings,
}
```

- SQLite dump yerine **mantıksal dump** → migrasyon sonrası geri yükleme kolay.  
- İsteğe bağlı gzip (ileride).

### 8.2 Import stratejileri

| Mod | Davranış |
|-----|----------|
| `replace` | Mevcut veriyi sil, yedeği yükle (onaylı) |
| `merge` | ID çakışmasında `updatedAt` / kullanıcı seçimi |

Import transaction içinde; hata → rollback.

### 8.3 UI

Ayarlar → “Yedek Al” / “Yedekten Yükle” (document picker). Home stub “Ayarlar” buraya bağlanır.

---

## 9. Bulut senkronizasyonuna uygun mimari

### 9.1 Şimdi yapılacaklar (kod yazmadan sözleşme)

1. Tüm kayıtlarda `id` (UUID), `updatedAt`, `schemaVersion`.  
2. Append-only `game_events` + `sync_outbox` tablosu iskeleti.  
3. Repository arayüzleri; implementasyon LocalSqlite.  
4. Hiçbir ekranın doğrudan SQLite çağırmaması.

### 9.2 Gelecek sync modeli (tasarım)

```
Device ──outbox──► Sync API ──► Cloud store
Device ◄──pull──── Cursor / since updatedAt
```

- Conflict: last-writer-wins on `GameRecord.snapshot`; events CRDT değil — **maç kilidi**: in_progress oyun tek cihazda (lease).  
- Auth: sonra (Apple/Google); v2 local-first.  
- Motor: sunucuda `calculateRound` yeniden çalıştırılabilir (TypeScript package paylaşımı) — doğrulama için; istemci sonuçları yine event’te.

### 9.3 Paket sınırı

```
packages/ (monorepo opsiyonel, sonra)
  scoring-engine/   ← mevcut src/engine taşınabilir
app/
  src/ui, src/domain, src/persistence, ...
```

Şimdilik klasör ayrımı yeterli; fiziksel monorepo Sprint 8+ opsiyonel.

---

## 10. Yeni klasör yapısı (hedef)

Mevcut `src/engine` ve `src/ui` yerinde kalır; yanına eklenir:

```
src/
  engine/                 # DOKUNULMAZ sözleşme (geliştirme dikkatli)
  domain/
    game/
      types.ts            # GameRecord, GameEvent, projection
      lifecycle.ts        # complete, abandon, rematch (saf)
    tournament/
      types.ts
      standings.ts
    stats/
      metrics.ts
      leaderboard.ts
    export/
      matchReport.ts      # DTO → HTML/Markdown
      backup.ts           # backup serialize (saf)
  persistence/
    db.ts
    migrations/
    repositories/
    mappers/
  services/               # App use-cases (IO orchestration)
    GameSessionService.ts
    TournamentService.ts
    StatsService.ts
    BackupService.ts
    ExportService.ts
  ui/                     # mevcut + yeni ekranlar
    screens/
    ...
  app/                    # isteğe bağlı: App state machine parçaları
    navigation.ts         # Screen union + helpers
    sessionStore.ts       # aktif oyun orchestration (App.tsx’ten taşınabilir)
```

**Taşıma kuralı:** `ActiveGameData` tipi zamanla `src/domain/game/projection.ts`’e taşınabilir; ekranlar re-export ile kırılmaz.

---

## 11. Navigasyon ve App.tsx evrimi

### Kısa vadede (kütüphane eklemeden)

`Screen` genişletmesi:

```
home | newGame | activeGame | roundEntry | quickPenalty | gameResult
| history | gameDetail | tournamentList | tournamentSetup | tournamentDetail
| leaderboard | settings | stats
```

### Orta vadede

React Navigation (native-stack) — deep link / geri yığını ihtiyacı artınca. Engine etkilenmez.

### Session orchestration

`handleSaveRound` bugün:

1. `applyRoundResultToGame`  
2. `isGameComplete` → `gameResult`  

v2’de aynı akış + `GameSessionService.saveRound` (persist). UI akışı aynı kalır.

---

## 12. Test stratejisi

| Katman | Ne test edilir |
|--------|----------------|
| Engine | Mevcut 34 test — regresyon kapısı; bozulmaz |
| Domain saf | Turnuva standings, stats, backup serialize, migrasyon |
| Mapper | `ActiveGameData` ↔ `GameRecord` |
| Repository | SQLite integration (jest + in-memory veya temp file) |
| UI | Kritik ekran smoke (sonra); şimdilik helper testleri |

Yeni özellikler engine test sayısını kırmaz; domain testleri ayrı dosyalarda büyür.

---

## 13. Riskler ve azaltma

| Risk | Azaltma |
|------|---------|
| Snapshot vs event tutarsızlığı | Transaction; rebuild komutu (Ayarlar → “Veriyi onar”) |
| Ceza geçmişinin kaybolması | `penalty_applied` event zorunlu |
| ID kırılması (player-1 vs UUID) | Seat binding tablosu; engine’e UUID dayatılmaz |
| Expo sürüm sapması (54 vs 57 docs) | v2 başında tek Expo major seç + AGENTS.md güncelle |
| PDF HTML kırılganlığı | Dar şablon; görsel regresyon manuel checklist |
| “Yüksek skor iyi” vs 101 geleneği | `scoringMode` + UI metinleri |

---

## 14. Sprint yol haritası

Her sprint: çalışan, test edilebilir artış. Engine sözleşmesi değişmez.

### Sprint 0 — Hazırlık (0.5–1 hafta)

- Expo major / dokümantasyon hizası kararı  
- `schemaVersion` ve klasör iskeleti (boş modüller)  
- Ürün kararı: liderlikte düşük mü yüksek mü kazanır?  
- Event tipi taslağı dondurulur  

**Çıkış:** Mimari ADR notu + boş `domain/` / `persistence/` iskeleti.

---

### Sprint 1 — Kalıcılık temeli + otomatik kayıt (kritik)

**Hedef:** Uygulama kapanınca aktif oyun kaybolmasın.

- SQLite + migrasyon v1  
- `GameRepository` + `ActiveGameData` mapper  
- El kaydı / ceza / yeni oyun / rematch → persist  
- Açılışta in-progress yükleme → Home “Devam Et” gerçek  
- `AppState` flush  
- Uyarı metnini “kaydedildi” ile güncelle  

**Çıkış:** Kill & reopen ile oyun devam eder; engine testleri yeşil.

---

### Sprint 2 — Olay geçmişi + zengin el kaydı

- `game_events` tablosu  
- `round_saved` içinde tam `RoundInput` + `CalculateRoundResult`  
- `penalty_applied` event (ActiveGame geçmiş UI’da cezaları da göster)  
- Oyun detay ekranı (History → maç)  

**Çıkış:** Geçmişten maç açılır; cezalar listelenir.

---

### Sprint 3 — Oyuncu profilleri + Geçmiş listesi

- `PlayerProfile` CRUD (isim düzenleme, arşiv)  
- NewGame: mevcut oyuncu seç / yeni oluştur  
- Seat ↔ playerId bağlama  
- `HistoryScreen` (completed games)  
- Home “Geçmiş” bağlanır  

**Çıkış:** İsimler kalıcı; geçmiş listesi dolu.

---

### Sprint 4 — Turnuva MVP

- Turnuva oluştur / detay / standings  
- Maçı turnuvaya bağla  
- GameResult → turnuva güncelle  
- Saf `standings` testleri  

**Çıkış:** 3 maçlık turnuva kümülatif tablo ile oynanır.

---

### Sprint 5 — İstatistik + liderlik (cihaz)

- Stats aggregation (oyuncu/takım)  
- `LeaderboardScreen` + turnuva liderliği reuse  
- GameResult / TournamentDetail’den giriş  

**Çıkış:** Cihaz genel ve turnuva liderlikleri görünür.

---

### Sprint 6 — PDF paylaşımı

- Maç HTML şablonu + `expo-print` / sharing  
- Turnuva PDF  
- Paylaş butonları (GameResult, TournamentDetail, History)  

**Çıkış:** WhatsApp/Files ile PDF paylaşılır.

---

### Sprint 7 — Yedekleme / geri yükleme + Ayarlar

- Backup export/import (`replace` + onaylı `merge`)  
- Settings ekranı (yedek, skor modu metni, veri onar)  
- Home “Ayarlar” bağlanır  

**Çıkış:** Cihaz değişiminde veri taşınabilir (manuel dosya).

---

### Sprint 8 — Sertleştirme + buluta hazırlık

- Sync outbox şeması (henüz ağ yok)  
- Conflict/lease dokümantasyonu  
- Performans: büyük geçmişte liste sayfalama  
- Opsiyonel: React Navigation  
- Opsiyonel: engine’i paylaşılabilir pakete ayırma hazırlığı  

**Çıkış:** “Local-first, cloud-ready” checklist tamam; v2.0 etiketine aday.

---

## 15. Bilinçli olarak sonraya bırakılanlar

- Online çok oyunculu / gerçek zamanlı masa  
- Hesap sistemi ve sunucu auth  
- Push bildirimleri  
- Reklam / satın alma  
- Tam eleme turnuva bracket UI  
- Undo/redo yığını (event reverse ile sonra eklenebilir)  
- Kuralların (ScoreRules) kullanıcı tarafından düzenlenmesi — `rulesSnapshot` alanı Sprint 1’de hazır bırakılır, UI Sprint 8+

---

## 16. Uygulama sırası özeti (öncelik)

```
1. Persist + autosave          ← kullanıcı güveni
2. Event log + ceza geçmişi    ← veri bütünlüğü
3. Oyuncu profilleri + Geçmiş  ← kimlik
4. Turnuva                     ← ürün farklılaşması
5. Stats + liderlik            ← bağlayıcılık
6. PDF                         ← paylaşım / sosyal
7. Backup                      ← veri güvenliği
8. Cloud-ready sertleştirme    ← gelecek
```

---

## 17. Başarı kriterleri (v2.0)

- [ ] Aktif oyun kill sonrası devam eder  
- [ ] Tamamlanan maçlar Geçmiş’te listelenir  
- [ ] Turnuva kümülatif skor üretir  
- [ ] Liderlik tablosu (turnuva + cihaz) çalışır  
- [ ] Maç/turnuva PDF paylaşılır  
- [ ] Yedek al / yükle round-trip  
- [ ] `npx tsc --noEmit` temiz  
- [ ] Mevcut engine testleri + yeni domain testleri yeşil  
- [ ] `calculateRound` imzası değişmemiş  

---

## 18. Sonuç

v1 başarılı bir **saf skor motoru + geçici oturum UI**’dır. v2’nin işi motoru büyütmek değil; **local-first uygulama katmanı** eklemektir: olay kayıtlı kalıcılık, turnuva/istatistik domain’i, export ve yedekleme — hepsi engine sınırının dışında.

Bu belge uygulandığında “101 Yaz-Boz v2”, mevcut el girişi ve puan doğruluğunu koruyarak masaüstü yaz-boz defterinin kalıcı, paylaşılabilir ve ileride senkronize edilebilir dijital karşılığı olur.

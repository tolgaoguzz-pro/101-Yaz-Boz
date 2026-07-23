import {
  buildCompletedGameRecord,
  CompletedGameRecord,
  createCompletedGameId,
} from '../domain/completedGame';
import {
  getCompletedGameRepository,
} from '../persistence/completedGameRepository';
import { isGameComplete } from '../ui/gameResult';
import { ActiveGameData } from '../ui/screens/ActiveGameScreen';

export type EnsureCompletedGameResult = {
  game: ActiveGameData;
  record: CompletedGameRecord | null;
  saved: boolean;
};

/**
 * Tamamlanmış oyunu geçmişe bir kez yazar (idempotent).
 * Abandoned oyunlar kaydedilmez. Hata sonuç ekranını engellemez.
 */
export async function ensureCompletedGamePersisted(
  game: ActiveGameData,
): Promise<EnsureCompletedGameResult> {
  if (game.status === 'abandoned') {
    return { game, record: null, saved: false };
  }

  if (!isGameComplete(game)) {
    return { game, record: null, saved: false };
  }

  const repo = getCompletedGameRepository();
  const id = game.completedGameRecordId ?? createCompletedGameId();

  try {
    if (await repo.hasCompletedGame(id)) {
      const existing = await repo.getCompletedGameById(id);
      return {
        game: {
          ...game,
          status: 'completed',
          completedGameRecordId: id,
          completedAt: game.completedAt ?? existing?.completedAt,
        },
        record: existing,
        saved: false,
      };
    }

    const completedAt = game.completedAt ?? new Date().toISOString();
    const gameForRecord: ActiveGameData = {
      ...game,
      status: 'completed',
      completedAt,
      completedGameRecordId: id,
    };
    const record = buildCompletedGameRecord(gameForRecord, id, completedAt);
    const outcome = await repo.saveCompletedGame(record);

    return {
      game: gameForRecord,
      record,
      saved: outcome === 'inserted',
    };
  } catch (error) {
    console.warn('[persistence] ensureCompletedGamePersisted failed', error);
    return {
      game: {
        ...game,
        status: 'completed',
        completedGameRecordId: id,
      },
      record: null,
      saved: false,
    };
  }
}

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clearActiveGame,
  loadActiveGame,
  saveActiveGame,
} from '../persistence/activeGameRepository';
import { getDatabase } from '../persistence/database';
import { isContinuableActiveGame } from '../persistence/activeGameSnapshot';
import { ActiveGameData } from '../ui/screens/ActiveGameScreen';

type PersistJob = () => Promise<void>;

/**
 * Aktif oyunu hydrate eder ve her commit’te sırayla kalıcılar.
 * Hydration bitmeden persist yapılmaz.
 */
export function usePersistedActiveGame() {
  const [ready, setReady] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueuePersist = useCallback((job: PersistJob) => {
    if (!readyRef.current) {
      return;
    }
    queueRef.current = queueRef.current
      .then(job)
      .catch((error) => {
        console.warn('[persistence] Persist queue error', error);
      });
  }, []);

  const persistSnapshot = useCallback(
    (game: ActiveGameData | null) => {
      enqueuePersist(async () => {
        if (game == null || !isContinuableActiveGame(game)) {
          await clearActiveGame();
          return;
        }
        await saveActiveGame(game);
      });
    },
    [enqueuePersist],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await getDatabase();
        const loaded = await loadActiveGame();
        if (cancelled) {
          return;
        }
        setActiveGame(loaded);
      } catch (error) {
        console.warn('[persistence] Hydration failed', error);
        if (!cancelled) {
          setActiveGame(null);
        }
      } finally {
        if (!cancelled) {
          readyRef.current = true;
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const commitActiveGame = useCallback(
    (game: ActiveGameData | null) => {
      setActiveGame(game);
      persistSnapshot(game);
    },
    [persistSnapshot],
  );

  const updateActiveGame = useCallback(
    (updater: (current: ActiveGameData) => ActiveGameData) => {
      setActiveGame((current) => {
        if (!current) {
          return current;
        }
        const next = updater(current);
        persistSnapshot(next);
        return next;
      });
    },
    [persistSnapshot],
  );

  const continuableGame =
    activeGame && isContinuableActiveGame(activeGame) ? activeGame : null;

  return {
    ready,
    activeGame,
    continuableGame,
    commitActiveGame,
    updateActiveGame,
  };
}

import { PLAYER_IDS } from './gameRoster';
import {
  DEFAULT_GAME_MODE,
  GameMode,
  isGameMode,
  resolveGameMode,
} from './gameMode';
import { ActiveGameData } from './screens/ActiveGameScreen';
import {
  isTargetRoundCountOption,
  resolveTargetRoundCount,
} from './targetRoundCount';

export type NewGameSetupForm = {
  team1Name: string;
  player1Name: string;
  player2Name: string;
  team2Name: string;
  player3Name: string;
  player4Name: string;
};

export const DEFAULT_NEW_GAME_FORM: NewGameSetupForm = {
  team1Name: 'Takım 1',
  player1Name: 'Oyuncu 1',
  player2Name: 'Oyuncu 2',
  team2Name: 'Takım 2',
  player3Name: 'Oyuncu 3',
  player4Name: 'Oyuncu 4',
};

export type NewGameSetupInput = NewGameSetupForm & {
  gameMode: GameMode;
  targetRoundCount: number;
};

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function normalizeNameKey(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

/**
 * Tekli: yalnızca oyuncu adları.
 * Eşli: takım + oyuncu adları.
 */
export function validateNewGameSetup(input: NewGameSetupInput): string | null {
  if (!isGameMode(input.gameMode)) {
    return 'Oyun modunu seçmelisin (Eşli veya Tekli).';
  }

  if (!isTargetRoundCountOption(input.targetRoundCount)) {
    return 'Kaç el oynanacağını seçmelisin (8, 10, 12 veya 16).';
  }

  const playerNames = [
    input.player1Name,
    input.player2Name,
    input.player3Name,
    input.player4Name,
  ];

  if (playerNames.some(isBlank)) {
    return 'Dört oyuncunun adını da doldurmalısın.';
  }

  if (input.gameMode === 'paired') {
    if (isBlank(input.team1Name) || isBlank(input.team2Name)) {
      return 'Tüm takım ve oyuncu adlarını doldurmalısın.';
    }
  }

  if (input.gameMode === 'individual') {
    const keys = playerNames.map(normalizeNameKey);
    const unique = new Set(keys);
    if (unique.size !== keys.length) {
      return 'Tekli oyunda oyuncu adları birbirinden farklı olmalı.';
    }
  }

  return null;
}

/**
 * Aşama 1 veri modeli:
 * - `teams` hâlâ 2×2 koltuk (engine / mevcut UI ile uyumlu)
 * - individual’da takım adları formda gizlenir; dahili olarak saklanır
 * - dört oyuncu player-1…player-4 sırasıyla korunur
 */
export function buildActiveGameFromSetup(
  input: NewGameSetupInput,
): ActiveGameData {
  const gameMode = resolveGameMode(input.gameMode);
  const team1Name =
    gameMode === 'individual'
      ? input.team1Name.trim() || DEFAULT_NEW_GAME_FORM.team1Name
      : input.team1Name.trim();
  const team2Name =
    gameMode === 'individual'
      ? input.team2Name.trim() || DEFAULT_NEW_GAME_FORM.team2Name
      : input.team2Name.trim();

  return {
    gameMode,
    roundNumber: 1,
    rounds: [],
    lastAction: null,
    targetRoundCount: resolveTargetRoundCount(input.targetRoundCount),
    teams: [
      {
        name: team1Name,
        totalScore: 0,
        players: [
          {
            id: PLAYER_IDS.player1,
            name: input.player1Name.trim(),
            totalScore: 0,
          },
          {
            id: PLAYER_IDS.player2,
            name: input.player2Name.trim(),
            totalScore: 0,
          },
        ],
      },
      {
        name: team2Name,
        totalScore: 0,
        players: [
          {
            id: PLAYER_IDS.player3,
            name: input.player3Name.trim(),
            totalScore: 0,
          },
          {
            id: PLAYER_IDS.player4,
            name: input.player4Name.trim(),
            totalScore: 0,
          },
        ],
      },
    ],
  };
}

export function createInitialNewGameForm(): NewGameSetupForm {
  return { ...DEFAULT_NEW_GAME_FORM };
}

export { DEFAULT_GAME_MODE };

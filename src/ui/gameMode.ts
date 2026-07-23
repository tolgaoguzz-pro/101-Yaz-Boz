export const GAME_MODES = ['paired', 'individual'] as const;

export type GameMode = (typeof GAME_MODES)[number];

export const DEFAULT_GAME_MODE: GameMode = 'paired';

export function isGameMode(value: unknown): value is GameMode {
  return value === 'paired' || value === 'individual';
}

/**
 * Eksik veya geçersiz değerde eşli (paired) fallback.
 */
export function resolveGameMode(value: unknown): GameMode {
  return isGameMode(value) ? value : DEFAULT_GAME_MODE;
}

export function gameModeLabel(mode: GameMode): string {
  return mode === 'individual' ? 'Tekli Oyun' : 'Eşli Oyun';
}

export function gameModeShortLabel(mode: GameMode): string {
  return mode === 'individual' ? 'Tekli' : 'Eşli';
}

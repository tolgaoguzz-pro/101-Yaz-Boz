import { GameMode, resolveGameMode } from '../ui/gameMode';

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
}

function sortedPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

/**
 * Aynı kadro/eşleşmeyi belirleyen deterministik anahtar.
 * Turnuva geçmişi için hazırlık; UI’da henüz kullanılmaz.
 */
export function buildMatchupKey(input: {
  gameMode: GameMode | unknown;
  players: [string, string, string, string];
}): string {
  const mode = resolveGameMode(input.gameMode);
  const names = input.players.map(normalizeName);

  if (mode === 'individual') {
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'tr'));
    return `individual|${sorted.join('|')}`;
  }

  // Eşli: (p1,p2) takım1, (p3,p4) takım2 — takım içi sıra ve taraf yeri normalize.
  const teamA = sortedPair(names[0], names[1]).join('+');
  const teamB = sortedPair(names[2], names[3]).join('+');
  const teams = [teamA, teamB].sort((a, b) => a.localeCompare(b, 'tr'));
  return `paired|${teams.join('||')}`;
}

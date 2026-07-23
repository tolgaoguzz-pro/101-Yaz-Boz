import { CompletedGameRecord } from './completedGame';
import { GameMode, resolveGameMode } from '../ui/gameMode';

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
}

function displayName(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'Oyuncu';
}

export type TeamIdentity = {
  /** Takım içi oyuncu adları normalize + sıralı. */
  key: string;
  playerNames: [string, string];
  displayLabel: string;
};

/**
 * Takım kimliği: oyuncu sırası değişse de aynı.
 */
export function normalizeTeamIdentity(
  playerA: string,
  playerB: string,
): TeamIdentity {
  const a = displayName(playerA);
  const b = displayName(playerB);
  const na = normalizeName(a);
  const nb = normalizeName(b);
  const [first, second] = na <= nb ? [a, b] : [b, a];
  const [nk1, nk2] = na <= nb ? [na, nb] : [nb, na];
  return {
    key: `${nk1}+${nk2}`,
    playerNames: [first, second],
    displayLabel: `${first} / ${second}`,
  };
}

export type PairedSeriesStanding = {
  teamA: TeamIdentity;
  teamB: TeamIdentity;
  winsA: number;
  winsB: number;
  ties: number;
};

export type IndividualPlayerSeriesStat = {
  name: string;
  nameKey: string;
  wins: number;
  /** Berabere biten oyun sayısı (oyuncu 1. olduysa). */
  sharedWins: number;
  gamesPlayed: number;
  totalPenalty: number;
  averagePenalty: number;
};

export type MatchupSeriesSummary = {
  matchupKey: string;
  gameMode: GameMode;
  totalGames: number;
  lastPlayedAt: string | null;
  games: CompletedGameRecord[];
  paired: PairedSeriesStanding | null;
  individual: IndividualPlayerSeriesStat[] | null;
  individualTieGames: number;
};

function teamIdentityFromRecordTeam(team: {
  players: { name: string }[];
}): TeamIdentity {
  return normalizeTeamIdentity(
    team.players[0]?.name ?? 'Oyuncu',
    team.players[1]?.name ?? 'Oyuncu',
  );
}

function resolvePairedSides(
  games: CompletedGameRecord[],
): { teamA: TeamIdentity; teamB: TeamIdentity } | null {
  for (const game of games) {
    if (game.gameMode !== 'paired') {
      continue;
    }
    const left = teamIdentityFromRecordTeam(game.teams[0]);
    const right = teamIdentityFromRecordTeam(game.teams[1]);
    if (left.key === right.key) {
      continue;
    }
    const [teamA, teamB] =
      left.key <= right.key ? [left, right] : [right, left];
    return { teamA, teamB };
  }
  return null;
}

function pairedWinnerSide(
  game: CompletedGameRecord,
  teamA: TeamIdentity,
  teamB: TeamIdentity,
): 'A' | 'B' | 'tie' | null {
  if (game.gameMode !== 'paired') {
    return null;
  }
  const left = teamIdentityFromRecordTeam(game.teams[0]);
  const right = teamIdentityFromRecordTeam(game.teams[1]);
  const scoreLeft = game.teams[0].totalScore;
  const scoreRight = game.teams[1].totalScore;

  if (scoreLeft === scoreRight) {
    return 'tie';
  }

  const leftIsA = left.key === teamA.key;
  const rightIsA = right.key === teamA.key;
  if (!leftIsA && !rightIsA) {
    // Beklenmeyen kadro; atla
    return null;
  }

  const winnerIsLeft = scoreLeft < scoreRight;
  if (winnerIsLeft) {
    return leftIsA ? 'A' : 'B';
  }
  return leftIsA ? 'B' : 'A';
}

/**
 * Aynı matchupKey altındaki tamamlanmış oyunlardan seri özeti.
 * Düşük ceza puanı kazanır.
 */
export function calculateMatchupSeries(
  games: CompletedGameRecord[],
): MatchupSeriesSummary | null {
  const valid = games.filter((game) => game && game.status === 'completed');
  if (valid.length === 0) {
    return null;
  }

  const sorted = [...valid].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );
  const matchupKey = sorted[0].matchupKey;
  const gameMode = resolveGameMode(sorted[0].gameMode);
  const lastPlayedAt = sorted[0]?.completedAt ?? null;

  if (gameMode === 'paired') {
    const sides = resolvePairedSides(sorted);
    if (!sides) {
      return {
        matchupKey,
        gameMode,
        totalGames: sorted.length,
        lastPlayedAt,
        games: sorted,
        paired: null,
        individual: null,
        individualTieGames: 0,
      };
    }

    let winsA = 0;
    let winsB = 0;
    let ties = 0;
    for (const game of sorted) {
      const outcome = pairedWinnerSide(game, sides.teamA, sides.teamB);
      if (outcome === 'A') {
        winsA += 1;
      } else if (outcome === 'B') {
        winsB += 1;
      } else if (outcome === 'tie') {
        ties += 1;
      }
    }

    return {
      matchupKey,
      gameMode,
      totalGames: sorted.length,
      lastPlayedAt,
      games: sorted,
      paired: {
        teamA: sides.teamA,
        teamB: sides.teamB,
        winsA,
        winsB,
        ties,
      },
      individual: null,
      individualTieGames: 0,
    };
  }

  return {
    matchupKey,
    gameMode: 'individual',
    totalGames: sorted.length,
    lastPlayedAt,
    games: sorted,
    paired: null,
    individual: rankIndividualSeries(sorted),
    individualTieGames: sorted.filter((game) => game.resultSummary.isTie)
      .length,
  };
}

/**
 * Tekli seri: galibiyet (düşük ceza), paylaşılan birincilik, ortalama ceza.
 */
export function rankIndividualSeries(
  games: CompletedGameRecord[],
): IndividualPlayerSeriesStat[] {
  const byName = new Map<string, IndividualPlayerSeriesStat>();

  function ensure(name: string): IndividualPlayerSeriesStat {
    const nameKey = normalizeName(name);
    const existing = byName.get(nameKey);
    if (existing) {
      return existing;
    }
    const created: IndividualPlayerSeriesStat = {
      name: displayName(name),
      nameKey,
      wins: 0,
      sharedWins: 0,
      gamesPlayed: 0,
      totalPenalty: 0,
      averagePenalty: 0,
    };
    byName.set(nameKey, created);
    return created;
  }

  for (const game of games) {
    if (resolveGameMode(game.gameMode) !== 'individual') {
      continue;
    }
    for (const player of game.finalPlayerScores) {
      const stat = ensure(player.name);
      stat.gamesPlayed += 1;
      stat.totalPenalty += player.totalScore;
    }

    const winner = game.winner;
    if (winner.kind !== 'individual') {
      continue;
    }
    if (winner.outcome === 'winner' && winner.name) {
      ensure(winner.name).wins += 1;
    } else if (winner.outcome === 'tie' && winner.players) {
      for (const row of winner.players) {
        ensure(row.name).sharedWins += 1;
      }
    }
  }

  const ranked = [...byName.values()].map((stat) => ({
    ...stat,
    averagePenalty:
      stat.gamesPlayed > 0 ? stat.totalPenalty / stat.gamesPlayed : 0,
  }));

  ranked.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    if (b.sharedWins !== a.sharedWins) {
      return b.sharedWins - a.sharedWins;
    }
    if (a.averagePenalty !== b.averagePenalty) {
      return a.averagePenalty - b.averagePenalty;
    }
    return a.name.localeCompare(b.name, 'tr');
  });

  return ranked;
}

/**
 * Tüm tamamlanmış oyunları matchupKey’e göre gruplayıp seri özetleri üretir.
 * Son oynanan turnuva en üstte.
 */
export function buildAllMatchupSeries(
  games: CompletedGameRecord[],
): MatchupSeriesSummary[] {
  const byKey = new Map<string, CompletedGameRecord[]>();
  for (const game of games) {
    if (!game?.matchupKey) {
      continue;
    }
    const list = byKey.get(game.matchupKey) ?? [];
    list.push(game);
    byKey.set(game.matchupKey, list);
  }

  const series: MatchupSeriesSummary[] = [];
  for (const list of byKey.values()) {
    const summary = calculateMatchupSeries(list);
    if (summary) {
      series.push(summary);
    }
  }

  series.sort((a, b) => {
    const aTime = a.lastPlayedAt ?? '';
    const bTime = b.lastPlayedAt ?? '';
    return bTime.localeCompare(aTime);
  });

  return series;
}

export function formatPairedSeriesScore(
  standing: PairedSeriesStanding,
): string {
  return `${standing.winsA} - ${standing.winsB}`;
}

export function formatPairedSeriesHeadline(
  standing: PairedSeriesStanding,
): string {
  return `${standing.teamA.displayLabel} ${standing.winsA} - ${standing.winsB} ${standing.teamB.displayLabel}`;
}

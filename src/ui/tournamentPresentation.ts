import { CompletedGameRecord } from '../domain/completedGame';
import {
  formatPairedSeriesScore,
  MatchupSeriesSummary,
} from '../domain/tournament';
import { gameModeShortLabel } from './gameMode';

export type TournamentListCardModel = {
  matchupKey: string;
  gameMode: 'paired' | 'individual';
  modeLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  lastPlayedAt: string | null;
};

export type TournamentGameRowModel = {
  id: string;
  completedAt: string;
  scoreLine: string;
  outcomeLine: string;
  roundsLine: string;
};

export function formatSafeDateTime(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  try {
    return date.toLocaleString('tr-TR');
  } catch {
    return value;
  }
}

export function buildTournamentListCard(
  series: MatchupSeriesSummary,
): TournamentListCardModel {
  const modeLabel = gameModeShortLabel(series.gameMode);
  if (series.gameMode === 'paired' && series.paired) {
    const ties =
      series.paired.ties > 0 ? ` · ${series.paired.ties} beraberlik` : '';
    return {
      matchupKey: series.matchupKey,
      gameMode: 'paired',
      modeLabel,
      title: `${series.paired.teamA.displayLabel}  vs  ${series.paired.teamB.displayLabel}`,
      subtitle: `Seri ${formatPairedSeriesScore(series.paired)}${ties}`,
      meta: `${series.totalGames} oyun · ${formatSafeDateTime(series.lastPlayedAt)}`,
      lastPlayedAt: series.lastPlayedAt,
    };
  }

  const leader = series.individual?.[0];
  const leaderLine = leader
    ? `${leader.name}: ${leader.wins} galibiyet`
    : 'Tekli turnuva';

  return {
    matchupKey: series.matchupKey,
    gameMode: 'individual',
    modeLabel,
    title: (series.individual ?? [])
      .map((player) => player.name)
      .slice(0, 4)
      .join(' · '),
    subtitle: leaderLine,
    meta: `${series.totalGames} oyun · ${formatSafeDateTime(series.lastPlayedAt)}`,
    lastPlayedAt: series.lastPlayedAt,
  };
}

export function buildTournamentGameRow(
  record: CompletedGameRecord,
): TournamentGameRowModel {
  const scoreLine =
    record.gameMode === 'paired'
      ? `${record.teams[0].name} ${record.teams[0].totalScore} — ${record.teams[1].totalScore} ${record.teams[1].name}`
      : record.finalPlayerScores
          .map((player) => `${player.name} ${player.totalScore}`)
          .join(' · ');

  let outcomeLine = 'Berabere';
  if (record.winner.kind === 'paired') {
    if (record.winner.outcome === 'winner' && record.winner.teamName) {
      outcomeLine = `Kazanan: ${record.winner.teamName}`;
    }
  } else if (record.winner.outcome === 'winner' && record.winner.name) {
    outcomeLine = `Kazanan: ${record.winner.name}`;
  } else if (record.winner.outcome === 'tie') {
    outcomeLine = 'Berabere';
  }

  return {
    id: record.id,
    completedAt: formatSafeDateTime(record.completedAt),
    scoreLine,
    outcomeLine,
    roundsLine: `${record.playedRoundCount} / ${record.targetRoundCount} el`,
  };
}

export function buildSeriesSummaryLine(
  series: MatchupSeriesSummary | null,
): string | null {
  if (!series) {
    return null;
  }
  if (series.gameMode === 'paired' && series.paired) {
    return `${series.paired.teamA.displayLabel} ${series.paired.winsA} - ${series.paired.winsB} ${series.paired.teamB.displayLabel}`;
  }
  const leader = series.individual?.[0];
  if (!leader) {
    return null;
  }
  return `${leader.name}: ${leader.wins} galibiyet`;
}

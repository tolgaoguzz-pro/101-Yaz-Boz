import { resolveActivityLog } from './gameLifecycle';
import { resolveGameMode } from './gameMode';
import { rosterPlayersInOrder } from './gameResult';
import {
  ActiveGameData,
  ActiveGamePlayer,
} from './screens/ActiveGameScreen';
import { GameActivityEvent } from './gameActivity';

export type ScoreSheetCell =
  | { kind: 'empty' }
  | { kind: 'value'; text: string; emphasize?: boolean }
  | { kind: 'dash' };

export type ScoreSheetRow = {
  id: string;
  label: string;
  cells: ScoreSheetCell[];
  kind: 'round' | 'penalty' | 'total';
  detail?: string;
};

export type ScoreSheetModel = {
  gameMode: 'paired' | 'individual';
  playerNames: string[];
  playerIds: string[];
  teamNames: [string, string] | null;
  teamTotals: [number, number] | null;
  /** Kronolojik el + ceza satırları + sonda toplam satırı. */
  rows: ScoreSheetRow[];
  /** Toplam hariç activity satır sayısı. */
  activityRowCount: number;
};

function cellForAmount(amount: number | null | undefined): ScoreSheetCell {
  if (amount === null || amount === undefined) {
    return { kind: 'dash' };
  }
  return { kind: 'value', text: String(amount) };
}

function penaltyCell(amount: number): ScoreSheetCell {
  return { kind: 'value', text: `+${amount}`, emphasize: true };
}

function scoreByPlayerId(
  scores: { playerId: string; score: number }[],
  playerId: string,
): number {
  return scores.find((entry) => entry.playerId === playerId)?.score ?? 0;
}

function buildRowsFromLog(
  events: GameActivityEvent[],
  players: ActiveGamePlayer[],
): ScoreSheetRow[] {
  const rows: ScoreSheetRow[] = [];
  let penaltyIndex = 0;

  for (const event of events) {
    if (event.type === 'round') {
      rows.push({
        id: event.id,
        label: String(event.roundNumber),
        kind: 'round',
        cells: players.map((player) =>
          cellForAmount(scoreByPlayerId(event.playerScores, player.id)),
        ),
      });
      continue;
    }

    penaltyIndex += 1;
    rows.push({
      id: event.id,
      label: `C${penaltyIndex}`,
      kind: 'penalty',
      detail: event.penaltyLabel,
      cells: players.map((player) =>
        player.id === event.playerId
          ? penaltyCell(event.amount)
          : { kind: 'dash' },
      ),
    });
  }

  return rows;
}

export function getScoreSheetBodyRows(sheet: ScoreSheetModel): ScoreSheetRow[] {
  return sheet.rows.filter((row) => row.kind !== 'total');
}

export function getScoreSheetTotalRow(
  sheet: ScoreSheetModel,
): ScoreSheetRow | null {
  return sheet.rows.find((row) => row.kind === 'total') ?? null;
}

/** Activity satır sayısı arttı mı? (otomatik alta kaydırma için). */
export function didActivityRowCountIncrease(
  previousCount: number,
  nextCount: number,
): boolean {
  return nextCount > previousCount;
}

export function buildScoreSheet(game: ActiveGameData): ScoreSheetModel {
  const mode = resolveGameMode(game.gameMode);
  const players = rosterPlayersInOrder(game);
  const events = resolveActivityLog(game);
  const bodyRows = buildRowsFromLog(events, players);

  const totalRow: ScoreSheetRow = {
    id: 'total',
    label: 'Toplam',
    kind: 'total',
    cells: players.map((player) => ({
      kind: 'value',
      text: String(player.totalScore),
      emphasize: true,
    })),
  };

  return {
    gameMode: mode,
    playerNames: players.map((player) => player.name),
    playerIds: players.map((player) => player.id),
    teamNames:
      mode === 'paired'
        ? [game.teams[0].name, game.teams[1].name]
        : null,
    teamTotals:
      mode === 'paired'
        ? [game.teams[0].totalScore, game.teams[1].totalScore]
        : null,
    rows: [...bodyRows, totalRow],
    activityRowCount: bodyRows.length,
  };
}

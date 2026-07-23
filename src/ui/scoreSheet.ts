import { resolveActivityLog } from './gameLifecycle';
import { resolveGameMode } from './gameMode';
import { rosterPlayersInOrder } from './gameResult';
import { resolveTargetRoundCount } from './targetRoundCount';
import {
  ActiveGameData,
  ActiveGamePlayer,
} from './screens/ActiveGameScreen';
import { GameActivityEvent } from './gameActivity';

export const SCORE_SHEET_PAGE_SIZE = 8;

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
  rows: ScoreSheetRow[];
  pageCount: number;
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

  const rows = [...bodyRows, totalRow];
  const pageCount = Math.max(1, Math.ceil(Math.max(bodyRows.length, 1) / SCORE_SHEET_PAGE_SIZE));

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
    rows,
    pageCount,
  };
}

/** Toplam satırı hariç gövde satırları için sayfa dilimi. */
export function paginateScoreSheetRows(
  sheet: ScoreSheetModel,
  pageIndex: number,
): { pageRows: ScoreSheetRow[]; totalRow: ScoreSheetRow | null; pageIndex: number; pageCount: number } {
  const body = sheet.rows.filter((row) => row.kind !== 'total');
  const totalRow = sheet.rows.find((row) => row.kind === 'total') ?? null;
  const pageCount = Math.max(1, Math.ceil(Math.max(body.length, 1) / SCORE_SHEET_PAGE_SIZE));
  const safePage = Math.min(Math.max(pageIndex, 0), pageCount - 1);
  const start = safePage * SCORE_SHEET_PAGE_SIZE;
  const pageRows = body.slice(start, start + SCORE_SHEET_PAGE_SIZE);
  return { pageRows, totalRow, pageIndex: safePage, pageCount };
}

export function pageIndexForLastEvent(sheet: ScoreSheetModel): number {
  const body = sheet.rows.filter((row) => row.kind !== 'total');
  if (body.length === 0) {
    return 0;
  }
  return Math.floor((body.length - 1) / SCORE_SHEET_PAGE_SIZE);
}

export function scoreSheetPageLabel(
  pageIndex: number,
  pageCount: number,
  targetRoundCount?: number,
): string {
  const target = resolveTargetRoundCount(targetRoundCount);
  const start = pageIndex * SCORE_SHEET_PAGE_SIZE + 1;
  const end = Math.min((pageIndex + 1) * SCORE_SHEET_PAGE_SIZE, Math.max(target, pageCount * SCORE_SHEET_PAGE_SIZE));
  return `${pageIndex + 1} / ${pageCount} · ${start}–${end}`;
}

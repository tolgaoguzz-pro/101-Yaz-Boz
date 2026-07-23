import { applyRoundResultToPairedGame } from '../applyGameUpdates';
import { calculateRound } from '../../engine/calculateRound';
import { DEFAULT_SCORE_RULES } from '../../engine/rules';
import { RoundInput } from '../../engine/models';
import { buildRosterFromActiveGame } from '../gameRoster';
import {
  buildCompletedGameRecord,
  createCompletedGameId,
} from '../../domain/completedGame';
import { calculateMatchupSeries } from '../../domain/tournament';
import {
  calculateGameResult,
  rankPlayersByPenaltyAscending,
  rosterPlayersInOrder,
} from '../gameResult';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../newGameSetup';
import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
} from '../screens/ActiveGameScreen';
import {
  buildScoreSheet,
  pageIndexForLastEvent,
  paginateScoreSheetRows,
  SCORE_SHEET_PAGE_SIZE,
} from '../scoreSheet';
import { applyQuickPenaltyToPairedGame } from '../applyGameUpdates';

function player(
  id: string,
  name: string,
  totalScore: number,
): ActiveGamePlayer {
  return { id, name, totalScore };
}

function team(
  name: string,
  totalScore: number,
  players: [ActiveGamePlayer, ActiveGamePlayer],
): ActiveGameTeam {
  return { name, totalScore, players };
}

function gameWithScores(
  scores: [number, number, number, number],
  mode: 'paired' | 'individual' = 'individual',
): ActiveGameData {
  return {
    gameMode: mode,
    roundNumber: 3,
    lastAction: null,
    targetRoundCount: 12,
    status: 'completed',
    rounds: [
      {
        roundNumber: 1,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
      {
        roundNumber: 2,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      },
    ],
    teams: [
      team('Oğuz Ailesi', scores[0] + scores[1], [
        player('player-1', 'Tolga', scores[0]),
        player('player-2', 'Aygül', scores[1]),
      ]),
      team('Güldiken Ailesi', scores[2] + scores[3], [
        player('player-3', 'Şahin', scores[2]),
        player('player-4', 'Mashhura', scores[3]),
      ]),
    ],
  };
}

describe('first place ranking scenarios', () => {
  it('Tolga 10 leads over Aygül 20', () => {
    const result = calculateGameResult(
      gameWithScores([10, 20, 30, 40], 'individual'),
    );
    expect(result.individualWinner).toEqual({
      kind: 'winner',
      playerId: 'player-1',
      name: 'Tolga',
      totalScore: 10,
    });
    expect(result.firstPlacePlayers.map((row) => row.name)).toEqual(['Tolga']);
  });

  it('Şahin 20 leads when others are higher', () => {
    const result = calculateGameResult(
      gameWithScores([80, 70, 20, 90], 'individual'),
    );
    expect(result.individualWinner).toMatchObject({
      kind: 'winner',
      name: 'Şahin',
      totalScore: 20,
    });
  });

  it('Aygül 10 leads when she truly has the lowest score', () => {
    const result = calculateGameResult(
      gameWithScores([40, 10, 30, 20], 'individual'),
    );
    expect(result.individualWinner).toMatchObject({
      kind: 'winner',
      name: 'Aygül',
      totalScore: 10,
    });
  });

  it('shared first place for Tolga and Aygül at 20', () => {
    const result = calculateGameResult(
      gameWithScores([20, 20, 40, 50], 'individual'),
    );
    expect(result.isTie).toBe(true);
    expect(result.firstPlacePlayers.map((row) => row.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
  });

  it('paired team with lower total wins', () => {
    const result = calculateGameResult(gameWithScores([40, 40, 90, 90], 'paired'));
    expect(result.pairedWinner).toMatchObject({
      kind: 'winner',
      teamName: 'Oğuz Ailesi',
      teamScore: 80,
    });
  });

  it('renamed players keep score identity by id', () => {
    const game = gameWithScores([5, 50, 60, 70], 'individual');
    game.teams[0].players[0].name = 'Ali';
    const result = calculateGameResult(game);
    expect(result.individualWinner).toMatchObject({
      playerId: 'player-1',
      name: 'Ali',
      totalScore: 5,
    });
  });

  it('completed record and game result agree on winner', () => {
    const game = gameWithScores([15, 25, 35, 45], 'individual');
    const result = calculateGameResult(game);
    const record = buildCompletedGameRecord(game, createCompletedGameId());
    expect(record.resultSummary.individualWinner).toEqual(
      result.individualWinner,
    );
    expect(record.winner).toMatchObject({
      kind: 'individual',
      outcome: 'winner',
      name: 'Tolga',
    });
  });

  it('tournament series uses the same winner identity', () => {
    const game = gameWithScores([12, 40, 50, 60], 'individual');
    const record = buildCompletedGameRecord(game, 'cg-1');
    const series = calculateMatchupSeries([record]);
    expect(series?.individual?.[0].name).toBe('Tolga');
    expect(series?.individual?.[0].wins).toBe(1);
  });
});

describe('paired finish bonus on finisher player total', () => {
  it('applies finish bonus to the finishing player, not the partner', () => {
    const game = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      team1Name: 'Oğuz',
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      team2Name: 'Güldiken',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'paired',
      targetRoundCount: 12,
    });

    const input: RoundInput = {
      id: 'r1',
      finish: { finishType: 'normal', finisherPlayerId: 'player-1' },
      players: [
        {
          playerId: 'player-1',
          openType: 'didNotOpen',
          remainingTilePoints: 0,
          remainingOkeyCount: 0,
          wrongOpenCount: 0,
          playableTileDiscardCount: 0,
          manualPenalty: 0,
        },
        {
          playerId: 'player-2',
          openType: 'series',
          remainingTilePoints: 20,
          remainingOkeyCount: 0,
          wrongOpenCount: 0,
          playableTileDiscardCount: 0,
          manualPenalty: 0,
        },
        {
          playerId: 'player-3',
          openType: 'series',
          remainingTilePoints: 30,
          remainingOkeyCount: 0,
          wrongOpenCount: 0,
          playableTileDiscardCount: 0,
          manualPenalty: 0,
        },
        {
          playerId: 'player-4',
          openType: 'series',
          remainingTilePoints: 40,
          remainingOkeyCount: 0,
          wrongOpenCount: 0,
          playableTileDiscardCount: 0,
          manualPenalty: 0,
        },
      ],
    };

    const calc = calculateRound(
      input,
      DEFAULT_SCORE_RULES,
      buildRosterFromActiveGame(game),
    );
    const next = applyRoundResultToPairedGame(game, calc, {
      finishType: 'normal',
      finisherPlayerId: 'player-1',
    });

    // Bitiren Tolga: 0 + (-101). Partner Aygül: fixedPenalty 0.
    expect(next.teams[0].players[0].totalScore).toBe(
      0 + DEFAULT_SCORE_RULES.finishTeamBonus.normal,
    );
    expect(next.teams[0].players[1].totalScore).toBe(
      DEFAULT_SCORE_RULES.finisherPartner.fixedPenalty,
    );

    const ranked = rankPlayersByPenaltyAscending(rosterPlayersInOrder(next));
    expect(ranked[0].name).toBe('Tolga');
    expect(ranked[0].totalScore).toBe(DEFAULT_SCORE_RULES.finishTeamBonus.normal);
  });
});

describe('score sheet presentation', () => {
  it('builds chronological round and penalty rows with totals', () => {
    let game = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'paired',
      targetRoundCount: 16,
    });
    game.rounds = [
      {
        roundNumber: 1,
        players: [
          { playerId: 'player-1', score: 0 },
          { playerId: 'player-2', score: 45 },
          { playerId: 'player-3', score: 29 },
          { playerId: 'player-4', score: 39 },
        ],
        teams: [
          { teamId: 'team-1', score: 45 },
          { teamId: 'team-2', score: 68 },
        ],
        finishTeamBonus: { teamId: 'team-1', amount: -101 },
        finishBonusPlayerId: 'player-1',
      },
    ];
    game.teams[0].players[0].totalScore = 0;
    game.teams[0].players[1].totalScore = 45;
    game.teams[1].players[0].totalScore = 29;
    game.teams[1].players[1].totalScore = 39;
    game.teams[0].totalScore = 45;
    game.teams[1].totalScore = 68;
    delete game.activityLog;

    game = applyQuickPenaltyToPairedGame(game, {
      playerId: 'player-1',
      playerName: 'Tolga',
      kind: 'wrongOpen',
      label: 'Gösterge açma',
      amount: 101,
    });

    const sheet = buildScoreSheet(game);
    expect(sheet.gameMode).toBe('paired');
    expect(sheet.teamNames).not.toBeNull();
    expect(sheet.rows.some((row) => row.kind === 'round')).toBe(true);
    expect(sheet.rows.some((row) => row.kind === 'penalty')).toBe(true);
    const penalty = sheet.rows.find((row) => row.kind === 'penalty');
    expect(penalty?.cells[0]).toMatchObject({
      kind: 'value',
      text: '+101',
    });
    expect(penalty?.cells[1]).toEqual({ kind: 'dash' });
    expect(sheet.rows[sheet.rows.length - 1].kind).toBe('total');
  });

  it('paginates and jumps to last event page', () => {
    const game = gameWithScores([1, 2, 3, 4], 'individual');
    game.activityLog = Array.from({ length: 10 }, (_, index) => ({
      id: `round-${index}`,
      type: 'round' as const,
      createdAt: new Date(0).toISOString(),
      sequence: index + 1,
      roundNumber: index + 1,
      playerScores: [
        { playerId: 'player-1', score: 1 },
        { playerId: 'player-2', score: 2 },
        { playerId: 'player-3', score: 3 },
        { playerId: 'player-4', score: 4 },
      ],
      teamScores: [],
      finishType: 'none' as const,
      finisherPlayerId: null,
      finishBonusAmount: 0,
    }));
    const sheet = buildScoreSheet(game);
    expect(pageIndexForLastEvent(sheet)).toBe(1);
    const page0 = paginateScoreSheetRows(sheet, 0);
    expect(page0.pageRows).toHaveLength(SCORE_SHEET_PAGE_SIZE);
    expect(page0.pageCount).toBe(2);
  });

  it('individual sheet omits team headers/totals', () => {
    const sheet = buildScoreSheet(gameWithScores([1, 2, 3, 4], 'individual'));
    expect(sheet.teamNames).toBeNull();
    expect(sheet.teamTotals).toBeNull();
  });
});

import { calculateRound } from '../calculateRound';
import { Player, PlayerRoundInput, RoundInput } from '../models';
import { DEFAULT_SCORE_RULES, ScoreRules } from '../rules';

const roster: Player[] = [
  { id: 'p1', name: 'P1', teamId: 't1' },
  { id: 'p2', name: 'P2', teamId: 't1' },
  { id: 'p3', name: 'P3', teamId: 't2' },
  { id: 'p4', name: 'P4', teamId: 't2' },
];

function playerInput(
  overrides: Partial<PlayerRoundInput> & Pick<PlayerRoundInput, 'playerId'>,
): PlayerRoundInput {
  return {
    openType: 'series',
    remainingTilePoints: 0,
    remainingOkeyCount: 0,
    wrongOpenCount: 0,
    playableTileDiscardCount: 0,
    manualPenalty: 0,
    ...overrides,
  };
}

function roundWithPlayers(
  players: PlayerRoundInput[],
  finish: RoundInput['finish'] = { finishType: 'none', finisherPlayerId: null },
): RoundInput {
  return {
    id: 'round-1',
    players,
    finish,
  };
}

function scoreOf(
  result: ReturnType<typeof calculateRound>,
  playerId: string,
): number {
  const entry = result.players.find((player) => player.playerId === playerId);
  if (!entry) {
    throw new Error(`Missing score for ${playerId}`);
  }
  return entry.score;
}

function teamScoreOf(
  result: ReturnType<typeof calculateRound>,
  teamId: string,
): number {
  const entry = result.teams.find((team) => team.teamId === teamId);
  if (!entry) {
    throw new Error(`Missing score for team ${teamId}`);
  }
  return entry.score;
}

/** p1 finishes for t1; p2 partner; p3/p4 opponents with known base+extras. */
function finishedRoundPlayers(): PlayerRoundInput[] {
  return [
    playerInput({ playerId: 'p1', remainingTilePoints: 10 }),
    playerInput({ playerId: 'p2', remainingTilePoints: 30 }),
    playerInput({
      playerId: 'p3',
      remainingTilePoints: 50,
      remainingOkeyCount: 1,
    }),
    playerInput({ playerId: 'p4', remainingTilePoints: 20 }),
  ];
}

describe('calculateRound', () => {
  it('can be imported', () => {
    expect(typeof calculateRound).toBe('function');
  });

  it('gives 202 points for didNotOpen', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({ playerId: 'p1', openType: 'didNotOpen' }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(202);
  });

  it('gives remaining tile points for series open', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({
          playerId: 'p1',
          openType: 'series',
          remainingTilePoints: 47,
        }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(47);
  });

  it('gives remaining tile points times 2 for doubles open', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({
          playerId: 'p1',
          openType: 'doubles',
          remainingTilePoints: 47,
        }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(94);
  });

  it('adds 101 for one remaining okey', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({ playerId: 'p1', remainingOkeyCount: 1 }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(101);
  });

  it('adds 101 for one wrong open', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({ playerId: 'p1', wrongOpenCount: 1 }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(101);
  });

  it('adds 101 for one playable tile discard', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({ playerId: 'p1', playableTileDiscardCount: 1 }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(101);
  });

  it('adds manualPenalty to the player score', () => {
    const result = calculateRound(
      roundWithPlayers([
        playerInput({ playerId: 'p1', manualPenalty: 33 }),
        playerInput({ playerId: 'p2' }),
        playerInput({ playerId: 'p3' }),
        playerInput({ playerId: 'p4' }),
      ]),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(33);
  });

  it('applies finish team bonus when finishType is normal', () => {
    const result = calculateRound(
      roundWithPlayers(
        [
          playerInput({ playerId: 'p1' }),
          playerInput({ playerId: 'p2' }),
          playerInput({ playerId: 'p3' }),
          playerInput({ playerId: 'p4' }),
        ],
        { finishType: 'normal', finisherPlayerId: 'p1' },
      ),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(result.finishTeamBonus).toEqual({ teamId: 't1', amount: -101 });
    expect(result.teams.find((team) => team.teamId === 't1')?.score).toBe(-101);
  });

  it('multiplies opponent penalties by 2 and applies -202 bonus on okey finish', () => {
    const result = calculateRound(
      roundWithPlayers(finishedRoundPlayers(), {
        finishType: 'okey',
        finisherPlayerId: 'p1',
      }),
      DEFAULT_SCORE_RULES,
      roster,
    );

    // opponents: (50+101)*2=302, 20*2=40; finisher/partner default 0
    expect(scoreOf(result, 'p1')).toBe(0);
    expect(scoreOf(result, 'p2')).toBe(0);
    expect(scoreOf(result, 'p3')).toBe(302);
    expect(scoreOf(result, 'p4')).toBe(40);

    expect(result.finishTeamBonus).toEqual({ teamId: 't1', amount: -202 });
    expect(teamScoreOf(result, 't1')).toBe(-202);
    expect(teamScoreOf(result, 't2')).toBe(342);
  });

  it('multiplies opponent penalties by 2 and applies -202 bonus on fromHand finish', () => {
    const result = calculateRound(
      roundWithPlayers(finishedRoundPlayers(), {
        finishType: 'fromHand',
        finisherPlayerId: 'p1',
      }),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(0);
    expect(scoreOf(result, 'p2')).toBe(0);
    expect(scoreOf(result, 'p3')).toBe(302);
    expect(scoreOf(result, 'p4')).toBe(40);

    expect(result.finishTeamBonus).toEqual({ teamId: 't1', amount: -202 });
    expect(teamScoreOf(result, 't1')).toBe(-202);
    expect(teamScoreOf(result, 't2')).toBe(342);
  });

  it('multiplies opponent penalties by 4 and applies -404 bonus on fromHandAndOkey finish', () => {
    const result = calculateRound(
      roundWithPlayers(finishedRoundPlayers(), {
        finishType: 'fromHandAndOkey',
        finisherPlayerId: 'p1',
      }),
      DEFAULT_SCORE_RULES,
      roster,
    );

    // opponents: (50+101)*4=604, 20*4=80
    expect(scoreOf(result, 'p1')).toBe(0);
    expect(scoreOf(result, 'p2')).toBe(0);
    expect(scoreOf(result, 'p3')).toBe(604);
    expect(scoreOf(result, 'p4')).toBe(80);

    expect(result.finishTeamBonus).toEqual({ teamId: 't1', amount: -404 });
    expect(teamScoreOf(result, 't1')).toBe(-404);
    expect(teamScoreOf(result, 't2')).toBe(684);
  });

  it('multiplies only the base penalty when extraPenaltyTiming is afterFinishMultiplier', () => {
    const rules: ScoreRules = {
      ...DEFAULT_SCORE_RULES,
      extraPenaltyTiming: 'afterFinishMultiplier',
    };

    const result = calculateRound(
      roundWithPlayers(finishedRoundPlayers(), {
        finishType: 'okey',
        finisherPlayerId: 'p1',
      }),
      rules,
      roster,
    );

    // opponents: 50*2+101=201, 20*2+0=40 (extras not multiplied)
    expect(scoreOf(result, 'p1')).toBe(0);
    expect(scoreOf(result, 'p2')).toBe(0);
    expect(scoreOf(result, 'p3')).toBe(201);
    expect(scoreOf(result, 'p4')).toBe(40);

    expect(result.finishTeamBonus).toEqual({ teamId: 't1', amount: -202 });
    expect(teamScoreOf(result, 't1')).toBe(-202);
    expect(teamScoreOf(result, 't2')).toBe(241);
  });

  it('applies no finish multiplier or team bonus when finishType is none', () => {
    const result = calculateRound(
      roundWithPlayers(finishedRoundPlayers(), {
        finishType: 'none',
        finisherPlayerId: null,
      }),
      DEFAULT_SCORE_RULES,
      roster,
    );

    expect(scoreOf(result, 'p1')).toBe(10);
    expect(scoreOf(result, 'p2')).toBe(30);
    expect(scoreOf(result, 'p3')).toBe(151);
    expect(scoreOf(result, 'p4')).toBe(20);

    expect(result.finishTeamBonus).toEqual({ teamId: null, amount: 0 });
    expect(teamScoreOf(result, 't1')).toBe(40);
    expect(teamScoreOf(result, 't2')).toBe(171);
  });
});

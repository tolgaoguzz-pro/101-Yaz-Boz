import { calculateRound } from '../calculateRound';
import { Player, PlayerRoundInput, RoundInput } from '../models';
import { DEFAULT_SCORE_RULES } from '../rules';

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
});

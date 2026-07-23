import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
} from '../screens/ActiveGameScreen';
import {
  calculateGameResult,
  createRematchGame,
  isGameComplete,
} from '../gameResult';

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

function makeGame(overrides: Partial<ActiveGameData> = {}): ActiveGameData {
  const {
    teams: overrideTeams,
    rounds: overrideRounds,
    ...rest
  } = overrides;

  return {
    roundNumber: 13,
    lastAction: null,
    targetRoundCount: 12,
    ...rest,
    teams: overrideTeams ?? [
      team('Oğuz Ailesi', 188, [
        player('player-1', 'Tolga', 100),
        player('player-2', 'Aygül', 88),
      ]),
      team('Güldiken Ailesi', 120, [
        player('player-3', 'Şahin', 70),
        player('player-4', 'Mashhura', 50),
      ]),
    ],
    rounds:
      overrideRounds ??
      Array.from({ length: 12 }, (_, index) => ({
        roundNumber: index + 1,
        players: [],
        teams: [],
        finishTeamBonus: { teamId: null, amount: 0 },
      })),
  };
}

describe('isGameComplete', () => {
  it('is false when no rounds were played', () => {
    expect(
      isGameComplete(
        makeGame({
          rounds: [],
          targetRoundCount: 12,
        }),
      ),
    ).toBe(false);
  });

  it('uses fallback target 12 when targetRoundCount is missing', () => {
    expect(
      isGameComplete(
        makeGame({
          targetRoundCount: undefined,
          rounds: Array.from({ length: 11 }, (_, index) => ({
            roundNumber: index + 1,
            players: [],
            teams: [],
            finishTeamBonus: { teamId: null, amount: 0 },
          })),
        }),
      ),
    ).toBe(false);

    expect(
      isGameComplete(
        makeGame({
          targetRoundCount: undefined,
          rounds: Array.from({ length: 12 }, (_, index) => ({
            roundNumber: index + 1,
            players: [],
            teams: [],
            finishTeamBonus: { teamId: null, amount: 0 },
          })),
        }),
      ),
    ).toBe(true);
  });

  it('is true when played rounds reach the target', () => {
    expect(
      isGameComplete(
        makeGame({
          targetRoundCount: 8,
          rounds: Array.from({ length: 8 }, (_, index) => ({
            roundNumber: index + 1,
            players: [],
            teams: [],
            finishTeamBonus: { teamId: null, amount: 0 },
          })),
        }),
      ),
    ).toBe(true);
  });
});

describe('calculateGameResult', () => {
  it('picks the team with the higher total score as winner', () => {
    const result = calculateGameResult(makeGame());
    expect(result.winner).toEqual({
      kind: 'winner',
      teamName: 'Oğuz Ailesi',
      teamScore: 188,
      otherTeamName: 'Güldiken Ailesi',
      otherTeamScore: 120,
    });
  });

  it('reports a tie when team totals are equal', () => {
    const result = calculateGameResult(
      makeGame({
        teams: [
          team('Oğuz Ailesi', 150, [
            player('player-1', 'Tolga', 80),
            player('player-2', 'Aygül', 70),
          ]),
          team('Güldiken Ailesi', 150, [
            player('player-3', 'Şahin', 90),
            player('player-4', 'Mashhura', 60),
          ]),
        ],
      }),
    );

    expect(result.winner).toEqual({
      kind: 'tie',
      team1Name: 'Oğuz Ailesi',
      team1Score: 150,
      team2Name: 'Güldiken Ailesi',
      team2Score: 150,
    });
  });

  it('ranks players by individual totalScore descending', () => {
    const result = calculateGameResult(makeGame());
    expect(result.standings.map((row) => row.name)).toEqual([
      'Tolga',
      'Aygül',
      'Şahin',
      'Mashhura',
    ]);
    expect(result.standings.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
    expect(result.topScorer).toEqual({
      rank: 1,
      playerId: 'player-1',
      name: 'Tolga',
      totalScore: 100,
    });
  });

  it('keeps roster order when individual scores are tied', () => {
    const result = calculateGameResult(
      makeGame({
        teams: [
          team('Takım 1', 100, [
            player('player-1', 'Tolga', 50),
            player('player-2', 'Aygül', 50),
          ]),
          team('Takım 2', 100, [
            player('player-3', 'Şahin', 50),
            player('player-4', 'Mashhura', 50),
          ]),
        ],
      }),
    );

    expect(result.standings.map((row) => row.name)).toEqual([
      'Tolga',
      'Aygül',
      'Şahin',
      'Mashhura',
    ]);
  });
});

describe('createRematchGame', () => {
  it('resets scores and rounds while keeping the same roster', () => {
    const previous = makeGame({ targetRoundCount: 16 });
    const rematch = createRematchGame(previous);

    expect(rematch.roundNumber).toBe(1);
    expect(rematch.rounds).toEqual([]);
    expect(rematch.lastAction).toBeNull();
    expect(rematch.teams[0].name).toBe('Oğuz Ailesi');
    expect(rematch.teams[1].name).toBe('Güldiken Ailesi');
    expect(rematch.teams[0].totalScore).toBe(0);
    expect(rematch.teams[1].totalScore).toBe(0);
    expect(rematch.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(rematch.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(rematch.teams[0].players.map((p) => p.totalScore)).toEqual([0, 0]);
    expect(rematch.teams[1].players.map((p) => p.totalScore)).toEqual([0, 0]);
    expect(rematch.teams[0].players.map((p) => p.id)).toEqual([
      'player-1',
      'player-2',
    ]);
  });

  it('preserves targetRoundCount and falls back to 12 when missing', () => {
    expect(createRematchGame(makeGame({ targetRoundCount: 8 })).targetRoundCount).toBe(
      8,
    );
    expect(
      createRematchGame(makeGame({ targetRoundCount: undefined })).targetRoundCount,
    ).toBe(12);
  });

  it('defaults missing gameMode to paired on rematch', () => {
    expect(createRematchGame(makeGame({ gameMode: undefined })).gameMode).toBe(
      'paired',
    );
  });
});

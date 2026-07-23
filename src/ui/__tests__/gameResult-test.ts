import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
  SavedRoundSummary,
} from '../screens/ActiveGameScreen';
import {
  calculateGameResult,
  createRematchGame,
  isGameComplete,
  rankPlayersByPenaltyAscending,
  rosterPlayersInOrder,
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

function makeRounds(count: number): SavedRoundSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    roundNumber: index + 1,
    players: [],
    teams: [],
    finishTeamBonus: { teamId: null, amount: 0 },
  }));
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
    gameMode: 'paired',
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
    rounds: overrideRounds ?? makeRounds(12),
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
          rounds: makeRounds(11),
        }),
      ),
    ).toBe(false);

    expect(
      isGameComplete(
        makeGame({
          targetRoundCount: undefined,
          rounds: makeRounds(12),
        }),
      ),
    ).toBe(true);
  });

  it('is true when played rounds reach the target', () => {
    expect(
      isGameComplete(
        makeGame({
          targetRoundCount: 8,
          rounds: makeRounds(8),
        }),
      ),
    ).toBe(true);
  });
});

describe('calculateGameResult paired (lower penalty wins)', () => {
  it('picks the team with the lower total score as winner', () => {
    const result = calculateGameResult(makeGame());
    expect(result.mode).toBe('paired');
    expect(result.pairedWinner).toEqual({
      kind: 'winner',
      teamName: 'Güldiken Ailesi',
      teamScore: 120,
      otherTeamName: 'Oğuz Ailesi',
      otherTeamScore: 188,
    });
    expect(result.isTie).toBe(false);
  });

  it('treats the higher team score as the loser', () => {
    const result = calculateGameResult(makeGame());
    expect(result.pairedWinner?.kind).toBe('winner');
    if (result.pairedWinner?.kind === 'winner') {
      expect(result.pairedWinner.otherTeamScore).toBeGreaterThan(
        result.pairedWinner.teamScore,
      );
    }
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

    expect(result.pairedWinner).toEqual({
      kind: 'tie',
      team1Name: 'Oğuz Ailesi',
      team1Score: 150,
      team2Name: 'Güldiken Ailesi',
      team2Score: 150,
    });
    expect(result.isTie).toBe(true);
  });

  it('ranks players by individual totalScore ascending', () => {
    const result = calculateGameResult(makeGame());
    expect(result.standings.map((row) => row.name)).toEqual([
      'Mashhura',
      'Şahin',
      'Aygül',
      'Tolga',
    ]);
    expect(result.standings.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
    expect(result.firstPlacePlayers).toEqual([
      {
        rank: 1,
        playerId: 'player-4',
        name: 'Mashhura',
        totalScore: 50,
      },
    ]);
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
    expect(result.firstPlacePlayers).toHaveLength(4);
  });

  it('falls back to paired when gameMode is undefined', () => {
    const result = calculateGameResult(
      makeGame({ gameMode: undefined }),
    );
    expect(result.mode).toBe('paired');
    expect(result.pairedWinner).not.toBeNull();
    expect(result.individualWinner).toBeNull();
  });
});

describe('calculateGameResult individual', () => {
  it('picks the lowest player score as winner', () => {
    const result = calculateGameResult(
      makeGame({
        gameMode: 'individual',
        teams: [
          team('Takım 1', 0, [
            player('player-1', 'Tolga', 42),
            player('player-2', 'Aygül', 67),
          ]),
          team('Takım 2', 0, [
            player('player-3', 'Şahin', 88),
            player('player-4', 'Mashhura', 103),
          ]),
        ],
      }),
    );

    expect(result.mode).toBe('individual');
    expect(result.pairedWinner).toBeNull();
    expect(result.individualWinner).toEqual({
      kind: 'winner',
      playerId: 'player-1',
      name: 'Tolga',
      totalScore: 42,
    });
    expect(result.standings.map((row) => row.name)).toEqual([
      'Tolga',
      'Aygül',
      'Şahin',
      'Mashhura',
    ]);
  });

  it('reports a tie when multiple players share the lowest score', () => {
    const result = calculateGameResult(
      makeGame({
        gameMode: 'individual',
        teams: [
          team('Takım 1', 0, [
            player('player-1', 'Tolga', 40),
            player('player-2', 'Aygül', 40),
          ]),
          team('Takım 2', 0, [
            player('player-3', 'Şahin', 80),
            player('player-4', 'Mashhura', 90),
          ]),
        ],
      }),
    );

    expect(result.isTie).toBe(true);
    expect(result.individualWinner).toEqual({
      kind: 'tie',
      players: [
        { playerId: 'player-1', name: 'Tolga', totalScore: 40 },
        { playerId: 'player-2', name: 'Aygül', totalScore: 40 },
      ],
    });
  });
});

describe('active standings helpers', () => {
  it('orders players low-to-high with stable roster ties', () => {
    const game = makeGame({
      gameMode: 'individual',
      teams: [
        team('Takım 1', 0, [
          player('player-1', 'Tolga', 50),
          player('player-2', 'Aygül', 40),
        ]),
        team('Takım 2', 0, [
          player('player-3', 'Şahin', 40),
          player('player-4', 'Mashhura', 60),
        ]),
      ],
    });

    const ranked = rankPlayersByPenaltyAscending(rosterPlayersInOrder(game));
    expect(ranked.map((row) => row.name)).toEqual([
      'Aygül',
      'Şahin',
      'Tolga',
      'Mashhura',
    ]);
  });

  it('keeps roster order for round history player lists', () => {
    const game = makeGame({ gameMode: 'individual' });
    expect(rosterPlayersInOrder(game).map((p) => p.name)).toEqual([
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
    expect(rematch.gameMode).toBe('paired');
  });

  it('preserves targetRoundCount and falls back to 12 when missing', () => {
    expect(createRematchGame(makeGame({ targetRoundCount: 8 })).targetRoundCount).toBe(
      8,
    );
    expect(
      createRematchGame(makeGame({ targetRoundCount: undefined })).targetRoundCount,
    ).toBe(12);
  });

  it('preserves individual gameMode and roster on rematch', () => {
    const rematch = createRematchGame(
      makeGame({
        gameMode: 'individual',
        targetRoundCount: 8,
        teams: [
          team('Takım 1', 99, [
            player('player-1', 'Tolga', 40),
            player('player-2', 'Aygül', 59),
          ]),
          team('Takım 2', 80, [
            player('player-3', 'Şahin', 30),
            player('player-4', 'Mashhura', 50),
          ]),
        ],
      }),
    );

    expect(rematch.gameMode).toBe('individual');
    expect(rematch.targetRoundCount).toBe(8);
    expect(rematch.teams[0].players.map((p) => p.name)).toEqual([
      'Tolga',
      'Aygül',
    ]);
    expect(rematch.teams[1].players.map((p) => p.name)).toEqual([
      'Şahin',
      'Mashhura',
    ]);
    expect(rematch.teams[0].totalScore).toBe(0);
  });

  it('defaults missing gameMode to paired on rematch', () => {
    expect(createRematchGame(makeGame({ gameMode: undefined })).gameMode).toBe(
      'paired',
    );
  });
});

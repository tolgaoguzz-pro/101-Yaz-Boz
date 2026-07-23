import {
  buildCompletedGameRecord,
  createCompletedGameId,
} from '../completedGame';
import {
  buildAllMatchupSeries,
  calculateMatchupSeries,
  formatPairedSeriesHeadline,
  normalizeTeamIdentity,
  rankIndividualSeries,
} from '../tournament';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../../ui/newGameSetup';
import { ActiveGameData } from '../../ui/screens/ActiveGameScreen';
import { CompletedGameRecord } from '../completedGame';

function pairedGame(scores: [number, number], completedAt: string): CompletedGameRecord {
  const game = buildActiveGameFromSetup({
    ...DEFAULT_NEW_GAME_FORM,
    team1Name: 'A',
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    team2Name: 'B',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'paired',
    targetRoundCount: 2,
  });
  game.status = 'completed';
  game.completedAt = completedAt;
  game.startedAt = completedAt;
  game.rounds = [
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
  ];
  game.teams[0].totalScore = scores[0];
  game.teams[1].totalScore = scores[1];
  return buildCompletedGameRecord(game, createCompletedGameId(), completedAt);
}

function swappedSidesGame(
  scores: [number, number],
  completedAt: string,
): CompletedGameRecord {
  const game = buildActiveGameFromSetup({
    ...DEFAULT_NEW_GAME_FORM,
    team1Name: 'B',
    player1Name: 'Şahin',
    player2Name: 'Mashhura',
    team2Name: 'A',
    player3Name: 'Tolga',
    player4Name: 'Aygül',
    gameMode: 'paired',
    targetRoundCount: 2,
  });
  game.status = 'completed';
  game.completedAt = completedAt;
  game.startedAt = completedAt;
  game.rounds = [
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
  ];
  // Ekranda B tarafı solda; skorlar [B, A]
  game.teams[0].totalScore = scores[0];
  game.teams[1].totalScore = scores[1];
  return buildCompletedGameRecord(game, createCompletedGameId(), completedAt);
}

function individualGame(
  scores: [number, number, number, number],
  completedAt: string,
): CompletedGameRecord {
  const game: ActiveGameData = buildActiveGameFromSetup({
    ...DEFAULT_NEW_GAME_FORM,
    player1Name: 'Tolga',
    player2Name: 'Aygül',
    player3Name: 'Şahin',
    player4Name: 'Mashhura',
    gameMode: 'individual',
    targetRoundCount: 2,
  });
  game.status = 'completed';
  game.completedAt = completedAt;
  game.startedAt = completedAt;
  game.rounds = [
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
  ];
  game.teams[0].players[0].totalScore = scores[0];
  game.teams[0].players[1].totalScore = scores[1];
  game.teams[1].players[0].totalScore = scores[2];
  game.teams[1].players[1].totalScore = scores[3];
  game.teams[0].totalScore = scores[0] + scores[1];
  game.teams[1].totalScore = scores[2] + scores[3];
  return buildCompletedGameRecord(game, createCompletedGameId(), completedAt);
}

describe('normalizeTeamIdentity', () => {
  it('ignores teammate order', () => {
    expect(normalizeTeamIdentity('Tolga', 'Aygül').key).toBe(
      normalizeTeamIdentity('Aygül', 'Tolga').key,
    );
  });
});

describe('calculateMatchupSeries paired', () => {
  it('groups same matchup and keeps sides stable when sides swap', () => {
    const g1 = pairedGame([40, 80], '2026-07-01T00:00:00.000Z'); // A wins
    const g2 = swappedSidesGame([90, 30], '2026-07-02T00:00:00.000Z'); // B=90, A=30 → A wins again
    const g3 = pairedGame([50, 50], '2026-07-03T00:00:00.000Z'); // tie
    expect(g1.matchupKey).toBe(g2.matchupKey);

    const series = calculateMatchupSeries([g1, g2, g3]);
    expect(series).not.toBeNull();
    expect(series!.totalGames).toBe(3);
    expect(series!.paired?.winsA).toBe(2);
    expect(series!.paired?.winsB).toBe(0);
    expect(series!.paired?.ties).toBe(1);
    expect(series!.lastPlayedAt).toBe('2026-07-03T00:00:00.000Z');
    expect(formatPairedSeriesHeadline(series!.paired!)).toContain('2 - 0');
  });

  it('separates different partnerships', () => {
    const same = pairedGame([10, 20], '2026-07-01T00:00:00.000Z');
    const otherGame = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      player1Name: 'Tolga',
      player2Name: 'Şahin',
      player3Name: 'Aygül',
      player4Name: 'Mashhura',
      gameMode: 'paired',
      targetRoundCount: 2,
    });
    otherGame.status = 'completed';
    otherGame.completedAt = '2026-07-02T00:00:00.000Z';
    otherGame.rounds = same.rounds;
    otherGame.teams[0].totalScore = 10;
    otherGame.teams[1].totalScore = 20;
    const other = buildCompletedGameRecord(otherGame, 'other');
    expect(same.matchupKey).not.toBe(other.matchupKey);
    const all = buildAllMatchupSeries([same, other]);
    expect(all).toHaveLength(2);
  });
});

describe('rankIndividualSeries', () => {
  it('ranks by wins with lower average penalty tie-break', () => {
    const g1 = individualGame([10, 40, 50, 60], '2026-07-01T00:00:00.000Z');
    const g2 = individualGame([20, 5, 40, 50], '2026-07-02T00:00:00.000Z');
    const ranked = rankIndividualSeries([g1, g2]);
    expect(ranked[0].name).toBe('Tolga');
    expect(ranked[0].wins).toBe(1);
    expect(ranked.find((row) => row.name === 'Aygül')?.wins).toBe(1);
  });

  it('counts shared wins on ties', () => {
    const tie = individualGame([10, 10, 40, 50], '2026-07-01T00:00:00.000Z');
    const ranked = rankIndividualSeries([tie]);
    const tolga = ranked.find((row) => row.name === 'Tolga');
    const aygul = ranked.find((row) => row.name === 'Aygül');
    expect(tolga?.sharedWins).toBe(1);
    expect(aygul?.sharedWins).toBe(1);
    expect(tolga?.wins).toBe(0);
  });
});

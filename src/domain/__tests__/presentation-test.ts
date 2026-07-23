import { APP_INFO, DEVELOPER_CREDIT } from '../../config/appInfo';
import {
  buildSeriesSummaryLine,
  buildTournamentListCard,
  formatSafeDateTime,
} from '../../ui/tournamentPresentation';
import {
  calculateMatchupSeries,
} from '../tournament';
import {
  buildCompletedGameRecord,
  createCompletedGameId,
} from '../completedGame';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../../ui/newGameSetup';

describe('APP_INFO', () => {
  it('exposes central about constants', () => {
    expect(APP_INFO.name).toBe('101 Yaz-Boz');
    expect(APP_INFO.developer).toBe('Tolga Oğuz');
    expect(DEVELOPER_CREDIT).toContain('Tolga Oğuz');
    expect(APP_INFO.version).toBeTruthy();
  });
});

describe('tournamentPresentation', () => {
  it('builds list card and series summary safely', () => {
    const game = buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'paired',
      targetRoundCount: 2,
    });
    game.status = 'completed';
    game.completedAt = '2026-07-20T12:00:00.000Z';
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
    game.teams[0].totalScore = 30;
    game.teams[1].totalScore = 90;
    const record = buildCompletedGameRecord(game, createCompletedGameId());
    const series = calculateMatchupSeries([record]);
    expect(series).not.toBeNull();
    const card = buildTournamentListCard(series!);
    expect(card.subtitle).toContain('1 - 0');
    expect(buildSeriesSummaryLine(series)).toContain('1 - 0');
    expect(formatSafeDateTime('not-a-date')).toBe('not-a-date');
  });
});

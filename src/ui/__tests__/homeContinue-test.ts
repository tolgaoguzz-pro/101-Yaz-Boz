import { abandonGame, finishGameEarly, pauseGame } from '../gameLifecycle';
import {
  invokeHomeContinue,
  resolveHomeContinuableGame,
  shouldEnableHomeContinue,
} from '../homeContinue';
import { buildActiveGameFromSetup, DEFAULT_NEW_GAME_FORM } from '../newGameSetup';
import { ActiveGameData } from '../screens/ActiveGameScreen';

function makeActiveGame(
  overrides: Partial<ActiveGameData> = {},
): ActiveGameData {
  return {
    ...buildActiveGameFromSetup({
      ...DEFAULT_NEW_GAME_FORM,
      team1Name: 'Takım 1',
      team2Name: 'Takım 2',
      player1Name: 'Tolga',
      player2Name: 'Aygül',
      player3Name: 'Şahin',
      player4Name: 'Mashhura',
      gameMode: 'paired',
      targetRoundCount: 12,
    }),
    ...overrides,
  };
}

describe('homeContinue', () => {
  it('calls onContinue for an active game', () => {
    const onContinue = jest.fn();
    const game = makeActiveGame({ status: 'active' });

    expect(shouldEnableHomeContinue(game)).toBe(true);
    expect(resolveHomeContinuableGame(game)).toBe(game);
    expect(invokeHomeContinue(game, onContinue)).toBe(true);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue for a paused game', () => {
    const onContinue = jest.fn();
    const game = pauseGame(makeActiveGame());

    expect(game.status).toBe('paused');
    expect(shouldEnableHomeContinue(game)).toBe(true);
    expect(invokeHomeContinue(game, onContinue)).toBe(true);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('does not call onContinue when there is no game', () => {
    const onContinue = jest.fn();

    expect(shouldEnableHomeContinue(null)).toBe(false);
    expect(resolveHomeContinuableGame(null)).toBeNull();
    expect(invokeHomeContinue(null, onContinue)).toBe(false);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('does not produce a continue card for completed or abandoned games', () => {
    const onContinue = jest.fn();
    const completed = finishGameEarly(makeActiveGame());
    const abandoned = abandonGame(makeActiveGame());

    expect(shouldEnableHomeContinue(completed)).toBe(false);
    expect(resolveHomeContinuableGame(completed)).toBeNull();
    expect(invokeHomeContinue(completed, onContinue)).toBe(false);

    expect(shouldEnableHomeContinue(abandoned)).toBe(false);
    expect(resolveHomeContinuableGame(abandoned)).toBeNull();
    expect(invokeHomeContinue(abandoned, onContinue)).toBe(false);

    expect(onContinue).not.toHaveBeenCalled();
  });
});

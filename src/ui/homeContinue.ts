import { isContinuableActiveGame } from '../persistence/activeGameSnapshot';
import { ActiveGameData } from './screens/ActiveGameScreen';

/**
 * Home “Devam Eden Oyun” kartında gösterilecek / tıklanabilir oyun.
 * completed / abandoned asla devam kartı üretmez.
 */
export function resolveHomeContinuableGame(
  game: ActiveGameData | null | undefined,
): ActiveGameData | null {
  if (!game) {
    return null;
  }
  return isContinuableActiveGame(game) ? game : null;
}

export function shouldEnableHomeContinue(
  game: ActiveGameData | null | undefined,
): boolean {
  return resolveHomeContinuableGame(game) != null;
}

/** Home devam kartı onPress — pasifken callback çağrılmaz. */
export function invokeHomeContinue(
  game: ActiveGameData | null | undefined,
  onContinue: () => void,
): boolean {
  if (!shouldEnableHomeContinue(game)) {
    return false;
  }
  onContinue();
  return true;
}

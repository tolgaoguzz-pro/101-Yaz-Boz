import { PlayerRoundInput } from '../models';
import { OpenBaseRules } from '../rules';

export function basePenalty(
  player: PlayerRoundInput,
  openBase: OpenBaseRules,
): number {
  switch (player.openType) {
    case 'didNotOpen':
      return openBase.didNotOpenPenalty;
    case 'series':
      return player.remainingTilePoints * openBase.seriesTileSumMultiplier;
    case 'doubles':
      return player.remainingTilePoints * openBase.doublesTileSumMultiplier;
  }
}

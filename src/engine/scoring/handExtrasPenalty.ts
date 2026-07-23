import { PlayerRoundInput } from '../models';
import { HandExtrasRules } from '../rules';

export function handExtrasPenalty(
  player: PlayerRoundInput,
  handExtras: HandExtrasRules,
): number {
  return (
    player.remainingOkeyCount * handExtras.okeyPenalty +
    player.wrongOpenCount * handExtras.wrongOpenPenalty +
    player.playableTileDiscardCount * handExtras.playableTileDiscardPenalty +
    player.manualPenalty
  );
}

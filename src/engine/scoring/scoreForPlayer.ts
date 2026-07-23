import { FinishType, Player, PlayerRoundInput } from '../models';
import { ScoreRules } from '../rules';
import { requireTeamId } from '../teams/requireTeamId';
import { applyExtrasWithFinishMultiplier } from './applyExtrasWithFinishMultiplier';
import { basePenalty } from './basePenalty';
import { handExtrasPenalty } from './handExtrasPenalty';

export function scoreForPlayer(
  player: PlayerRoundInput,
  rules: ScoreRules,
  finishType: FinishType,
  finisherPlayerId: string | null,
  finisherTeamId: string | null,
  finishMultiplier: number,
  roster: Player[],
): number {
  const base = basePenalty(player, rules.openBase);
  const extras = handExtrasPenalty(player, rules.handExtras);

  if (finishType === 'none') {
    return base + extras;
  }

  if (player.playerId === finisherPlayerId) {
    return 0;
  }

  const playerTeamId = requireTeamId(roster, player.playerId);

  if (finisherTeamId !== null && playerTeamId === finisherTeamId) {
    switch (rules.finisherPartner.penaltyMode) {
      case 'fixed':
        return rules.finisherPartner.fixedPenalty;
      case 'calculated':
        return base + extras;
    }
  }

  return applyExtrasWithFinishMultiplier(
    base,
    extras,
    finishMultiplier,
    rules.extraPenaltyTiming,
  );
}

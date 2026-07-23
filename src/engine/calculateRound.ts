import {
  FinishType,
  Player,
  PlayerRoundInput,
  RoundInput,
} from './models';
import {
  ExtraPenaltyTiming,
  HandExtrasRules,
  OpenBaseRules,
  ScoreRules,
} from './rules';

export type PlayerRoundScore = {
  playerId: string;
  score: number;
};

export type CalculateRoundResult = {
  players: PlayerRoundScore[];
  finishTeamBonus: number;
};

function basePenalty(
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

function handExtrasPenalty(
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

function opponentFinishMultiplier(
  finishType: FinishType,
  rules: ScoreRules,
): number {
  switch (finishType) {
    case 'normal':
      return rules.opponentFinishMultiplier.normal;
    case 'okey':
      return rules.opponentFinishMultiplier.okey;
    case 'fromHand':
      return rules.opponentFinishMultiplier.fromHand;
    case 'fromHandAndOkey':
      return rules.opponentFinishMultiplier.fromHandAndOkey;
    case 'none':
      return rules.opponentFinishMultiplier.none;
  }
}

function finishTeamBonus(finishType: FinishType, rules: ScoreRules): number {
  switch (finishType) {
    case 'normal':
      return rules.finishTeamBonus.normal;
    case 'okey':
      return rules.finishTeamBonus.okey;
    case 'fromHand':
      return rules.finishTeamBonus.fromHand;
    case 'fromHandAndOkey':
      return rules.finishTeamBonus.fromHandAndOkey;
    case 'none':
      return 0;
  }
}

function findTeamId(roster: Player[], playerId: string): string | null {
  const player = roster.find((entry) => entry.id === playerId);
  return player ? player.teamId : null;
}

function isOpponent(
  playerId: string,
  finisherPlayerId: string | null,
  roster: Player[],
): boolean {
  if (finisherPlayerId === null) {
    return false;
  }

  const finisherTeamId = findTeamId(roster, finisherPlayerId);
  const playerTeamId = findTeamId(roster, playerId);

  if (finisherTeamId === null || playerTeamId === null) {
    return false;
  }

  return playerTeamId !== finisherTeamId;
}

function playerScore(
  player: PlayerRoundInput,
  rules: ScoreRules,
  applyFinishMultiplier: boolean,
  finishMultiplier: number,
): number {
  const base = basePenalty(player, rules.openBase);
  const extras = handExtrasPenalty(player, rules.handExtras);

  if (!applyFinishMultiplier) {
    return base + extras;
  }

  return applyExtrasWithFinishMultiplier(
    base,
    extras,
    finishMultiplier,
    rules.extraPenaltyTiming,
  );
}

function applyExtrasWithFinishMultiplier(
  base: number,
  extras: number,
  finishMultiplier: number,
  timing: ExtraPenaltyTiming,
): number {
  switch (timing) {
    case 'beforeFinishMultiplier':
      return (base + extras) * finishMultiplier;
    case 'afterFinishMultiplier':
      return base * finishMultiplier + extras;
  }
}

/**
 * @param roster Game players with teamId — used to detect opponents of the finisher.
 */
export function calculateRound(
  input: RoundInput,
  rules: ScoreRules,
  roster: Player[],
): CalculateRoundResult {
  const { finishType, finisherPlayerId } = input.finish;
  const finishMultiplier = opponentFinishMultiplier(finishType, rules);

  const players = input.players.map((player) => {
    const applyFinishMultiplier = isOpponent(
      player.playerId,
      finisherPlayerId,
      roster,
    );

    return {
      playerId: player.playerId,
      score: playerScore(
        player,
        rules,
        applyFinishMultiplier,
        finishMultiplier,
      ),
    };
  });

  return {
    players,
    finishTeamBonus: finishTeamBonus(finishType, rules),
  };
}

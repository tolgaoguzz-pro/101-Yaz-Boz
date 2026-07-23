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

export type TeamRoundScore = {
  teamId: string;
  score: number;
};

export type FinishTeamBonusResult = {
  teamId: string | null;
  amount: number;
};

export type CalculateRoundResult = {
  players: PlayerRoundScore[];
  teams: TeamRoundScore[];
  finishTeamBonus: FinishTeamBonusResult;
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

function finishTeamBonusAmount(
  finishType: FinishType,
  rules: ScoreRules,
): number {
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

function requireTeamId(roster: Player[], playerId: string): string {
  const player = roster.find((entry) => entry.id === playerId);
  if (!player) {
    throw new Error(`Player "${playerId}" is not in the roster.`);
  }
  if (!player.teamId) {
    throw new Error(`Player "${playerId}" is missing a teamId.`);
  }
  return player.teamId;
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

function validateRoundInput(
  input: RoundInput,
  roster: Player[],
): void {
  if (input.players.length !== 4) {
    throw new Error(
      `Round must contain exactly 4 players, got ${input.players.length}.`,
    );
  }

  if (roster.length !== 4) {
    throw new Error(
      `Roster must contain exactly 4 players, got ${roster.length}.`,
    );
  }

  const roundIds = input.players.map((player) => player.playerId);
  const rosterIds = roster.map((player) => player.id);

  if (new Set(roundIds).size !== 4) {
    throw new Error('Round playerIds must be unique.');
  }

  if (new Set(rosterIds).size !== 4) {
    throw new Error('Roster player ids must be unique.');
  }

  const roundIdSet = new Set(roundIds);
  const rosterIdSet = new Set(rosterIds);

  for (const id of roundIds) {
    if (!rosterIdSet.has(id)) {
      throw new Error(
        `Round playerId "${id}" is missing from the roster.`,
      );
    }
  }

  for (const id of rosterIds) {
    if (!roundIdSet.has(id)) {
      throw new Error(
        `Roster player "${id}" is missing from the round input.`,
      );
    }
  }

  const teamIds = roster.map((player) => {
    if (!player.teamId) {
      throw new Error(`Player "${player.id}" is missing a teamId.`);
    }
    return player.teamId;
  });

  const uniqueTeamIds = [...new Set(teamIds)];
  if (uniqueTeamIds.length !== 2) {
    throw new Error(
      `Roster must contain exactly 2 teams, got ${uniqueTeamIds.length}.`,
    );
  }

  for (const teamId of uniqueTeamIds) {
    const count = teamIds.filter((id) => id === teamId).length;
    if (count !== 2) {
      throw new Error(
        `Team "${teamId}" must have exactly 2 players, got ${count}.`,
      );
    }
  }

  const { finishType, finisherPlayerId } = input.finish;

  if (finishType === 'none') {
    if (finisherPlayerId !== null) {
      throw new Error(
        'finisherPlayerId must be null when finishType is "none".',
      );
    }
    return;
  }

  if (finisherPlayerId === null) {
    throw new Error(
      `finisherPlayerId is required when finishType is "${finishType}".`,
    );
  }

  if (!rosterIdSet.has(finisherPlayerId)) {
    throw new Error(
      `finisherPlayerId "${finisherPlayerId}" is not in the roster.`,
    );
  }
}

function scoreForPlayer(
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

/**
 * @param roster Game players with teamId — used for teams, partners, and opponents.
 */
export function calculateRound(
  input: RoundInput,
  rules: ScoreRules,
  roster: Player[],
): CalculateRoundResult {
  validateRoundInput(input, roster);

  const { finishType, finisherPlayerId } = input.finish;
  const finishMultiplier = opponentFinishMultiplier(finishType, rules);
  const finisherTeamId =
    finisherPlayerId === null
      ? null
      : requireTeamId(roster, finisherPlayerId);

  const players = input.players.map((player) => ({
    playerId: player.playerId,
    score: scoreForPlayer(
      player,
      rules,
      finishType,
      finisherPlayerId,
      finisherTeamId,
      finishMultiplier,
      roster,
    ),
  }));

  const amount =
    finishType === 'none' ? 0 : finishTeamBonusAmount(finishType, rules);
  const finishTeamBonus: FinishTeamBonusResult = {
    teamId: finishType === 'none' ? null : finisherTeamId,
    amount,
  };

  const teamIdsInOrder: string[] = [];
  for (const entry of roster) {
    if (!teamIdsInOrder.includes(entry.teamId)) {
      teamIdsInOrder.push(entry.teamId);
    }
  }

  const scoreByPlayerId = new Map(
    players.map((player) => [player.playerId, player.score]),
  );

  const teams: TeamRoundScore[] = teamIdsInOrder.map((teamId) => {
    const teamPlayerIds = roster
      .filter((entry) => entry.teamId === teamId)
      .map((entry) => entry.id);

    let score = 0;
    for (const playerId of teamPlayerIds) {
      score += scoreByPlayerId.get(playerId) ?? 0;
    }

    if (finishTeamBonus.teamId === teamId) {
      score += finishTeamBonus.amount;
    }

    return { teamId, score };
  });

  return {
    players,
    teams,
    finishTeamBonus,
  };
}

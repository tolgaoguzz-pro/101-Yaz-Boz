import { Player, RoundInput } from './models';

export type ValidateRoundInputOptions = {
  /**
   * paired (varsayılan): tam 2 takım × 2 oyuncu.
   * any: yalnızca her oyuncuda teamId olsun (tekli orchestration).
   */
  teamStructure?: 'paired' | 'any';
};

export function validateRoundInput(
  input: RoundInput,
  roster: Player[],
  options: ValidateRoundInputOptions = {},
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

  const teamStructure = options.teamStructure ?? 'paired';
  if (teamStructure === 'paired') {
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

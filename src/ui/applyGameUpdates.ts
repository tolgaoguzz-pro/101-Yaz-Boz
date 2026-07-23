import { CalculateRoundResult } from '../engine/calculateRound';
import { FinishType } from '../engine/models';
import {
  appendPenaltyActivity,
  appendRoundActivity,
  nowIso,
} from './gameLifecycle';
import { resolveGameMode } from './gameMode';
import { isGameComplete } from './gameResult';
import {
  playerIdFromIndividualTeamId,
  containerTeamScoresFromPlayers,
} from './individualRound';
import { TEAM_IDS } from './gameRoster';
import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
  LastGameAction,
  SavedRoundSummary,
} from './screens/ActiveGameScreen';
import { QuickPenaltySelection } from './screens/QuickPenaltyScreen';

export type RoundSaveMeta = {
  finishType: FinishType;
  finisherPlayerId: string | null;
};

function scoreById(
  entries: { playerId?: string; teamId?: string; score: number }[],
  id: string,
  idKey: 'playerId' | 'teamId',
): number {
  const found = entries.find((entry) => entry[idKey] === id);
  return found?.score ?? 0;
}

function withUpdatedPlayerScore(
  player: ActiveGamePlayer,
  playerId: string,
  amount: number,
): ActiveGamePlayer {
  if (player.id !== playerId) {
    return player;
  }
  return {
    ...player,
    totalScore: player.totalScore + amount,
  };
}

function withRecalculatedTeamTotal(team: ActiveGameTeam): ActiveGameTeam {
  return {
    ...team,
    totalScore: team.players[0].totalScore + team.players[1].totalScore,
  };
}

function finalizeAfterRound(
  game: ActiveGameData,
  savedRound: SavedRoundSummary,
  result: CalculateRoundResult,
  meta: RoundSaveMeta,
): ActiveGameData {
  const at = nowIso();
  const withRound: ActiveGameData = {
    ...game,
    updatedAt: at,
    lastAction: null,
  };

  const activityLog = appendRoundActivity(withRound, {
    roundNumber: savedRound.roundNumber,
    playerScores: savedRound.players,
    teamScores: savedRound.teams,
    finishType: meta.finishType,
    finisherPlayerId: meta.finisherPlayerId,
    finishBonusAmount: result.finishTeamBonus.amount,
    finishBonusPlayerId: savedRound.finishBonusPlayerId ?? null,
    finishBonusTeamId: result.finishTeamBonus.teamId,
    gameMode: resolveGameMode(game.gameMode),
  });

  let next: ActiveGameData = {
    ...withRound,
    activityLog,
  };

  if (isGameComplete({ ...next, status: 'active' })) {
    next = {
      ...next,
      status: 'completed',
      completedAt: at,
      pausedAt: undefined,
    };
  } else {
    next = {
      ...next,
      status: 'active',
    };
  }

  return next;
}

export function applyRoundResultToPairedGame(
  game: ActiveGameData,
  result: CalculateRoundResult,
  meta: RoundSaveMeta,
): ActiveGameData {
  const playerScores = result.players.map((player) => ({
    playerId: player.playerId,
    score: player.score,
  }));
  const teamScores = result.teams.map((team) => ({
    teamId: team.teamId,
    score: team.score,
  }));

  const finishBonusPlayerId = meta.finisherPlayerId;
  const bonusAmount =
    finishBonusPlayerId && result.finishTeamBonus.amount !== 0
      ? result.finishTeamBonus.amount
      : 0;

  const savedRound: SavedRoundSummary = {
    roundNumber: game.roundNumber,
    players: playerScores,
    teams: teamScores,
    finishTeamBonus: {
      teamId: result.finishTeamBonus.teamId,
      amount: result.finishTeamBonus.amount,
    },
    gameMode: 'paired',
    finishType: meta.finishType,
    finisherPlayerId: meta.finisherPlayerId,
    finishBonusPlayerId,
  };

  function nextPlayerTotal(player: ActiveGamePlayer): number {
    const roundScore = scoreById(playerScores, player.id, 'playerId');
    const bonus = player.id === finishBonusPlayerId ? bonusAmount : 0;
    return player.totalScore + roundScore + bonus;
  }

  const team1 = game.teams[0];
  const team2 = game.teams[1];

  const team1Players: [ActiveGamePlayer, ActiveGamePlayer] = [
    {
      id: team1.players[0].id,
      name: team1.players[0].name,
      totalScore: nextPlayerTotal(team1.players[0]),
    },
    {
      id: team1.players[1].id,
      name: team1.players[1].name,
      totalScore: nextPlayerTotal(team1.players[1]),
    },
  ];
  const team2Players: [ActiveGamePlayer, ActiveGamePlayer] = [
    {
      id: team2.players[0].id,
      name: team2.players[0].name,
      totalScore: nextPlayerTotal(team2.players[0]),
    },
    {
      id: team2.players[1].id,
      name: team2.players[1].name,
      totalScore: nextPlayerTotal(team2.players[1]),
    },
  ];

  const scored: ActiveGameData = {
    ...game,
    gameMode: resolveGameMode(game.gameMode),
    roundNumber: game.roundNumber + 1,
    rounds: [...game.rounds, savedRound],
    lastAction: null,
    teams: [
      {
        name: team1.name,
        totalScore:
          team1.totalScore +
          scoreById(teamScores, TEAM_IDS.team1, 'teamId'),
        players: team1Players,
      },
      {
        name: team2.name,
        totalScore:
          team2.totalScore +
          scoreById(teamScores, TEAM_IDS.team2, 'teamId'),
        players: team2Players,
      },
    ],
  };

  return finalizeAfterRound(scored, savedRound, result, meta);
}

export function applyRoundResultToIndividualGame(
  game: ActiveGameData,
  result: CalculateRoundResult,
  meta: RoundSaveMeta,
): ActiveGameData {
  const playerScores = result.players.map((player) => ({
    playerId: player.playerId,
    score: player.score,
  }));

  const finishBonusPlayerId = playerIdFromIndividualTeamId(
    result.finishTeamBonus.teamId,
  );

  const bonusAmount =
    finishBonusPlayerId && result.finishTeamBonus.amount !== 0
      ? result.finishTeamBonus.amount
      : 0;

  const containerTeams = containerTeamScoresFromPlayers(result);

  const savedRound: SavedRoundSummary = {
    roundNumber: game.roundNumber,
    players: playerScores,
    teams: containerTeams,
    finishTeamBonus: {
      teamId: null,
      amount: result.finishTeamBonus.amount,
    },
    gameMode: 'individual',
    finishBonusPlayerId,
    finishType: meta.finishType,
    finisherPlayerId: meta.finisherPlayerId,
  };

  function nextPlayerTotal(player: ActiveGamePlayer): number {
    const roundScore = scoreById(playerScores, player.id, 'playerId');
    const bonus = player.id === finishBonusPlayerId ? bonusAmount : 0;
    return player.totalScore + roundScore + bonus;
  }

  const team1Players: [ActiveGamePlayer, ActiveGamePlayer] = [
    {
      id: game.teams[0].players[0].id,
      name: game.teams[0].players[0].name,
      totalScore: nextPlayerTotal(game.teams[0].players[0]),
    },
    {
      id: game.teams[0].players[1].id,
      name: game.teams[0].players[1].name,
      totalScore: nextPlayerTotal(game.teams[0].players[1]),
    },
  ];
  const team2Players: [ActiveGamePlayer, ActiveGamePlayer] = [
    {
      id: game.teams[1].players[0].id,
      name: game.teams[1].players[0].name,
      totalScore: nextPlayerTotal(game.teams[1].players[0]),
    },
    {
      id: game.teams[1].players[1].id,
      name: game.teams[1].players[1].name,
      totalScore: nextPlayerTotal(game.teams[1].players[1]),
    },
  ];

  const scored: ActiveGameData = {
    ...game,
    gameMode: 'individual',
    roundNumber: game.roundNumber + 1,
    rounds: [...game.rounds, savedRound],
    lastAction: null,
    teams: [
      {
        name: game.teams[0].name,
        totalScore:
          team1Players[0].totalScore + team1Players[1].totalScore,
        players: team1Players,
      },
      {
        name: game.teams[1].name,
        totalScore:
          team2Players[0].totalScore + team2Players[1].totalScore,
        players: team2Players,
      },
    ],
  };

  return finalizeAfterRound(scored, savedRound, result, meta);
}

export function applyRoundResultToGame(
  game: ActiveGameData,
  result: CalculateRoundResult,
  meta: RoundSaveMeta,
): ActiveGameData {
  if (resolveGameMode(game.gameMode) === 'individual') {
    return applyRoundResultToIndividualGame(game, result, meta);
  }
  return applyRoundResultToPairedGame(game, result, meta);
}

function penaltySource(
  selection: QuickPenaltySelection,
): 'fixed' | 'manual' {
  return selection.kind === 'manual' ? 'manual' : 'fixed';
}

export function applyQuickPenaltyToPairedGame(
  game: ActiveGameData,
  selection: QuickPenaltySelection,
): ActiveGameData {
  const lastAction: LastGameAction = {
    playerName: selection.playerName,
    penaltyLabel: selection.label,
    amount: selection.amount,
  };

  const teams = game.teams.map((team): ActiveGameTeam => {
    const hasPlayer = team.players.some(
      (player) => player.id === selection.playerId,
    );
    if (!hasPlayer) {
      return team;
    }

    return {
      name: team.name,
      totalScore: team.totalScore + selection.amount,
      players: [
        withUpdatedPlayerScore(team.players[0], selection.playerId, selection.amount),
        withUpdatedPlayerScore(team.players[1], selection.playerId, selection.amount),
      ],
    };
  });

  const base: ActiveGameData = {
    ...game,
    lastAction,
    teams: [teams[0], teams[1]],
    updatedAt: nowIso(),
    status: game.status === 'paused' ? 'paused' : 'active',
  };

  return {
    ...base,
    activityLog: appendPenaltyActivity(base, {
      playerId: selection.playerId,
      playerName: selection.playerName,
      penaltyLabel: selection.label,
      amount: selection.amount,
      source: penaltySource(selection),
    }),
  };
}

export function applyQuickPenaltyToIndividualGame(
  game: ActiveGameData,
  selection: QuickPenaltySelection,
): ActiveGameData {
  const lastAction: LastGameAction = {
    playerName: selection.playerName,
    penaltyLabel: selection.label,
    amount: selection.amount,
  };

  const teams = game.teams.map((team): ActiveGameTeam => {
    const hasPlayer = team.players.some(
      (player) => player.id === selection.playerId,
    );
    if (!hasPlayer) {
      return team;
    }

    const players: [ActiveGamePlayer, ActiveGamePlayer] = [
      withUpdatedPlayerScore(team.players[0], selection.playerId, selection.amount),
      withUpdatedPlayerScore(team.players[1], selection.playerId, selection.amount),
    ];

    return withRecalculatedTeamTotal({
      name: team.name,
      totalScore: team.totalScore,
      players,
    });
  });

  const base: ActiveGameData = {
    ...game,
    gameMode: 'individual',
    lastAction,
    teams: [teams[0], teams[1]],
    updatedAt: nowIso(),
    status: game.status === 'paused' ? 'paused' : 'active',
  };

  return {
    ...base,
    activityLog: appendPenaltyActivity(base, {
      playerId: selection.playerId,
      playerName: selection.playerName,
      penaltyLabel: selection.label,
      amount: selection.amount,
      source: penaltySource(selection),
    }),
  };
}

export function applyQuickPenaltyToGame(
  game: ActiveGameData,
  selection: QuickPenaltySelection,
): ActiveGameData {
  if (resolveGameMode(game.gameMode) === 'individual') {
    return applyQuickPenaltyToIndividualGame(game, selection);
  }
  return applyQuickPenaltyToPairedGame(game, selection);
}

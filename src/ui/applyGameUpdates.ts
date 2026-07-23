import { CalculateRoundResult } from '../engine/calculateRound';
import { resolveGameMode } from './gameMode';
import {
  individualTeamIdForPlayer,
  playerIdFromIndividualTeamId,
  containerTeamScoresFromPlayers,
} from './individualRound';
import { PLAYER_IDS, TEAM_IDS } from './gameRoster';
import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameTeam,
  LastGameAction,
  SavedRoundSummary,
} from './screens/ActiveGameScreen';
import { QuickPenaltySelection } from './screens/QuickPenaltyScreen';

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

function teamTotalFromPlayers(team: ActiveGameTeam): number {
  return team.players[0].totalScore + team.players[1].totalScore;
}

function withRecalculatedTeamTotal(team: ActiveGameTeam): ActiveGameTeam {
  return {
    ...team,
    totalScore: teamTotalFromPlayers(team),
  };
}

export function applyRoundResultToPairedGame(
  game: ActiveGameData,
  result: CalculateRoundResult,
): ActiveGameData {
  const playerScores = result.players.map((player) => ({
    playerId: player.playerId,
    score: player.score,
  }));
  const teamScores = result.teams.map((team) => ({
    teamId: team.teamId,
    score: team.score,
  }));

  const savedRound: SavedRoundSummary = {
    roundNumber: game.roundNumber,
    players: playerScores,
    teams: teamScores,
    finishTeamBonus: {
      teamId: result.finishTeamBonus.teamId,
      amount: result.finishTeamBonus.amount,
    },
    gameMode: 'paired',
  };

  const team1 = game.teams[0];
  const team2 = game.teams[1];

  return {
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
        players: [
          {
            id: team1.players[0].id,
            name: team1.players[0].name,
            totalScore:
              team1.players[0].totalScore +
              scoreById(playerScores, PLAYER_IDS.player1, 'playerId'),
          },
          {
            id: team1.players[1].id,
            name: team1.players[1].name,
            totalScore:
              team1.players[1].totalScore +
              scoreById(playerScores, PLAYER_IDS.player2, 'playerId'),
          },
        ],
      },
      {
        name: team2.name,
        totalScore:
          team2.totalScore +
          scoreById(teamScores, TEAM_IDS.team2, 'teamId'),
        players: [
          {
            id: team2.players[0].id,
            name: team2.players[0].name,
            totalScore:
              team2.players[0].totalScore +
              scoreById(playerScores, PLAYER_IDS.player3, 'playerId'),
          },
          {
            id: team2.players[1].id,
            name: team2.players[1].name,
            totalScore:
              team2.players[1].totalScore +
              scoreById(playerScores, PLAYER_IDS.player4, 'playerId'),
          },
        ],
      },
    ],
  };
}

/**
 * Tekli: oyuncu skorları + bitiş bonusu yalnız bitirene.
 * Container team.totalScore = iki oyuncunun güncel toplamı.
 */
export function applyRoundResultToIndividualGame(
  game: ActiveGameData,
  result: CalculateRoundResult,
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

  return {
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
}

export function applyRoundResultToGame(
  game: ActiveGameData,
  result: CalculateRoundResult,
): ActiveGameData {
  if (resolveGameMode(game.gameMode) === 'individual') {
    return applyRoundResultToIndividualGame(game, result);
  }
  return applyRoundResultToPairedGame(game, result);
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

  return {
    ...game,
    lastAction,
    teams: [teams[0], teams[1]],
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

  return {
    ...game,
    gameMode: 'individual',
    lastAction,
    teams: [teams[0], teams[1]],
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

export function finishBonusPlayerIdFromIndividualResult(
  result: CalculateRoundResult,
): string | null {
  return playerIdFromIndividualTeamId(result.finishTeamBonus.teamId);
}

export { individualTeamIdForPlayer };

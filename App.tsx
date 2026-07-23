import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { CalculateRoundResult } from './src/engine/calculateRound';
import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameScreen,
  ActiveGameTeam,
  LastGameAction,
  SavedRoundSummary,
} from './src/ui/screens/ActiveGameScreen';
import { HomeScreen } from './src/ui/screens/HomeScreen';
import { NewGameScreen } from './src/ui/screens/NewGameScreen';
import {
  QuickPenaltyScreen,
  QuickPenaltySelection,
} from './src/ui/screens/QuickPenaltyScreen';
import { RoundEntryScreen } from './src/ui/screens/RoundEntryScreen';
import { PLAYER_IDS, TEAM_IDS } from './src/ui/gameRoster';

type Screen =
  | 'home'
  | 'newGame'
  | 'activeGame'
  | 'roundEntry'
  | 'quickPenalty';

/** Geçici aktif oyun state’i (UI katmanı; henüz kalıcı değil). */
type TemporaryActiveGame = ActiveGameData;

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

function applyPenaltyToGame(
  game: TemporaryActiveGame,
  selection: QuickPenaltySelection,
): TemporaryActiveGame {
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

function applyRoundResultToGame(
  game: TemporaryActiveGame,
  result: CalculateRoundResult,
): TemporaryActiveGame {
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
  };

  const team1 = game.teams[0];
  const team2 = game.teams[1];

  return {
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeGame, setActiveGame] = useState<TemporaryActiveGame | null>(
    null,
  );

  function handleStartGame(game: TemporaryActiveGame) {
    setActiveGame(game);
    setScreen('activeGame');
  }

  function handleHome() {
    setScreen('home');
  }

  function handleSaveRound(result: CalculateRoundResult) {
    setActiveGame((current) => {
      if (!current) {
        return current;
      }
      return applyRoundResultToGame(current, result);
    });
    setScreen('activeGame');
  }

  function handleApplyPenalty(selection: QuickPenaltySelection) {
    setActiveGame((current) => {
      if (!current) {
        return current;
      }
      return applyPenaltyToGame(current, selection);
    });
    setScreen('activeGame');
  }

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen
          activeGame={activeGame}
          onContinue={() => setScreen('activeGame')}
          onNewGame={() => setScreen('newGame')}
        />
      ) : null}
      {screen === 'newGame' ? (
        <NewGameScreen
          onBack={() => setScreen('home')}
          onStart={handleStartGame}
        />
      ) : null}
      {screen === 'activeGame' && activeGame ? (
        <ActiveGameScreen
          game={activeGame}
          onHome={handleHome}
          onNewRound={() => setScreen('roundEntry')}
          onAddPenalty={() => setScreen('quickPenalty')}
        />
      ) : null}
      {screen === 'roundEntry' && activeGame ? (
        <RoundEntryScreen
          game={activeGame}
          onBack={() => setScreen('activeGame')}
          onSaveRound={handleSaveRound}
        />
      ) : null}
      {screen === 'quickPenalty' && activeGame ? (
        <QuickPenaltyScreen
          game={activeGame}
          onBack={() => setScreen('activeGame')}
          onApply={handleApplyPenalty}
        />
      ) : null}
      <StatusBar style="dark" />
    </>
  );
}

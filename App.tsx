import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { usePersistedActiveGame } from './src/app/usePersistedActiveGame';
import { CalculateRoundResult } from './src/engine/calculateRound';
import {
  createRematchGame,
  isGameComplete,
} from './src/ui/gameResult';
import { PLAYER_IDS, TEAM_IDS } from './src/ui/gameRoster';
import {
  ActiveGameData,
  ActiveGamePlayer,
  ActiveGameScreen,
  ActiveGameTeam,
  LastGameAction,
  SavedRoundSummary,
} from './src/ui/screens/ActiveGameScreen';
import { AppLoadingScreen } from './src/ui/screens/AppLoadingScreen';
import { GameResultScreen } from './src/ui/screens/GameResultScreen';
import { HomeScreen } from './src/ui/screens/HomeScreen';
import { NewGameScreen } from './src/ui/screens/NewGameScreen';
import {
  QuickPenaltyScreen,
  QuickPenaltySelection,
} from './src/ui/screens/QuickPenaltyScreen';
import { RoundEntryScreen } from './src/ui/screens/RoundEntryScreen';

type Screen =
  | 'home'
  | 'newGame'
  | 'activeGame'
  | 'roundEntry'
  | 'quickPenalty'
  | 'gameResult';

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

function applyRoundResultToGame(
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
  };

  const team1 = game.teams[0];
  const team2 = game.teams[1];

  return {
    ...game,
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
  const {
    ready,
    activeGame,
    continuableGame,
    commitActiveGame,
    updateActiveGame,
  } = usePersistedActiveGame();

  if (!ready) {
    return (
      <>
        <AppLoadingScreen />
        <StatusBar style="dark" />
      </>
    );
  }

  function handleStartGame(game: ActiveGameData) {
    commitActiveGame(game);
    setScreen('activeGame');
  }

  function handleHome() {
    setScreen('home');
  }

  function handleSaveRound(result: CalculateRoundResult) {
    if (!activeGame) {
      return;
    }

    const nextGame = applyRoundResultToGame(activeGame, result);
    commitActiveGame(nextGame);
    setScreen(isGameComplete(nextGame) ? 'gameResult' : 'activeGame');
  }

  function handleApplyPenalty(selection: QuickPenaltySelection) {
    updateActiveGame((current) => applyPenaltyToGame(current, selection));
    setScreen('activeGame');
  }

  function handleRematch() {
    updateActiveGame((current) => createRematchGame(current));
    setScreen('activeGame');
  }

  function handleNewTeams() {
    commitActiveGame(null);
    setScreen('newGame');
  }

  function handleNewGameFromHome() {
    commitActiveGame(null);
    setScreen('newGame');
  }

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen
          activeGame={continuableGame}
          onContinue={() => setScreen('activeGame')}
          onNewGame={handleNewGameFromHome}
        />
      ) : null}
      {screen === 'newGame' ? (
        <NewGameScreen
          onBack={() => setScreen('home')}
          onStart={handleStartGame}
        />
      ) : null}
      {screen === 'activeGame' && continuableGame ? (
        <ActiveGameScreen
          game={continuableGame}
          onHome={handleHome}
          onNewRound={() => setScreen('roundEntry')}
          onAddPenalty={() => setScreen('quickPenalty')}
        />
      ) : null}
      {screen === 'roundEntry' && continuableGame ? (
        <RoundEntryScreen
          game={continuableGame}
          onBack={() => setScreen('activeGame')}
          onSaveRound={handleSaveRound}
        />
      ) : null}
      {screen === 'quickPenalty' && continuableGame ? (
        <QuickPenaltyScreen
          game={continuableGame}
          onBack={() => setScreen('activeGame')}
          onApply={handleApplyPenalty}
        />
      ) : null}
      {screen === 'gameResult' && activeGame ? (
        <GameResultScreen
          game={activeGame}
          onRematch={handleRematch}
          onNewTeams={handleNewTeams}
        />
      ) : null}
      <StatusBar style="dark" />
    </>
  );
}

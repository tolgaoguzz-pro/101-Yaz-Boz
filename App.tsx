import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { usePersistedActiveGame } from './src/app/usePersistedActiveGame';
import { CalculateRoundResult } from './src/engine/calculateRound';
import {
  applyQuickPenaltyToGame,
  applyRoundResultToGame,
  RoundSaveMeta,
} from './src/ui/applyGameUpdates';
import {
  finishGameEarly,
  pauseGame,
  restartGame,
  resumeGame,
} from './src/ui/gameLifecycle';
import {
  createRematchGame,
  isGameComplete,
} from './src/ui/gameResult';
import {
  ActiveGameData,
  ActiveGameScreen,
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

  function handleContinue() {
    if (continuableGame?.status === 'paused') {
      updateActiveGame((current) => resumeGame(current));
    }
    setScreen('activeGame');
  }

  function handleSaveRound(
    result: CalculateRoundResult,
    meta: RoundSaveMeta,
  ) {
    if (!activeGame) {
      return;
    }

    const nextGame = applyRoundResultToGame(activeGame, result, meta);
    commitActiveGame(nextGame);
    setScreen(isGameComplete(nextGame) ? 'gameResult' : 'activeGame');
  }

  function handleApplyPenalty(selection: QuickPenaltySelection) {
    updateActiveGame((current) => applyQuickPenaltyToGame(current, selection));
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

  function handlePause() {
    updateActiveGame((current) => pauseGame(current));
    setScreen('home');
  }

  function handleFinishEarly() {
    updateActiveGame((current) => finishGameEarly(current));
    setScreen('gameResult');
  }

  function handleAbandonFromActive() {
    commitActiveGame(null);
    setScreen('home');
  }

  function handleRestartFromHome() {
    updateActiveGame((current) => restartGame(current));
    setScreen('activeGame');
  }

  function handleAbandonFromHome() {
    commitActiveGame(null);
  }

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen
          activeGame={continuableGame}
          onContinue={handleContinue}
          onNewGame={handleNewGameFromHome}
          onRestart={handleRestartFromHome}
          onAbandon={handleAbandonFromHome}
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
          onPause={handlePause}
          onFinishEarly={handleFinishEarly}
          onAbandon={handleAbandonFromActive}
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

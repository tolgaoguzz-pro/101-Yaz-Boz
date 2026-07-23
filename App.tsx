import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { usePersistedActiveGame } from './src/app/usePersistedActiveGame';
import { ensureCompletedGamePersisted } from './src/domain/ensureCompletedGame';
import {
  CompletedGameRecord,
  matchupKeyFromGame,
} from './src/domain/completedGame';
import { calculateMatchupSeries } from './src/domain/tournament';
import { CalculateRoundResult } from './src/engine/calculateRound';
import { listCompletedGamesByMatchup } from './src/persistence/completedGameRepository';
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
  createGameFromCompletedRecord,
  createRematchGame,
  isGameComplete,
} from './src/ui/gameResult';
import { buildSeriesSummaryLine } from './src/ui/tournamentPresentation';
import {
  ActiveGameData,
  ActiveGameScreen,
} from './src/ui/screens/ActiveGameScreen';
import { AboutScreen } from './src/ui/screens/AboutScreen';
import { AppLoadingScreen } from './src/ui/screens/AppLoadingScreen';
import { CompletedGameDetailScreen } from './src/ui/screens/CompletedGameDetailScreen';
import { GameResultScreen } from './src/ui/screens/GameResultScreen';
import { HomeScreen } from './src/ui/screens/HomeScreen';
import { NewGameScreen } from './src/ui/screens/NewGameScreen';
import {
  QuickPenaltyScreen,
  QuickPenaltySelection,
} from './src/ui/screens/QuickPenaltyScreen';
import { RoundEntryScreen } from './src/ui/screens/RoundEntryScreen';
import { TournamentDetailScreen } from './src/ui/screens/TournamentDetailScreen';
import { TournamentListScreen } from './src/ui/screens/TournamentListScreen';

type Screen =
  | 'home'
  | 'newGame'
  | 'activeGame'
  | 'roundEntry'
  | 'quickPenalty'
  | 'gameResult'
  | 'tournamentList'
  | 'tournamentDetail'
  | 'completedGameDetail'
  | 'about';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMatchupKey, setSelectedMatchupKey] = useState<string | null>(
    null,
  );
  const [selectedCompletedGameId, setSelectedCompletedGameId] = useState<
    string | null
  >(null);
  const [seriesSummaryLine, setSeriesSummaryLine] = useState<string | null>(
    null,
  );
  const completionInFlight = useRef(false);

  const {
    ready,
    activeGame,
    continuableGame,
    commitActiveGame,
    updateActiveGame,
  } = usePersistedActiveGame();

  async function persistCompletionAndShowResult(game: ActiveGameData) {
    if (completionInFlight.current) {
      return;
    }
    completionInFlight.current = true;
    try {
      const { game: completedGame } = await ensureCompletedGamePersisted(game);
      // Bellekte sonuç kalsın; SQLite aktif snapshot temizlensin.
      commitActiveGame(completedGame);

      try {
        const key = matchupKeyFromGame(completedGame);
        const seriesGames = await listCompletedGamesByMatchup(key);
        const series = calculateMatchupSeries(seriesGames);
        setSeriesSummaryLine(buildSeriesSummaryLine(series));
        setSelectedMatchupKey(key);
      } catch (error) {
        console.warn('[app] series summary load failed', error);
        setSeriesSummaryLine(null);
      }

      setScreen('gameResult');
    } finally {
      completionInFlight.current = false;
    }
  }

  useEffect(() => {
    if (screen !== 'gameResult' || !activeGame) {
      return;
    }
    if (!isGameComplete(activeGame)) {
      return;
    }
    if (activeGame.completedGameRecordId) {
      return;
    }
    void persistCompletionAndShowResult(activeGame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeGame?.completedGameRecordId]);

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
    if (isGameComplete(nextGame)) {
      void persistCompletionAndShowResult(nextGame);
      return;
    }
    commitActiveGame(nextGame);
    setScreen('activeGame');
  }

  function handleApplyPenalty(selection: QuickPenaltySelection) {
    updateActiveGame((current) => applyQuickPenaltyToGame(current, selection));
    setScreen('activeGame');
  }

  function handleRematch() {
    updateActiveGame((current) => createRematchGame(current));
    setSeriesSummaryLine(null);
    setScreen('activeGame');
  }

  function handleNewTeams() {
    commitActiveGame(null);
    setSeriesSummaryLine(null);
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
    if (!activeGame) {
      return;
    }
    const finished = finishGameEarly(activeGame);
    void persistCompletionAndShowResult(finished);
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

  function handleViewTournamentFromResult() {
    if (selectedMatchupKey) {
      setScreen('tournamentDetail');
      return;
    }
    setScreen('tournamentList');
  }

  function startFromCompletedRecord(record: CompletedGameRecord) {
    const next = createGameFromCompletedRecord(record);
    commitActiveGame(next);
    setSeriesSummaryLine(null);
    setSelectedMatchupKey(record.matchupKey);
    setScreen('activeGame');
  }

  function handlePlayAgainFromHistory(record: CompletedGameRecord) {
    if (continuableGame) {
      Alert.alert(
        'Yeni oyun başlatılsın mı?',
        'Mevcut aktif oyun silinir ve skorlar kaybolur. Geçmiş kayıtlar korunur.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Başlat',
            style: 'destructive',
            onPress: () => startFromCompletedRecord(record),
          },
        ],
      );
      return;
    }
    startFromCompletedRecord(record);
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
          onTournaments={() => setScreen('tournamentList')}
          onAbout={() => setScreen('about')}
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
          seriesSummaryLine={seriesSummaryLine}
          onRematch={handleRematch}
          onViewTournament={handleViewTournamentFromResult}
          onNewTeams={handleNewTeams}
        />
      ) : null}
      {screen === 'tournamentList' ? (
        <TournamentListScreen
          onBack={() => setScreen('home')}
          onOpenMatchup={(key) => {
            setSelectedMatchupKey(key);
            setScreen('tournamentDetail');
          }}
          onStartNewGame={() => {
            commitActiveGame(null);
            setScreen('newGame');
          }}
        />
      ) : null}
      {screen === 'tournamentDetail' && selectedMatchupKey ? (
        <TournamentDetailScreen
          matchupKey={selectedMatchupKey}
          onBack={() => setScreen('tournamentList')}
          onOpenGame={(gameId) => {
            setSelectedCompletedGameId(gameId);
            setScreen('completedGameDetail');
          }}
          onPlayAgain={handlePlayAgainFromHistory}
        />
      ) : null}
      {screen === 'completedGameDetail' && selectedCompletedGameId ? (
        <CompletedGameDetailScreen
          gameId={selectedCompletedGameId}
          onBack={() => setScreen('tournamentDetail')}
          onPlayAgain={handlePlayAgainFromHistory}
        />
      ) : null}
      {screen === 'about' ? (
        <AboutScreen onBack={() => setScreen('home')} />
      ) : null}
      <StatusBar style="dark" />
    </>
  );
}

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import {
  ActiveGameData,
  ActiveGameScreen,
} from './src/ui/screens/ActiveGameScreen';
import { HomeScreen } from './src/ui/screens/HomeScreen';
import { NewGameScreen } from './src/ui/screens/NewGameScreen';

type Screen = 'home' | 'newGame' | 'activeGame';

/** Yeni Oyun'dan Aktif Oyun'a taşınan geçici masa verisi. */
type TemporaryActiveGame = ActiveGameData;

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

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen onNewGame={() => setScreen('newGame')} />
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
          onNewRound={() => console.log('Yeni El')}
        />
      ) : null}
      <StatusBar style="dark" />
    </>
  );
}

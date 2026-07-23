import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from './src/ui/screens/HomeScreen';
import { NewGameScreen } from './src/ui/screens/NewGameScreen';

type Screen = 'home' | 'newGame';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen onNewGame={() => setScreen('newGame')} />
      ) : (
        <NewGameScreen onBack={() => setScreen('home')} />
      )}
      <StatusBar style="dark" />
    </>
  );
}

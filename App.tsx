import React, { useState } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'home' | 'camera'>('home');

  if (screen === 'camera') {
    return <CameraScreen autoOpen onBack={() => setScreen('home')} />;
  }

  return <HomeScreen onOpenCamera={() => setScreen('camera')} />;
};

export default App;

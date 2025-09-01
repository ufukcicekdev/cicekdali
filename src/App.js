import React, { useState } from 'react';
import SetupScreen from './SetupScreen';
import GameScreen from './GameScreen';
import './Game.css';

function App() {
  const [gameSettings, setGameSettings] = useState(null);

  const handleGameStart = (settings) => {
    setGameSettings(settings);
  };

  return (
    <div className="App">
      {gameSettings ? (
        <GameScreen settings={gameSettings} />
      ) : (
        <SetupScreen onGameStart={handleGameStart} />
      )}
    </div>
  );
}

export default App;
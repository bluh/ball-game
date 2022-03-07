import { useState } from 'react';
import './App.scss';
import Game from './Game';

function App() {
  const [callbacks, setCallbacks] = useState({ fastForward: () => {}, restart: () => {}, undo: () => {}, skip: () => {}});
  const [gameLevel, setGameLevel] = useState(0);

  return (
    <div className="container">
      <div className="header">
        <h1>Balls Game - Level {gameLevel}</h1>
      </div>
      <div className="game-container">
        <Game setCallbacks={setCallbacks} setGameLevel={setGameLevel} />
      </div>
      <div className="footer">
        <button onClick={callbacks.fastForward}>Fast Forward</button>
        <button onClick={callbacks.restart}>Restart</button>
        <button onClick={callbacks.undo}>Undo</button>
        <button onClick={callbacks.skip}>Skip</button>
      </div>
    </div>
  );
}

export default App;

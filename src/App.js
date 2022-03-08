import { useState } from 'react';
import './App.scss';
import Game from './Game';

function App() {
  const [callbacks, setCallbacks] = useState({ fastForward: () => {}, restart: () => {}, undo: () => {}, skip: () => {}});
  const [gameLevel, setGameLevel] = useState(0);
  const [gameBalls, setGameBalls] = useState(0);

  return (
    <div className="container">
      <div className="header">
        <h1>Balls Game</h1>
        <span className="header-left">Balls - {gameBalls}</span>
        <span className="header-right">Level - {gameLevel}</span>
      </div>
      <div className="game-container">
        <Game setCallbacks={setCallbacks} setGameLevel={setGameLevel} setGameBalls={setGameBalls} />
      </div>
      <div className="game-footer">
        <button onClick={callbacks.fastForward}>Fast Forward</button>
        <button onClick={callbacks.restart}>Restart</button>
        <button onClick={callbacks.undo}>Undo</button>
        <button onClick={callbacks.skip}>Skip</button>
      </div>
      <div className="footer">
        v0.2 | <a href="https://github.com/bluh/ball-game" target="_blank" rel="noreferrer">View on Github</a>
      </div>
    </div>
  );
}

export default App;

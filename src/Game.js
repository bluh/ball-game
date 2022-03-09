import { useCallback, useEffect, useState } from "react";
import BallsOverlay from "./BallsOverlay";
import { GAME_ROWS, GAME_COLS, UPDATE_STATE, GAME_TAG } from "./GameConstants";
import "./Game.scss";

function isGameOver(gameState){
  const lastLevel = gameState[gameState.length - 2];

  return lastLevel !== null && lastLevel.some(c => c > 0);
}

function generateNewLine(gameLevel){
  const level = Array(GAME_ROWS).fill(0);

  let numTiles = Math.floor(Math.random() * 3) + 1;

  while(numTiles > 0){
    let randomIndex = Math.floor(Math.random() * GAME_ROWS);
    while(level[randomIndex] !== 0){
      randomIndex = Math.floor(Math.random() * GAME_ROWS);
    }
    level[randomIndex] = gameLevel;
    numTiles--;
  }

  if(gameLevel > 1){
    let randomIndex = Math.floor(Math.random() * GAME_ROWS);
    while(level[randomIndex] !== 0){
      randomIndex = Math.floor(Math.random() * GAME_ROWS);
    }

    level[randomIndex] = -1;
  }

  return level;
}

function generateNewState(gameState, gameLevel) {
  if (isGameOver(gameState)) {
    return null;
  } else {
    const newLine = generateNewLine(gameLevel);
    const newGameState = [...gameState];
    for (let index = 0; index < newGameState.length - 1; index++) {
      newGameState[index + 1] = gameState[index];
    }
    newGameState[0] = newLine;

    return newGameState;
  }
}

function generateInitialGameState() {
  const blankState = Array(GAME_COLS - 2).fill(Array(GAME_ROWS).fill(0));

  return [
    generateNewLine(1),
    generateNewLine(1),
    ...blankState
  ]
}

function Game({
  setCallbacks,
  setGameLevel: setAppLevel,
  setGameBalls: setAppBalls
}) {
  const [gameState, setGameState] = useState(generateInitialGameState);
  const [gameLevel, setGameLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);

  const [ballsRunning, setBallsRunning] = useState(false);

  const [restartCallback, setRestartCallback] = useState(() => {});

  // Load game upon page load
  useEffect(() => {
    try{
      const saveDataJson = window.localStorage.getItem(GAME_TAG);
      const saveData = JSON.parse(saveDataJson);

      setGameLevel(saveData.level);
      setGameState(saveData.state);
    }catch{
      console.error("Could not load save");
    }
    setGameLoaded(true);
  }, [])

  // Callback to reset the game
  const restartGame = useCallback(() => {
    if(window.confirm("Restart game?")){
      setGameState(generateInitialGameState());
      setGameLevel(1);
      setGameOver(false);
      restartCallback && restartCallback();
    }
  }, [restartCallback]);

  // Callback to add a new line to the game state
  const makeNewLine = useCallback((ballsRunning) => {
    if(!gameOver && !ballsRunning) {
      const newLevel = gameLevel + 1;
      const newState = generateNewState(gameState, newLevel);

      if(newState){
        setGameLevel(newLevel);
        setGameState(newState);
      }else{
        setGameOver(true);
      }
    }
  }, [gameOver, gameState, gameLevel]);

  // Setup initial callbacks
  useEffect(() => {
    setCallbacks && setCallbacks(callbacks => ({
      ...callbacks,
      restart: restartGame,
      undo: () => console.log('undo'),
      skip: () => makeNewLine(ballsRunning)
    }))
  }, [setCallbacks, makeNewLine, restartGame, ballsRunning]);

  // Bubble game level up to App to display
  useEffect(() => setAppLevel && setAppLevel(gameLevel), [setAppLevel, gameLevel]);

  // Callback to handle change in BallsOverlay's number of balls
  const getNumBalls = (num) => {
    setAppBalls(num);
  }

  // Callback to handle ball collisions
  const ballCollision = (x, y) => {
    setGameState(state => {
      const newState = [...state];
      const item = newState[y][x];
      if(item > 0){
        newState[y][x] = newState[y][x] - 1;
      }else if(item === -1){
        newState[y][x] = 0;
      }
      return newState;
    });
  }

  // Callback to handle change in BallsOverlay state
  const onBallsChanged = (state) => {
    if(state === UPDATE_STATE.STOPPED){
      setBallsRunning(false);
      makeNewLine(false);
    }else if(state === UPDATE_STATE.RUNNING){
      setBallsRunning(true);
    }
  }

  return (
    <>
      {gameState.map((col, colIndex) => (
        <div
          className="game-row"
          style={{
            maxHeight: `${100/GAME_COLS}%`,
          }}
          key={colIndex}
        >
          {col.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`game-square ${row > 0 ? "game-block" : ""} ${row === -1 ? "game-powerup" : ""}`}
              style={{
                width: `${100/GAME_ROWS}%`,
              }}
            >
              {row > 0 ? row : ""}
            </div>
          ))}
        </div>
      ))}
      <div className="game-overlay">
        {gameLoaded ? 
          (<BallsOverlay
            gameplayState={gameState}
            gameplayLevel={gameLevel}
            setCallbacks={setCallbacks}
            setAppBalls={getNumBalls}
            setRestartCallback={setRestartCallback}
            onBallCollision={ballCollision}
            onBallsChanged={onBallsChanged}
          />)
          : <h1>Loading...</h1>
        }
      </div>
      <div
        className="game-over"
        style={{display: (gameOver ? "block" : "none")}}
      >
        <div>Game Over</div>
      </div>
    </>
  )
}

export default Game;
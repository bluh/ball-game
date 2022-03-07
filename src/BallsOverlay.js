import { useCallback, useEffect, useState } from "react";
import Ball from "./Ball";
import { UPDATE_STATE, BIG_BALL_SIZE, BALL_SIZE } from "./GameConstants";

import "./BallsOverlay.scss";

const GAME_STATES = {
  READY: 0,
  PLAYING: 1,
  FF: 2
}

function BallsOverlay({
  gameState: gameplayState,
  setCallbacks,
  onBallCollision,
  onBallFinished
}) {
  const [gameState, setGameState] = useState(GAME_STATES.READY);
  const [bigBall, setBigBall] = useState(0);
  const [pendingBigBall, setPendingBigBall] = useState(null);
  const [numBalls, setNumBalls] = useState(1);
  const [balls, setBalls] = useState([]);
  const [gameTime, setGameTime] = useState(0);
  const [gameTimer, setGameTimer] = useState(null);
  const [initDirection, setInitDirection] = useState({x: 1, y: 1});
  const [initMouse, setInitMouse] = useState(null);

  useEffect(() => {
    setCallbacks(callbacks => ({
      ...callbacks,
      fastForward: () => setGameState(state => state === GAME_STATES.PLAYING ? GAME_STATES.FF : state)
    }))
  }, [setCallbacks]);

  useEffect(() => {
    if(gameState === GAME_STATES.READY && gameTimer){
      clearInterval(gameTimer);
      setGameTimer(null);
      setGameTime(0);
    }else if(gameState === GAME_STATES.PLAYING && !gameTimer){
      const newTimer = setInterval(() => {
        setGameTime(gameTime => gameTime + 5);
      }, 10);
      setGameTimer(newTimer);
    }else if(gameState === GAME_STATES.FF && gameTimer){
      clearInterval(gameTimer);
      const newTimer = setInterval(() => {
        setGameTime(gameTime => gameTime + 7);
      }, 2);
      setGameTimer(newTimer);
      setGameState(GAME_STATES.PLAYING);
    }
  }, [gameState, gameTimer, numBalls]);

  const gameField = document.getElementById("game-field");

  useEffect(() => {
    if(gameField){
      const newPos = gameField.clientWidth / 2;
      setBigBall(newPos);
    }
  }, [gameField]);

  const ballCallback = useCallback((evt, index) => {
    console.log('update', index, evt, balls[index]);
    if(evt.state === UPDATE_STATE.STOPPED && balls[index]){
      if(balls.every(v => v)){
        setPendingBigBall(Math.min(evt.x + BALL_SIZE / 2, gameField.clientWidth - BALL_SIZE));
      }
      setBalls(balls => {
        const newBalls = [...balls];
        newBalls[index] = false;
        return newBalls;
      });
    }else if(evt.state === UPDATE_STATE.COLLISION && balls[index]){
      const gameItem = gameplayState[evt.y][evt.x];
      if(gameItem === -1){
        setNumBalls(balls => balls + 1);
      }
      onBallCollision(evt.x, evt.y);
    }
  }, [gameField, balls, onBallCollision, gameplayState])

  useEffect(() => {
    console.log(balls);
    if(balls.length > 0 && balls.every(v => !v) && gameState === GAME_STATES.PLAYING){
      setGameState(GAME_STATES.READY);
      if(pendingBigBall){
        setBigBall(pendingBigBall)
        setPendingBigBall(null);
      }
      onBallFinished();
      console.log('finishing');
    }
  }, [balls, pendingBigBall, gameState, onBallFinished])

  return (
    <div
      id="game-field"
      onPointerDown={(evt) => {
        if(gameState === GAME_STATES.READY && evt.isPrimary){
          setInitMouse({x: evt.clientX, y: evt.clientY});
        }
      }}
      onPointerUp={(evt) => {
        if(gameState === GAME_STATES.READY && initMouse && evt.isPrimary){
          const dX = evt.clientX - initMouse.x;
          const dY = -(evt.clientY - initMouse.y);
          const distance = Math.sqrt(dX * dX + dY * dY);
          if(distance >= 10 && dY > 0){
            console.log('starting', dX, dY);
            setInitDirection({x: dX, y: dY});
            setBalls(Array(numBalls).fill(true));
            setGameState(GAME_STATES.PLAYING);
          }
          setInitMouse(null);
        }
      }}
    >
      <div
        className="ball big-ball"
        style={{
          left: (pendingBigBall ? pendingBigBall : bigBall) - BIG_BALL_SIZE / 2
        }}
      />
      {(gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.FF) && balls.map((v, i) => (
        (<Ball
          key={i}
          gameState={gameplayState}
          initialX={bigBall - BIG_BALL_SIZE / 2}
          initialDX={initDirection.x}
          initialDY={initDirection.y}
          maxWidth={gameField && gameField.clientWidth}
          maxHeight={gameField && gameField.clientHeight}
          gameTime={(gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.FF) && gameTime > (i * 50) ? gameTime : 0}
          updateCallback={(evt) => ballCallback(evt, i)}
        />)
      ))}
    </div>
  )
}


export default BallsOverlay;
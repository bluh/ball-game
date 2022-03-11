import { useCallback, useEffect, useRef, useState } from "react";
import Ball from "./Ball";
import { UPDATE_STATE, BIG_BALL_SIZE, BALL_SIZE, GAME_TAG } from "./GameConstants";

import "./BallsOverlay.scss";

const BALLS_STATES = {
  READY: 0,
  PLAYING: 1,
  FF: 2,
  SKIP: 3
}

function BallsOverlay({
  gameState,
  gameLevel,
  gameOver,
  setCallbacks,
  setAppBalls,
  setRestartCallback,
  onBallCollision,
  onBallsChanged
}) {
  const [ballsState, setBallsState] = useState(BALLS_STATES.READY);
  const [bigBall, setBigBall] = useState(0);
  const [pendingBigBall, setPendingBigBall] = useState(null);
  const [numBalls, setNumBalls] = useState(1);
  const [balls, setBalls] = useState([]);
  const [gameTime, setGameTime] = useState(0);
  const [gameTimer, setGameTimer] = useState(null);
  const [initDirection, setInitDirection] = useState({x: 1, y: 1});
  const [initMouse, setInitMouse] = useState(null);
  const [endMouse, setEndMouse] = useState(null);

  const finishedBalls = useRef(0);

  const gameField = document.getElementById("game-field");
  
  // Load game upon page load
  useEffect(() => {
    try{
      const saveDataJson = window.localStorage.getItem(GAME_TAG);
      const saveData = JSON.parse(saveDataJson);

      if(saveData.balls && saveData.bigBall){
        setNumBalls(saveData.balls);
        setBigBall(saveData.bigBall);
      }
    }catch{
      console.error("Could not load save");
    }
  }, [])

  // Set callbacks
  useEffect(() => {
    setCallbacks && setCallbacks(callbacks => ({
      ...callbacks,
      fastForward: () => setBallsState(state => state === BALLS_STATES.PLAYING ? BALLS_STATES.FF : state),
      skipBalls: () => setBallsState(state => state === BALLS_STATES.PLAYING ? BALLS_STATES.SKIP : state),
    }))
  }, [setCallbacks]);

  // Set restart callback
  useEffect(() => {
    gameField && setRestartCallback && setRestartCallback(() => {
      return () => {
        setNumBalls(1);
        setBalls([]);
        setPendingBigBall(null);
        setBigBall(gameField.clientWidth / 2);
        setBallsState(BALLS_STATES.READY);
      }
    })
  }, [setRestartCallback, gameField]);

  // Create app balls callback
  useEffect(() => {
    setAppBalls && setAppBalls(numBalls);
  }, [setAppBalls, numBalls]);

  // Track game state & create gameTime loop
  useEffect(() => {
    if(ballsState === BALLS_STATES.READY && gameTimer){
      // gameTimer is running and must be cancelled
      clearInterval(gameTimer);
      setGameTimer(null);
      setGameTime(0);
    }else if(ballsState === BALLS_STATES.PLAYING && !gameTimer){
      // Start running gameTimer
      const newTimer = setInterval(() => {
        setGameTime(gameTime => gameTime + 5);
      }, 10);
      setGameTimer(newTimer);
      onBallsChanged(UPDATE_STATE.RUNNING);
    }else if(ballsState === BALLS_STATES.FF && gameTimer){
      // Recreate gameTimer to be faster
      clearInterval(gameTimer);
      const newTimer = setInterval(() => {
        setGameTime(gameTime => gameTime + 7);
      }, 2);
      setGameTimer(newTimer);
      setBallsState(BALLS_STATES.PLAYING);
    }
  }, [ballsState, gameTimer, numBalls, onBallsChanged]);

  // When the gameField is initialized, move Big Ball to middle of the screen
  useEffect(() => {
    if(gameField && !bigBall){
      const newPos = gameField.clientWidth / 2;
      setBigBall(newPos);
    }
  }, [gameField, bigBall]);

  // Callback when a Ball has a state update
  const ballCallback = useCallback((evt, index) => {
    if(evt.state === UPDATE_STATE.STOPPED && balls[index]){
      finishedBalls.current = finishedBalls.current + 1;
      if(finishedBalls.current === 1){
        // This is the first ball, so move the Big Ball to its location
        setPendingBigBall(Math.min(evt.x + BALL_SIZE / 2, gameField.clientWidth - BALL_SIZE));
      }
      setBalls(balls => {
        const newBalls = [...balls];
        newBalls[index] = false;
        return newBalls;
      });
    }else if(evt.state === UPDATE_STATE.COLLISION && balls[index]){
      // Use powerup, bubble event up to Game
      const gameItem = gameState[evt.y][evt.x];
      if(gameItem === -1){
        setNumBalls(balls => balls + 1);
      }
      onBallCollision(evt.x, evt.y);
    }
  }, [gameField, balls, onBallCollision, gameState])

  // Exit PLAYING state when all balls are done
  useEffect(() => {
    if((finishedBalls.current === balls.length && ballsState === BALLS_STATES.PLAYING) || ballsState === BALLS_STATES.SKIP){
      setBallsState(BALLS_STATES.READY);
      if(pendingBigBall){
        setBigBall(pendingBigBall)
        setPendingBigBall(null);
      }
      onBallsChanged(UPDATE_STATE.STOPPED);
    }
  }, [finishedBalls, balls, pendingBigBall, ballsState, onBallsChanged])

  // Save game after the game state has changed
  useEffect(() => {
    if(gameOver){
      window.localStorage.removeItem(GAME_TAG);
    }else{
      const saveData = {
        level: gameLevel,
        state: gameState,
        balls: numBalls,
        bigBall: bigBall
      };
  
      const saveDataJson = JSON.stringify(saveData);
  
      window.localStorage.setItem(GAME_TAG, saveDataJson);
    }
  }, [gameLevel, gameState, numBalls, bigBall, gameOver]);

  return (
    <div
      id="game-field"
      onPointerDown={(evt) => {
        if(ballsState === BALLS_STATES.READY && evt.isPrimary){
          setInitMouse({x: evt.clientX, y: evt.clientY});
        }
      }}
      onPointerMove={(evt) => {
        if(ballsState === BALLS_STATES.READY && evt.isPrimary){
          setEndMouse({x: evt.clientX, y: evt.clientY})
        }
      }}
      onPointerUp={(evt) => {
        if(ballsState === BALLS_STATES.READY && initMouse && evt.isPrimary){
          const dX = evt.clientX - initMouse.x;
          const dY = -(evt.clientY - initMouse.y);
          const distance = Math.sqrt(dX * dX + dY * dY);
          if(distance >= 10 && dY > 0){
            setInitDirection({x: dX, y: dY});
            setBalls(Array(numBalls).fill(true));
            setBallsState(BALLS_STATES.PLAYING);
            finishedBalls.current = 0;
          }
          setInitMouse(null);
        }
      }}
    >
      {gameField && initMouse && (
        <div
          className="origin"
          style={{
            left: initMouse.x - 15/2,
            top: initMouse.y - 15/2
          }}
        />
      )}
      {initMouse && endMouse && initMouse.y - endMouse.y > 0 && (
        <div
          className="reticle"
          style={{
            left: bigBall - 5/2,
            transform: `rotate(${180 * Math.atan2(endMouse.x - initMouse.x, initMouse.y - endMouse.y) / Math.PI}deg)`
          }}
        />
      )}
      <div
        className="ball big-ball"
        style={{
          left: (pendingBigBall ? pendingBigBall : bigBall) - BIG_BALL_SIZE / 2
        }}
      >
        {numBalls}
      </div>
      {(ballsState === BALLS_STATES.PLAYING || ballsState === BALLS_STATES.FF) && balls.map((v, i) => (
        (<Ball
          key={i}
          gameState={gameState}
          initialX={bigBall - BIG_BALL_SIZE / 2}
          initialDX={initDirection.x}
          initialDY={initDirection.y}
          maxWidth={gameField && gameField.clientWidth}
          maxHeight={gameField && gameField.clientHeight}
          gameTime={(ballsState === BALLS_STATES.PLAYING || ballsState === BALLS_STATES.FF) && gameTime > (i * 50) ? gameTime : 0}
          updateCallback={(evt) => ballCallback(evt, i)}
        />)
      ))}
    </div>
  )
}


export default BallsOverlay;

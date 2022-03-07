import { useEffect, useMemo, useState } from "react";
import { BALL_SIZE, GAME_COLS, GAME_ROWS, UPDATE_STATE } from "./GameConstants";

const BALL_WIDTH = BALL_SIZE;

function Ball({
  gameState,
  initialX,
  initialDX,
  initialDY,
  maxWidth,
  maxHeight,
  gameTime,
  updateCallback
}) {
  const [ballPosition, setBallPosition] = useState({x: 1, y: 1});
  const [ballDirection, setBallDirection] = useState({x: 1, y: 1})
  const [lastGameTime, setLastGameTime] = useState(null);
  const [isMoving, setIsMoving] = useState(true);

  useEffect(() => {
    setBallPosition({
      x: initialX,
      y: 1
    });
  }, [initialX]);

  useEffect(() => {
    setBallDirection({
      x: initialDX,
      y: initialDY
    });
  }, [initialDX, initialDY]);

  const ballDirectionNormal = useMemo(() => {
    const vectorLength = Math.sqrt(ballDirection.x * ballDirection.x + ballDirection.y * ballDirection.y);
    return {
      x: ballDirection.x / vectorLength,
      y: ballDirection.y / vectorLength
    }
  }, [ballDirection]);

  useEffect(() => {
    if(lastGameTime){
      const dt = gameTime - lastGameTime;
      if(dt > 0 && isMoving){
        const lastPosition = ballPosition;
        const newPosition = {
          x: lastPosition.x + ballDirectionNormal.x * dt,
          y: lastPosition.y + ballDirectionNormal.y * dt
        }
        const currentBlockX = Math.floor(lastPosition.x * GAME_ROWS / maxWidth);
        const currentBlockY = GAME_COLS - Math.floor(lastPosition.y * GAME_COLS / maxHeight) - 1;

        let nextBlockX;
        let nextBlockY;

        if(ballDirectionNormal.x > 0){
          nextBlockX = Math.floor((newPosition.x + BALL_SIZE) * GAME_ROWS / maxWidth);
        }else{
          nextBlockX = Math.floor(newPosition.x * GAME_ROWS / maxWidth);
        }

        if(ballDirectionNormal.y > 0){
          nextBlockY = Math.max(0, GAME_COLS - Math.floor((newPosition.y + BALL_SIZE) * GAME_COLS / maxHeight) - 1);
        }else{
          nextBlockY = GAME_COLS - Math.floor(newPosition.y * GAME_COLS / maxHeight) - 1;
        }

        if(currentBlockX !== nextBlockX || currentBlockY !== nextBlockY){
          // console.log(currentBlockX, currentBlockY, 'moving to', nextBlockX, nextBlockY);
          if(gameState[nextBlockY] && gameState[nextBlockY][nextBlockX] !== 0){
            // console.log('collision with', gameState[nextBlockY][nextBlockX], 'at', nextBlockX, nextBlockY);
            // horizontal or vertical hit
            const blockType = gameState[nextBlockY][nextBlockX];
            if(blockType > 0){
              if(currentBlockX < nextBlockX){
                const nextBlockX_X = nextBlockX * maxWidth / GAME_ROWS;
                const xDifference = nextBlockX_X - newPosition.x - BALL_SIZE;
                newPosition.x = lastPosition.x + xDifference;
                setBallDirection(dir => ({
                  ...dir,
                  x: -dir.x
                }));
              }else if(currentBlockX > nextBlockX){
                const nextBlockX_X = (nextBlockX + 1) * maxWidth / GAME_ROWS;
                const xDifference = nextBlockX_X - newPosition.x;
                newPosition.x = lastPosition.x + xDifference;
                setBallDirection(dir => ({
                  ...dir,
                  x: -dir.x
                }));
              }
              
              if(currentBlockY > nextBlockY){
                const nextBlockY_Y = maxHeight - (nextBlockY + 1) * maxHeight / GAME_COLS;
                const yDifference = newPosition.y - nextBlockY_Y;
                newPosition.y = nextBlockY_Y + yDifference;
                setBallDirection(dir => ({
                  ...dir,
                  y: -dir.y
                }));
              }else if(currentBlockY < nextBlockY){
                const nextBlockY_Y = maxHeight - nextBlockY * maxHeight / GAME_COLS;
                const yDifference = newPosition.y - nextBlockY_Y;
                newPosition.y = nextBlockY_Y + yDifference;
                setBallDirection(dir => ({
                  ...dir,
                  y: -dir.y
                }));
              }
            }

            updateCallback({state: UPDATE_STATE.COLLISION, x: nextBlockX, y: nextBlockY});
          }
        }
        setLastGameTime(gameTime);
        setBallPosition(newPosition);
      }
    }else{
      setLastGameTime(gameTime);
    }
  }, [gameTime, lastGameTime, ballDirectionNormal, isMoving, maxHeight, maxWidth, gameState, updateCallback]);

  useEffect(() => {
    if(ballPosition.x >= maxWidth - BALL_WIDTH || ballPosition.x <= 0){
      setBallDirection(dir => ({
        ...dir,
        x: -dir.x
      }));
      setBallPosition(pos => ({
        ...pos,
        x: Math.max(Math.min(pos.x, maxWidth - BALL_WIDTH - 1), 1)
      }));
    }else if(ballPosition.y >= maxHeight - BALL_WIDTH || ballPosition.y <= 0){
      setBallDirection(dir => ({
        ...dir,
        y: -dir.y
      }));
      setBallPosition(pos => ({
        ...pos,
        y: Math.max(Math.min(pos.y, maxHeight - BALL_WIDTH - 1), 1)
      }));
    }
  }, [ballPosition, maxHeight, maxWidth]);

  useEffect(() => {
    if(ballPosition.y <= 0 && isMoving){
      setIsMoving(false);
      updateCallback && updateCallback({state: UPDATE_STATE.STOPPED, x: ballPosition.x, y: ballPosition.y});
    }
  }, [ballPosition, isMoving, updateCallback]);

  return (
    <div
      className="ball"
      style={{
        bottom: ballPosition.y || 0,
        left: ballPosition.x || 0
      }}
    />
  )
}

export default Ball;
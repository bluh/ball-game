import { useEffect, useMemo, useRef, useState } from "react";
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
  const [isMoving, setIsMoving] = useState(true);

  const lastGameTime = useRef(0);

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
    if(lastGameTime.current){
      const dt = gameTime - lastGameTime.current;
      if(dt > 0 && isMoving){
        const lastPosition = ballPosition;
        const newPosition = {
          x: lastPosition.x + ballDirectionNormal.x * dt,
          y: lastPosition.y + ballDirectionNormal.y * dt
        }
        const ballOffset = {
          x: (ballDirectionNormal.x > 0) * BALL_SIZE,
          y: (ballDirectionNormal.y > 0) * BALL_SIZE
        }
        const currentBlockX = Math.floor((lastPosition.x + ballOffset.x) * GAME_ROWS / maxWidth);
        const currentBlockY = GAME_COLS - Math.floor((lastPosition.y + ballOffset.y) * GAME_COLS / maxHeight) - 1;

        const nextBlockX = Math.floor((newPosition.x + ballOffset.x) * GAME_ROWS / maxWidth);
        const nextBlockY = Math.max(0, GAME_COLS - Math.floor((newPosition.y + ballOffset.y) * GAME_COLS / maxHeight) - 1);

        if((currentBlockX !== nextBlockX || currentBlockY !== nextBlockY) && nextBlockX >= 0 && nextBlockX < GAME_ROWS && nextBlockY >= 0){
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
        setBallPosition(newPosition);
      }
    }
    lastGameTime.current = gameTime;
  }, [gameTime]);

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
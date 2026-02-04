import React, { useRef, useEffect, useState, useCallback } from 'react';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(true);
  const [gameStarted, setGameStarted] = useState(false); // New state to control initial screen

  // Game Constants
  const TILE_SIZE = 20;
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 400;
  const INITIAL_SNAKE_LENGTH = 3;
  const GAME_SPEED = 100; // milliseconds per frame

  // Game State
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([]);
  const [food, setFood] = useState<{ x: number; y: number } | null>(null);
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [changingDirection, setChangingDirection] = useState(false); // To prevent rapid direction changes

  // Utility function to generate random coordinates
  const generateRandomCoord = useCallback((max: number) => {
    return Math.floor(Math.random() * (max / TILE_SIZE)) * TILE_SIZE;
  }, []);

  // Initialize Game
  const initializeGame = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setDirection('RIGHT');
    setChangingDirection(false);

    const initialSnake = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: (INITIAL_SNAKE_LENGTH - 1 - i) * TILE_SIZE, y: 0 });
    }
    setSnake(initialSnake);

    setFood({
      x: generateRandomCoord(CANVAS_WIDTH),
      y: generateRandomCoord(CANVAS_HEIGHT),
    });
  }, [generateRandomCoord]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (changingDirection || gameOver || !gameStarted) return; // Only allow input if game is started and not over

      const keyPressed = event.key;
      const goingUp = direction === 'UP';
      const goingDown = direction === 'DOWN';
      const goingLeft = direction === 'LEFT';
      const goingRight = direction === 'RIGHT';

      if (keyPressed === 'ArrowLeft' && !goingRight) {
        setDirection('LEFT');
        setChangingDirection(true);
      } else if (keyPressed === 'ArrowUp' && !goingDown) {
        setDirection('UP');
        setChangingDirection(true);
      } else if (keyPressed === 'ArrowRight' && !goingLeft) {
        setDirection('RIGHT');
        setChangingDirection(true);
      } else if (keyPressed === 'ArrowDown' && !goingUp) {
        setDirection('DOWN');
        setChangingDirection(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, changingDirection, gameOver, gameStarted]);

  // Game Loop
  useEffect(() => {
    if (gameOver || !gameStarted) return; // Only run loop if game is started and not over

    const gameInterval = setInterval(() => {
      setSnake((prevSnake) => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] }; // Get current head position

        // Move head based on direction
        switch (direction) {
          case 'UP':
            head.y -= TILE_SIZE;
            break;
          case 'DOWN':
            head.y += TILE_SIZE;
            break;
          case 'LEFT':
            head.x -= TILE_SIZE;
            break;
          case 'RIGHT':
            head.x += TILE_SIZE;
            break;
        }

        // Check for collisions
        const collisionWithWall =
          head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT;
        const collisionWithSelf = newSnake.some(
          (segment, index) => index !== 0 && segment.x === head.x && segment.y === head.y
        );

        if (collisionWithWall || collisionWithSelf) {
          setGameOver(true);
          clearInterval(gameInterval);
          return prevSnake; // Don't update snake if game over
        }

        newSnake.unshift(head); // Add new head

        // Check for food collision
        if (food && head.x === food.x && head.y === food.y) {
          setScore((prevScore) => prevScore + 1);
          setFood({
            x: generateRandomCoord(CANVAS_WIDTH),
            y: generateRandomCoord(CANVAS_HEIGHT),
          });
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        setChangingDirection(false); // Allow direction change in next frame
        return newSnake;
      });
    }, GAME_SPEED);

    return () => clearInterval(gameInterval);
  }, [gameOver, direction, food, generateRandomCoord, gameStarted]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Clear canvas

    // Draw snake (only if game has started)
    if (gameStarted) {
      snake.forEach((segment) => {
        context.fillStyle = 'lime';
        context.strokeStyle = 'darkgreen';
        context.fillRect(segment.x, segment.y, TILE_SIZE, TILE_SIZE);
        context.strokeRect(segment.x, segment.y, TILE_SIZE, TILE_SIZE);
      });

      // Draw food
      if (food) {
        context.fillStyle = 'red';
        context.strokeStyle = 'darkred';
        context.fillRect(food.x, food.y, TILE_SIZE, TILE_SIZE);
        context.strokeRect(food.x, food.y, TILE_SIZE, TILE_SIZE);
      }
    }


    // Display score
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`Score: ${score}`, 5, 25);

    if (!gameStarted && gameOver) { // Initial screen
      context.textAlign = 'center';
      context.fillText('SNAKE GAME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      context.font = '16px Arial';
      context.fillText('Use Arrow Keys to Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      context.fillText('Eat Food to Grow', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      context.fillText('Avoid Walls & Self', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      context.fillText('Press "Start Game" or Space', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else if (gameOver && gameStarted) { // Game over screen
      context.textAlign = 'center';
      context.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      context.fillText('Press "Restart Game" or Space', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    }
  }, [snake, food, score, gameOver, gameStarted]);

  // Handle Game Start/Restart
  const startGame = () => {
    setGameStarted(true);
    initializeGame();
  };

  const restartGame = () => {
    setGameStarted(true);
    initializeGame();
  };

  // Restart Game on Spacebar (also for initial start)
  useEffect(() => {
    const handleSpacebar = (event: KeyboardEvent) => {
      if (event.key === ' ' && gameOver) { // Only allow spacebar to start/restart if game is over
        startGame();
      }
    };
    window.addEventListener('keydown', handleSpacebar);
    return () => window.removeEventListener('keydown', handleSpacebar);
  }, [gameOver, startGame]);

  // Initialize game on mount - this is now handled by the start button/spacebar
  useEffect(() => {
    // initializeGame(); // Removed: game now starts with button or spacebar
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-700 bg-gray-800"
      />
      {(!gameStarted || gameOver) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white">
          {!gameStarted && gameOver && ( // Initial state
            <>
              <h2 className="text-3xl font-bold mb-4">SNAKE GAME</h2>
              <p className="text-lg">Use Arrow Keys to Move</p>
              <p className="text-lg mb-4">Eat Food to Grow, Avoid Walls & Self</p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-xl"
              >
                Start Game
              </button>
            </>
          )}
          {gameStarted && gameOver && ( // Game Over state
            <>
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-4">Your Score: {score}</p>
              <button
                onClick={restartGame}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xl"
              >
                Restart Game
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GameCanvas;

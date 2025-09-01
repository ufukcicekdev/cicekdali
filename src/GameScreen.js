import React, { useState, useEffect, useRef } from 'react';

// --- OYUN SABİTLERİ ---
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const PLAYER_SPEED = 5;
const PROJECTILE_WIDTH = 10;
const PROJECTILE_HEIGHT = 30;
const PROJECTILE_SPEED = 15;
const INITIAL_LIVES = 3;
const INITIAL_TARGET_SIZE = 70;
const FIRE_COOLDOWN = 200;

function GameScreen({ settings }) {
  // --- React State ---
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('loading');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [, setRenderState] = useState({});

  // --- Refs ---
  const gameAreaRef = useRef(null);
  const keys = useRef({ left: false, right: false, space: false });
  const player = useRef({ x: 0, y: 0 });
  const projectiles = useRef([]);
  const targets = useRef([]);
  const difficultyTier = useRef(1);
  const canFire = useRef(true);
  const sounds = useRef({});
  const isAudioUnlocked = useRef(false);

  const projectileSymbol = settings.projectile === 'cicek' ? '🌸' : '🪴';

  // --- KURULUM ---

  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem('cicekAtariHighScore') || '0', 10));
    // DÜZELTME: hit sesini .mp3 olarak değiştir
    sounds.current = {
        shoot: new Audio('/sounds/hit2.mp3'),
        hit: new Audio('/sounds/ah.mp3')
    };
    Object.values(sounds.current).forEach(sound => sound.preload = 'auto');
  }, []);

  useEffect(() => {
    const handleKey = (e, isDown) => {
      if (e.code === 'ArrowLeft') keys.current.left = isDown;
      if (e.code === 'ArrowRight') keys.current.right = isDown;
      if (e.code === 'Space') keys.current.space = isDown;
    };
    const down = (e) => handleKey(e, true);
    const up = (e) => handleKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) setDimensions({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
    });
    if (gameAreaRef.current) resizeObserver.observe(gameAreaRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width > 0 && gameState === 'loading') restartGame();
  }, [dimensions, gameState]);

  useEffect(() => {
    if (lives <= 0 && gameState === 'ready') {
      if (score > highScore) {
        localStorage.setItem('cicekAtariHighScore', score);
        setHighScore(score);
      }
      setGameState('gameOver');
    }
  }, [lives, score, highScore, gameState]);

  // --- ZORLUK VE HEDEF OLUŞTURMA ---
  useEffect(() => {
    if (gameState !== 'ready') return;
    const difficultyTimer = setInterval(() => { difficultyTier.current += 1; }, 25000);
    const spawnLogic = () => {
      const spawnInterval = Math.max(500, 3000 / difficultyTier.current);
      spawnTarget();
      setTimeout(spawnLogic, spawnInterval);
    };
    spawnLogic();
    return () => clearInterval(difficultyTimer);
  }, [gameState]);

  const spawnTarget = () => {
    if (dimensions.width === 0) return;
    const size = INITIAL_TARGET_SIZE;
    const speed = 1.5 + (difficultyTier.current * 0.5);
    targets.current.push({ x: Math.random() * (dimensions.width - size), y: 0 - size, vy: speed, size: size });
  };

  const restartGame = () => {
    setScore(0);
    setLives(INITIAL_LIVES);
    difficultyTier.current = 1;
    if (dimensions.width > 0) player.current = { x: dimensions.width / 2 - PLAYER_WIDTH / 2, y: dimensions.height - PLAYER_HEIGHT - 10 };
    targets.current = [];
    projectiles.current = [];
    setGameState('ready');
  };

  const playSound = (soundName) => {
    const sound = sounds.current[soundName];
    if (sound) {
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.error(`Ses çalınamadı [${soundName}]:`, error));
      }
    }
  };

  // --- ANA OYUN DÖNGÜSÜ ---
  useEffect(() => {
    if (gameState !== 'ready') return;
    const gameLoop = () => {
      // Oyuncu Hareketi
      if (keys.current.left) player.current.x -= PLAYER_SPEED;
      if (keys.current.right) player.current.x += PLAYER_SPEED;
      if (player.current.x < 0) player.current.x = 0;
      if (player.current.x > dimensions.width - PLAYER_WIDTH) player.current.x = dimensions.width - PLAYER_WIDTH;

      // Ateş Etme
      if (keys.current.space && canFire.current) {
        canFire.current = false;
        if (!isAudioUnlocked.current) {
            Object.values(sounds.current).forEach(s => { s.play().catch(()=>{}); s.pause(); s.currentTime = 0; });
            isAudioUnlocked.current = true;
        }
        playSound('shoot');
        projectiles.current.push({ x: player.current.x + PLAYER_WIDTH / 2 - PROJECTILE_WIDTH / 2, y: player.current.y });
        setTimeout(() => { canFire.current = true; }, FIRE_COOLDOWN);
      }

      // Mermi Hareketi
      projectiles.current.forEach((p, i) => {
        p.y -= PROJECTILE_SPEED;
        if (p.y < 0) projectiles.current.splice(i, 1);
      });

      // Hedef Hareketi ve Kontrolü
      targets.current.forEach((target, i) => {
        target.y += target.vy;
        if (target.y > dimensions.height) {
          targets.current.splice(i, 1);
          setLives(l => l - 1);
        }

        // Çarpışma kontrolü
        projectiles.current.forEach((p, p_i) => {
            if (p.x < target.x + target.size &&
                p.x + PROJECTILE_WIDTH > target.x &&
                p.y < target.y + target.size &&
                p.y + PROJECTILE_HEIGHT > target.y) {
              
              playSound('hit');
              targets.current.splice(i, 1);
              projectiles.current.splice(p_i, 1);
              setScore(s => s + 10);
            }
        });
      });

      setRenderState({});
    };

    const animationId = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(animationId);
  }, [gameState, dimensions]);

  // --- RENDER ---

  if (gameState === 'gameOver') {
    return (
        <div className="overlay">
            <h1>GAME OVER</h1>
            {score > highScore && <h2>YENİ YÜKSEK SKOR!</h2>}
            <h2>SKOR: {score}</h2>
            <button onClick={restartGame}>TEKRAR OYNA</button>
        </div>
    )
  }

  return (
    <div className="container-fluid game-container" ref={gameAreaRef} style={{cursor: 'none'}}>
      <div className="game-header">
        <div className="game-stats-left">SCORE: {score}</div>
        <div className="game-stats-center">LIVES: {lives}</div>
        <div className="game-stats-right">HI: {highScore}</div>
      </div>
      
      {targets.current.map((target, i) => (
        settings.targetImg ? (
          <img key={i} src={settings.targetImg} alt="Hedef" className="game-target" style={{ left: target.x, top: target.y, width: target.size, height: target.size }} />
        ) : (
          <div key={i} className="default-target game-target" style={{ left: target.x, top: target.y, width: target.size, height: target.size }}></div>
        )
      ))}

      {projectiles.current.map((p, i) => (
          <div key={i} className="projectile" style={{ left: p.x, top: p.y, width: PROJECTILE_WIDTH, height: PROJECTILE_HEIGHT, fontSize: 20 }}>{projectileSymbol}</div>
      ))}

      <div className="projectile" style={{ left: player.current.x, top: player.current.y, fontSize: PLAYER_WIDTH }}>
        {projectileSymbol}
      </div>
    </div>
  );
}

export default GameScreen;
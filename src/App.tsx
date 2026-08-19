import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameMode, GameStats, CampaignMission, ToolType } from './types';
import { sounds } from './utils/audio';
import {
  getSavedHighScore,
  saveHighScore,
  getSavedEnergy,
  addSavedEnergy,
  getSavedMissions,
  saveMissionProgress
} from './utils/storage';
import { CAMPAIGN_MISSIONS } from './utils/missions';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { StatsPanel } from './components/StatsPanel';
import { Oscilloscope } from './components/Oscilloscope';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { TutorialModal } from './components/TutorialModal';
import { MissionsModal } from './components/MissionsModal';

export default function App() {
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('endless');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover' | 'victory'>('idle');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: getSavedHighScore(),
    combo: 0,
    maxCombo: 0,
    blockedCount: 0,
    missedCount: 0,
    gridIntegrity: 100,
    overheat: 0,
    voltageLevel: 220,
    avgReactionTimeMs: 0,
    reactionTimeRecords: [],
    level: 1,
    energyPoints: getSavedEnergy(),
    empCharges: 1,
  });
  const [activeTool, setActiveTool] = useState<ToolType>('grounding');
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [missions, setMissions] = useState<CampaignMission[]>(getSavedMissions());

  // Game over/victory state
  const [gameOverReason, setGameOverReason] = useState('');
  const [isHighScore, setIsHighScore] = useState(false);
  const [currentMission, setCurrentMission] = useState<CampaignMission | null>(null);

  // Game engine ref
  const gameEngineRef = useRef<GameEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize game engine
  useEffect(() => {
    if (canvasRef.current && !gameEngineRef.current) {
      const engine = new GameEngine(canvasRef.current);
      gameEngineRef.current = engine;

      // Set up callbacks
      engine.onStatsUpdate = (newStats) => {
        setStats({ ...newStats });
      };

      engine.onGameOver = (finalStats, reason) => {
        const isNewHighScore = saveHighScore(finalStats.score);
        const energyGained = addSavedEnergy(Math.round(finalStats.score / 10));

        setStats(prev => ({
          ...prev,
          energyPoints: energyGained,
          highScore: Math.max(prev.highScore, finalStats.score)
        }));

        setGameOverReason(reason);
        setIsHighScore(isNewHighScore);
        setGameState('gameover');
      };

      engine.onVictory = (finalStats) => {
        if (currentMission) {
          const stars = finalStats.gridIntegrity >= 80 ? 3 : finalStats.gridIntegrity >= 45 ? 2 : 1;
          saveMissionProgress(currentMission.id, stars);
          setMissions(getSavedMissions());

          const energyGained = addSavedEnergy(Math.round(finalStats.score / 8));
          setStats(prev => ({
            ...prev,
            energyPoints: energyGained
          }));
        }
        setGameState('victory');
      };

      // Handle resize
      const handleResize = () => {
        const canvas = canvasRef.current;
        if (canvas && gameEngineRef.current) {
          const container = canvas.parentElement;
          if (container) {
            const width = container.clientWidth;
            const height = Math.min(600, window.innerHeight * 0.7);
            gameEngineRef.current.resize(width, height);
          }
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Initial resize

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [currentMission]);

  // Start game function
  const startGame = useCallback((mode: GameMode, mission?: CampaignMission) => {
    if (!gameEngineRef.current) return;

    const engine = gameEngineRef.current;
    engine.mode = mode;
    engine.activeTool = activeTool;

    if (mission) {
      engine.targetScore = mission.targetScore;
      engine.missionDuration = mission.durationSeconds;
      engine.speedMultiplier = mission.speedMultiplier;
      setCurrentMission(mission);
    } else {
      engine.targetScore = 5000;
      engine.missionDuration = 60;
      engine.speedMultiplier = 1.0;
      setCurrentMission(null);
    }

    engine.start();
    setGameState('playing');
  }, [activeTool]);

  // Auto-start endless mode on mount
  useEffect(() => {
    // Small delay to ensure canvas is ready
    const timer = setTimeout(() => {
      if (gameState === 'idle' && gameEngineRef.current) {
        startGame('endless');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [gameState, startGame]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const engine = gameEngineRef.current;
      if (!engine) return;

      // Tool selection (1, 2, 3)
      if (e.key === '1') {
        setActiveTool('grounding');
        engine.activeTool = 'grounding';
      } else if (e.key === '2') {
        setActiveTool('surge_protector');
        engine.activeTool = 'surge_protector';
      } else if (e.key === '3') {
        setActiveTool('fuse');
        engine.activeTool = 'fuse';
      }
      // Lane selection (1-5 for lanes)
      else if (e.key >= '1' && e.key <= '5') {
        const lane = parseInt(e.key) - 1;
        engine.deployDefenseOnLane(lane);
      }
      // EMP blast (Space)
      else if (e.key === ' ') {
        e.preventDefault();
        engine.triggerEMP();
      }
      // Pause (P or Escape)
      else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'playing') {
          gameEngineRef.current?.pause();
          setGameState('paused');
        } else if (gameState === 'paused') {
          gameEngineRef.current?.resume();
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeTool]);

  // Event handlers
  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'endless') {
      startGame('endless');
    } else if (mode === 'reflex_test') {
      startGame('reflex_test');
    }
  };

  const handleSelectMission = (mission: CampaignMission) => {
    setShowMissions(false);
    setGameMode('campaign');
    startGame('campaign', mission);
  };

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    if (gameEngineRef.current) {
      gameEngineRef.current.activeTool = tool;
    }
  };

  const handleLaneDeploy = (laneIndex: number) => {
    if (gameEngineRef.current && gameState === 'playing') {
      gameEngineRef.current.deployDefenseOnLane(laneIndex);
    }
  };

  const handleTriggerEMP = () => {
    if (gameEngineRef.current && gameState === 'playing') {
      gameEngineRef.current.triggerEMP();
    }
  };

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !gameEngineRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    gameEngineRef.current.handleCanvasInput(clientX, clientY);
  };

  const handleToggleMute = () => {
    const newMuted = sounds.toggleMute();
    setIsMuted(newMuted);
  };

  const handleRestart = () => {
    if (!gameEngineRef.current) return;

    setIsHighScore(false);
    setGameOverReason('');

    if (currentMission) {
      startGame('campaign', currentMission);
    } else if (gameMode === 'reflex_test') {
      startGame('reflex_test');
    } else {
      startGame('endless');
    }
  };

  const handleResume = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resume();
      setGameState('playing');
    }
  };

  const handleNextMission = () => {
    if (!currentMission) return;

    const nextMissionId = currentMission.id + 1;
    const nextMission = missions.find(m => m.id === nextMissionId);

    if (nextMission && nextMission.unlocked) {
      setGameState('victory'); // Will be cleared when starting new mission
      setTimeout(() => {
        handleSelectMission(nextMission);
      }, 100);
    } else {
      // No more missions or next is locked, go back to missions list
      setGameState('idle');
      setShowMissions(true);
    }
  };

  const handleOpenUpgrades = () => {
    // For now, just show tutorial - could implement upgrades modal later
    setShowTutorial(true);
  };

  // Calculate mission time left
  const getTimeLeft = () => {
    if (gameMode === 'endless') return 0;
    if (!gameEngineRef.current) return 0;
    return Math.max(0, gameEngineRef.current.missionDuration - gameEngineRef.current.missionTimeElapsed);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <Header
        mode={gameMode}
        onSelectMode={handleSelectMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenMissions={() => setShowMissions(true)}
        onOpenUpgrades={handleOpenUpgrades}
        energyPoints={stats.energyPoints}
      />

      {/* Stats Panel */}
      <StatsPanel
        stats={stats}
        mode={gameMode}
        missionTimeLeft={getTimeLeft()}
      />

      {/* Game Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-slate-900">
        <div className="relative w-full max-w-2xl aspect-[3/4] max-h-[600px]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasInteraction}
            onTouchStart={handleCanvasInteraction}
            className="w-full h-full rounded-lg border-2 border-slate-800 bg-slate-950 cursor-crosshair touch-none select-none"
          />

          {/* Pause overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-4">⏸️</div>
                <h3 className="text-xl font-bold text-white font-mono mb-2">ĐÃ TẠM DỪNG</h3>
                <p className="text-slate-400 text-sm mb-4">Nhấn P hoặc Escape để tiếp tục</p>
                <button
                  onClick={handleResume}
                  className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg font-mono transition-colors"
                >
                  TIẾP TỤC
                </button>
              </div>
            </div>
          )}

          {/* Start prompt */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white font-mono mb-2">SẴN SÀNG BẢO VỆ LƯỚI ĐIỆN</h3>
                <p className="text-slate-400 text-sm">Chế độ chơi đang khởi động...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Oscilloscope */}
      <div className="px-2 sm:px-4 pb-2">
        <Oscilloscope
          waveBuffer={gameEngineRef.current?.waveBuffer || new Array(80).fill(0)}
          voltage={stats.voltageLevel}
          integrity={stats.gridIntegrity}
        />
      </div>

      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={handleToolSelect}
        toolCooldowns={gameEngineRef.current?.toolCooldowns || {
          grounding: { current: 0, max: 0.35 },
          surge_protector: { current: 0, max: 1.2 },
          fuse: { current: 0, max: 2.0 }
        }}
        empCharges={stats.empCharges}
        onTriggerEMP={handleTriggerEMP}
        onDeployLane={handleLaneDeploy}
        numLanes={5}
      />

      {/* Modals */}
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {showMissions && (
        <MissionsModal
          missions={missions}
          onSelectMission={handleSelectMission}
          onClose={() => setShowMissions(false)}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          reason={gameOverReason}
          onRestart={handleRestart}
          onOpenUpgrades={handleOpenUpgrades}
          isHighScore={isHighScore}
        />
      )}

      {gameState === 'victory' && currentMission && (
        <VictoryModal
          stats={stats}
          missionTitle={currentMission.title}
          onNextMission={handleNextMission}
          onReplay={handleRestart}
          onOpenMissions={() => {
            setGameState('idle');
            setShowMissions(true);
          }}
        />
      )}
    </div>
  );
}
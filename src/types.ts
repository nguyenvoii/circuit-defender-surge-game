export type ToolType = 'grounding' | 'surge_protector' | 'fuse';

export type GameMode = 'endless' | 'campaign' | 'reflex_test';

export interface SurgeItem {
  id: string;
  lane: number; // 0 to 4 (5 lanes)
  x: number;
  y: number;
  speed: number;
  type: 'spike' | 'lightning' | 'overload' | 'glitch' | 'bonus';
  voltage: number; // in Volts (e.g. 500, 1000, 2500)
  maxHealth: number;
  health: number;
  radius: number;
  color: string;
  glowColor: string;
  spawnTime: number;
  isBlocked: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'ring' | 'lightning';
}

export interface DefenseObject {
  id: string;
  lane: number;
  toolType: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number; // remaining frames/ms
  maxDuration: number;
  durability: number; // hits left
  maxDurability: number;
  alpha: number;
  active: boolean;
}

export interface ElectricArc {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  segments: { x: number; y: number }[];
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  fontSize: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
  blockedCount: number;
  missedCount: number;
  gridIntegrity: number; // 0 - 100%
  overheat: number; // 0 - 100%
  voltageLevel: number; // current instant kV
  avgReactionTimeMs: number;
  reactionTimeRecords: number[];
  level: number;
  energyPoints: number;
  empCharges: number;
}

export interface CampaignMission {
  id: number;
  title: string;
  subtitle: string;
  targetScore: number;
  durationSeconds: number;
  hazardTypes: ('spike' | 'lightning' | 'overload' | 'glitch')[];
  description: string;
  speedMultiplier: number;
  rewardEnergy: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
}

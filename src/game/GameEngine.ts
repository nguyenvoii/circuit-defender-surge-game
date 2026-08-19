import {
  DefenseObject,
  ElectricArc,
  FloatingText,
  GameMode,
  GameStats,
  Particle,
  SurgeItem,
  ToolType,
} from '../types';
import { sounds } from '../utils/audio';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 600;
  private height: number = 800;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Game configuration
  public numLanes: number = 5;
  public activeTool: ToolType = 'grounding';
  public mode: GameMode = 'endless';
  public speedMultiplier: number = 1.0;
  public missionDuration: number = 60; // for campaign/reflex
  public missionTimeElapsed: number = 0;
  public targetScore: number = 5000;

  // Game state
  public surges: SurgeItem[] = [];
  public defenses: DefenseObject[] = [];
  public particles: Particle[] = [];
  public ambientParticles: Particle[] = [];
  public electricArcs: ElectricArc[] = [];
  public floatingTexts: FloatingText[] = [];

  // Cooldowns per tool (in seconds)
  public toolCooldowns: Record<ToolType, { current: number; max: number }> = {
    grounding: { current: 0, max: 0.35 },
    surge_protector: { current: 0, max: 1.2 },
    fuse: { current: 0, max: 2.0 },
  };

  public stats: GameStats = {
    score: 0,
    highScore: 0,
    combo: 0,
    maxCombo: 0,
    blockedCount: 0,
    missedCount: 0,
    gridIntegrity: 100, // 100%
    overheat: 0, // 0 - 100%
    voltageLevel: 220, // 220V nominal
    avgReactionTimeMs: 0,
    reactionTimeRecords: [],
    level: 1,
    energyPoints: 0,
    empCharges: 1,
  };

  // Oscilloscope wave buffer
  public waveBuffer: number[] = new Array(80).fill(0);

  // Callbacks
  public onStatsUpdate?: (stats: GameStats) => void;
  public onGameOver?: (stats: GameStats, reason: string) => void;
  public onVictory?: (stats: GameStats) => void;

  // Spawner timing
  private spawnTimer: number = 0;
  private nextSpawnInterval: number = 1.2; // seconds

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Cannot get 2D context');
    this.ctx = context;

    this.initAmbientParticles();
  }

  public resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = w;
    this.height = h;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  private initAmbientParticles() {
    this.ambientParticles = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 1.5 + Math.random() * 2.5,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.3 ? '#00f0ff' : '#00e575',
        alpha: 0.2 + Math.random() * 0.5,
        decay: 0,
        life: 1,
        maxLife: 1,
        shape: 'spark',
      });
    }
  }

  public start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    sounds.startAmbientHum();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sounds.stopAmbientHum();
  }

  public reset() {
    this.surges = [];
    this.defenses = [];
    this.particles = [];
    this.electricArcs = [];
    this.floatingTexts = [];
    this.spawnTimer = 0;
    this.missionTimeElapsed = 0;
    this.nextSpawnInterval = 1.0;

    this.toolCooldowns.grounding.current = 0;
    this.toolCooldowns.surge_protector.current = 0;
    this.toolCooldowns.fuse.current = 0;

    this.stats = {
      ...this.stats,
      score: 0,
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
      empCharges: 1,
    };
  }

  // Trigger defense on a specific lane
  public deployDefenseOnLane(laneIndex: number, toolOverride?: ToolType) {
    if (!this.isRunning || this.isPaused) return;

    const tool = toolOverride || this.activeTool;
    const cooldown = this.toolCooldowns[tool];

    if (cooldown.current > 0) {
      // Still cooling down
      this.createFloatingText(
        this.getLaneCenterX(laneIndex),
        this.getPerimeterY() - 20,
        'Nạp lại...',
        '#ef4444',
        14
      );
      return;
    }

    // Set cooldown
    cooldown.current = cooldown.max;

    const laneX = this.getLaneCenterX(laneIndex);
    const laneWidth = this.width / this.numLanes;
    const defenseY = this.getPerimeterY();

    let durability = 1;
    let duration = 0.5; // seconds

    if (tool === 'grounding') {
      sounds.playGroundingZap();
      durability = 2;
      duration = 0.45;
      this.stats.overheat = Math.max(0, this.stats.overheat - 4); // Grounding cools the system
      this.createGroundingSparks(laneX, defenseY);
    } else if (tool === 'surge_protector') {
      sounds.playSurgeAbsorb();
      durability = 3;
      duration = 1.8;
      this.createShieldAura(laneX, defenseY, laneWidth * 0.85);
    } else if (tool === 'fuse') {
      sounds.playFuseTrip();
      durability = 5;
      duration = 2.2;
      this.createFuseArc(laneX, defenseY, laneWidth * 0.9);
    }

    // Vibration on mobile if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(tool === 'grounding' ? 25 : tool === 'surge_protector' ? 40 : 60);
    }

    const defense: DefenseObject = {
      id: Math.random().toString(36).substring(2, 9),
      lane: laneIndex,
      toolType: tool,
      x: laneX,
      y: defenseY,
      width: laneWidth * 0.85,
      height: 24,
      duration: duration,
      maxDuration: duration,
      durability: durability,
      maxDurability: durability,
      alpha: 1,
      active: true,
    };

    // Replace or add defense in this lane
    this.defenses = this.defenses.filter(d => d.lane !== laneIndex);
    this.defenses.push(defense);

    // Instant collision check with surges close to this lane & perimeter
    this.checkDirectInterception(laneIndex, defense);
  }

  // Deploy defense based on canvas click/touch coordinates
  public handleCanvasInput(clientX: number, clientY: number) {
    if (!this.isRunning || this.isPaused) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const laneWidth = this.width / this.numLanes;
    const laneIndex = Math.min(
      Math.max(0, Math.floor(x / laneWidth)),
      this.numLanes - 1
    );

    // Check if user tapped directly on a surge higher up to intercept it!
    const hitSurge = this.surges.find(s => {
      const dist = Math.hypot(s.x - x, s.y - y);
      return dist <= s.radius * 1.5 + 15;
    });

    if (hitSurge) {
      this.deployDefenseOnLane(hitSurge.lane);
    } else {
      this.deployDefenseOnLane(laneIndex);
    }
  }

  // Trigger EMP Shockwave (Emergency Discharge)
  public triggerEMP() {
    if (!this.isRunning || this.isPaused) return;
    if (this.stats.empCharges <= 0) {
      this.createFloatingText(this.width / 2, this.height / 2, 'Hết năng lượng EMP!', '#ef4444', 18);
      return;
    }

    this.stats.empCharges--;
    sounds.playEMPBlast();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 100]);
    }

    // Destroy all active surges on screen
    let clearedCount = 0;
    this.surges.forEach(surge => {
      if (!surge.isBlocked) {
        surge.isBlocked = true;
        clearedCount++;
        this.createExplosion(surge.x, surge.y, '#00f0ff', 35);
        this.addScore(surge.voltage * 0.6, 'EMP XẢ TOÀN LƯỚI!', surge.x, surge.y);
      }
    });

    this.surges = [];
    this.stats.overheat = Math.max(0, this.stats.overheat - 25);
    this.stats.gridIntegrity = Math.min(100, this.stats.gridIntegrity + 10);

    // Massive screen shockwave effect
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: i % 2 === 0 ? '#00f0ff' : '#a855f7',
        alpha: 1,
        decay: 0.02,
        life: 1,
        maxLife: 1,
        shape: 'spark',
      });
    }

    this.createFloatingText(
      this.width / 2,
      this.height * 0.4,
      `XẢ SÉT KHẨN CẤP: +${clearedCount} ĐÃ CHẶN`,
      '#38bdf8',
      22
    );
  }

  private getLaneCenterX(lane: number): number {
    const laneWidth = this.width / this.numLanes;
    return laneWidth * (lane + 0.5);
  }

  private getPerimeterY(): number {
    return this.height * 0.74;
  }

  private checkDirectInterception(lane: number, defense: DefenseObject) {
    const perimeterY = this.getPerimeterY();
    for (const surge of this.surges) {
      if (surge.lane === lane && !surge.isBlocked) {
        // If surge is within interception reach (above or near defense)
        if (surge.y >= perimeterY - 140 && surge.y <= perimeterY + 40) {
          this.interceptSurge(surge, defense);
        }
      }
    }
  }

  private interceptSurge(surge: SurgeItem, defense: DefenseObject) {
    surge.isBlocked = true;
    defense.durability--;

    // Record reaction time (ms since spawn)
    const reactionTime = performance.now() - surge.spawnTime;
    this.stats.reactionTimeRecords.push(reactionTime);
    if (this.stats.reactionTimeRecords.length > 20) {
      this.stats.reactionTimeRecords.shift();
    }
    const sum = this.stats.reactionTimeRecords.reduce((a, b) => a + b, 0);
    this.stats.avgReactionTimeMs = Math.round(sum / this.stats.reactionTimeRecords.length);

    // Score & Combo
    this.stats.combo++;
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }
    this.stats.blockedCount++;

    sounds.playComboNote(this.stats.combo);

    // Check surge type outcome
    if (surge.type === 'bonus') {
      sounds.playBonusCollect();
      this.stats.gridIntegrity = Math.min(100, this.stats.gridIntegrity + 20);
      this.stats.overheat = Math.max(0, this.stats.overheat - 15);
      this.addScore(800, '+20% ỔN ĐỊNH LƯỚI!', surge.x, surge.y, '#00e575');
      this.createExplosion(surge.x, surge.y, '#00e575', 25);
      return;
    }

    let multiplier = 1 + Math.floor(this.stats.combo / 4) * 0.25;
    let basePts = surge.voltage;
    let label = 'ĐÃ CHẶN';
    let color = '#38bdf8';

    if (defense.toolType === 'grounding') {
      if (surge.type === 'lightning') {
        basePts *= 1.5;
        label = 'TIẾP ĐỊA HOÀN HẢO! ⚡';
        color = '#a855f7';
      } else {
        label = 'XẢ TIẾP ĐỊA ⚡';
      }
      this.createElectricArc(surge.x, surge.y, defense.x, this.height * 0.95, '#a855f7');
      this.createExplosion(surge.x, surge.y, '#c084fc', 22);
    } else if (defense.toolType === 'surge_protector') {
      if (surge.type === 'overload') {
        basePts *= 1.4;
        label = 'HẤP THỤ QUÁ ÁP! 🛡️';
        color = '#38bdf8';
      } else {
        label = 'CHỐNG QUÁ TẢI 🛡️';
      }
      this.createExplosion(surge.x, surge.y, '#38bdf8', 25);
    } else if (defense.toolType === 'fuse') {
      label = 'NGẮT CẦU CHÌ! ⚡';
      color = '#f59e0b';
      this.createExplosion(surge.x, surge.y, '#f59e0b', 30);
    }

    const finalPts = Math.round(basePts * multiplier);
    this.addScore(finalPts, `${label} +${finalPts}`, surge.x, surge.y, color);

    // Chance to grant EMP charge every 12 combos
    if (this.stats.combo > 0 && this.stats.combo % 12 === 0 && this.stats.empCharges < 3) {
      this.stats.empCharges++;
      this.createFloatingText(this.width / 2, this.height * 0.45, '+1 SẠC EMP XẢ LƯỚI!', '#00f0ff', 20);
    }

    if (defense.durability <= 0) {
      defense.active = false;
    }
  }

  private addScore(pts: number, text: string, x: number, y: number, color: string = '#00f0ff') {
    this.stats.score += pts;
    this.stats.energyPoints += Math.round(pts / 10);
    this.createFloatingText(x, y, text, color, 16);
  }

  private spawnSurge() {
    const lane = Math.floor(Math.random() * this.numLanes);
    const laneX = this.getLaneCenterX(lane);

    // Random hazard type with probabilities
    const rand = Math.random();
    let type: SurgeItem['type'] = 'spike';
    let voltage = 500;
    let speed = 2.4 * this.speedMultiplier;
    let radius = 18;
    let color = '#ef4444';
    let glowColor = '#f87171';

    if (rand < 0.45) {
      // Standard Voltage Spike (Quá áp đột biến)
      type = 'spike';
      voltage = 500 + Math.floor(Math.random() * 400);
      speed = (2.6 + Math.random() * 1.2) * this.speedMultiplier;
      radius = 16;
      color = '#ef4444';
      glowColor = '#fca5a5';
    } else if (rand < 0.70) {
      // Lightning Surge (Sét cao thế - very fast zig-zag)
      type = 'lightning';
      voltage = 1200 + Math.floor(Math.random() * 800);
      speed = (3.8 + Math.random() * 1.6) * this.speedMultiplier;
      radius = 15;
      color = '#c084fc';
      glowColor = '#e9d5ff';
      sounds.playWarningBeep();
    } else if (rand < 0.88) {
      // Current Overload (Quá tải dòng - large plasma orb)
      type = 'overload';
      voltage = 2500 + Math.floor(Math.random() * 1500);
      speed = (1.8 + Math.random() * 0.8) * this.speedMultiplier;
      radius = 26;
      color = '#f97316';
      glowColor = '#fed7aa';
      sounds.playWarningBeep();
    } else if (rand < 0.95) {
      // Harmonic Glitch (Sóng hài nhiễu loạn)
      type = 'glitch';
      voltage = 800 + Math.floor(Math.random() * 600);
      speed = (2.8 + Math.random() * 1.4) * this.speedMultiplier;
      radius = 18;
      color = '#ec4899';
      glowColor = '#fbcfe8';
    } else {
      // Bonus Supercharge Cell (Hạt năng lượng vàng phục hồi)
      type = 'bonus';
      voltage = 300;
      speed = 2.2 * this.speedMultiplier;
      radius = 18;
      color = '#00e575';
      glowColor = '#86efac';
    }

    const surge: SurgeItem = {
      id: Math.random().toString(36).substring(2, 9),
      lane,
      x: laneX,
      y: -20,
      speed,
      type,
      voltage,
      maxHealth: 1,
      health: 1,
      radius,
      color,
      glowColor,
      spawnTime: performance.now(),
      isBlocked: false,
      trail: [],
    };

    this.surges.push(surge);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.missionTimeElapsed += dt;

    // Update level based on score in endless mode
    if (this.mode === 'endless') {
      const newLevel = 1 + Math.floor(this.stats.score / 2500);
      if (newLevel !== this.stats.level) {
        this.stats.level = newLevel;
        this.speedMultiplier = 1.0 + (newLevel - 1) * 0.12;
        this.createFloatingText(
          this.width / 2,
          this.height * 0.35,
          `CẤP ĐỘ ${newLevel} - TĂNG ÁP LỰC ĐIỆN!`,
          '#f59e0b',
          20
        );
      }
    }

    // Cooldown ticks
    (Object.keys(this.toolCooldowns) as ToolType[]).forEach(k => {
      if (this.toolCooldowns[k].current > 0) {
        this.toolCooldowns[k].current = Math.max(0, this.toolCooldowns[k].current - dt);
      }
    });

    // Surge spawner timer
    this.spawnTimer += dt;
    // Interval decreases with level
    const dynamicInterval = Math.max(
      0.35,
      this.nextSpawnInterval / (1 + (this.stats.level - 1) * 0.1)
    );

    if (this.spawnTimer >= dynamicInterval) {
      this.spawnTimer = 0;
      this.spawnSurge();

      // In high levels or blitz, occasional double surge
      if (this.stats.level >= 3 && Math.random() < 0.35) {
        setTimeout(() => {
          if (this.isRunning && !this.isPaused) this.spawnSurge();
        }, 180);
      }
    }

    // Update Defenses
    for (let i = this.defenses.length - 1; i >= 0; i--) {
      const d = this.defenses[i];
      d.duration -= dt;
      d.alpha = Math.max(0, d.duration / d.maxDuration);
      if (d.duration <= 0 || !d.active || d.durability <= 0) {
        this.defenses.splice(i, 1);
      }
    }

    const perimeterY = this.getPerimeterY();
    const targetBottomY = this.height * 0.92;

    // Update Surges
    for (let i = this.surges.length - 1; i >= 0; i--) {
      const s = this.surges[i];

      // Trail update
      s.trail.unshift({ x: s.x, y: s.y, alpha: 0.8 });
      if (s.trail.length > 8) s.trail.pop();
      s.trail.forEach(t => (t.alpha *= 0.82));

      // Glitch movement (erratic sine wave)
      if (s.type === 'glitch') {
        const laneX = this.getLaneCenterX(s.lane);
        s.x = laneX + Math.sin(s.y * 0.08) * 14;
      }

      s.y += s.speed * 60 * dt;

      // Check collision with active defense
      if (!s.isBlocked) {
        const defense = this.defenses.find(d => d.lane === s.lane && d.active);
        if (defense) {
          if (s.y >= defense.y - 20 && s.y <= defense.y + 20) {
            this.interceptSurge(s, defense);
          }
        }
      }

      // Check reaching appliances (Damage!)
      if (s.y >= targetBottomY) {
        if (!s.isBlocked) {
          if (s.type !== 'bonus') {
            this.handleSurgeLeak(s);
          }
        }
        this.surges.splice(i, 1);
      } else if (s.isBlocked && s.y > perimeterY + 40) {
        this.surges.splice(i, 1);
      }
    }

    // Update Oscilloscope Wave
    this.updateWaveBuffer(dt);

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Ambient Stream Particles
    this.ambientParticles.forEach(p => {
      p.y += p.vy;
      if (p.y > this.height) {
        p.y = 0;
        p.x = Math.random() * this.width;
      }
    });

    // Update Electric Arcs
    for (let i = this.electricArcs.length - 1; i >= 0; i--) {
      const arc = this.electricArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) {
        this.electricArcs.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.1;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Overheat natural cooling
    if (this.stats.overheat > 0) {
      this.stats.overheat = Math.max(0, this.stats.overheat - dt * 2.5);
    }

    // Voltage level fluctuation
    const activeSurgeCount = this.surges.filter(s => !s.isBlocked).length;
    this.stats.voltageLevel = Math.round(220 + activeSurgeCount * 140 + Math.sin(Date.now() * 0.005) * 15);

    // Check Campaign / Blitz Time completion
    if (this.mode === 'campaign' || this.mode === 'reflex_test') {
      if (this.missionTimeElapsed >= this.missionDuration) {
        if (this.stats.score >= this.targetScore && this.stats.gridIntegrity > 0) {
          this.triggerVictory();
          return;
        } else {
          this.triggerGameOver('Hết thời gian! Không đạt đủ điểm ổn định điện áp.');
          return;
        }
      }
    }

    // Notify React state
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private handleSurgeLeak(surge: SurgeItem) {
    this.stats.missedCount++;
    this.stats.combo = 0; // Combo reset
    sounds.playDamage();

    // Damage based on voltage
    let damage = Math.round(surge.voltage / 75);
    if (surge.type === 'overload') damage = 35;
    if (surge.type === 'lightning') damage = 25;

    this.stats.gridIntegrity = Math.max(0, this.stats.gridIntegrity - damage);
    this.stats.overheat = Math.min(100, this.stats.overheat + damage * 1.5);

    this.createExplosion(surge.x, this.height * 0.92, '#ef4444', 30);
    this.createFloatingText(
      surge.x,
      this.height * 0.88,
      `CHÁY LINH KIỆN! -${damage}%`,
      '#ef4444',
      18
    );

    // Screen shake / flash
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Check failure condition: Grid integrity 0% OR Overheat 100%
    if (this.stats.gridIntegrity <= 0) {
      sounds.playBlackout();
      this.triggerGameOver('SỤP ĐỔ LƯỚI ĐIỆN! Thiết bị bảo vệ bị thiêu rụi.');
    } else if (this.stats.overheat >= 100) {
      sounds.playBlackout();
      this.triggerGameOver('QUÁ NHIỆT 100%! Thiết bị chập cháy do quá tải.');
    }
  }

  private triggerGameOver(reason: string) {
    this.isRunning = false;
    sounds.stopAmbientHum();
    if (this.onGameOver) {
      this.onGameOver({ ...this.stats }, reason);
    }
  }

  private triggerVictory() {
    this.isRunning = false;
    sounds.stopAmbientHum();
    if (this.onVictory) {
      this.onVictory({ ...this.stats });
    }
  }

  private updateWaveBuffer(dt: number) {
    this.waveBuffer.shift();
    const baseSine = Math.sin(Date.now() * 0.012) * 12;
    let surgeNoise = 0;
    this.surges.forEach(s => {
      if (!s.isBlocked) {
        surgeNoise += (s.voltage / 300) * (Math.random() - 0.5) * 10;
      }
    });
    this.waveBuffer.push(baseSine + surgeNoise);
  }

  // Visual Effects Creators
  public createExplosion(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color: Math.random() > 0.3 ? color : '#ffffff',
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
        life: 1,
        maxLife: 1,
        shape: Math.random() > 0.5 ? 'spark' : 'circle',
      });
    }
  }

  private createGroundingSparks(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + Math.random() * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 5,
        size: 2 + Math.random() * 2,
        color: '#c084fc',
        alpha: 1,
        decay: 0.04,
        life: 1,
        maxLife: 1,
        shape: 'spark',
      });
    }
  }

  private createShieldAura(x: number, y: number, width: number) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * width,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        size: 2.5 + Math.random() * 2.5,
        color: '#38bdf8',
        alpha: 1,
        decay: 0.03,
        life: 1,
        maxLife: 1,
        shape: 'circle',
      });
    }
  }

  private createFuseArc(x: number, y: number, width: number) {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * width,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: 2 + Math.random() * 3,
        color: '#f59e0b',
        alpha: 1,
        decay: 0.04,
        life: 1,
        maxLife: 1,
        shape: 'spark',
      });
    }
  }

  private createElectricArc(startX: number, startY: number, endX: number, endY: number, color: string) {
    const segments: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const steps = 8;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const curX = startX + (endX - startX) * t + (Math.random() - 0.5) * 35;
      const curY = startY + (endY - startY) * t;
      segments.push({ x: curX, y: curY });
    }
    segments.push({ x: endX, y: endY });

    this.electricArcs.push({
      startX,
      startY,
      endX,
      endY,
      color,
      segments,
      life: 0.15,
      maxLife: 0.15,
    });
  }

  private createFloatingText(x: number, y: number, text: string, color: string, fontSize: number = 16) {
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -45,
      fontSize,
    });
  }

  // Main Canvas Rendering
  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const laneWidth = w / this.numLanes;
    const perimeterY = this.getPerimeterY();
    const bottomApplianceY = h * 0.92;

    // Dark high-tech blueprint background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Circuit board subtle grid lines
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw 5 Circuit Transmission Lanes
    for (let i = 0; i < this.numLanes; i++) {
      const laneX = this.getLaneCenterX(i);

      // Outer conductor track
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(i * laneWidth + 4, 0, laneWidth - 8, h);

      // Center glowing copper / optical trace
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneX, 0);
      ctx.lineTo(laneX, bottomApplianceY);
      ctx.stroke();

      // Phase labels at the top
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PHA L${i + 1}`, laneX, 16);
    }

    // Ambient flowing electricity particles
    this.ambientParticles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size * 2);
    });
    ctx.globalAlpha = 1;

    // Draw Defense Perimeter Warning Line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, perimeterY);
    ctx.lineTo(w, perimeterY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Perimeter Glow & Text
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('VÙNG PHÒNG THỦ TIẾP ĐIỆN (PERIMETER ZONE)', w - 12, perimeterY - 6);

    // Grounding Busbar at bottom
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, bottomApplianceY, w, h - bottomApplianceY);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, bottomApplianceY);
    ctx.lineTo(w, bottomApplianceY);
    ctx.stroke();

    // Draw Protected Appliances (Thiết bị tải / Máy chủ bảo vệ)
    for (let i = 0; i < this.numLanes; i++) {
      const laneX = this.getLaneCenterX(i);
      const appW = laneWidth - 14;
      const appH = h - bottomApplianceY - 10;
      const appX = laneX - appW / 2;
      const appY = bottomApplianceY + 5;

      // Appliance Box
      const integrity = this.stats.gridIntegrity;
      const isDamaged = integrity < 40;
      ctx.fillStyle = isDamaged ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.8)';
      ctx.strokeStyle = isDamaged ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(appX, appY, appW, appH, 4);
      ctx.fill();
      ctx.stroke();

      // Glowing LED Indicator
      const ledColor = integrity > 60 ? '#22c55e' : integrity > 30 ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = ledColor;
      ctx.beginPath();
      ctx.arc(laneX, appY + 12, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      const labels = ['MÁY CHỦ', 'VI MẠCH', 'TỦ LẠNH', 'LÒ PHẢN ỨNG', 'LƯỚI ĐIỆN'];
      ctx.fillText(labels[i % labels.length], laneX, appY + 28);
    }

    // Draw Active Defenses
    this.defenses.forEach(d => {
      ctx.save();
      ctx.globalAlpha = d.alpha;

      const halfW = d.width / 2;

      if (d.toolType === 'grounding') {
        // Grounding Spike Rod & Earth Arcs
        ctx.strokeStyle = '#c084fc';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(d.x - halfW, d.y);
        ctx.lineTo(d.x + halfW, d.y);
        ctx.stroke();

        // Downward grounding spike
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + 24);
        ctx.stroke();

        // Grounding symbol at tip
        ctx.beginPath();
        ctx.moveTo(d.x - 12, d.y + 24);
        ctx.lineTo(d.x + 12, d.y + 24);
        ctx.moveTo(d.x - 8, d.y + 28);
        ctx.lineTo(d.x + 8, d.y + 28);
        ctx.moveTo(d.x - 4, d.y + 32);
        ctx.lineTo(d.x + 4, d.y + 32);
        ctx.stroke();
      } else if (d.toolType === 'surge_protector') {
        // Surge Protector Absorber Dome
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(d.x, d.y + 4, halfW, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shield core icon
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x, d.y - 6, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.toolType === 'fuse') {
        // Circuit Breaker Barrier
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(d.x - halfW, d.y);
        ctx.lineTo(d.x + halfW, d.y);
        ctx.stroke();

        // Mechanical latch clamps
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(d.x - halfW - 4, d.y - 6, 8, 12);
        ctx.fillRect(d.x + halfW - 4, d.y - 6, 8, 12);
      }

      ctx.restore();
    });

    // Draw Electric Arcs
    this.electricArcs.forEach(arc => {
      ctx.save();
      ctx.strokeStyle = arc.color;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      arc.segments.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    });

    // Draw Surges
    this.surges.forEach(s => {
      ctx.save();

      // Draw Motion Trails
      s.trail.forEach(t => {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = t.alpha * 0.45;
        ctx.beginPath();
        ctx.arc(t.x, t.y, s.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowColor = s.glowColor;
      ctx.shadowBlur = s.isBlocked ? 2 : 20;

      if (s.type === 'spike') {
        // Red Voltage Spike (Gai nhọn / Quá áp)
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing spikes
        ctx.strokeStyle = '#fee2e2';
        ctx.lineWidth = 2;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2 + Date.now() * 0.008;
          const r1 = s.radius;
          const r2 = s.radius + 6;
          ctx.beginPath();
          ctx.moveTo(s.x + Math.cos(angle) * r1, s.y + Math.sin(angle) * r1);
          ctx.lineTo(s.x + Math.cos(angle) * r2, s.y + Math.sin(angle) * r2);
          ctx.stroke();
        }
      } else if (s.type === 'lightning') {
        // High Voltage Lightning Bolt
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Center bright spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Zig-zag aura
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x - 6, s.y - 10);
        ctx.lineTo(s.x + 2, s.y - 2);
        ctx.lineTo(s.x - 3, s.y + 1);
        ctx.lineTo(s.x + 6, s.y + 10);
        ctx.stroke();
      } else if (s.type === 'overload') {
        // Massive Plasma Current Overload
        const gradient = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, s.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#f59e0b');
        gradient.addColorStop(1, '#ea580c');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsating outer plasma ring
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius + Math.sin(Date.now() * 0.015) * 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.type === 'glitch') {
        // Glitch Harmonic Wave
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - s.radius, s.y - s.radius * 0.6, s.radius * 2, s.radius * 1.2);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(s.x - s.radius + 4, s.y - s.radius * 0.3, s.radius * 1.4, s.radius * 0.6);
      } else if (s.type === 'bonus') {
        // Golden Ion Energy Cell
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', s.x, s.y);
      }

      // Voltage Tag above surge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowBlur = 4;
      ctx.fillText(`${s.voltage}V`, s.x, s.y - s.radius - 2);

      ctx.restore();
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1;

    // Draw Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${ft.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}

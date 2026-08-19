import { CampaignMission } from '../types';
import { CAMPAIGN_MISSIONS } from './missions';

const STORAGE_KEY_HIGHSCORE = 'voltage_defense_high_score';
const STORAGE_KEY_REFLEX_BEST = 'voltage_defense_best_reflex';
const STORAGE_KEY_MISSIONS = 'voltage_defense_missions_progress';
const STORAGE_KEY_ENERGY = 'voltage_defense_energy_points';
const STORAGE_KEY_UPGRADES = 'voltage_defense_upgrades';

export interface UpgradesState {
  groundingCooldownReduction: number; // level 0-5
  shieldCapacity: number; // level 0-5
  fuseAutoResetSpeed: number; // level 0-5
  empMaxCharges: number; // level 0-3
}

export const getSavedHighScore = (): number => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

export const saveHighScore = (score: number): boolean => {
  try {
    const current = getSavedHighScore();
    if (score > current) {
      localStorage.setItem(STORAGE_KEY_HIGHSCORE, score.toString());
      return true;
    }
  } catch {
    // ignore
  }
  return false;
};

export const getSavedMissions = (): CampaignMission[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_MISSIONS);
    if (data) {
      const parsed = JSON.parse(data) as CampaignMission[];
      return CAMPAIGN_MISSIONS.map(m => {
        const found = parsed.find(p => p.id === m.id);
        return found ? { ...m, unlocked: found.unlocked, completed: found.completed, stars: found.stars } : m;
      });
    }
  } catch {
    // fallback
  }
  return CAMPAIGN_MISSIONS;
};

export const saveMissionProgress = (missionId: number, stars: number) => {
  try {
    const missions = getSavedMissions();
    const targetIdx = missions.findIndex(m => m.id === missionId);
    if (targetIdx !== -1) {
      missions[targetIdx].completed = true;
      missions[targetIdx].stars = Math.max(missions[targetIdx].stars, stars);
      
      // Unlock next mission
      if (targetIdx + 1 < missions.length) {
        missions[targetIdx + 1].unlocked = true;
      }
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(missions));
    }
  } catch {
    // ignore
  }
};

export const getSavedEnergy = (): number => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_ENERGY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

export const addSavedEnergy = (amount: number): number => {
  try {
    const current = getSavedEnergy() + amount;
    localStorage.setItem(STORAGE_KEY_ENERGY, current.toString());
    return current;
  } catch {
    return 0;
  }
};

export const getSavedUpgrades = (): UpgradesState => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_UPGRADES);
    if (val) return JSON.parse(val);
  } catch {
    // ignore
  }
  return {
    groundingCooldownReduction: 0,
    shieldCapacity: 0,
    fuseAutoResetSpeed: 0,
    empMaxCharges: 1,
  };
};

export const saveUpgrades = (upgrades: UpgradesState) => {
  try {
    localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(upgrades));
  } catch {
    // ignore
  }
};

export const getBestReflexTime = (): number => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_REFLEX_BEST);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

export const saveBestReflexTime = (ms: number) => {
  try {
    const current = getBestReflexTime();
    if (current === 0 || ms < current) {
      localStorage.setItem(STORAGE_KEY_REFLEX_BEST, Math.round(ms).toString());
    }
  } catch {
    // ignore
  }
};

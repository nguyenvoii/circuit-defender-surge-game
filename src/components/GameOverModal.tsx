import React from 'react';
import { AlertTriangle, RotateCcw, Trophy, Activity, Zap, Sparkles } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  reason: string;
  onRestart: () => void;
  onOpenUpgrades: () => void;
  isHighScore: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  reason,
  onRestart,
  onOpenUpgrades,
  isHighScore,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] flex flex-col gap-4 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              MẤT ĐIỆN TOÀN CỤC
            </h2>
            <p className="text-xs text-rose-300/80 font-sans">
              {reason || 'Lưới điện bị đánh thủng do quá áp!'}
            </p>
          </div>
        </div>

        {/* High Score Banner */}
        {isHighScore && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-300 font-mono text-sm font-bold animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400" />
            KỶ LỤC ĐIỂM SỐ MỚI ĐƯỢC THIẾT LẬP!
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              TỔNG ĐIỂM
            </span>
            <span className="text-xl font-bold text-amber-300 mt-1">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              PHẢN XẠ TB
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1">
              {stats.avgReactionTimeMs > 0 ? `${stats.avgReactionTimeMs} ms` : '--'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[11px]">ĐÃ CHẶN THÀNH CÔNG</span>
            <span className="text-lg font-bold text-sky-400 mt-1">
              {stats.blockedCount} xung
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[11px]">COMBO TỐI ĐA</span>
            <span className="text-lg font-bold text-purple-400 mt-1">
              x{stats.maxCombo}
            </span>
          </div>
        </div>

        {/* Reward Energy */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Năng lượng thu được:
          </span>
          <span className="text-amber-400 font-bold text-sm">
            +{Math.round(stats.score / 10)} Joules
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            id="restart-game-btn"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-98 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            CHƠI LẠI
          </button>
          <button
            id="open-upgrades-modal-btn"
            onClick={onOpenUpgrades}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono text-sm font-semibold transition-colors"
          >
            NÂNG CẤP
          </button>
        </div>
      </div>
    </div>
  );
};

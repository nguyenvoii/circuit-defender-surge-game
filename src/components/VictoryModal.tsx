import React from 'react';
import { Award, ArrowRight, RotateCcw, Star, Zap, Activity } from 'lucide-react';
import { GameStats } from '../types';

interface VictoryModalProps {
  stats: GameStats;
  onNextMission: () => void;
  onReplay: () => void;
  onOpenMissions: () => void;
  missionTitle: string;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onNextMission,
  onReplay,
  onOpenMissions,
  missionTitle,
}) => {
  // Calculate stars (1-3) based on integrity
  const stars = stats.gridIntegrity >= 80 ? 3 : stats.gridIntegrity >= 45 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.25)] flex flex-col gap-4 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              HOÀN THÀNH NHIỆM VỤ!
            </h2>
            <p className="text-xs text-emerald-300/80 font-sans">
              {missionTitle || 'Bảo vệ thành công lưới điện'}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[1, 2, 3].map(s => (
            <Star
              key={s}
              className={`w-8 h-8 ${
                s <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_#f59e0b]'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">ĐIỂM ĐẠT ĐƯỢC</span>
            <span className="text-xl font-bold text-amber-300 mt-1">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">ĐỘ BỀN CÒN LẠI</span>
            <span className="text-xl font-bold text-emerald-400 mt-1">
              {stats.gridIntegrity}%
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">PHẢN XẠ TB</span>
            <span className="text-lg font-bold text-sky-400 mt-1">
              {stats.avgReactionTimeMs} ms
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400">THƯỞNG NĂNG LƯỢNG</span>
            <span className="text-lg font-bold text-amber-400 mt-1 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              +{Math.round(stats.score / 8)} J
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            id="replay-mission-btn"
            onClick={onReplay}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-sm transition-colors"
            title="Chơi lại"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            id="open-missions-list-btn"
            onClick={onOpenMissions}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-sm font-semibold transition-colors"
          >
            DS MÀN CHƠI
          </button>
          <button
            id="next-mission-btn"
            onClick={onNextMission}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
          >
            TIẾP THEO
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Shield, Flame, Activity, Zap, Trophy, Clock } from 'lucide-react';
import { GameStats } from '../types';

interface StatsPanelProps {
  stats: GameStats;
  mode: string;
  missionTimeLeft?: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  mode,
  missionTimeLeft,
}) => {
  const getIntegrityColor = (val: number) => {
    if (val > 60) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (val > 30) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10 animate-pulse';
  };

  const getHeatColor = (val: number) => {
    if (val < 40) return 'bg-sky-500';
    if (val < 75) return 'bg-amber-500';
    return 'bg-rose-500 animate-pulse';
  };

  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800/80 px-3 py-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono select-none">
      {/* 1. Điểm số & Kỷ lục */}
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            ĐIỂM SỐ
          </span>
          {stats.combo > 1 && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px] animate-bounce">
              COMBO x{stats.combo}
            </span>
          )}
        </div>
        <div className="text-lg font-bold text-amber-300 tracking-wider">
          {stats.score.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-500 flex justify-between">
          <span>KỶ LỤC:</span>
          <span>{stats.highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. Độ Ổn Định Lưới Điện (Grid Integrity) */}
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            ĐỘ BỀN LƯỚI
          </span>
          <span className={`font-bold ${stats.gridIntegrity > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.gridIntegrity}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-1">
          <div
            className={`h-full transition-all duration-200 ${
              stats.gridIntegrity > 60
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : stats.gridIntegrity > 30
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            }`}
            style={{ width: `${stats.gridIntegrity}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-400 flex justify-between">
          <span>ĐÃ CHẶN: {stats.blockedCount}</span>
          <span className="text-rose-400">LỌT: {stats.missedCount}</span>
        </div>
      </div>

      {/* 3. Nhiệt Độ / Quá Nhiệt (Overheat Meter) */}
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            QUÁ NHIỆT MẠCH
          </span>
          <span className={`font-bold ${stats.overheat > 75 ? 'text-rose-400' : 'text-orange-300'}`}>
            {Math.round(stats.overheat)}°C
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-1">
          <div
            className={`h-full transition-all duration-150 ${getHeatColor(stats.overheat)}`}
            style={{ width: `${stats.overheat}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-400 flex justify-between">
          <span>GIỚI HẠN: 100°C</span>
          <span className="text-sky-400">TIẾP ĐỊA ĐỂ HẠ NHIỆT</span>
        </div>
      </div>

      {/* 4. Điện Áp Tức Thời (kV Monitor) */}
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            ĐIỆN ÁP TỨC THỜI
          </span>
          <span className="text-sky-300 font-bold text-[10px]">
            {stats.voltageLevel > 1000 ? 'QUÁ ÁP' : 'CHUẨN'}
          </span>
        </div>
        <div className="text-lg font-bold text-sky-400 tracking-wide">
          {stats.voltageLevel} V
        </div>
        <div className="text-[10px] text-slate-500">
          ĐỊNH MỨC AN TOÀN: 220V - 380V
        </div>
      </div>

      {/* 5. Tốc Độ Phản Xạ Trung Bình (Reaction Speed ms) */}
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            PHẢN XẠ (MS)
          </span>
          <span className="text-[10px] text-emerald-300">
            {stats.avgReactionTimeMs > 0 && stats.avgReactionTimeMs < 300
              ? 'SIÊU NHANH'
              : stats.avgReactionTimeMs < 500
              ? 'TỐT'
              : 'TRUNG BÌNH'}
          </span>
        </div>
        <div className="text-lg font-bold text-emerald-400">
          {stats.avgReactionTimeMs > 0 ? `${stats.avgReactionTimeMs} ms` : '-- ms'}
        </div>
        <div className="text-[10px] text-slate-500">
          COMBO CAO NHẤT: x{stats.maxCombo}
        </div>
      </div>

      {/* 6. Thời Gian Còn Lại / Cấp Độ */}
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {mode === 'endless' ? 'CẤP ĐỘ' : 'THỜI GIAN'}
          </span>
          {mode !== 'endless' && (
            <span className="text-[10px] text-indigo-300">
              MỤC TIÊU
            </span>
          )}
        </div>
        <div className="text-lg font-bold text-indigo-400">
          {mode === 'endless' ? (
            `LV. ${stats.level}`
          ) : (
            `${Math.max(0, Math.ceil(missionTimeLeft || 0))} s`
          )}
        </div>
        <div className="text-[10px] text-slate-500">
          {mode === 'endless' ? 'TĂNG TỐC THEO ĐIỂM' : 'GIỮ LƯỚI KHÔNG SẬP'}
        </div>
      </div>
    </div>
  );
};

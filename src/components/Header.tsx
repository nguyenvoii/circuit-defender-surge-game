import React from 'react';
import { Volume2, VolumeX, HelpCircle, Trophy, Zap, Shield, Flame, Activity } from 'lucide-react';
import { GameMode } from '../types';

interface HeaderProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTutorial: () => void;
  onOpenMissions: () => void;
  onOpenUpgrades: () => void;
  energyPoints: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSelectMode,
  isMuted,
  onToggleMute,
  onOpenTutorial,
  onOpenMissions,
  onOpenUpgrades,
  energyPoints,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur border-b border-sky-900/50 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-sky-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-md shadow-sky-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
            BẢO VỆ ĐIỆN ÁP
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              SURGE DEFENSE
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Chặn xung điện quá tải • Tiếp địa an toàn • Bảo vệ mạch vi xử lý
          </p>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
        <button
          id="mode-endless-btn"
          onClick={() => onSelectMode('endless')}
          className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
            mode === 'endless'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Vô Tận
        </button>
        <button
          id="mode-campaign-btn"
          onClick={onOpenMissions}
          className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
            mode === 'campaign'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Chiến Dịch
        </button>
        <button
          id="mode-blitz-btn"
          onClick={() => onSelectMode('reflex_test')}
          className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
            mode === 'reflex_test'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Phản Xạ 60s
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Energy Points Badge */}
        <button
          id="upgrades-btn"
          onClick={onOpenUpgrades}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-mono transition-colors"
          title="Nâng cấp công cụ"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">{energyPoints.toLocaleString()} J</span>
        </button>

        {/* Tutorial Button */}
        <button
          id="tutorial-btn"
          onClick={onOpenTutorial}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Hướng dẫn & Nguyên lý"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Audio Toggle */}
        <button
          id="sound-toggle-btn"
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg border transition-colors ${
            isMuted
              ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              : 'bg-sky-500/20 border-sky-500/40 text-sky-300 hover:bg-sky-500/30'
          }`}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

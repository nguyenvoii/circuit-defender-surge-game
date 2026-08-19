import React from 'react';
import { Zap, Shield, ToggleRight, Radio, BatteryCharging } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  toolCooldowns: Record<ToolType, { current: number; max: number }>;
  empCharges: number;
  onTriggerEMP: () => void;
  onDeployLane: (laneIndex: number) => void;
  numLanes?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  toolCooldowns,
  empCharges,
  onTriggerEMP,
  onDeployLane,
  numLanes = 5,
}) => {
  const tools = [
    {
      id: 'grounding' as ToolType,
      name: 'TIẾP ĐỊA',
      sub: 'Xả sét & hạ nhiệt',
      icon: Zap,
      key: '1',
      color: 'from-purple-600 to-indigo-600',
      activeColor: 'border-purple-400 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.4)]',
      desc: 'Hóa giải sét & xung cao thế, giảm 4°C nhiệt',
    },
    {
      id: 'surge_protector' as ToolType,
      name: 'CHỐNG QUÁ TẢI',
      sub: 'Hấp thụ xung áp',
      icon: Shield,
      key: '2',
      color: 'from-sky-600 to-blue-600',
      activeColor: 'border-sky-400 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]',
      desc: 'Tạo từ trường hấp thụ xung, chịu 3 lần va chạm',
    },
    {
      id: 'fuse' as ToolType,
      name: 'CẦU CHÌ / APTOMAT',
      sub: 'Ngắt dòng tức thì',
      icon: ToggleRight,
      key: '3',
      color: 'from-amber-600 to-orange-600',
      activeColor: 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      desc: 'Chặn đứng quá tải dòng cực lớn (Plasma)',
    },
  ];

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 p-2 sm:p-3 flex flex-col gap-2 shadow-2xl">
      {/* Mobile Multi-Lane Tap Bar (5 Lanes Quick Response) */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {Array.from({ length: numLanes }).map((_, idx) => (
          <button
            key={idx}
            id={`lane-trigger-${idx}`}
            onClick={() => onDeployLane(idx)}
            className="py-2 sm:py-2.5 px-1 rounded-lg bg-slate-800/90 hover:bg-sky-600/30 active:bg-sky-500 border border-slate-700 hover:border-sky-400 text-slate-300 active:text-white transition-all flex flex-col items-center justify-center font-mono select-none"
          >
            <span className="text-[10px] text-slate-400 font-semibold">PHA L{idx + 1}</span>
            <span className="text-xs font-bold text-sky-400">CHẶN</span>
          </button>
        ))}
      </div>

      {/* Main Tool Selection & EMP Blast */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        {/* Tool Cards */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          {tools.map(tool => {
            const Icon = tool.icon;
            const isSelected = activeTool === tool.id;
            const cd = toolCooldowns[tool.id];
            const isCooling = cd.current > 0;
            const cdPercent = isCooling ? (cd.current / cd.max) * 100 : 0;

            return (
              <button
                key={tool.id}
                id={`tool-btn-${tool.id}`}
                onClick={() => onSelectTool(tool.id)}
                className={`relative overflow-hidden p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? tool.activeColor
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {/* Cooldown progress overlay */}
                {isCooling && (
                  <div
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex items-center justify-center z-10"
                    style={{ clipPath: `inset(0 0 ${100 - cdPercent}% 0)` }}
                  >
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {cd.current.toFixed(1)}s
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono tracking-tight">
                      {tool.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Phím {tool.key}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                  {tool.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* EMP Blast Emergency Button */}
        <button
          id="emp-blast-btn"
          onClick={onTriggerEMP}
          disabled={empCharges <= 0}
          className={`px-3.5 py-2.5 rounded-xl border font-mono text-xs flex items-center gap-2 transition-all shrink-0 ${
            empCharges > 0
              ? 'bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white border-cyan-400 hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
              : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Radio className="w-4 h-4" />
          <div className="text-left">
            <div className="font-bold flex items-center gap-1">
              XẢ SÉT EMP
              <span className="text-[10px] bg-slate-950/50 px-1 rounded text-cyan-300">
                (Space)
              </span>
            </div>
            <div className="text-[10px] opacity-80">
              Sạc: {empCharges}/3
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

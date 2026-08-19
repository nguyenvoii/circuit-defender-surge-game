import React from 'react';
import { X, Lock, Star, Play, CheckCircle2, Zap } from 'lucide-react';
import { CampaignMission } from '../types';

interface MissionsModalProps {
  missions: CampaignMission[];
  onSelectMission: (mission: CampaignMission) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  onSelectMission,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl flex flex-col text-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-mono">
              CHIẾN DỊCH BẢO VỆ LƯỚI ĐIỆN QUỐC GIA
            </h2>
          </div>
          <button
            id="close-missions-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {missions.map(m => {
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  m.unlocked
                    ? 'bg-slate-950/80 border-slate-800 hover:border-sky-500/60 shadow-md'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                      MÀN {m.id}
                    </span>
                    {m.completed ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(s => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= m.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    ) : !m.unlocked ? (
                      <Lock className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">CHƯA QUA MÀN</span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm font-mono">{m.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{m.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-mono">
                    <span>Mục tiêu: </span>
                    <span className="text-amber-300 font-bold">{m.targetScore.toLocaleString()}đ</span>
                    <span className="text-slate-600"> • </span>
                    <span>{m.durationSeconds}s</span>
                  </div>

                  {m.unlocked ? (
                    <button
                      id={`start-mission-${m.id}-btn`}
                      onClick={() => onSelectMission(m)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      VÀO
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Khóa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

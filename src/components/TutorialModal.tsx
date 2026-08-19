import React from 'react';
import { X, Zap, Shield, ToggleRight, Radio, AlertTriangle, CheckCircle2, Flame, HeartHandshake } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-sky-500/40 rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.2)] flex flex-col text-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-mono">
              HƯỚNG DẪN & NGUYÊN LÝ PHÒNG VỆ
            </h2>
          </div>
          <button
            id="close-tutorial-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Section 1: Gameplay Overview */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-sky-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              1. CƠ CHẾ PHẢN XẠ ĐÁNH CHẶN
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Dòng điện chạy từ trên xuống 5 đường dây pha (L1 - L5). Các <strong>xung điện quá áp, sét lan truyền và khối quá tải</strong> sẽ xuất hiện bất ngờ với tốc độ cao.
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Nhấn trực tiếp vào đường dây (hoặc phím số <strong>1 - 5</strong>) khi xung chạm vùng phòng thủ.</li>
              <li>Chặn liên tiếp để nhân hệ số <strong>Combo x2, x3, x5</strong> và nạp năng lượng EMP.</li>
              <li>Để lọt xung sẽ làm <strong>giảm Độ Bền Lưới</strong> và <strong>tăng Quá Nhiệt</strong> mạch. Nếu chạm 0% hoặc quá 100°C, hệ thống sẽ mất điện toàn diện (Blackout).</li>
            </ul>
          </div>

          {/* Section 2: Defense Tools */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-amber-400 font-mono flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              2. BỘ 3 CÔNG CỤ BẢO VỆ CHUYÊN DỤNG
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Tool 1 */}
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold font-mono">
                  <Zap className="w-4 h-4 text-purple-400" />
                  TIẾP ĐỊA (Phím 1)
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  Dẫn xung sét trực tiếp xuống đất qua cọc tiếp địa. Giúp <strong>hạ 4°C nhiệt độ mạch</strong> và trị các tia sét tím siêu tốc.
                </p>
              </div>

              {/* Tool 2 */}
              <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold font-mono">
                  <Shield className="w-4 h-4 text-sky-400" />
                  CHỐNG QUÁ TẢI (Phím 2)
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  Tạo vòm điện môi hấp thụ xung điện trong 1.8 giây hoặc 3 lần va chạm, biến áp lực xung thành điểm năng lượng.
                </p>
              </div>

              {/* Tool 3 */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                  <ToggleRight className="w-4 h-4 text-amber-400" />
                  CẦU CHÌ (Phím 3)
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  Ngắt dòng tức thì, là lá chắn vững chắc nhất trước các quả cầu <strong>Quá Tải Dòng Plasma lớn</strong> (2500V+).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Hazard Types & Special Orbs */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-rose-400 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              3. CÁC LOẠI XUNG ĐIỆN & HẠT THƯỞNG
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <span className="text-rose-400 font-bold block">Quá Áp Đột Biến</span>
                <span className="text-slate-400">Hạt đỏ tiêu chuẩn (500V)</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20">
                <span className="text-purple-400 font-bold block">Sấm Sét Lan Truyền</span>
                <span className="text-slate-400">Tia tím siêu nhanh (1200V)</span>
              </div>
              <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-500/20">
                <span className="text-orange-400 font-bold block">Quá Tải Plasma</span>
                <span className="text-slate-400">Cầu lửa khổng lồ (2500V)</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold block">Hạt Ion Thưởng (+)</span>
                <span className="text-slate-400">Hồi +20% độ bền lưới</span>
              </div>
            </div>
          </div>

          {/* Section 4: EMP Shockwave */}
          <div className="bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-500/30 flex items-center gap-3">
            <Radio className="w-8 h-8 text-cyan-400 shrink-0 animate-pulse" />
            <div>
              <h4 className="font-bold text-cyan-300 font-mono">XẢ SÉT KHẨN CẤP EMP (Phím Space)</h4>
              <p className="text-slate-300 text-[11px]">
                Khi bị quá tải dồn dập, kích hoạt EMP để quét sạch toàn bộ xung điện trên màn hình, hạ 25°C nhiệt độ và cứu vãn lưới điện!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            id="close-tutorial-action-btn"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-xs transition-colors"
          >
            ĐÃ HIỂU - VÀO CHƠI
          </button>
        </div>
      </div>
    </div>
  );
};

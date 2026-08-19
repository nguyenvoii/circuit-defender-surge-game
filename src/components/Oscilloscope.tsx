import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

interface OscilloscopeProps {
  waveBuffer: number[];
  voltage: number;
  integrity: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  waveBuffer,
  voltage,
  integrity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark screen background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Green oscilloscope grid lines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center reference line
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Waveform line
    ctx.strokeStyle = integrity < 35 ? '#ef4444' : voltage > 800 ? '#f59e0b' : '#22c55e';
    ctx.shadowColor = integrity < 35 ? '#f87171' : voltage > 800 ? '#fbbf24' : '#4ade80';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    const len = waveBuffer.length;
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * w;
      const y = h / 2 - waveBuffer[i] * 0.8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [waveBuffer, voltage, integrity]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col gap-1 text-[11px] font-mono">
      <div className="flex items-center justify-between text-slate-400">
        <span className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          DAO ĐỘNG KÝ SÓNG ĐIỆN (OSCILLOSCOPE)
        </span>
        <span className="text-[10px] text-emerald-400 font-bold">
          50Hz / CH1
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={240}
        height={64}
        className="w-full h-16 rounded border border-emerald-950 bg-black"
      />
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ImageJob } from '../types';
import { Download, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface PreviewPanelProps {
  job: ImageJob;
}

export function PreviewPanel({ job }: PreviewPanelProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handleDownload = () => {
    if (!job.resultUrl) return;
    const a = document.createElement('a');
    a.href = job.resultUrl;
    a.download = `edited_${job.name}`;
    a.click();
  };

  if (job.status === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-900/30">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl text-zinc-200 font-medium">Processing Failed</h3>
        <p className="text-zinc-500 mt-2 max-w-sm text-center text-sm">{job.errorMessage}</p>
      </div>
    );
  }

  const showComparison = job.status === 'done' && job.resultUrl;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A]">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <h3 className="text-xs tracking-wider opacity-80 uppercase font-bold text-[#E0E0E0] truncate pr-4">
          {job.name}
        </h3>
        {showComparison && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-[#000] rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-amber-400 transition-colors shrink-0 shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        )}
      </div>

      {/* Main Preview */}
      <div className="flex-1 p-8 flex flex-col relative">
        <div className="flex-1 bg-[#0F0F0F] rounded-2xl border-2 border-dashed border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center checkered-bg cursor-crosshair">
          <style>{`.checkered-bg { background-image: linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }`}</style>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150 pointer-events-none"></div>

          {!showComparison ? (
            <img 
              src={job.originalUrl} 
              alt="Original" 
              className={cn(
                "max-w-full max-h-full object-contain transition-opacity duration-300 z-10",
                job.status === 'processing' ? "opacity-30 blur-sm" : "opacity-100"
              )} 
            />
          ) : (
            <div 
              ref={containerRef}
              className="relative w-full h-full max-w-full max-h-full z-10"
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
            >
              {/* After (Bottom Layer) */}
              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                <img src={job.resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
              </div>

              {/* Before (Top Layer) */}
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden select-none pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img src={job.originalUrl} alt="Original" className="max-w-full max-h-full object-contain select-none" />
              </div>

              {/* Slider Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] cursor-ew-resize hidden md:flex items-center justify-center"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border border-[#0A0A0A]">
                  <div className="flex gap-[3px]">
                    <div className="w-0.5 h-3 bg-[#0A0A0A] rounded-full"></div>
                    <div className="w-0.5 h-3 bg-[#0A0A0A] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {job.status === 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 z-20">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full text-amber-500 animate-spin opacity-80" viewBox="0 0 100 100">
                  <circle className="opacity-25" cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"/>
                  <circle className="opacity-100" cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="70 200" strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center bg-[#0F0F0F]/50 rounded-full blur-sm"></div>
                <span className="absolute text-[11px] font-mono text-amber-500 tracking-wider font-bold shadow-black">{job.progress ?? 0}%</span>
              </div>
              <p className="text-[10px] tracking-widest uppercase text-amber-500/80 font-bold animate-pulse px-4 py-2 border border-amber-500/20 bg-amber-500/10 rounded-full backdrop-blur-md">Extracting Subject</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

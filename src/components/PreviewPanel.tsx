import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Layers,
  Split,
  Eye,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { ImageJob, ViewMode, AppSettings } from '../types';
import { cn } from '../lib/utils';
import { triggerBlobDownload } from '../lib/zipExporter';

interface PreviewPanelProps {
  job: ImageJob;
  settings: AppSettings;
  onQuickBackdropChange?: (style: AppSettings['backgroundStyle'], value?: string) => void;
  onRetry?: (id: string) => void;
}

export function PreviewPanel({ job, settings, onQuickBackdropChange, onRetry }: PreviewPanelProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = Fit, 0.5 to 2.5
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when job changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [job.id]);

  // Handle Split Slider Dragging
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!imageBoxRef.current) return;
      const rect = imageBoxRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    },
    []
  );

  const handleMouseDownSlider = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSlider(true);
  };

  const handleTouchStartSlider = (e: React.TouchEvent) => {
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      } else if (isPanning) {
        setPanOffset({
          x: e.clientX - startPanPos.x,
          y: e.clientY - startPanPos.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches.length > 0) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingSlider(false);
    };

    if (isDraggingSlider || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSlider, isPanning, startPanPos, handleSliderMove]);

  const handleExport = () => {
    if (job.resultBlob) {
      const ext =
        settings.exportFormat === 'image/jpeg'
          ? 'jpg'
          : settings.exportFormat === 'image/webp'
          ? 'webp'
          : 'png';
      const cleanName = job.name.replace(/\.[^/.]+$/, '');
      triggerBlobDownload(job.resultBlob, `${cleanName}_studio.${ext}`);
    } else if (job.resultUrl) {
      const a = document.createElement('a');
      a.href = job.resultUrl;
      a.download = `edited_${job.name}`;
      a.click();
    }
  };

  const handleStartPan = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && !isDraggingSlider) {
      setIsPanning(true);
      setStartPanPos({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(0.5, Math.min(2.5, +(prev + delta).toFixed(2)));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // If Error State
  if (job.status === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Background Extraction Failed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {job.errorMessage || 'An unexpected issue occurred while segmenting the photo.'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={() => onRetry(job.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry Processing
          </button>
        )}
      </div>
    );
  }

  const isDone = job.status === 'done' && (job.resultUrl || job.foregroundUrl);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/60 relative select-none">
      {/* Top Canvas Toolbar */}
      <div className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
        {/* Left: File name & metadata */}
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span className="text-xs font-bold text-slate-800 truncate max-w-xs" title={job.name}>
            {job.name}
          </span>

          {job.processingTimeMs && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Zap className="w-2.5 h-2.5 text-blue-600" />
              {(job.processingTimeMs / 1000).toFixed(2)}s
            </span>
          )}

          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {settings.exportFormat.replace('image/', '')}
          </span>
        </div>

        {/* Center: View Mode Switcher */}
        {isDone && (
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-inner">
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                viewMode === 'split'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Split className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>

            <button
              onClick={() => setViewMode('result')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                viewMode === 'result'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Studio Result</span>
            </button>

            <button
              onClick={() => setViewMode('cutout')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                viewMode === 'cutout'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cutout Only</span>
            </button>

            <button
              onClick={() => setViewMode('original')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors',
                viewMode === 'original'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Original</span>
            </button>
          </div>
        )}

        {/* Right: Zoom & Direct High-Res Export */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-slate-600">
            <button
              onClick={() => handleZoom(-0.25)}
              disabled={zoomLevel <= 0.5}
              className="p-1 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 text-[10px] font-mono font-semibold text-slate-700 hover:text-blue-600"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => handleZoom(0.25)}
              disabled={zoomLevel >= 2.5}
              className="p-1 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Button */}
          {isDone && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold tracking-wide transition-all shadow-sm shadow-blue-500/25"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-100/70"
        onMouseDown={handleStartPan}
        style={{ cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Canvas Frame */}
        <div
          ref={imageBoxRef}
          className="relative max-w-full max-h-full rounded-2xl border border-slate-300 overflow-hidden shadow-lg flex items-center justify-center checkered-canvas-light"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Mode 1: Split View */}
          {isDone && viewMode === 'split' && (
            <div className="relative max-w-full max-h-[72vh] flex items-center justify-center overflow-hidden">
              {/* After (Studio Result) Layer */}
              <img
                src={job.resultUrl || job.foregroundUrl}
                alt="Studio Result"
                className="max-w-full max-h-[72vh] object-contain select-none pointer-events-none"
              />

              {/* Before (Original) Layer with dynamic clip path */}
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden select-none pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={job.originalUrl}
                  alt="Original"
                  className="max-w-full max-h-[72vh] object-contain select-none pointer-events-none"
                />
              </div>

              {/* Slider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.6)] cursor-ew-resize flex items-center justify-center z-20"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDownSlider}
                onTouchStart={handleTouchStartSlider}
              >
                <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
                  <div className="flex items-center gap-[3px]">
                    <div className="w-0.5 h-3 bg-blue-600 rounded-full" />
                    <div className="w-0.5 h-3 bg-blue-600 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Glass Labels: Before / After */}
              <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 pointer-events-none shadow-sm">
                Original
              </div>
              <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-blue-400/30 pointer-events-none shadow-sm">
                Studio Cutout
              </div>
            </div>
          )}

          {/* Mode 2: Studio Result Only */}
          {isDone && viewMode === 'result' && (
            <img
              src={job.resultUrl || job.foregroundUrl}
              alt="Studio Result"
              className="max-w-full max-h-[72vh] object-contain select-none"
            />
          )}

          {/* Mode 3: Cutout Only (Transparent Checkerboard) */}
          {isDone && viewMode === 'cutout' && (
            <img
              src={job.foregroundUrl || job.resultUrl}
              alt="Cutout Transparent"
              className="max-w-full max-h-[72vh] object-contain select-none"
            />
          )}

          {/* Mode 4: Original Only or Processing/Queued */}
          {(!isDone || viewMode === 'original') && (
            <img
              src={job.originalUrl}
              alt="Original"
              className={cn(
                'max-w-full max-h-[72vh] object-contain select-none transition-all duration-300',
                job.status === 'processing' ? 'opacity-30 blur-xs' : 'opacity-100'
              )}
            />
          )}

          {/* Processing Overlay Ring */}
          {job.status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/70 backdrop-blur-xs z-30">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full text-blue-600 animate-spin" viewBox="0 0 100 100">
                  <circle
                    className="opacity-20"
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                  />
                  <circle
                    className="opacity-100"
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeDasharray="90 200"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold font-mono text-blue-700">
                    {job.progress !== undefined ? `${job.progress}%` : 'AI'}
                  </span>
                </div>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-white border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-md">
                Extracting Subject & Edges...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Quick Backdrop Switcher Bar */}
      {isDone && onQuickBackdropChange && (
        <div className="h-14 border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Quick Backdrops:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onQuickBackdropChange('transparent')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                  settings.backgroundStyle === 'transparent'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="w-3 h-3 rounded-xs border border-slate-300 checkered-thumb-light" />
                Transparent
              </button>

              <button
                onClick={() => onQuickBackdropChange('color', '#FFFFFF')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                  settings.backgroundStyle === 'color' && settings.backgroundColor.toUpperCase() === '#FFFFFF'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                Clean White
              </button>

              <button
                onClick={() => onQuickBackdropChange('color', '#1E293B')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                  settings.backgroundStyle === 'color' && settings.backgroundColor.toUpperCase() === '#1E293B'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="w-3 h-3 rounded-full bg-[#1E293B] border border-slate-400" />
                Dark Slate
              </button>

              <button
                onClick={() => onQuickBackdropChange('gradient', 'morning_mist')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                  settings.backgroundStyle === 'gradient' && (settings.gradientPreset === 'morning_mist' || settings.gradientPreset === 'clean_gray')
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#F8FAFC] to-[#E2E8F0] border border-slate-300" />
                Morning Mist
              </button>

              <button
                onClick={() => onQuickBackdropChange('gradient', 'aurora_blue')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                  settings.backgroundStyle === 'gradient' && (settings.gradientPreset === 'aurora_blue' || settings.gradientPreset === 'cyberpunk')
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#E0E7FF] to-[#CFFAFE] border border-blue-200" />
                Aurora Blue
              </button>

              <button
                onClick={() => onQuickBackdropChange('blur')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5',
                  settings.backgroundStyle === 'blur'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="w-3 h-3 rounded-full bg-slate-400 blur-[1px]" />
                Realistic Blur
              </button>
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-400 hidden md:block">
            Drag blue slider divider to inspect edge detail
          </div>
        </div>
      )}
    </div>
  );
}

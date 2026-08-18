import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Plus,
  Zap,
  CheckCircle2,
  Image as ImageIcon,
  Activity,
} from 'lucide-react';
import { SystemHealthResponse } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  systemHealth: SystemHealthResponse | null;
  isBackendConnected: boolean;
  completedJobsCount: number;
  totalJobsCount: number;
  onBatchExport: () => void;
  onNewBatch: () => void;
  onRefreshHealth: () => void;
  onOpenSampleSelector?: () => void;
}

export function Header({
  systemHealth,
  isBackendConnected,
  completedJobsCount,
  totalJobsCount,
  onBatchExport,
  onNewBatch,
  onRefreshHealth,
  onOpenSampleSelector,
}: HeaderProps) {
  const [showHealthTooltip, setShowHealthTooltip] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30 select-none shadow-xs">
      {/* Brand & Studio Title */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold tracking-tight text-slate-900">
              Background Remover <span className="text-blue-600">Pro</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Instant AI Engine
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Professional AI Segmentation & Studio Compositor
          </span>
        </div>
      </div>

      {/* Center / Right Actions: Sample Photos, Upload, Batch Export, Server Status */}
      <div className="flex items-center gap-2.5">
        {/* Try Sample Photos Button */}
        {onOpenSampleSelector && (
          <button
            onClick={onOpenSampleSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200 transition-all shadow-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Sample Photos</span>
          </button>
        )}

        {/* Upload Button */}
        <button
          onClick={onNewBatch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>Upload Image</span>
        </button>

        {/* Batch Export ZIP Button */}
        {completedJobsCount > 0 && (
          <button
            onClick={onBatchExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export All (ZIP)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-mono">
              {completedJobsCount}
            </span>
          </button>
        )}

        {/* Connection Status Pill */}
        <div className="relative ml-1">
          <button
            onClick={onRefreshHealth}
            onMouseEnter={() => setShowHealthTooltip(true)}
            onMouseLeave={() => setShowHealthTooltip(false)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
              isBackendConnected
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            <span className="font-semibold text-slate-700">
              {isBackendConnected ? 'Server Connected' : 'Client Mode'}
            </span>
          </button>

          {/* Connection Details Tooltip */}
          {showHealthTooltip && systemHealth && (
            <div className="absolute right-0 top-9 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-[11px] space-y-1.5 text-slate-600 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  AI Service Status
                </span>
                <span className="text-[10px] text-slate-400 font-mono">v{systemHealth.version}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Uptime:</span>
                <span className="font-mono font-medium text-slate-800">{systemHealth.uptimeSeconds}s</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Memory RSS:</span>
                <span className="font-mono font-medium text-slate-800">{systemHealth.memoryUsage.rssMb} MB</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Processed Jobs:</span>
                <span className="font-mono font-medium text-slate-800">{systemHealth.completedJobsCount}</span>
              </div>
              <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                Zero-login client and local AI hardware acceleration active.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

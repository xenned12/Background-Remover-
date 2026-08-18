import React from 'react';
import { ImageJob } from '../types';
import { CheckCircle2, CircleDashed, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  jobs: ImageJob[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ jobs, selectedId, onSelect }: SidebarProps) {
  return (
    <div className="w-72 border-r border-white/5 bg-[#0D0D0D] flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-[10px] font-semibold text-[#E0E0E0] uppercase tracking-widest opacity-60">History Log</h2>
        <p className="text-[10px] text-white/40 mt-1">{jobs.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {jobs.length === 0 ? (
          <div className="text-center p-8 text-white/40 text-xs">
            No images processed yet.
          </div>
        ) : (
          jobs.map(job => (
            <button
              key={job.id}
              onClick={() => onSelect(job.id)}
              className={cn(
                "w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors group",
                selectedId === job.id 
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-500" 
                  : "hover:bg-white/5 border-transparent text-white",
                "border cursor-pointer relative overflow-hidden"
              )}
            >
              <div className="h-12 w-12 shrink-0 bg-white/5 border border-white/10 rounded-lg overflow-hidden relative">
                <img 
                  src={job.originalUrl} 
                  alt={job.name} 
                  className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-300"
                  loading="lazy"
                />
                {job.resultUrl && (
                  <img 
                    src={job.resultUrl} 
                    alt="Result" 
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-wide truncate pr-2 opacity-80" title={job.name}>
                  {job.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {job.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  {job.status === 'processing' && <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />}
                  {job.status === 'queued' && <CircleDashed className="w-3 h-3 text-white/40" />}
                  {job.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                  <span className={cn(
                    "text-[10px] truncate uppercase tracking-widest",
                    job.status === 'error' ? "text-red-400" : "text-white/40"
                  )}>
                    {job.status === 'error' ? 'Failed' : job.status === 'processing' ? `${job.progress ?? 0}%` : job.status}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

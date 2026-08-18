import React, { useState } from 'react';
import {
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Loader2,
  Search,
  Trash2,
  Download,
  RotateCcw,
  Layers,
  FileImage,
  X,
} from 'lucide-react';
import { ImageJob } from '../types';
import { cn } from '../lib/utils';
import { triggerBlobDownload } from '../lib/zipExporter';

interface SidebarProps {
  jobs: ImageJob[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeleteJob: (id: string) => void;
  onClearAll: () => void;
  onRetryJob?: (id: string) => void;
  onDownloadSingle?: (job: ImageJob) => void;
  onDownloadAllZip?: () => void;
}

type FilterTab = 'all' | 'done' | 'processing' | 'error';

export function Sidebar({
  jobs,
  selectedId,
  onSelect,
  onDeleteJob,
  onClearAll,
  onRetryJob,
  onDownloadSingle,
  onDownloadAllZip,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const completedCount = jobs.filter((j) => j.status === 'done').length;
  const processingCount = jobs.filter((j) => j.status === 'processing' || j.status === 'queued').length;
  const errorCount = jobs.filter((j) => j.status === 'error').length;

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (filterTab === 'done') return job.status === 'done';
    if (filterTab === 'processing') return job.status === 'processing' || job.status === 'queued';
    if (filterTab === 'error') return job.status === 'error';
    return true;
  });

  const handleDownload = (e: React.MouseEvent, job: ImageJob) => {
    e.stopPropagation();
    if (onDownloadSingle) {
      onDownloadSingle(job);
    } else if (job.resultBlob) {
      triggerBlobDownload(job.resultBlob, `cutout_${job.name}`);
    } else if (job.resultUrl) {
      const a = document.createElement('a');
      a.href = job.resultUrl;
      a.download = `cutout_${job.name}`;
      a.click();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteJob(id);
  };

  const handleRetry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onRetryJob) onRetryJob(id);
  };

  return (
    <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden select-none shrink-0 z-20 shadow-xs">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Queue & Batch
            </h2>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
            {jobs.length} {jobs.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search images..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/60 border border-slate-200 text-[11px]">
          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              'flex-1 py-1 rounded text-center font-semibold transition-colors',
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            All ({jobs.length})
          </button>
          <button
            onClick={() => setFilterTab('done')}
            className={cn(
              'flex-1 py-1 rounded text-center font-semibold transition-colors',
              filterTab === 'done'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Done ({completedCount})
          </button>
          {processingCount > 0 && (
            <button
              onClick={() => setFilterTab('processing')}
              className={cn(
                'flex-1 py-1 rounded text-center font-semibold transition-colors',
                filterTab === 'processing'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Active ({processingCount})
            </button>
          )}
          {errorCount > 0 && (
            <button
              onClick={() => setFilterTab('error')}
              className={cn(
                'flex-1 py-1 rounded text-center font-semibold transition-colors',
                filterTab === 'error'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Errors ({errorCount})
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 space-y-2">
            <FileImage className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
            <p className="text-xs font-medium">
              {jobs.length === 0 ? 'No images in queue yet.' : 'No images match the filter.'}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isSelected = selectedId === job.id;
            const isDone = job.status === 'done';
            const isProcessing = job.status === 'processing';
            const isQueued = job.status === 'queued';
            const isError = job.status === 'error';

            return (
              <div
                key={job.id}
                onClick={() => onSelect(job.id)}
                className={cn(
                  'w-full group relative rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer flex items-center gap-3',
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                )}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                )}

                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 checkered-thumb-light flex items-center justify-center">
                  <img
                    src={job.originalUrl}
                    alt={job.name}
                    className={cn(
                      'w-full h-full object-cover transition-opacity duration-300',
                      isDone && job.resultUrl ? 'opacity-25' : 'opacity-90'
                    )}
                    loading="lazy"
                  />
                  {isDone && job.resultUrl && (
                    <img
                      src={job.resultUrl}
                      alt="Cutout Result"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-1">
                  <p
                    className={cn(
                      'text-xs font-semibold truncate',
                      isSelected ? 'text-blue-700' : 'text-slate-800'
                    )}
                    title={job.name}
                  >
                    {job.name}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                    {isDone && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> Done
                      </span>
                    )}
                    {isProcessing && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        {job.progress !== undefined ? `${job.progress}%` : 'Processing...'}
                      </span>
                    )}
                    {isQueued && (
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <CircleDashed className="w-3 h-3 shrink-0" /> Queued
                      </span>
                    )}
                    {isError && (
                      <span className="flex items-center gap-1 text-red-600 font-semibold truncate">
                        <AlertCircle className="w-3 h-3 shrink-0" /> Failed
                      </span>
                    )}

                    {job.processingTimeMs && (
                      <span className="text-slate-400 font-mono ml-auto">
                        {(job.processingTimeMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isDone && (
                    <button
                      onClick={(e) => handleDownload(e, job)}
                      title="Download image"
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isError && (
                    <button
                      onClick={(e) => handleRetry(e, job.id)}
                      title="Retry processing"
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, job.id)}
                    title="Remove from queue"
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      {jobs.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
          <button
            onClick={onClearAll}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>

          {completedCount > 0 && onDownloadAllZip && (
            <button
              onClick={onDownloadAllZip}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ZIP ({completedCount})</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  Layers,
  Sparkles,
  Zap,
  FileImage,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SAMPLE_IMAGES, fetchSampleAsFile, SampleImage } from '../lib/sampleImages';

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  className?: string;
}

export function Dropzone({ onDrop, className }: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  // Support clipboard paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        onDrop(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files as Iterable<File> | ArrayLike<File>).filter((f: File) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) onDrop(files as File[]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files as Iterable<File> | ArrayLike<File>).filter((f: File) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) onDrop(files as File[]);
      e.target.value = '';
    }
  };

  const handleSampleClick = async (e: React.MouseEvent, sample: SampleImage) => {
    e.stopPropagation();
    try {
      setLoadingSampleId(sample.id);
      const file = await fetchSampleAsFile(sample);
      onDrop([file]);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setLoadingSampleId(null);
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center w-full h-full p-6 md:p-10', className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/*"
      />

      {/* Main Drag-and-Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'w-full max-w-2xl rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-8 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden bg-white shadow-sm hover:shadow-md group',
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
        )}
      >
        {/* Subtle patterned background */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Upload Icon with Glowing Blue Aura */}
        <div className="relative mb-5">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-18 h-18 rounded-2xl bg-blue-50 border border-blue-200 group-hover:border-blue-400 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 duration-300">
            <UploadCloud className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center z-10 space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Drop your photos here, or{' '}
            <span className="text-blue-600 underline underline-offset-4 decoration-blue-300 group-hover:decoration-blue-600">
              browse files
            </span>
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            High precision cutout for products, portraits, and objects. Supports batch drop or paste (
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700">
              Ctrl + V
            </kbd>
            ).
          </p>
        </div>

        {/* Badges / Support Info */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 z-10">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <FileImage className="w-3 h-3 text-blue-600" /> PNG, JPG, WEBP, AVIF
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-blue-600" /> Multi-File Batch
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-600" /> Instant Local AI
          </span>
        </div>
      </div>

      {/* Try Sample Images Section */}
      <div className="w-full max-w-2xl mt-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Or try a studio sample photo:
          </span>
          <span className="text-[11px] text-slate-400 font-medium">1-click instant cutout</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={(e) => handleSampleClick(e, sample)}
              disabled={loadingSampleId !== null}
              className="group relative rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/80 p-2 text-left transition-all duration-200 overflow-hidden flex flex-col shadow-xs hover:shadow-sm"
            >
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
                <img
                  src={sample.thumbnailUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                  {sample.badge}
                </span>
                {loadingSampleId === sample.id && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {sample.category}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useRef } from 'react';
import { UploadCloud, Layers, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming cn utility is here

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  className?: string;
}

export function Dropzone({ onDrop, className }: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files as Iterable<File> | ArrayLike<File>).filter((f: File) => f.type.startsWith('image/'));
    if (files.length > 0) onDrop(files as File[]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files as Iterable<File> | ArrayLike<File>).filter((f: File) => f.type.startsWith('image/'));
      if (files.length > 0) onDrop(files as File[]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-300",
        "bg-[#0F0F0F] border-white/10 hover:border-amber-500/50 hover:bg-white/5",
        className
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150 pointer-events-none"></div>
      
      <div className="z-10 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-xl shadow-amber-500/5">
          <UploadCloud className="w-10 h-10 text-amber-500/80" />
        </div>
        <p className="text-xl font-light text-[#E0E0E0] mb-2">Drop images or <span className="text-amber-500 underline underline-offset-4 cursor-pointer">browse files</span></p>
        <p className="text-xs opacity-40 max-w-sm text-center tracking-wide">
          Supports PNG, JPG, WEBP.
        </p>
      </div>
      
      <div className="flex gap-4 mt-12 opacity-60 z-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#E0E0E0]">
          <Layers className="w-4 h-4" /> Batch Support
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#E0E0E0]">
          <ImageIcon className="w-4 h-4" /> AI Powered
        </div>
      </div>
    </div>
  );
}

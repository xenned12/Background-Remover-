import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dropzone } from './components/Dropzone';
import { PreviewPanel } from './components/PreviewPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AppSettings, ImageJob } from './types';
import { processBackgroundRemoval } from './lib/processBackground';
import { compositeImage } from './lib/imageCompositor';
import { Wand2 } from 'lucide-react';

export default function App() {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    accuracy: 'medium',
    backgroundStyle: 'transparent',
    backgroundColor: '#ffffff',
    exportFormat: 'image/png',
    maxResolution: 2048,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Re-composite all done jobs when settings change
  useEffect(() => {
    const reComposite = async () => {
      let updated = false;
      const newJobs = await Promise.all(
        jobs.map(async (job) => {
          if (job.status === 'done' && job.foregroundUrl) {
            try {
              const resultBlob = await compositeImage(job.originalUrl, job.foregroundUrl, settings);
              const resultUrl = URL.createObjectURL(resultBlob);
              updated = true;
              return { ...job, resultBlob, resultUrl };
            } catch (err) {
              console.error("Re-composite failed for", job.id, err);
              return job;
            }
          }
          return job;
        })
      );
      if (updated) {
        setJobs(newJobs);
      }
    };
    reComposite();
  }, [settings.backgroundStyle, settings.backgroundColor, settings.exportFormat, settings.maxResolution]);

  // Main Processing Queue
  useEffect(() => {
    const processQueue = async () => {
      const nextJobIndex = jobs.findIndex(j => j.status === 'queued');
      if (nextJobIndex === -1) return;

      const job = jobs[nextJobIndex];
      
      // Update status to processing
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing', progress: 0 } : j));
      
      try {
        // 1. Run AI Cutout
        const foregroundBlob = await processBackgroundRemoval(job.file, settings.accuracy, (progress) => {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress } : j));
        });
        
        const foregroundUrl = URL.createObjectURL(foregroundBlob);

        // 2. Composite based on current settings
        const resultBlob = await compositeImage(job.originalUrl, foregroundUrl, settings);
        const resultUrl = URL.createObjectURL(resultBlob);

        setJobs(prev => prev.map(j => j.id === job.id ? { 
          ...j, 
          status: 'done', 
          foregroundBlob,
          foregroundUrl,
          resultBlob,
          resultUrl,
          completedAt: Date.now(),
        } : j));

      } catch (error: any) {
        setJobs(prev => prev.map(j => j.id === job.id ? { 
          ...j, 
          status: 'error', 
          errorMessage: error.message || 'Unknown processing error' 
        } : j));
      }
    };

    processQueue();
  }, [jobs, settings.accuracy]);

  const handleDrop = useCallback((files: File[]) => {
    const newJobs: ImageJob[] = files.map(file => ({
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      file,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      status: 'queued',
      createdAt: Date.now()
    }));
    
    setJobs(prev => [...prev, ...newJobs]);
    if (!selectedId && newJobs.length > 0) {
      setSelectedId(newJobs[0].id);
    }
  }, [selectedId]);

  const handleClearHistory = () => {
    jobs.forEach(j => {
      URL.revokeObjectURL(j.originalUrl);
      if (j.resultUrl) URL.revokeObjectURL(j.resultUrl);
      if (j.foregroundUrl) URL.revokeObjectURL(j.foregroundUrl);
    });
    setJobs([]);
    setSelectedId(null);
  };

  const selectedJob = jobs.find(j => j.id === selectedId) || null;

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-[#E0E0E0] overflow-hidden font-sans selection:bg-amber-500/30">
      <Sidebar 
        jobs={jobs} 
        selectedId={selectedId} 
        onSelect={setSelectedId} 
      />
      
      <main className="flex-1 flex flex-col h-full bg-[#0A0A0A] relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-xl tracking-tight font-light" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Background Remover <span className="text-white opacity-40 font-sans text-xs italic ml-2">Pro</span>
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold px-2 py-1 border border-amber-500/20 rounded">GPU Accelerated</span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col p-8 space-y-6">
          {!selectedJob ? (
            <div className="flex-1 rounded-2xl border-2 border-dashed border-white/10 bg-[#0F0F0F] flex flex-col items-center justify-center relative overflow-hidden">
              <Dropzone onDrop={handleDrop} />
            </div>
          ) : (
            <PreviewPanel job={selectedJob} />
          )}
        </div>
      </main>

      <SettingsPanel 
        settings={settings} 
        onChange={setSettings} 
        onClearHistory={handleClearHistory} 
      />
    </div>
  );
}

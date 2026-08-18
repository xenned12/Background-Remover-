import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dropzone } from './components/Dropzone';
import { PreviewPanel } from './components/PreviewPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  AppSettings,
  ImageJob,
  BackdropPresetsResponse,
  SystemHealthResponse,
  BackgroundStyle,
} from './types';
import { processBackgroundRemoval } from './lib/processBackground';
import { compositeImage } from './lib/imageCompositor';
import { createZipArchive, triggerBlobDownload } from './lib/zipExporter';
import {
  getPreferences,
  updatePreferences,
  createJob,
  updateJob,
  deleteJob,
  clearAllJobs,
  getBackdropPresets,
  getSystemHealth,
} from './lib/api';

const SETTINGS_STORAGE_KEY = 'bg_remover_pro_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  accuracy: 'medium',
  backgroundStyle: 'transparent',
  backgroundColor: '#FFFFFF',
  gradientPreset: 'morning_mist',
  blurRadius: 16,
  blurOverlayOpacity: 0.15,
  exportFormat: 'image/png',
  maxResolution: 2048,
  shadow: 'none',
  edgeSmoothing: true,
  autoDownload: false,
  jpegQuality: 0.92,
};

export default function App() {
  // 1. Settings state with localStorage initialization
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not restore local settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // State
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Server data state
  const [backdropPresets, setBackdropPresets] = useState<BackdropPresetsResponse | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs for tracking active processing to prevent duplicate queue execution
  const isProcessingRef = useRef<boolean>(false);

  // Persist settings to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Initial Data Fetch on Mount
  const fetchInitialData = useCallback(async () => {
    try {
      // Check health
      const health = await getSystemHealth().catch(() => null);
      if (health) {
        setSystemHealth(health);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }

      // Fetch backdrop presets
      const presets = await getBackdropPresets().catch(() => null);
      if (presets) setBackdropPresets(presets);

      // Fetch preferences from server if available and merge
      const preferences = await getPreferences().catch(() => null);
      if (preferences) {
        setSettings((prev) => ({
          ...prev,
          accuracy: preferences.accuracy || prev.accuracy,
          backgroundStyle: preferences.backgroundStyle || prev.backgroundStyle,
          backgroundColor: preferences.backgroundColor || prev.backgroundColor,
          gradientPreset: preferences.gradientPreset || prev.gradientPreset,
          exportFormat: preferences.exportFormat || prev.exportFormat,
          maxResolution: preferences.maxResolution || prev.maxResolution,
          shadow: preferences.shadow || prev.shadow,
          edgeSmoothing: preferences.edgeSmoothing ?? prev.edgeSmoothing,
          autoDownload: preferences.autoDownload ?? prev.autoDownload,
          jpegQuality: preferences.jpegQuality ?? prev.jpegQuality,
        }));
      }
    } catch (err) {
      console.warn('Initial server sync completed with offline fallback:', err);
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Periodic health check (every 30s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const health = await getSystemHealth();
        setSystemHealth(health);
        setIsBackendConnected(true);
      } catch {
        setIsBackendConnected(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. Re-composite Done Jobs when styling/export settings change
  useEffect(() => {
    let isCancelled = false;

    const reCompositeDoneJobs = async () => {
      const doneJobs = jobs.filter((j) => j.status === 'done' && j.foregroundUrl);
      if (doneJobs.length === 0) return;

      const updatedJobs = await Promise.all(
        jobs.map(async (job) => {
          if (job.status === 'done' && job.foregroundUrl) {
            try {
              const resultBlob = await compositeImage(
                job.originalUrl,
                job.foregroundUrl,
                settings,
                backdropPresets?.gradients
              );
              const resultUrl = URL.createObjectURL(resultBlob);
              return { ...job, resultBlob, resultUrl };
            } catch (err) {
              console.error('Re-compositing failed for job:', job.id, err);
              return job;
            }
          }
          return job;
        })
      );

      if (!isCancelled) {
        setJobs(updatedJobs);
      }
    };

    reCompositeDoneJobs();

    return () => {
      isCancelled = true;
    };
  }, [
    settings.backgroundStyle,
    settings.backgroundColor,
    settings.gradientPreset,
    settings.customGradient,
    settings.customImageBackground,
    settings.blurRadius,
    settings.blurOverlayOpacity,
    settings.shadow,
    settings.edgeSmoothing,
    settings.exportFormat,
    settings.maxResolution,
    settings.jpegQuality,
  ]);

  // 4. Queue Processor
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingRef.current) return;

      const nextJob = jobs.find((j) => j.status === 'queued');
      if (!nextJob || !nextJob.file) return;

      isProcessingRef.current = true;
      const startTime = Date.now();

      // Set status to processing
      setJobs((prev) =>
        prev.map((j) => (j.id === nextJob.id ? { ...j, status: 'processing', progress: 0 } : j))
      );

      // Inform backend if available
      updateJob(nextJob.id, { status: 'processing', progress: 0 }).catch(() => null);

      try {
        // Step 1: Run AI Cutout with progress callback
        const foregroundBlob = await processBackgroundRemoval(
          nextJob.file,
          settings.accuracy,
          (progress) => {
            setJobs((prev) =>
              prev.map((j) => (j.id === nextJob.id ? { ...j, progress } : j))
            );
            updateJob(nextJob.id, { progress }).catch(() => null);
          }
        );

        const foregroundUrl = URL.createObjectURL(foregroundBlob);

        // Step 2: Composite Foreground onto Background Style
        const resultBlob = await compositeImage(
          nextJob.originalUrl,
          foregroundUrl,
          settings,
          backdropPresets?.gradients
        );
        const resultUrl = URL.createObjectURL(resultBlob);

        const completedAt = Date.now();
        const processingTimeMs = completedAt - startTime;

        // Step 3: Update local job state
        setJobs((prev) =>
          prev.map((j) =>
            j.id === nextJob.id
              ? {
                  ...j,
                  status: 'done',
                  progress: 100,
                  foregroundBlob,
                  foregroundUrl,
                  resultBlob,
                  resultUrl,
                  completedAt,
                  processingTimeMs,
                }
              : j
          )
        );

        // Step 4: Sync with backend job records
        updateJob(nextJob.id, {
          status: 'done',
          progress: 100,
          processingTimeMs,
          completedAt,
        }).catch(() => null);

        // Auto download if enabled
        if (settings.autoDownload && resultBlob) {
          const ext =
            settings.exportFormat === 'image/jpeg'
              ? 'jpg'
              : settings.exportFormat === 'image/webp'
              ? 'webp'
              : 'png';
          triggerBlobDownload(resultBlob, `${nextJob.name.replace(/\.[^/.]+$/, '')}_studio.${ext}`);
        }
      } catch (error: any) {
        console.error('Job processing error:', error);
        const errorMessage = error?.message || 'Failed to extract background';

        setJobs((prev) =>
          prev.map((j) =>
            j.id === nextJob.id
              ? { ...j, status: 'error', errorMessage, progress: 0 }
              : j
          )
        );

        updateJob(nextJob.id, { status: 'error', errorMessage }).catch(() => null);
      } finally {
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [jobs, settings, backdropPresets]);

  // Handle Drop / File Add
  const handleDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const newJobs: ImageJob[] = files.map((file) => {
        const id = 'job_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        const originalUrl = URL.createObjectURL(file);

        return {
          id,
          file,
          name: file.name,
          originalUrl,
          fileSize: file.size,
          fileType: file.type,
          status: 'queued',
          createdAt: Date.now(),
        };
      });

      setJobs((prev) => [...prev, ...newJobs]);

      // Set selection if nothing selected
      if (!selectedId && newJobs.length > 0) {
        setSelectedId(newJobs[0].id);
      }

      // Sync creation with backend
      createJob({
        name: files[0].name,
        fileSize: files[0].size,
        fileType: files[0].type,
        settingsSnapshot: settings,
      }).catch(() => null);

      addToast(
        'info',
        `Added ${files.length} photo${files.length > 1 ? 's' : ''} to queue`,
        'Instant AI segmentation started.'
      );
    },
    [selectedId, settings, addToast]
  );

  // Handle Delete Single Job
  const handleDeleteJob = useCallback(
    (id: string) => {
      const jobToDelete = jobs.find((j) => j.id === id);
      if (jobToDelete) {
        URL.revokeObjectURL(jobToDelete.originalUrl);
        if (jobToDelete.foregroundUrl) URL.revokeObjectURL(jobToDelete.foregroundUrl);
        if (jobToDelete.resultUrl) URL.revokeObjectURL(jobToDelete.resultUrl);
      }

      setJobs((prev) => prev.filter((j) => j.id !== id));
      if (selectedId === id) {
        const remaining = jobs.filter((j) => j.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }

      deleteJob(id).catch(() => null);
    },
    [jobs, selectedId]
  );

  // Handle Clear All
  const handleClearAll = useCallback(() => {
    jobs.forEach((j) => {
      URL.revokeObjectURL(j.originalUrl);
      if (j.foregroundUrl) URL.revokeObjectURL(j.foregroundUrl);
      if (j.resultUrl) URL.revokeObjectURL(j.resultUrl);
    });

    setJobs([]);
    setSelectedId(null);
    clearAllJobs().catch(() => null);
    addToast('info', 'Queue Cleared', 'All temporary images and cutouts removed.');
  }, [jobs, addToast]);

  // Handle Retry Job
  const handleRetryJob = useCallback((id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'queued', errorMessage: undefined, progress: 0 } : j))
    );
  }, []);

  // Handle Batch Export ZIP
  const handleBatchExport = useCallback(async () => {
    const doneJobs = jobs.filter((j) => j.status === 'done' && j.resultBlob);
    if (doneJobs.length === 0) {
      addToast('info', 'No Completed Photos', 'Process at least one photo first.');
      return;
    }

    try {
      const ext =
        settings.exportFormat === 'image/jpeg'
          ? 'jpg'
          : settings.exportFormat === 'image/webp'
          ? 'webp'
          : 'png';

      const zipEntries = doneJobs.map((j) => ({
        name: `${j.name.replace(/\.[^/.]+$/, '')}_studio.${ext}`,
        blob: j.resultBlob!,
      }));

      const zipBlob = await createZipArchive(zipEntries);
      triggerBlobDownload(zipBlob, `studio_batch_export_${Date.now()}.zip`);

      addToast(
        'success',
        'Batch ZIP Generated!',
        `Archived ${doneJobs.length} studio cutouts for download.`
      );
    } catch (err) {
      console.error('Batch ZIP export error:', err);
      addToast('error', 'Export Failed', 'Could not assemble ZIP archive.');
    }
  }, [jobs, settings.exportFormat, addToast]);

  // Handle Quick Backdrop Change from Canvas Bottom Toolbar
  const handleQuickBackdropChange = useCallback(
    (style: BackgroundStyle, value?: string) => {
      if (style === 'transparent') {
        setSettings((prev) => ({ ...prev, backgroundStyle: 'transparent' }));
      } else if (style === 'color') {
        setSettings((prev) => ({
          ...prev,
          backgroundStyle: 'color',
          backgroundColor: value || '#FFFFFF',
        }));
      } else if (style === 'gradient') {
        setSettings((prev) => ({
          ...prev,
          backgroundStyle: 'gradient',
          gradientPreset: value || 'morning_mist',
        }));
      } else if (style === 'blur') {
        setSettings((prev) => ({
          ...prev,
          backgroundStyle: 'blur',
        }));
      }
    },
    []
  );

  // Save Preferences to backend & local storage
  const handleSavePreferences = useCallback(async () => {
    try {
      await updatePreferences({
        accuracy: settings.accuracy,
        backgroundStyle: settings.backgroundStyle,
        backgroundColor: settings.backgroundColor,
        gradientPreset: settings.gradientPreset,
        exportFormat: settings.exportFormat,
        maxResolution: settings.maxResolution,
        shadow: settings.shadow,
        edgeSmoothing: settings.edgeSmoothing,
        autoDownload: settings.autoDownload,
        jpegQuality: settings.jpegQuality,
      });

      addToast('success', 'Preferences Saved', 'Default studio settings updated.');
    } catch (err) {
      console.error('Failed to sync preferences to server:', err);
      addToast('success', 'Preferences Saved', 'Saved locally to browser storage.');
    }
  }, [settings, addToast]);

  const selectedJob = jobs.find((j) => j.id === selectedId) || null;
  const completedJobsCount = jobs.filter((j) => j.status === 'done').length;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans select-none antialiased">
      {/* App Header */}
      <Header
        systemHealth={systemHealth}
        isBackendConnected={isBackendConnected}
        completedJobsCount={completedJobsCount}
        totalJobsCount={jobs.length}
        onBatchExport={handleBatchExport}
        onNewBatch={() => setSelectedId(null)}
        onRefreshHealth={fetchInitialData}
        onOpenSampleSelector={() => setSelectedId(null)}
      />

      {/* Main Studio Body: Sidebar | Center Canvas | Settings Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          jobs={jobs}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDeleteJob={handleDeleteJob}
          onClearAll={handleClearAll}
          onRetryJob={handleRetryJob}
          onDownloadAllZip={handleBatchExport}
        />

        {/* Center Canvas / Dropzone */}
        <main className="flex-1 flex flex-col h-full bg-slate-100/60 relative overflow-hidden">
          {!selectedJob ? (
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
              <Dropzone onDrop={handleDrop} />
            </div>
          ) : (
            <PreviewPanel
              job={selectedJob}
              settings={settings}
              onQuickBackdropChange={handleQuickBackdropChange}
              onRetry={handleRetryJob}
            />
          )}
        </main>

        {/* Right Settings & Controls Panel */}
        <SettingsPanel
          settings={settings}
          backdropPresets={backdropPresets}
          onChange={setSettings}
          onSavePreferences={handleSavePreferences}
          onClearHistory={handleClearAll}
        />
      </div>

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

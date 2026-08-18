import React from 'react';
import { Settings, Image as ImageIcon, Download, Trash2, SlidersHorizontal, Activity } from 'lucide-react';
import { AppSettings, ExportFormat, BackgroundStyle, AIModelAccuracy } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onClearHistory?: () => void;
}

export function SettingsPanel({ settings, onChange, onClearHistory }: SettingsPanelProps) {
  const handleChange = (key: keyof AppSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="w-72 bg-[#0D0D0D] border-l border-white/5 p-6 flex flex-col h-full overflow-y-auto space-y-8">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-amber-500" />
        <h2 className="text-[11px] font-semibold text-[#E0E0E0] uppercase tracking-widest">Workflow Settings</h2>
      </div>

      <div className="space-y-8">
        {/* Background Style */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest opacity-50 flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4" /> Background
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['transparent', 'color', 'blur'] as BackgroundStyle[]).map(style => (
              <button
                key={style}
                onClick={() => handleChange('backgroundStyle', style)}
                className={`py-2 px-3 text-[10px] rounded-lg capitalize border text-center transition-colors ${
                  settings.backgroundStyle === style 
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-500' 
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          
          {settings.backgroundStyle === 'color' && (
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="color" 
                value={settings.backgroundColor}
                onChange={e => handleChange('backgroundColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
              />
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{settings.backgroundColor}</span>
            </div>
          )}
        </div>

        {/* AI Model */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest opacity-50 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" /> Output Quality
          </label>
          <select 
            value={settings.accuracy}
            onChange={(e) => handleChange('accuracy', e.target.value as AIModelAccuracy)}
            className="w-full bg-[#141414] border border-white/10 text-white/80 rounded px-2 py-2 text-[11px] focus:outline-none focus:border-amber-500/50 tracking-wider"
          >
            <option value="small">Standard (Fast/Normal)</option>
            <option value="medium">Pro (High Precision)</option>
          </select>
        </div>

        {/* Export Format */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest opacity-50 flex items-center gap-2 mb-4">
            <Download className="w-4 h-4" /> Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'image/png', label: 'PNG' },
              { id: 'image/jpeg', label: 'JPG' },
              { id: 'image/webp', label: 'WEBP' }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => handleChange('exportFormat', fmt.id as ExportFormat)}
                className={`py-2 px-3 text-[10px] rounded-lg border text-center transition-colors ${
                  settings.exportFormat === fmt.id 
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-500' 
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[11px] uppercase tracking-widest opacity-50 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Max Resolution
            </label>
            <span className="text-[10px] text-amber-500 font-mono tracking-wider">{settings.maxResolution}px</span>
          </div>
          <input 
            type="range" 
            min="512" 
            max="4096" 
            step="512"
            value={settings.maxResolution}
            onChange={e => handleChange('maxResolution', parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
        
        <div className="pt-8 border-t border-white/5 mt-auto">
          <button 
            onClick={onClearHistory}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 text-[11px] uppercase tracking-widest font-bold transition-colors border border-white/5"
          >
            <Trash2 className="w-4 h-4" /> Clear Batch
          </button>
        </div>
      </div>
    </div>
  );
}

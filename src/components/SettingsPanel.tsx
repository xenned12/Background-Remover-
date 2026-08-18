import React, { useState, useRef } from 'react';
import {
  SlidersHorizontal,
  Image as ImageIcon,
  Sparkles,
  Sun,
  Activity,
  Download,
  Settings2,
  Trash2,
  BookmarkCheck,
  Check,
  Wand2,
  Palette,
  Upload,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  AppSettings,
  BackgroundStyle,
  AIModelAccuracy,
  ExportFormat,
  ShadowStyle,
  BackdropPresetsResponse,
  BackdropSuggestion,
} from '../types';
import { cn } from '../lib/utils';
import { generateBackdropSuggestion } from '../lib/api';

interface SettingsPanelProps {
  settings: AppSettings;
  backdropPresets?: BackdropPresetsResponse | null;
  onChange: (settings: AppSettings) => void;
  onSavePreferences?: () => void;
  onClearHistory?: () => void;
}

export function SettingsPanel({
  settings,
  backdropPresets,
  onChange,
  onSavePreferences,
  onClearHistory,
}: SettingsPanelProps) {
  // Tabs: 'backdrop' | 'ai_gen' | 'shadow' | 'export'
  const [activeTab, setActiveTab] = useState<'backdrop' | 'ai_gen' | 'shadow' | 'export'>('backdrop');

  // AI Generator state
  const [aiSubject, setAiSubject] = useState<'product' | 'portrait' | 'pet' | 'vehicle' | 'food' | 'general'>('product');
  const [aiMood, setAiMood] = useState<'studio' | 'lifestyle' | 'neon' | 'minimalist' | 'nature' | 'luxury' | 'vintage' | 'futuristic'>('studio');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<BackdropSuggestion | null>(null);

  const customBgInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleGenerateBackdrop = async () => {
    try {
      setIsGeneratingAi(true);
      const res = await generateBackdropSuggestion({
        subjectType: aiSubject,
        mood: aiMood,
        prompt: aiPrompt.trim() || undefined,
      });

      if (res && res.suggestion) {
        setAiSuggestion(res.suggestion);
      }
    } catch (err) {
      console.error('AI backdrop generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;

    if (aiSuggestion.recommendedGradient) {
      onChange({
        ...settings,
        backgroundStyle: 'gradient',
        customGradient: aiSuggestion.recommendedGradient,
        shadow: (aiSuggestion.shadowRecommendation as ShadowStyle) || 'studio',
      });
    } else if (aiSuggestion.recommendedColor) {
      onChange({
        ...settings,
        backgroundStyle: 'color',
        backgroundColor: aiSuggestion.recommendedColor,
        shadow: (aiSuggestion.shadowRecommendation as ShadowStyle) || 'studio',
      });
    }
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({
          ...settings,
          backgroundStyle: 'custom_image',
          customImageBackground: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCustomBg = () => {
    onChange({
      ...settings,
      backgroundStyle: 'transparent',
      customImageBackground: undefined,
    });
  };

  // Curated 8 light & studio swatches
  const solidPresets = [
    { id: 'clean_white', name: 'Clean White', hex: '#FFFFFF' },
    { id: 'soft_pearl', name: 'Soft Pearl', hex: '#F8FAFC' },
    { id: 'slate_mist', name: 'Slate Mist', hex: '#E2E8F0' },
    { id: 'studio_blue', name: 'Studio Blue', hex: '#E0E7FF' },
    { id: 'mint_sage', name: 'Mint Sage', hex: '#DCFCE7' },
    { id: 'rose_quartz', name: 'Rose Quartz', hex: '#FCE7F3' },
    { id: 'warm_sand', name: 'Warm Sand', hex: '#F5EBE0' },
    { id: 'dark_charcoal', name: 'Dark Charcoal', hex: '#1E293B' },
  ];

  // Curated 6 modern light gradients
  const gradientList = backdropPresets?.gradients || [
    { id: 'morning_mist', name: 'Morning Mist', css: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', colors: ['#F8FAFC', '#E2E8F0'], description: 'Crisp minimal gray mist' },
    { id: 'aurora_blue', name: 'Aurora Blue', css: 'linear-gradient(135deg, #E0E7FF 0%, #CFFAFE 100%)', colors: ['#E0E7FF', '#CFFAFE'], description: 'Cool tech modern studio' },
    { id: 'sunset_whisper', name: 'Sunset Whisper', css: 'linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 100%)', colors: ['#FFE4E6', '#FEF3C7'], description: 'Warm subtle ambient light' },
    { id: 'ocean_flow', name: 'Ocean Flow', css: 'linear-gradient(135deg, #E0F2FE 0%, #E0E7FF 100%)', colors: ['#E0F2FE', '#E0E7FF'], description: 'Calm aerial sky tones' },
    { id: 'clean_indigo', name: 'Clean Indigo', css: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', colors: ['#EEF2FF', '#E0E7FF'], description: 'Sleek SaaS product backdrop' },
    { id: 'soft_lavender', name: 'Soft Lavender', css: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)', colors: ['#F3E8FF', '#FCE7F3'], description: 'Editorial luxury pastel' },
  ];

  const blurList = backdropPresets?.blurFilters || [
    { id: 'subtle_blur', name: 'Subtle Depth', blurRadius: 8, overlayOpacity: 0.1, description: 'Light natural lens blur' },
    { id: 'studio_portrait_blur', name: 'Studio Portrait (f/2.8)', blurRadius: 16, overlayOpacity: 0.15, description: 'Balanced commercial bokeh' },
    { id: 'dramatic_bokeh', name: 'Dramatic Bokeh (f/1.4)', blurRadius: 28, overlayOpacity: 0.25, description: 'Silky shallow depth of field' },
    { id: 'abstract_dream', name: 'Dreamy Melt', blurRadius: 42, overlayOpacity: 0.35, description: 'Soft artistic atmosphere' },
  ];

  const shadowList: { id: ShadowStyle; name: string; desc: string }[] = [
    { id: 'none', name: 'None', desc: 'Flat lossless alpha' },
    { id: 'soft', name: 'Soft Ambient', desc: 'Gentle natural room shadow' },
    { id: 'drop', name: 'Drop Shadow', desc: 'Direct elevation & contrast' },
    { id: 'floating', name: 'Floating 3D', desc: 'High elevation with soft spread' },
    { id: 'studio', name: 'Studio Floor', desc: 'Tabletop product ground shadow' },
    { id: 'neon', name: 'Neon Glow', desc: 'Vibrant electric blue radiance' },
  ];

  const handleResetDefaults = () => {
    onChange({
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
    });
  };

  return (
    <aside className="w-84 border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden select-none shrink-0 z-20 shadow-xs">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Studio Controls
          </h2>
        </div>
        {onSavePreferences && (
          <button
            onClick={onSavePreferences}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            title="Save current configuration as default"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Save Default</span>
          </button>
        )}
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center p-1.5 border-b border-slate-200 bg-slate-100/70 gap-1 text-[11px]">
        <button
          onClick={() => setActiveTab('backdrop')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5',
            activeTab === 'backdrop'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Backdrop</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_gen')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5',
            activeTab === 'ai_gen'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('shadow')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5',
            activeTab === 'shadow'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Lighting</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5',
            activeTab === 'export'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Format</span>
        </button>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TAB 1: BACKDROP CONTROLS */}
        {activeTab === 'backdrop' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Style Mode Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Backdrop Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'transparent', label: 'Transparent' },
                  { id: 'color', label: 'Solid Studio' },
                  { id: 'gradient', label: 'Gradient' },
                  { id: 'blur', label: 'Realistic Blur' },
                  { id: 'custom_image', label: 'Custom Photo' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleUpdate('backgroundStyle', st.id as BackgroundStyle)}
                    className={cn(
                      'py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all',
                      settings.backgroundStyle === st.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-section: Transparent Info */}
            {settings.backgroundStyle === 'transparent' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">Lossless Transparent Cutout</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Clean transparent PNG/WebP alpha channel. Perfect for product listings, marketing banners, and UI design assets.
                </p>
              </div>
            )}

            {/* Sub-section: Solid Colors */}
            {settings.backgroundStyle === 'color' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Curated Studio Swatches</span>
                  <span className="font-mono text-[10px] text-blue-600 uppercase font-semibold">
                    {settings.backgroundColor}
                  </span>
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {solidPresets.map((preset) => {
                    const isSelected = settings.backgroundColor.toUpperCase() === preset.hex.toUpperCase();
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleUpdate('backgroundColor', preset.hex)}
                        title={preset.name}
                        style={{ backgroundColor: preset.hex }}
                        className={cn(
                          'h-9 rounded-lg border transition-transform hover:scale-105 relative flex items-center justify-center shadow-xs',
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/30'
                            : 'border-slate-300'
                        )}
                      >
                        {isSelected && (
                          <Check
                            className={cn(
                              'w-4 h-4 stroke-[3]',
                              preset.hex === '#1E293B' ? 'text-white' : 'text-slate-900'
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                    className="flex-1 py-1 px-2.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>
            )}

            {/* Sub-section: Studio Gradients */}
            {settings.backgroundStyle === 'gradient' && (
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-700">
                  Curated Studio Gradients
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {gradientList.map((grad) => {
                    const isSelected = settings.gradientPreset === grad.id;
                    return (
                      <button
                        key={grad.id}
                        onClick={() => handleUpdate('gradientPreset', grad.id)}
                        className={cn(
                          'p-2 rounded-xl border text-left transition-all relative overflow-hidden group shadow-xs',
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <div
                          className="h-10 w-full rounded-lg mb-1.5 border border-slate-200/80 shadow-inner"
                          style={{ background: grad.css }}
                        />
                        <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {grad.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-section: Realistic Blur Bokeh */}
            {settings.backgroundStyle === 'blur' && (
              <div className="space-y-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">
                  Aperture & Bokeh Presets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {blurList.map((bp) => (
                    <button
                      key={bp.id}
                      onClick={() => {
                        handleUpdate('blurRadius', bp.blurRadius);
                        handleUpdate('blurOverlayOpacity', bp.overlayOpacity);
                      }}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-[11px] border text-left transition-all',
                        settings.blurRadius === bp.blurRadius
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <div className="truncate font-medium">{bp.name}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Blur Slider */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="font-medium">Blur Intensity</span>
                    <span className="font-mono font-bold text-blue-600">{settings.blurRadius || 16}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="50"
                    step="2"
                    value={settings.blurRadius || 16}
                    onChange={(e) => handleUpdate('blurRadius', parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Overlay Darkness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="font-medium">Atmospheric Dark Tint</span>
                    <span className="font-mono font-bold text-blue-600">
                      {Math.round((settings.blurOverlayOpacity ?? 0.15) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={settings.blurOverlayOpacity ?? 0.15}
                    onChange={(e) => handleUpdate('blurOverlayOpacity', parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Sub-section: Custom Background Photo */}
            {settings.backgroundStyle === 'custom_image' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="file"
                  ref={customBgInputRef}
                  onChange={handleCustomBgUpload}
                  accept="image/*"
                  className="hidden"
                />

                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Custom Replacement Backdrop</span>
                </label>

                {settings.customImageBackground ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                      <img
                        src={settings.customImageBackground}
                        alt="Custom Background"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={handleRemoveCustomBg}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors"
                        title="Remove custom image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => customBgInputRef.current?.click()}
                      className="w-full py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Change Background Photo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => customBgInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-white hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Upload Background Image</p>
                      <p className="text-[10px] text-slate-500">JPG, PNG, or WEBP scenery/interior</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI BACKDROP STUDIO GENERATOR */}
        {activeTab === 'ai_gen' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-blue-600" />
                AI Studio Backdrop Brainstormer
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically generate harmonic lighting, gradients, and backdrop themes tailored for your subject.
              </p>
            </div>

            {/* Subject Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Subject Category
              </label>
              <select
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value as any)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="product">Product & E-Commerce</option>
                <option value="portrait">Studio Portrait / Headshot</option>
                <option value="pet">Pet & Animal</option>
                <option value="vehicle">Automotive / Vehicle</option>
                <option value="food">Culinary & Food</option>
                <option value="general">Creative / Modern Art</option>
              </select>
            </div>

            {/* Mood */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Aesthetic & Mood
              </label>
              <select
                value={aiMood}
                onChange={(e) => setAiMood(e.target.value as any)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="studio">Clean Minimalist Studio</option>
                <option value="luxury">Luxury & Editorial Cashmere</option>
                <option value="neon">Cyberpunk Neon Radiance</option>
                <option value="lifestyle">Warm Golden Hour</option>
                <option value="nature">Fresh Organic Meadow</option>
                <option value="futuristic">Futuristic Deep Space</option>
              </select>
            </div>

            {/* Concept Prompt */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Custom Notes (Optional)
              </label>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Leather watch on travertine stone"
                className="w-full py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Generate Trigger */}
            <button
              onClick={handleGenerateBackdrop}
              disabled={isGeneratingAi}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Designing Concept...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Generate Backdrop Style</span>
                </>
              )}
            </button>

            {/* AI Generated Result Preview Card */}
            {aiSuggestion && (
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900">{aiSuggestion.title}</h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300 uppercase font-mono font-bold">
                    {aiSuggestion.shadowRecommendation}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {aiSuggestion.description}
                </p>

                {aiSuggestion.recommendedGradient && (
                  <div
                    className="h-7 w-full rounded-lg border border-slate-300 shadow-inner"
                    style={{ background: aiSuggestion.recommendedGradient }}
                  />
                )}

                <div className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                  <Sun className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">{aiSuggestion.lightingDescription}</span>
                </div>

                <button
                  onClick={handleApplyAiSuggestion}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Apply to Canvas</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDIO SHADOWS & LIGHTING */}
        {activeTab === 'shadow' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-blue-600" />
                Cast Shadow & Depth
              </label>
              <p className="text-[11px] text-slate-500">
                Adds dimensional contact and realistic studio illumination behind your subject.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {shadowList.map((sh) => {
                const isSelected = (settings.shadow || 'none') === sh.id;
                return (
                  <button
                    key={sh.id}
                    onClick={() => handleUpdate('shadow', sh.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all shadow-xs',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <p className="text-xs font-bold">{sh.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{sh.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Edge Smoothing Anti-Aliasing */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800">Sub-Pixel Edge Feathering</label>
                <p className="text-[10px] text-slate-500">Smooth fine hair & semi-transparent edges</p>
              </div>
              <button
                onClick={() => handleUpdate('edgeSmoothing', !settings.edgeSmoothing)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer',
                  settings.edgeSmoothing ? 'bg-blue-600' : 'bg-slate-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-xs',
                    settings.edgeSmoothing ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: EXPORT FORMAT & QUALITY */}
        {activeTab === 'export' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* AI Model Quality */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                AI Segmentation Model
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'small', label: 'Standard (Fast)', desc: 'Optimized speed' },
                  { id: 'medium', label: 'Studio Pro (HD)', desc: 'High-precision FP16' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleUpdate('accuracy', m.id as AIModelAccuracy)}
                    className={cn(
                      'p-2 rounded-xl border text-left transition-all shadow-xs',
                      settings.accuracy === m.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <p className="text-xs font-bold">{m.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'image/png', label: 'PNG', note: 'Lossless' },
                  { id: 'image/jpeg', label: 'JPG', note: 'Studio' },
                  { id: 'image/webp', label: 'WEBP', note: 'Compact' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => handleUpdate('exportFormat', fmt.id as ExportFormat)}
                    className={cn(
                      'py-2 px-2 rounded-xl border text-center transition-all shadow-xs',
                      settings.exportFormat === fmt.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <p className="text-xs font-bold">{fmt.label}</p>
                    <p className="text-[9px] text-slate-500">{fmt.note}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Resolution Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-600">
                  Max Output Resolution
                </span>
                <span className="font-mono text-blue-600 font-bold">
                  {settings.maxResolution || 2048}px
                </span>
              </div>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={settings.maxResolution || 2048}
                onChange={(e) => handleUpdate('maxResolution', parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>512px</span>
                <span>1080p (1920)</span>
                <span>2K (2048)</span>
                <span>4K (4096)</span>
              </div>
            </div>

            {/* Quality Slider (for JPG / WebP) */}
            {settings.exportFormat !== 'image/png' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-slate-600">
                    Compression Quality
                  </span>
                  <span className="font-mono text-blue-600 font-bold">
                    {Math.round((settings.jpegQuality || 0.92) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.0"
                  step="0.02"
                  value={settings.jpegQuality || 0.92}
                  onChange={(e) => handleUpdate('jpegQuality', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          {onClearHistory && (
            <button
              onClick={onClearHistory}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
              <span>Clear Batch</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

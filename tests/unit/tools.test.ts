/**
 * Unit Test Suite: Tools Presets and Health Metrics
 */

import { TestSuiteRunner, expect } from '../helpers/assertions.js';
import {
  store,
  solidStudioPresets,
  gradientPresets,
  blurFilterPresets,
  aspectRatioPresets,
  shadowPresets,
} from '../../server/data/store.js';
import { getHealthStatus } from '../../server/routes/tools.js';

export function createToolsTestSuite(): TestSuiteRunner {
  const suite = new TestSuiteRunner('Tools Module Unit Tests', 'unit');

  suite.test('Solid Studio Presets: Verifies catalog completeness, valid hex formats, and category tags', () => {
    const presets = solidStudioPresets;

    expect(presets.length).toBe(8);
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;

    for (const preset of presets) {
      expect(preset.id.length).toBeGreaterThan(0);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.hex).toMatch(hexPattern);
      expect(['neutral', 'studio', 'vibrant', 'pastel']).toContain(preset.category);
    }

    // Specific key studio colors check
    expect(presets.some((p) => p.id === 'clean_white' && p.hex === '#FFFFFF')).toBe(true);
    expect(presets.some((p) => p.id === 'soft_pearl' && p.hex === '#F8FAFC')).toBe(true);
    expect(presets.some((p) => p.id === 'slate_mist' && p.hex === '#E2E8F0')).toBe(true);
    expect(presets.some((p) => p.id === 'studio_blue' && p.hex === '#E0E7FF')).toBe(true);
    expect(presets.some((p) => p.id === 'dark_charcoal' && p.hex === '#1E293B')).toBe(true);
  });

  suite.test('Gradient Presets: Verifies 6 curated light studio CSS gradients and color arrays', () => {
    const gradients = gradientPresets;

    expect(gradients.length).toBe(6);

    for (const g of gradients) {
      expect(g.id.length).toBeGreaterThan(0);
      expect(g.name.length).toBeGreaterThan(0);
      expect(g.css.startsWith('linear-gradient(')).toBe(true);
      expect(g.colors.length).toBeGreaterThanOrEqual(2);
      expect(typeof g.angle === 'number').toBe(true);
      expect(g.description.length).toBeGreaterThan(10);
    }

    expect(gradients.some((g) => g.id === 'morning_mist')).toBe(true);
    expect(gradients.some((g) => g.id === 'aurora_blue')).toBe(true);
    expect(gradients.some((g) => g.id === 'sunset_whisper')).toBe(true);
    expect(gradients.some((g) => g.id === 'ocean_flow')).toBe(true);
    expect(gradients.some((g) => g.id === 'clean_indigo')).toBe(true);
    expect(gradients.some((g) => g.id === 'soft_lavender')).toBe(true);
  });

  suite.test('Blur Filter Presets: Verifies bokeh and depth presets within safe visual bounds', () => {
    const blurFilters = blurFilterPresets;

    expect(blurFilters.length).toBe(4);

    for (const b of blurFilters) {
      expect(b.blurRadius).toBeGreaterThanOrEqual(2);
      expect(b.blurRadius).toBeLessThanOrEqual(60);
      expect(b.overlayOpacity).toBeGreaterThanOrEqual(0);
      expect(b.overlayOpacity).toBeLessThanOrEqual(1);
      expect(b.description.length).toBeGreaterThan(5);
    }

    expect(blurFilters.some((b) => b.id === 'subtle_blur' && b.blurRadius === 8)).toBe(true);
    expect(blurFilters.some((b) => b.id === 'dramatic_bokeh' && b.blurRadius === 28)).toBe(true);
  });

  suite.test('Aspect Ratio Presets: Validates standard canvas dimensions and social media platform hints', () => {
    const ratios = aspectRatioPresets;

    expect(ratios.length).toBe(7);

    for (const r of ratios) {
      expect(r.id.length).toBeGreaterThan(0);
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.ratio.length).toBeGreaterThan(0);
      if (r.id !== 'original') {
        expect(r.width).toBeGreaterThan(0);
        expect(r.height).toBeGreaterThan(0);
      }
    }

    const square = ratios.find((r) => r.id === 'square');
    expect(square?.width).toBe(1080);
    expect(square?.height).toBe(1080);

    const story = ratios.find((r) => r.id === 'story_9_16');
    expect(story?.width).toBe(1080);
    expect(story?.height).toBe(1920);

    const landscape = ratios.find((r) => r.id === 'landscape_16_9');
    expect(landscape?.width).toBe(1920);
    expect(landscape?.height).toBe(1080);
  });

  suite.test('Shadow Presets: Validates CSS drop-shadow filters and lighting effects', () => {
    const shadows = shadowPresets;

    expect(shadows.length).toBe(6);

    for (const s of shadows) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      if (s.id !== 'none') {
        expect(s.cssFilter.includes('drop-shadow(')).toBe(true);
      } else {
        expect(s.cssFilter).toBe('none');
      }
    }

    expect(shadows.some((s) => s.id === 'soft')).toBe(true);
    expect(shadows.some((s) => s.id === 'floating')).toBe(true);
    expect(shadows.some((s) => s.id === 'neon')).toBe(true);
  });

  suite.test('Health Status Metrics: Verifies system health reporting, memory, and job metrics calculation', () => {
    store.reset();
    const health = getHealthStatus();

    expect(health.status).toBe('ok');
    expect(health.service).toBe('background-remover-api');
    expect(health.version).toBe('2.0.0');
    expect(typeof health.uptimeSeconds).toBe('number');
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(typeof health.timestamp).toBe('string');
    expect(health.memoryUsage.rssMb).toBeGreaterThan(0);
    expect(health.memoryUsage.heapTotalMb).toBeGreaterThan(0);
    expect(health.memoryUsage.heapUsedMb).toBeGreaterThan(0);
    expect(typeof health.nodeVersion).toBe('string');
    expect(typeof health.activeJobsCount).toBe('number');
    expect(typeof health.completedJobsCount).toBe('number');
  });

  return suite;
}

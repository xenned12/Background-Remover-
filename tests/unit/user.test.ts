/**
 * Unit Test Suite: App Preferences and Defaults
 * Validates accountless stateless preferences, schema integrity, and mutations.
 */

import { TestSuiteRunner, expect } from '../helpers/assertions.js';
import { store, defaultAppPreferences } from '../../server/data/store.js';
import { AppPreferences, ExportFormat, ShadowStyle, BackgroundStyle } from '../../server/types.js';

export function createUserTestSuite(): TestSuiteRunner {
  const suite = new TestSuiteRunner('App Preferences Unit Tests', 'unit');

  suite.test('Preferences Retrieval: Returns default system preferences snapshot with crisp light defaults', () => {
    store.reset();
    const prefs = store.getPreferences();

    expect(prefs.accuracy).toBe('medium');
    expect(prefs.backgroundStyle).toBe('transparent');
    expect(prefs.backgroundColor).toBe('#FFFFFF');
    expect(prefs.gradientPreset).toBe('morning_mist');
    expect(prefs.exportFormat).toBe('image/png');
    expect(prefs.maxResolution).toBe(2048);
    expect(prefs.shadow).toBe('none');
    expect(prefs.edgeSmoothing).toBe(true);
    expect(prefs.autoDownload).toBe(false);
    expect(prefs.jpegQuality).toBe(0.92);
  });

  suite.test('Preferences Mutation: Successfully applies valid partial updates for gradients and shadows', () => {
    store.reset();
    const updated = store.updatePreferences({
      backgroundStyle: 'gradient',
      gradientPreset: 'aurora_blue',
      shadow: 'neon',
      maxResolution: 4096,
      edgeSmoothing: false,
      autoDownload: true,
      jpegQuality: 0.85,
    });

    expect(updated.backgroundStyle).toBe('gradient');
    expect(updated.gradientPreset).toBe('aurora_blue');
    expect(updated.shadow).toBe('neon');
    expect(updated.maxResolution).toBe(4096);
    expect(updated.edgeSmoothing).toBe(false);
    expect(updated.autoDownload).toBe(true);
    expect(updated.jpegQuality).toBe(0.85);

    // Unmodified fields maintain previous values
    expect(updated.accuracy).toBe('medium');
    expect(updated.backgroundColor).toBe('#FFFFFF');
  });

  suite.test('Preferences Mutation: Supports solid studio swatches and custom resolutions', () => {
    store.reset();
    const updated = store.updatePreferences({
      backgroundStyle: 'color',
      backgroundColor: '#E0E7FF',
      maxResolution: 1080,
    });

    expect(updated.backgroundStyle).toBe('color');
    expect(updated.backgroundColor).toBe('#E0E7FF');
    expect(updated.maxResolution).toBe(1080);
  });

  suite.test('Preferences Mutation: Supports custom_image and blur background style configurations', () => {
    store.reset();

    // 1. Custom Image Background
    const customImgPrefs = store.updatePreferences({
      backgroundStyle: 'custom_image',
      shadow: 'studio',
    });
    expect(customImgPrefs.backgroundStyle).toBe('custom_image');
    expect(customImgPrefs.shadow).toBe('studio');

    // 2. Blur background
    const blurPrefs = store.updatePreferences({
      backgroundStyle: 'blur',
      shadow: 'floating',
    });
    expect(blurPrefs.backgroundStyle).toBe('blur');
    expect(blurPrefs.shadow).toBe('floating');
  });

  suite.test('Preferences Mutation: Validates all supported export formats (PNG, JPEG, WEBP, SVG)', () => {
    store.reset();
    const formats: ExportFormat[] = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

    for (const fmt of formats) {
      const updated = store.updatePreferences({ exportFormat: fmt });
      expect(updated.exportFormat).toBe(fmt);
    }
  });

  suite.test('Preferences Mutation: Validates all shadow style options', () => {
    store.reset();
    const shadows: ShadowStyle[] = ['none', 'soft', 'drop', 'floating', 'studio', 'neon'];

    for (const sh of shadows) {
      const updated = store.updatePreferences({ shadow: sh });
      expect(updated.shadow).toBe(sh);
    }
  });

  suite.test('Store Isolation: reset() correctly restores default initial state', () => {
    store.updatePreferences({
      accuracy: 'small',
      backgroundStyle: 'gradient',
      backgroundColor: '#1E293B',
      maxResolution: 1024,
    });

    store.reset();
    const fresh = store.getPreferences();
    expect(fresh.accuracy).toBe(defaultAppPreferences.accuracy);
    expect(fresh.backgroundStyle).toBe(defaultAppPreferences.backgroundStyle);
    expect(fresh.backgroundColor).toBe(defaultAppPreferences.backgroundColor);
    expect(fresh.maxResolution).toBe(defaultAppPreferences.maxResolution);
  });

  return suite;
}

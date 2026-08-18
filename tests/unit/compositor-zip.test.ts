/**
 * Unit Test Suite: Image Compositor Math & ZIP Archive Generator Binary Validation
 */

import { TestSuiteRunner, expect } from '../helpers/assertions.js';
import { createZipArchive } from '../../src/lib/zipExporter.js';

// Pure mathematical functions mirroring imageCompositor for isolated unit testing
function computeBoundingDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxResolution = 2048
): { width: number; height: number } {
  let width = sourceWidth;
  let height = sourceHeight;
  const targetMax = Math.max(512, Math.min(4096, maxResolution || 2048));

  if (width > targetMax || height > targetMax) {
    const ratio = Math.min(targetMax / width, targetMax / height);
    width = Math.max(1, Math.floor(width * ratio));
    height = Math.max(1, Math.floor(height * ratio));
  }

  return { width, height };
}

function calculateGradientEndpoints(
  width: number,
  height: number,
  angleDeg = 135
): { x0: number; y0: number; x1: number; y1: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const x0 = width / 2 - (Math.cos(angleRad) * width) / 2;
  const y0 = height / 2 - (Math.sin(angleRad) * height) / 2;
  const x1 = width / 2 + (Math.cos(angleRad) * width) / 2;
  const y1 = height / 2 + (Math.sin(angleRad) * height) / 2;
  return { x0, y0, x1, y1 };
}

function computeShadowParameters(
  style: 'none' | 'soft' | 'drop' | 'floating' | 'studio' | 'neon',
  width: number,
  height: number
) {
  if (style === 'none') return null;
  const scaleFactor = Math.min(width, height) / 1000;

  switch (style) {
    case 'soft':
      return {
        color: 'rgba(15, 23, 42, 0.12)',
        blur: Math.max(8, 20 * scaleFactor),
        offsetX: 0,
        offsetY: Math.max(4, 12 * scaleFactor),
      };
    case 'drop':
      return {
        color: 'rgba(15, 23, 42, 0.22)',
        blur: Math.max(6, 14 * scaleFactor),
        offsetX: 0,
        offsetY: Math.max(8, 16 * scaleFactor),
      };
    case 'floating':
      return {
        color: 'rgba(15, 23, 42, 0.18)',
        blur: Math.max(16, 36 * scaleFactor),
        offsetX: 0,
        offsetY: Math.max(12, 28 * scaleFactor),
      };
    case 'studio':
      return {
        color: 'rgba(15, 23, 42, 0.20)',
        blur: Math.max(12, 24 * scaleFactor),
        offsetX: 0,
        offsetY: Math.max(14, 30 * scaleFactor),
      };
    case 'neon':
      return {
        color: 'rgba(37, 99, 235, 0.40)',
        blur: Math.max(12, 30 * scaleFactor),
        offsetX: 0,
        offsetY: 0,
      };
  }
}

function calculateBlurLayerGeometry(blurRadius: number) {
  const clampedBlur = Math.max(2, Math.min(60, blurRadius));
  const overflow = clampedBlur * 1.5;
  return { blurPx: clampedBlur, overflow };
}

function calculateCoverCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let sWidth = srcWidth;
  let sHeight = srcHeight;
  let sx = 0;
  let sy = 0;

  if (srcRatio > targetRatio) {
    sWidth = Math.floor(srcHeight * targetRatio);
    sx = Math.floor((srcWidth - sWidth) / 2);
  } else {
    sHeight = Math.floor(srcWidth / targetRatio);
    sy = Math.floor((srcHeight - sHeight) / 2);
  }

  return { sx, sy, sWidth, sHeight };
}

// CRC-32 Reference Calculation for verification
const crcTable: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createCompositorZipTestSuite(): TestSuiteRunner {
  const suite = new TestSuiteRunner('Compositor & ZIP Packaging Unit Tests', 'unit');

  suite.test('Dimension Scaling: Preserves aspect ratio when dimensions exceed maxResolution', () => {
    // 4000 x 2000 with max 2048 -> width becomes 2048, height becomes 1024
    const scaled = computeBoundingDimensions(4000, 2000, 2048);
    expect(scaled.width).toBe(2048);
    expect(scaled.height).toBe(1024);

    // 1500 x 3000 with max 1024 -> height becomes 1024, width becomes 512
    const scaledPortrait = computeBoundingDimensions(1500, 3000, 1024);
    expect(scaledPortrait.height).toBe(1024);
    expect(scaledPortrait.width).toBe(512);

    // 800 x 600 with max 2048 -> remains unchanged
    const unchanged = computeBoundingDimensions(800, 600, 2048);
    expect(unchanged.width).toBe(800);
    expect(unchanged.height).toBe(600);
  });

  suite.test('Resolution Bounds: Clamps targetMax between 512 and 4096', () => {
    // If user provides 100, clamped to 512
    const minClamp = computeBoundingDimensions(1000, 1000, 100);
    expect(minClamp.width).toBe(512);
    expect(minClamp.height).toBe(512);

    // If user provides 10000, clamped to 4096
    const maxClamp = computeBoundingDimensions(8000, 8000, 10000);
    expect(maxClamp.width).toBe(4096);
    expect(maxClamp.height).toBe(4096);
  });

  suite.test('Gradient Trigonometry: Accurately calculates linear gradient vector endpoints across multiple angles', () => {
    // 1000 x 1000 canvas
    // 180° (top to bottom)
    const g180 = calculateGradientEndpoints(1000, 1000, 180);
    expect(Math.round(g180.x0)).toBe(500);
    expect(Math.round(g180.y0)).toBe(0);
    expect(Math.round(g180.x1)).toBe(500);
    expect(Math.round(g180.y1)).toBe(1000);

    // 90° (left to right)
    const g90 = calculateGradientEndpoints(1000, 1000, 90);
    expect(Math.round(g90.x0)).toBe(0);
    expect(Math.round(g90.y0)).toBe(500);
    expect(Math.round(g90.x1)).toBe(1000);
    expect(Math.round(g90.y1)).toBe(500);

    // 135° (top-left to bottom-right diagonal)
    const g135 = calculateGradientEndpoints(1000, 1000, 135);
    expect(g135.x0).toBeLessThan(500);
    expect(g135.y0).toBeLessThan(500);
    expect(g135.x1).toBeGreaterThan(500);
    expect(g135.y1).toBeGreaterThan(500);
  });

  suite.test('Shadow Calculation: Computes responsive shadow scale factors and offsets for modern light palette', () => {
    const shadowSoft = computeShadowParameters('soft', 2000, 2000);
    expect(shadowSoft !== null).toBe(true);
    expect(shadowSoft?.color).toBe('rgba(15, 23, 42, 0.12)');
    expect(shadowSoft?.blur).toBe(40); // 20 * 2
    expect(shadowSoft?.offsetY).toBe(24); // 12 * 2

    const shadowStudio = computeShadowParameters('studio', 1500, 1500);
    expect(shadowStudio !== null).toBe(true);
    expect(shadowStudio?.color).toBe('rgba(15, 23, 42, 0.20)');
    expect(shadowStudio?.blur).toBe(36); // 24 * 1.5
    expect(shadowStudio?.offsetY).toBe(45); // 30 * 1.5

    const shadowNeon = computeShadowParameters('neon', 1000, 1000);
    expect(shadowNeon?.color).toBe('rgba(37, 99, 235, 0.40)');
    expect(shadowNeon?.blur).toBe(30);
    expect(shadowNeon?.offsetX).toBe(0);
    expect(shadowNeon?.offsetY).toBe(0);

    const shadowNone = computeShadowParameters('none', 1000, 1000);
    expect(shadowNone).toBeNull();
  });

  suite.test('Custom Background & Blur Math: Calculates cover crop offsets and anti-edge blur overflows', () => {
    // 1. Cover crop for a wide custom background (1920x1080) onto a square canvas (1080x1080)
    const crop = calculateCoverCrop(1920, 1080, 1080, 1080);
    expect(crop.sHeight).toBe(1080);
    expect(crop.sWidth).toBe(1080);
    expect(crop.sx).toBe(420); // (1920 - 1080) / 2
    expect(crop.sy).toBe(0);

    // 2. Blur overflow geometry
    const blurGeo = calculateBlurLayerGeometry(16);
    expect(blurGeo.blurPx).toBe(16);
    expect(blurGeo.overflow).toBe(24); // 16 * 1.5

    const blurClamped = calculateBlurLayerGeometry(100);
    expect(blurClamped.blurPx).toBe(60);
    expect(blurClamped.overflow).toBe(90);
  });

  suite.test('CRC32 Checksum Algorithm: Matches standard IEEE 802.3 test vectors', () => {
    const encoder = new TextEncoder();

    // Standard test vector: "123456789" -> 0xCBF43926 (3421780262)
    const standardVector = encoder.encode('123456789');
    const crc1 = calculateCrc32(standardVector);
    expect(crc1).toBe(0xcbf43926);

    // Empty string -> 0x00000000
    const emptyVector = new Uint8Array(0);
    const crcEmpty = calculateCrc32(emptyVector);
    expect(crcEmpty).toBe(0);

    // "The quick brown fox jumps over the lazy dog" -> 0x414FA339 (1095769913)
    const foxVector = encoder.encode('The quick brown fox jumps over the lazy dog');
    const crcFox = calculateCrc32(foxVector);
    expect(crcFox).toBe(0x414fa339);
  });

  suite.test('ZIP Packaging: Creates valid multi-file ZIP binary structure in memory', async () => {
    const encoder = new TextEncoder();
    const file1Data = encoder.encode('Hello Background Remover Pro');
    const file2Data = encoder.encode('{"jobId": "job_123", "status": "completed"}');

    const file1Blob = new Blob([file1Data], { type: 'text/plain' });
    const file2Blob = new Blob([file2Data], { type: 'application/json' });

    const zipBlob = await createZipArchive([
      { name: 'hello.txt', blob: file1Blob },
      { name: 'metadata.json', blob: file2Blob },
    ]);

    expect(zipBlob.type).toBe('application/zip');
    expect(zipBlob.size).toBeGreaterThan(0);

    // Inspect raw binary headers
    const arrayBuffer = await zipBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    // 1. Verify Local File Header 1 Signature (PK\x03\x04 = 0x04034b50)
    const localSig1 = view.getUint32(0, true);
    expect(localSig1).toBe(0x04034b50);

    // Verify filename length in local header 1
    const name1Len = view.getUint16(26, true);
    expect(name1Len).toBe('hello.txt'.length);

    // Verify uncompressed size in local header 1
    const size1 = view.getUint32(22, true);
    expect(size1).toBe(file1Data.length);

    // 2. Scan for End of Central Directory Record Signature (PK\x05\x06 = 0x06054b50)
    let foundEOCD = false;
    let totalEntries = 0;

    for (let i = 0; i <= bytes.length - 22; i++) {
      if (view.getUint32(i, true) === 0x06054b50) {
        foundEOCD = true;
        totalEntries = view.getUint16(i + 8, true);
        break;
      }
    }

    expect(foundEOCD).toBe(true);
    expect(totalEntries).toBe(2);
  });

  return suite;
}

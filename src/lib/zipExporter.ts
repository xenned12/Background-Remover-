/**
 * Lightweight Zero-Dependency Client-Side ZIP Generator
 * Builds standard ZIP archive (PK0304 / PK0102 / PK0506) in memory
 * Compatible with macOS Archive Utility, Windows Explorer, 7-Zip, Linux unzip.
 */

interface ZipFileEntry {
  name: string;
  blob: Blob;
  lastModified?: Date;
}

// CRC32 Lookup Table
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

function dateToDosDateTime(d: Date): { time: number; date: number } {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((d.getSeconds() >> 1) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

export async function createZipArchive(files: ZipFileEntry[]): Promise<Blob> {
  const parts: Uint8Array[] = [];
  const centralDirectoryHeaders: Uint8Array[] = [];
  let offset = 0;

  const encoder = new TextEncoder();

  for (const file of files) {
    const arrayBuffer = await file.blob.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const fileNameBytes = encoder.encode(file.name);
    const crc = calculateCrc32(fileBytes);
    const size = fileBytes.length;
    const { time, date } = dateToDosDateTime(file.lastModified || new Date());

    // Local File Header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true); // Local file header signature
    localView.setUint16(4, 20, true); // Version needed to extract (2.0)
    localView.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8 filename)
    localView.setUint16(8, 0, true); // Compression method (0 = store / uncompressed)
    localView.setUint16(10, time, true); // Last mod file time
    localView.setUint16(12, date, true); // Last mod file date
    localView.setUint32(14, crc, true); // CRC-32
    localView.setUint32(18, size, true); // Compressed size
    localView.setUint32(22, size, true); // Uncompressed size
    localView.setUint16(26, fileNameBytes.length, true); // File name length
    localView.setUint16(28, 0, true); // Extra field length
    localHeader.set(fileNameBytes, 30);

    parts.push(localHeader);
    parts.push(fileBytes);

    // Central Directory Header (46 bytes + name length)
    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true); // Central file header signature
    centralView.setUint16(4, 20, true); // Version made by
    centralView.setUint16(6, 20, true); // Version needed to extract
    centralView.setUint16(8, 0x0800, true); // General purpose bit flag (UTF-8)
    centralView.setUint16(10, 0, true); // Compression method (0 = store)
    centralView.setUint16(12, time, true); // Last mod file time
    centralView.setUint16(14, date, true); // Last mod file date
    centralView.setUint32(16, crc, true); // CRC-32
    centralView.setUint32(20, size, true); // Compressed size
    centralView.setUint32(24, size, true); // Uncompressed size
    centralView.setUint16(28, fileNameBytes.length, true); // File name length
    centralView.setUint16(30, 0, true); // Extra field length
    centralView.setUint16(32, 0, true); // File comment length
    centralView.setUint16(34, 0, true); // Disk number start
    centralView.setUint16(36, 0, true); // Internal file attributes
    centralView.setUint32(38, 0, true); // External file attributes
    centralView.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(fileNameBytes, 46);

    centralDirectoryHeaders.push(centralHeader);

    offset += localHeader.length + fileBytes.length;
  }

  const centralDirectoryOffset = offset;
  let centralDirectorySize = 0;
  for (const ch of centralDirectoryHeaders) {
    parts.push(ch);
    centralDirectorySize += ch.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, files.length, true); // Total entries on this disk
  eocdView.setUint16(10, files.length, true); // Total entries in central directory
  eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // Comment length

  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: 'application/zip' });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

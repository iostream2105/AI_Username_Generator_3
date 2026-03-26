import { toBlob } from 'html-to-image';

export async function exportPosterBlob(node: HTMLElement) {
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 1.35,
    backgroundColor: '#f5f1e8',
  });

  if (!blob) {
    throw new Error('POSTER_EXPORT_FAILED');
  }

  return blob;
}

export function buildPosterFileName(name: string) {
  const normalized = String(name || 'mingyouyi')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 32);
  return `名有意-${normalized || 'poster'}.png`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.target = '_blank';
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, 60000);
}

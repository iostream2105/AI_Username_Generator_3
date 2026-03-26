import { toBlob } from 'html-to-image';

export interface PosterSharePayload {
  blob: Blob;
  fileName: string;
  title: string;
  text: string;
  url?: string;
}

export async function exportPosterBlob(node: HTMLElement) {
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 2.5,
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

export async function sharePosterFile({ blob, fileName, title, text, url }: PosterSharePayload) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    throw new Error('WEB_SHARE_UNSUPPORTED');
  }

  const file = new File([blob], fileName, { type: blob.type || 'image/png' });
  const fileShareData: ShareData = {
    files: [file],
    title,
    text,
  };

  if (typeof navigator.canShare === 'function' && navigator.canShare(fileShareData)) {
    await navigator.share(fileShareData);
    return 'file';
  }

  const textShareData: ShareData = {
    title,
    text: [text, url].filter(Boolean).join('\n'),
  };

  await navigator.share(textShareData);
  return 'text';
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

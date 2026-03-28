import { toBlob } from 'html-to-image';

export async function exportPosterBlob(node: HTMLElement) {
  // 预览节点会为移动端缩放，这里始终导出独立的高清节点，保证保存图片质量稳定。
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
  // 文件名需要去掉系统不允许的字符，避免不同平台保存失败。
  const normalized = String(name || 'mingyouyi')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 32);
  return `名有意-${normalized || 'poster'}.png`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  // 下载链接延迟释放，给移动端浏览器一点时间完成保存动作。
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

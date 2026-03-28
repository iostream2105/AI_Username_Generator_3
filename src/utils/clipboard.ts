export async function copyText(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // 优先走现代剪贴板 API；不少手机浏览器会暴露接口但写入失败，所以还要保留旧方案兜底。
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some mobile browsers expose the API but still reject the write.
    }
  }

  return legacyCopyText(text);
}

function legacyCopyText(text: string): boolean {
  // 用隐藏 textarea 模拟选中复制，兼容不支持 navigator.clipboard 的移动端浏览器。
  const textarea = document.createElement('textarea');
  const selection = window.getSelection();
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  textarea.style.fontSize = '16px';

  document.body.appendChild(textarea);

  try {
    textarea.focus({ preventScroll: true });
  } catch {
    textarea.focus();
  }
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);

  if (selection) {
    selection.removeAllRanges();
    if (previousRange) {
      selection.addRange(previousRange);
    }
  }

  if (activeElement) {
    try {
      activeElement.focus({ preventScroll: true });
    } catch {
      activeElement.focus();
    }
  }

  return copied;
}

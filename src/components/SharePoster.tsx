import React, { forwardRef } from 'react';
import { GeneratedName } from '../types';

type NameMode = 'cn' | 'en' | 'mix';

interface SharePosterProps {
  item: Pick<GeneratedName, 'name' | 'meaning_title' | 'meaning_desc' | 'style_tags'>;
  keywords: string[];
  meaning?: string;
  nameMode: NameMode;
  siteUrl?: string;
  className?: string;
}

const MODE_LABELS: Record<NameMode, string> = {
  cn: '中文网名',
  en: '英文网名',
  mix: '中英混合网名',
};

export const SharePoster = forwardRef<HTMLDivElement, SharePosterProps>(function SharePoster(
  {
    item,
    keywords,
    meaning,
    nameMode,
    siteUrl = 'mingyouyi.cn',
    className = '',
  },
  ref
) {
  const displayKeywords = keywords.filter(Boolean).slice(0, 2);

  return (
    <div
      ref={ref}
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[32px] bg-[#f5f1e8] text-brand-900 ${className}`}
    >
      <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-[#e7dfc8]" />
      <div className="absolute bottom-10 right-[-28px] h-36 w-36 rounded-full bg-[#ddd4bc]" />

      <div className="relative flex h-full flex-col justify-between p-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-brand-800/45">MINGYOUYI</p>
              <h2 className="mt-2 font-serif text-2xl tracking-wide">名有意</h2>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-brand-800/75">
              {MODE_LABELS[nameMode]}
            </span>
          </div>

          <div className="mt-8 rounded-[28px] bg-white/85 p-5 shadow-[0px_8px_30px_rgba(0,0,0,0.06)]">
            <p className="text-xs uppercase tracking-[0.28em] text-brand-800/35">专属结果</p>
            <h3 className="mt-3 break-words font-serif text-[34px] leading-tight tracking-tight text-brand-900">
              {item.name}
            </h3>
            <div className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-900">
              {item.meaning_title}
            </div>
            <p className="mt-4 text-sm leading-7 text-brand-800/80">{item.meaning_desc}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] bg-white/75 p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-800/35">输入灵感</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {displayKeywords.length > 0 ? (
                displayKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-brand-900/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-900"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="text-sm text-brand-800/60">来自名有意的专属灵感卡</span>
              )}
              {meaning ? (
                <span className="rounded-full border border-brand-900/10 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-900">
                  {meaning}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[24px] bg-[#5A5A40] p-4 text-white shadow-[0px_10px_30px_rgba(90,90,64,0.24)]">
            <div className="flex flex-wrap gap-2">
              {item.style_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/12 px-3 py-1 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-white/86">
              把你的缩写、生日和情绪，变成一个有寓意、像你的专属网名。
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/78">
              <span>立即体验</span>
              <span>{siteUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

import React, { forwardRef } from 'react';
import { GeneratedName } from '../types';

type NameMode = 'cn' | 'en' | 'mix';

interface SharePosterProps {
  item: Pick<GeneratedName, 'name' | 'meaning_title' | 'meaning_desc' | 'style_tags'>;
  keywords: string[];
  meaning?: string;
  nameMode: NameMode;
  siteUrl?: string;
  variant?: 'preview' | 'export';
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
    variant = 'preview',
    className = '',
  },
  ref
) {
  const displayKeywords = keywords.filter(Boolean).slice(0, 2);
  const displayTags = item.style_tags.slice(0, 3);
  const isExport = variant === 'export';
  const posterNameLength = Array.from(item.name || '').length;

  const posterNameClassName = isExport
    ? posterNameLength > 20
      ? 'text-[56px] leading-[1.05]'
      : posterNameLength > 14
        ? 'text-[66px] leading-[1.06]'
        : 'text-[74px] leading-[1.04]'
    : posterNameLength > 20
      ? 'text-[28px] leading-[1.08]'
      : posterNameLength > 14
        ? 'text-[32px] leading-[1.08]'
        : 'text-[34px] leading-tight';

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-[32px] bg-[#f5f1e8] text-brand-900 ${isExport ? 'w-[960px] min-h-[1280px]' : 'w-full min-h-[620px]'} ${className}`}
    >
      <div className={`absolute rounded-full bg-[#e7dfc8] ${isExport ? '-left-14 top-14 h-44 w-44' : '-left-10 top-10 h-28 w-28'}`} />
      <div className={`absolute rounded-full bg-[#ddd4bc] ${isExport ? 'bottom-14 right-[-40px] h-56 w-56' : 'bottom-10 right-[-28px] h-36 w-36'}`} />

      <div className={`relative flex h-full flex-col justify-between ${isExport ? 'min-h-[1280px] p-10' : 'min-h-[620px] p-6'}`}>
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`${isExport ? 'text-[14px]' : 'text-[10px]'} uppercase tracking-[0.32em] text-brand-800/45`}>MINGYOUYI</p>
              <h2 className={`mt-2 font-serif tracking-wide ${isExport ? 'text-5xl' : 'text-2xl'}`}>名有意</h2>
            </div>
            <span className={`rounded-full bg-white/80 font-medium text-brand-800/75 ${isExport ? 'px-5 py-2 text-lg' : 'px-3 py-1 text-[11px]'}`}>
              {MODE_LABELS[nameMode]}
            </span>
          </div>

          <div className={`bg-white/85 shadow-[0px_8px_30px_rgba(0,0,0,0.06)] ${isExport ? 'mt-10 rounded-[36px] p-8' : 'mt-8 rounded-[28px] p-5'}`}>
            <p className={`${isExport ? 'text-base' : 'text-xs'} uppercase tracking-[0.28em] text-brand-800/35`}>专属结果</p>
            <h3 className={`mt-3 break-words font-serif tracking-tight text-brand-900 ${posterNameClassName}`}>
              {item.name}
            </h3>
            <div className={`mt-4 inline-flex rounded-full bg-brand-50 font-medium text-brand-900 ${isExport ? 'px-5 py-2.5 text-[26px]' : 'px-3 py-1.5 text-sm'}`}>
              {item.meaning_title}
            </div>
            <p className={`${isExport ? 'mt-6 text-[26px] leading-[1.9]' : 'mt-4 text-sm leading-7'} text-brand-800/80`}>
              {item.meaning_desc}
            </p>
          </div>
        </div>

        <div className={isExport ? 'space-y-5' : 'space-y-4'}>
          <div className={`rounded-[24px] bg-white/75 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] ${isExport ? 'p-6' : 'p-4'}`}>
            <p className={`${isExport ? 'text-sm' : 'text-xs'} uppercase tracking-[0.24em] text-brand-800/35`}>输入关键词 / 寓意方向</p>
            <div className={`mt-3 flex flex-wrap ${isExport ? 'gap-3' : 'gap-2'}`}>
              {displayKeywords.length > 0 ? (
                displayKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className={`rounded-full border border-brand-900/10 bg-white font-medium text-brand-900 ${isExport ? 'px-4 py-2 text-lg' : 'px-3 py-1.5 text-xs'}`}
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className={`${isExport ? 'text-lg' : 'text-sm'} text-brand-800/60`}>来自名有意的专属灵感卡</span>
              )}
              {meaning ? (
                <span className={`rounded-full border border-brand-900/10 bg-brand-50 font-medium text-brand-900 ${isExport ? 'px-4 py-2 text-lg' : 'px-3 py-1.5 text-xs'}`}>
                  {meaning}
                </span>
              ) : null}
            </div>
          </div>

          <div className={`rounded-[24px] bg-[#5A5A40] text-white shadow-[0px_10px_30px_rgba(90,90,64,0.24)] ${isExport ? 'p-6' : 'p-4'}`}>
            <div className={`flex flex-wrap ${isExport ? 'gap-3' : 'gap-2'}`}>
              {displayTags.map((tag) => (
                <span key={tag} className={`rounded-full bg-white/12 ${isExport ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-xs'}`}>
                  #{tag}
                </span>
              ))}
            </div>
            <p className={`${isExport ? 'mt-5 text-xl leading-9' : 'mt-4 text-sm leading-6'} text-white/86`}>
              把你的缩写、生日和情绪，变成一个有寓意、像你的专属网名。
            </p>
            <div className={`mt-4 flex items-center justify-between gap-3 text-white/78 ${isExport ? 'text-base' : 'text-xs'}`}>
              <span>立即体验</span>
              <span className="font-medium tracking-[0.08em] text-white">{siteUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

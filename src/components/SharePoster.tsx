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

const SITE_DESCRIPTION = '把你的缩写、生日和情绪，变成一个有寓意、像你的专属网名。';
const SITE_SCENES = '适合 QQ / 微信昵称、小红书 / 抖音昵称、游戏 ID 或英文社媒名。';

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
  const isExport = variant === 'export';
  const displayKeywords = keywords.filter(Boolean).slice(0, 2);
  const displayTags = item.style_tags.filter(Boolean).slice(0, 3);
  const posterNameLength = Array.from(item.name || '').length;
  const posterNameClassName = isExport
    ? posterNameLength > 20
      ? 'text-[54px] leading-[1.08]'
      : posterNameLength > 14
        ? 'text-[62px] leading-[1.06]'
        : 'text-[70px] leading-[1.04]'
    : posterNameLength > 20
      ? 'text-[27px] leading-[1.08]'
      : posterNameLength > 14
        ? 'text-[31px] leading-[1.08]'
        : 'text-[35px] leading-[1.04]';

  const shellPadding = isExport ? 'p-10' : 'p-6';
  const shellGap = isExport ? 'gap-5' : 'gap-4';
  const resultCardPadding = isExport ? 'p-8' : 'p-5';
  const subCardPadding = isExport ? 'p-6' : 'p-4';
  const roundedCard = isExport ? 'rounded-[34px]' : 'rounded-[24px]';
  const chipClassName = isExport ? 'px-4 py-2 text-lg' : 'px-3 py-1.5 text-xs';

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-[32px] bg-[#f5f1e8] text-brand-900 ${isExport ? 'w-[960px]' : 'w-full'} ${className}`}
    >
      <div className={`absolute rounded-full bg-[#e7dfc8] ${isExport ? '-left-14 top-10 h-44 w-44' : '-left-10 top-8 h-28 w-28'}`} />
      <div className={`absolute rounded-full bg-[#ddd4bc] ${isExport ? 'bottom-10 right-[-36px] h-56 w-56' : 'bottom-8 right-[-26px] h-32 w-32'}`} />

      <div className={`relative flex flex-col ${shellGap} ${shellPadding}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`${isExport ? 'text-[14px]' : 'text-[10px]'} uppercase tracking-[0.32em] text-brand-800/45`}>MINGYOUYI</p>
            <h2 className={`mt-2 font-serif tracking-wide ${isExport ? 'text-5xl' : 'text-2xl'}`}>名有意</h2>
          </div>
          <span className={`rounded-full bg-white/80 font-medium text-brand-800/75 ${isExport ? 'px-5 py-2 text-lg' : 'px-3 py-1 text-[11px]'}`}>
            {MODE_LABELS[nameMode]}
          </span>
        </div>

        <div className={`${roundedCard} bg-white/88 shadow-[0px_8px_30px_rgba(0,0,0,0.06)] ${resultCardPadding}`}>
          <p className={`${isExport ? 'text-base' : 'text-xs'} uppercase tracking-[0.28em] text-brand-800/35`}>专属结果</p>
          <h3 className={`mt-3 break-words font-serif tracking-tight text-brand-900 ${posterNameClassName}`}>
            {item.name}
          </h3>
          <div className={`mt-4 inline-flex rounded-full bg-brand-50 font-medium text-brand-900 ${isExport ? 'px-5 py-2.5 text-[26px]' : 'px-3 py-1.5 text-sm'}`}>
            {item.meaning_title}
          </div>
          <p className={`${isExport ? 'mt-6 text-[26px] leading-[1.8]' : 'mt-4 text-sm leading-7'} text-brand-800/82`}>
            {item.meaning_desc}
          </p>
          {displayTags.length > 0 ? (
            <div className={`mt-5 flex flex-wrap ${isExport ? 'gap-3' : 'gap-2'}`}>
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full bg-brand-50/90 font-medium text-brand-900 ${isExport ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-xs'}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`${roundedCard} bg-white/78 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] ${subCardPadding}`}>
          <p className={`${isExport ? 'text-sm' : 'text-xs'} uppercase tracking-[0.24em] text-brand-800/35`}>输入关键词 / 寓意方向</p>
          <div className={`mt-3 flex flex-wrap ${isExport ? 'gap-3' : 'gap-2'}`}>
            {displayKeywords.length > 0 ? (
              displayKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className={`rounded-full border border-brand-900/10 bg-white font-medium text-brand-900 ${chipClassName}`}
                >
                  {keyword}
                </span>
              ))
            ) : (
              <span className={`${isExport ? 'text-lg' : 'text-sm'} text-brand-800/60`}>来自名有意的专属灵感卡</span>
            )}
            {meaning ? (
              <span className={`rounded-full border border-brand-900/10 bg-brand-50 font-medium text-brand-900 ${chipClassName}`}>
                {meaning}
              </span>
            ) : null}
          </div>
        </div>

        <div className={`${roundedCard} bg-[#5A5A40] text-white shadow-[0px_10px_30px_rgba(90,90,64,0.24)] ${subCardPadding}`}>
          <p className={`${isExport ? 'text-[20px] leading-9' : 'text-sm leading-6'} text-white/92`}>
            {SITE_DESCRIPTION}
          </p>
          <p className={`${isExport ? 'mt-4 text-base leading-8' : 'mt-3 text-xs leading-5'} text-white/72`}>
            {SITE_SCENES}
          </p>
          <div className={`mt-4 flex items-center justify-between gap-3 text-white/80 ${isExport ? 'text-base' : 'text-xs'}`}>
            <span>立即体验</span>
            <span className="font-medium tracking-[0.08em] text-white">{siteUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Copy, RefreshCw, ChevronLeft, Bookmark, Check, ChevronDown, X, MessageSquare } from 'lucide-react';
import { addFavorite, fetchFavorites, generateNames, removeFavorite, submitFeedback, trackEvent } from './services/ai';
import { GeneratedName, GenerateParams } from './types';

type AppView = 'home' | 'loading' | 'results' | 'favorites';
type HistoryView = 'home' | 'results' | 'favorites';
type NameMode = 'cn' | 'en' | 'mix';

const NAME_MODE_OPTIONS: Array<{ value: NameMode; label: string }> = [
  { value: 'cn', label: '中文网名' },
  { value: 'en', label: '英文名字' },
  { value: 'mix', label: '中英混合' },
];

// 首页可选标签：参与生成请求，也用于筛选埋点
const MEANING_TAGS = ['向上蜕变', '内心安定', '自由探索', '温暖联结'];
const STYLE_TAGS_BY_MODE: Record<NameMode, string[]> = {
  cn: ['诗意文艺', '现代简洁', '古风雅致', '梦幻灵动'],
  en: ['现代简洁（国际感）', '柔和诗意（英文感）', '个性锋利（酷感）', '复古经典（旧电影感）'],
  mix: ['中英平衡', '中文主导（英文点缀）', '英文主导（中文点缀）', '潮流辨识（社交ID感）'],
};

const MODE_HINTS: Record<NameMode, { keywordHint: string; title: string; subtitle: string }> = {
  cn: {
    keywordHint: '可输入姓名缩写、生日月份、喜欢的事物等等你想要融入的元素',
    title: '为你定制的网名',
    subtitle: 'AI 定制示例',
  },
  en: {
    keywordHint: '可输入英文词、缩写、生日月份等，建议用 1-3 个关键词',
    title: '为你定制的英文名字',
    subtitle: 'English 示例',
  },
  mix: {
    keywordHint: '可输入中文词 + 英文词/缩写，帮助生成更有辨识度的混合名字',
    title: '为你定制的中英混合名字',
    subtitle: 'Mix 示例',
  },
};

const MODE_EXAMPLES: Record<NameMode, Array<{ name: string; input: string; descTitle: string; desc: string }>> = {
  cn: [
    {
      name: '仲阶闻',
      input: 'zjw、8月',
      descTitle: '仲月清韵感：',
      desc: '取zjw的首字母谐音，“仲”对应8月作为仲夏之末的时序，阶前听风落桂的闲静意象，适配喜欢松弛氛围感的表达',
    },
    {
      name: '知年桂',
      input: 'ZN、桂花、温柔',
      descTitle: '岁时桂香的温柔沉淀：',
      desc: '“zn”谐音“知年”，桂花开落知年岁，每年如约而至的桂香藏着时光沉淀的柔和感，很适合喜欢沉静温柔气质的用户',
    },
  ],
  en: [
    {
      name: 'Mossline',
      input: 'M、October、calm',
      descTitle: '自然感与克制感：',
      desc: '以 moss 的自然意象做底色，搭配 line 的简洁边界感，整体更现代、易记且有英文社交场景的适配度。',
    },
    {
      name: 'Aster Vale',
      input: 'A、星、自由',
      descTitle: '轻盈探索感：',
      desc: 'Aster 带有星点与光感，Vale 增加空间纵深，名字读感顺滑，适合表达自由与温和的个人气质。',
    },
  ],
  mix: [
    {
      name: '汐 Nova',
      input: '海、Nova、成长',
      descTitle: '流动与新生并置：',
      desc: '中文“汐”保留东方意象，Nova 提供英文新星感，整体兼顾记忆点与社交平台辨识度。',
    },
    {
      name: 'Luna见野',
      input: 'Luna、见、自由',
      descTitle: '中英节奏平衡：',
      desc: 'Luna 提供柔和月光氛围，“见野”增强开放探索感，组合后更像一个有情绪线索的混合ID。',
    },
  ],
};

const UNSATISFIED_REASONS = ['风格不对', '不够像我', '有点普通', '不好记'];
const USER_KEY_STORAGE = 'ai_nicknames_user_key';
const SESSION_KEY_STORAGE = 'ai_nicknames_session_key';
const LOADING_STAGE_TEXTS = ['正在理解关键词...','正在为你寻找灵感...', '正在创作...', '正在润色...'];
let homeExposureTrackedInRuntime = false;

function createLocalId() {
  // 仅用于前端渲染 key，不作为业务主键
  return Math.random().toString(36).substring(2, 10);
}

function getOrCreateUserKey() {
  // userKey 跨会话复用，承担“同一用户”归因
  const existing = localStorage.getItem(USER_KEY_STORAGE);
  if (existing) return existing;

  const generated = `u_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem(USER_KEY_STORAGE, generated);
  return generated;
}

function getOrCreateSessionKey() {
  // sessionId 仅在当前标签页生命周期内有效，用于区分一次访问会话
  const existing = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (existing) return existing;

  const generated = `s_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  sessionStorage.setItem(SESSION_KEY_STORAGE, generated);
  return generated;
}

function createGenerationId() {
  // 每次生成请求分配一个批次 ID，用于关联结果/埋点/反馈
  return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

const CustomSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => {
  // 局部展开态；值本身由父组件托管（受控组件）
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      {/* 触发器按钮：展示当前值或占位文案 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-none rounded-2xl pl-4 pr-10 py-3.5 text-sm text-brand-900 text-left focus:ring-2 focus:ring-brand-800/20 shadow-[0px_2px_10px_rgba(0,0,0,0.02)] transition-all outline-none flex items-center justify-between"
      >
        <span className={value ? "text-brand-900" : "text-brand-900/50"}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`text-brand-800/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 点击遮罩关闭下拉 */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-brand-900/5 overflow-hidden py-2"
            >
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${!value ? 'text-brand-900 font-medium bg-brand-50/50' : 'text-brand-800/70'}`}
              >
                {placeholder}
              </button>
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${value === opt ? 'text-brand-900 font-medium bg-brand-50/50' : 'text-brand-800/70'}`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  // 页面主状态机：home -> loading -> results / favorites
  const [view, setView] = useState<AppView>('home');
  const [nameMode, setNameMode] = useState<NameMode>('cn');
  
  // 输入区状态：关键词 + 寓意标签 + 风格标签
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [meaning, setMeaning] = useState('');
  const [style, setStyle] = useState('');
  
  // 结果区状态：生成结果、收藏、复制提示、反馈态
  const [results, setResults] = useState<GeneratedName[]>([]);
  const [favorites, setFavorites] = useState<GeneratedName[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userKey] = useState<string>(() => getOrCreateUserKey());
  const [sessionId] = useState<string>(() => getOrCreateSessionKey());
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [satisfactionStatus, setSatisfactionStatus] = useState<'idle' | 'unsatisfied_selecting' | 'satisfied' | 'unsatisfied_submitted'>('idle');
  const [satisfactionSubmitting, setSatisfactionSubmitting] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [isKeywordComposing, setIsKeywordComposing] = useState(false);
  const styleOptions = STYLE_TAGS_BY_MODE[nameMode];
  const modeHints = MODE_HINTS[nameMode];
  const modeExamples = MODE_EXAMPLES[nameMode];

  // 统一视图切换：同步 React 视图与浏览器 history，保障系统返回键可按层级回退
  const navigateToView = (nextView: AppView, mode: 'push' | 'replace' | 'none' = 'push') => {
    setView(nextView);

    if (typeof window === 'undefined' || mode === 'none') return;
    if (nextView === 'loading') return;

    const state = { app: 'mingyouyi', appView: nextView as HistoryView };
    const currentView = window.history.state?.appView as HistoryView | undefined;

    if (mode === 'replace') {
      window.history.replaceState(state, '');
      return;
    }

    if (currentView !== nextView) {
      window.history.pushState(state, '');
    }
  };

  const goBackInApp = () => {
    // 优先回退浏览器历史；若没有历史栈则兜底回首页
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateToView('home', 'replace');
    }
  };

  // 前端埋点统一出口，避免各处重复拼接用户/会话字段
  const fireTrack = (eventName: string, payload: Partial<{
    page_name: string;
    generation_id: string;
    keywords_count: number;
    meaning_tag: string;
    style_tag: string;
    result_rank: number;
    result_name: string;
    is_success: boolean;
    latency_ms: number;
    error_code: string;
    properties: Record<string, unknown>;
  }> = {}) => {
    const mergedProperties = {
      name_mode: nameMode,
      ...(payload.properties || {}),
    };

    // 埋点失败只打印日志，不影响主流程交互
    void trackEvent({
      event_name: eventName,
      user_key: userKey,
      session_id: sessionId,
      ...payload,
      properties: mergedProperties,
    }).catch((e) => {
      console.error(`Track ${eventName} failed`, e);
    });
  };

  useEffect(() => {
    if (!style) return;
    if (!styleOptions.includes(style)) {
      setStyle('');
    }
  }, [style, styleOptions]);

  useEffect(() => {
    // React StrictMode 在开发环境会触发双挂载，这里做一次运行时去重，避免曝光重复上报
    if (homeExposureTrackedInRuntime) return;
    homeExposureTrackedInRuntime = true;
    fireTrack('home_exposure', { page_name: 'home' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.history.state?.appView) {
      window.history.replaceState({ app: 'mingyouyi', appView: 'home' }, '');
    }

    // 监听系统返回：从 history state 还原应用内视图，而不是直接退出页面
    const onPopState = (event: PopStateEvent) => {
      const nextView = event.state?.appView as HistoryView | undefined;
      setFeedbackModalOpen(false);

      if (nextView === 'home' || nextView === 'results' || nextView === 'favorites') {
        setView(nextView);
      } else {
        setView('home');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 生成加载态分阶段提示：降低用户“卡住不动”的等待焦虑
  useEffect(() => {
    if (view !== 'loading') {
      setLoadingStageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStageIndex((prev) => Math.min(prev + 1, LOADING_STAGE_TEXTS.length - 1));
    }, 2200);

    return () => window.clearInterval(timer);
  }, [view]);
  
  // 启动时从后端拉取收藏，保持多端刷新后状态一致
  useEffect(() => {
    let mounted = true;

    const loadFavorites = async () => {
      // mounted 守卫：避免卸载后 setState 触发告警
      try {
        const items = await fetchFavorites(userKey);
        if (!mounted) return;

        setFavorites(items.map((item) => ({
          id: createLocalId(),
          name: item.name,
          meaning_title: item.meaning_title,
          meaning_desc: item.meaning_desc,
          style_tags: item.style_tags || [],
        })));
      } catch (e) {
        console.error('Failed to load favorites from API', e);
      }
    };

    void loadFavorites();

    return () => {
      mounted = false;
    };
  }, [userKey]);
  
  const handleGenerate = async () => {
    // 若输入框尚有未确认文本，点击生成时会自动并入关键词
    let finalKeywords = [...keywords];
    if (keywordInput.trim() && finalKeywords.length < 3) {
      finalKeywords.push(keywordInput.trim());
      setKeywords(finalKeywords);
      setKeywordInput('');
    }
    
    // 至少需要一个关键词才允许发起生成
    if (finalKeywords.length === 0) return;

    // 每次生成分配独立 generationId，用于关联结果、收藏和埋点
    const generationId = createGenerationId();
    setCurrentGenerationId(generationId);
    setSatisfactionStatus('idle');
    setLoadingStageIndex(0);
    
    setView('loading');
    try {
      // keywords 统一拼接后交给后端解析，保持请求结构简洁
      const params: GenerateParams = {
        keywords: finalKeywords.join('、'),
        nameMode,
        userKey,
        sessionId,
        generationId,
      };
      if (meaning) params.meaning = meaning;
      if (style) params.style = style;

      const response = await generateNames(params);

      // 结果项附带 result_rank / generation_id，供收藏/复制埋点关联统计
      setCurrentGenerationId(response.generation_id || generationId);
      setResults(
        response.items.map((n, idx) => ({
          ...n,
          id: createLocalId(),
          result_rank: idx + 1,
          generation_id: response.generation_id || generationId,
        }))
      );
      navigateToView('results');
    } catch (error) {
      console.error("Generation failed", error);
      alert("生成失败，请稍后重试");
      navigateToView('home', 'replace');
    }
  };

  // 结果页满意度反馈（满意/不满意+原因）
  const submitSatisfaction = async (satisfactionValue: 'satisfied' | 'unsatisfied', reasonTag = '') => {
    if (satisfactionSubmitting) return;
    setSatisfactionSubmitting(true);
    try {
      await submitFeedback({
        userKey,
        sessionId,
        feedbackType: 'satisfaction',
        satisfactionValue,
        reasonTag,
        pageName: 'results',
        generationId: currentGenerationId,
      });
      setSatisfactionStatus(satisfactionValue === 'satisfied' ? 'satisfied' : 'unsatisfied_submitted');
    } catch (e) {
      console.error('Submit satisfaction failed', e);
      alert('反馈提交失败，请稍后重试');
    } finally {
      setSatisfactionSubmitting(false);
    }
  };

  // 全局建议反馈弹层提交
  const submitGeneralFeedback = async () => {
    const text = feedbackText.trim();
    if (!text || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      await submitFeedback({
        userKey,
        sessionId,
        feedbackType: 'general',
        content: text,
        pageName: view,
        generationId: currentGenerationId || '',
      });
      setFeedbackText('');
      setFeedbackModalOpen(false);
      // 使用轻提示替代 alert，避免打断用户操作流
      setFeedbackNotice({ type: 'success', text: '感谢反馈，我们已收到你的建议。' });
      setTimeout(() => setFeedbackNotice(null), 2200);
    } catch (e) {
      console.error('Submit general feedback failed', e);
      setFeedbackNotice({ type: 'error', text: '反馈提交失败，请稍后重试。' });
      setTimeout(() => setFeedbackNotice(null), 2200);
    } finally {
      setFeedbackSubmitting(false);
    }
  };
  
  // 收藏状态与后端保持一致，避免只在本地内存变更导致刷新丢失
  const toggleFavorite = async (name: GeneratedName) => {
    // 以 name 作为收藏判重键，前后端保持同一规则
    const exists = favorites.some(f => f.name === name.name);

    try {
      if (exists) {
        await removeFavorite(userKey, name.name);
        setFavorites(prev => prev.filter(f => f.name !== name.name));
      } else {
        await addFavorite(userKey, {
          name: name.name,
          meaning_title: name.meaning_title,
          meaning_desc: name.meaning_desc,
          style_tags: name.style_tags || [],
        });
        setFavorites(prev => [name, ...prev]);
        fireTrack('click_favorite', {
          page_name: view,
          generation_id: name.generation_id || currentGenerationId,
          result_rank: name.result_rank || 0,
          result_name: name.name,
        });
      }
    } catch (e) {
      console.error('Favorite action failed', e);
      alert('收藏操作失败，请稍后重试');
    }
  };
  
  // 复制后记录具体结果序号，便于后端统计 copied_count
  const copyToClipboard = async (item: GeneratedName) => {
    try {
      await navigator.clipboard.writeText(item.name);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      fireTrack('click_copy', {
        page_name: view,
        generation_id: item.generation_id || currentGenerationId,
        result_rank: item.result_rank || 0,
        result_name: item.name,
      });
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const commitKeywordsFromText = (rawText: string) => {
    // 关键词标准化入口：兼容空白符、中文逗号、英文逗号、顿号
    const parts = rawText
      .split(/[\s,，、]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return;
    }

    // 最多 3 个且去重；仅新增词触发 input_keywords 埋点
    const next = [...keywords];
    const accepted: string[] = [];
    for (const part of parts) {
      if (next.length >= 3) break;
      if (next.includes(part)) continue;
      next.push(part);
      accepted.push(part);
    }

    if (accepted.length > 0) {
      setKeywords(next);
      accepted.forEach((kw, idx) => {
        fireTrack('input_keywords', {
          page_name: 'home',
          properties: { keyword: kw, keyword_count: keywords.length + idx + 1 },
        });
      });
    }
  };

  const addKeyword = () => {
    // Enter/空格/失焦等统一走该函数，保证分词行为一致
    commitKeywordsFromText(keywordInput);
    setKeywordInput('');
  };

  const handleKeywordInputChange = (rawValue: string) => {
    // iOS 输入中会逐字符提交，只有在“明确结束输入”时才拆词，避免错分
    if (isKeywordComposing) {
      setKeywordInput(rawValue);
      return;
    }

    if (/[\s,，、]$/.test(rawValue)) {
      commitKeywordsFromText(rawValue);
      setKeywordInput('');
      return;
    }

    setKeywordInput(rawValue);
  };

  const removeKeyword = (index: number) => {
    // 删除指定下标关键词
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isKeywordComposing) return;
    // Enter/空格/逗号快速分词；空输入时 Backspace 删除最后一个已选关键词
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',' || e.key === '，') {
      e.preventDefault();
      addKeyword();
    } else if (e.key === 'Backspace' && keywordInput === '' && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1));
    }
  };

  const isFavorite = (nameStr: string) => favorites.some(f => f.name === nameStr);

  // 结果卡片在结果页和收藏页复用，避免重复 UI 结构
  const renderCard = (item: GeneratedName) => (
    <motion.div 
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[32px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] mb-4"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-serif text-3xl font-medium tracking-tight text-brand-900">{item.name}</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => copyToClipboard(item)}
            className="p-2 rounded-full bg-brand-50 text-brand-800 hover:bg-brand-100 transition-colors"
          >
            {copiedId === item.id ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button 
            onClick={() => toggleFavorite(item)}
            className={`p-2 rounded-full transition-colors ${isFavorite(item.name) ? 'bg-rose-50 text-rose-500' : 'bg-brand-50 text-brand-800 hover:bg-brand-100'}`}
          >
            <Heart size={18} fill={isFavorite(item.name) ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <span className="text-sm font-medium text-brand-900 bg-brand-50 px-3 py-1 rounded-full">
          {item.meaning_title}
        </span>
      </div>
      
      <p className="text-brand-800/80 text-sm leading-relaxed mb-4">
        {item.meaning_desc}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {item.style_tags.map((tag, idx) => (
          <span key={idx} className="text-xs text-brand-800/60 uppercase tracking-wider">
            # {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center z-10">
        <div className="font-serif font-medium text-lg tracking-wide text-brand-900">
          名有意
        </div>
        <button 
          onClick={() => navigateToView('favorites')}
          aria-label="打开我的收藏"
          title="我的收藏"
          className="px-3 py-1.5 text-brand-800 hover:bg-black/5 rounded-full transition-colors flex items-center gap-1.5 text-sm"
        >
          <Bookmark size={20} />
          <span className="text-xs font-medium text-brand-800/80">我的收藏</span>
        </button>
      </header>

      <main className="flex-1 px-6 pb-24 overflow-y-auto z-10">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            // 首页：输入关键词 + 选择偏好 + 示例 + 发起生成
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="pt-4"
            >
              <h1 className="font-serif text-[clamp(20px,6.8vw,30px)] leading-[1.35] mb-4 text-brand-900">
                <span className="block">AI 深度解析你的特质，</span>
                <span className="block">定制独一无二的专属网名。</span>
              </h1>
              <p className="text-brand-800/70 mb-10 text-[clamp(11px,3.5vw,14px)] leading-[1.6]">
                <span className="block">
                  不仅是一个代号，更是你的个性表达。输入关键词，AI 将结合文学意象与情感共鸣，为你深度创作。
                </span>
              </p>

              <div className="space-y-8">
                {/* Name Mode */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-brand-900">
                    生成模式 <span className="text-brand-800/50 font-normal">(必选)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {NAME_MODE_OPTIONS.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setNameMode(mode.value)}
                        className={`rounded-xl py-2 text-xs font-medium transition-colors ${
                          nameMode === mode.value
                            ? 'bg-[#5A5A40] text-white'
                            : 'bg-white text-brand-800 border border-brand-900/10 hover:bg-brand-50'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-brand-900">
                    关键词 <span className="text-brand-800/50 font-normal">(必填，1-3个)</span>
                  </label>
                  <div className="w-full bg-white border-none rounded-2xl px-4 py-3 min-h-[56px] flex flex-wrap items-center gap-2 shadow-[0px_2px_10px_rgba(0,0,0,0.02)] transition-all focus-within:ring-2 focus-within:ring-brand-800/20">
                    {keywords.map((kw, idx) => (
                      <span key={idx} className="bg-brand-50 text-brand-900 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 font-medium">
                        {kw}
                        <button 
                          onClick={() => removeKeyword(idx)} 
                          className="text-brand-800/40 hover:text-brand-800 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    {keywords.length < 3 && (
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => handleKeywordInputChange(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        onCompositionStart={() => setIsKeywordComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsKeywordComposing(false);
                          handleKeywordInputChange(e.currentTarget.value);
                        }}
                        onBlur={addKeyword}
                        placeholder={keywords.length === 0 ? "输入后按空格或回车添加" : "继续输入..."}
                        className="flex-1 bg-transparent border-none outline-none text-brand-900 placeholder:text-brand-800/30 min-w-[120px] text-sm"
                      />
                    )}
                  </div>
                  <p className="text-[clamp(11px,2.7vw,11px)] text-brand-800/50 whitespace-nowrap">{modeHints.keywordHint}</p>
                </div>

                {/* Meaning & Style Dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-brand-900">
                      期望寓意 <span className="text-brand-800/50 font-normal">(选填)</span>
                    </label>
                    <CustomSelect 
                      value={meaning} 
                      onChange={(val) => {
                        setMeaning(val);
                        fireTrack('select_meaning', { page_name: 'home', meaning_tag: val || '' });
                      }} 
                      options={MEANING_TAGS} 
                      placeholder="不限寓意" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-brand-900">
                      偏好风格 <span className="text-brand-800/50 font-normal">(选填)</span>
                    </label>
                    <CustomSelect 
                      value={style} 
                      onChange={(val) => {
                        setStyle(val);
                        fireTrack('select_style', { page_name: 'home', style_tag: val || '' });
                      }} 
                      options={styleOptions} 
                      placeholder="不限风格" 
                    />
                  </div>
                </div>
              </div>

              {/* Examples Section */}
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-[1px] flex-1 bg-brand-900/10"></div>
                  <span className="text-xs font-medium text-brand-800/40 uppercase tracking-widest">{modeHints.subtitle}</span>
                  <div className="h-[1px] flex-1 bg-brand-900/10"></div>
                </div>
                
                <div className="space-y-3">
                  {modeExamples.map((example) => (
                    <div key={example.name} className="bg-white/40 rounded-2xl p-4 border border-white/60">
                      <div className="flex justify-between items-end mb-2">
                        <div className="font-serif text-lg text-brand-900">{example.name}</div>
                        <div className="text-[10px] text-brand-800/60 bg-white/60 px-2 py-1 rounded-md">{example.input}</div>
                      </div>
                      <p className="text-xs text-brand-800/70 leading-relaxed">
                        <span className="font-medium text-brand-900">{example.descTitle}</span>{example.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={handleGenerate}
                  disabled={keywords.length === 0 && !keywordInput.trim()}
                  className="w-full bg-[#5A5A40] text-white rounded-full py-4 font-medium tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A4A30] transition-colors shadow-lg shadow-[#5A5A40]/20"
                >
                  <Sparkles size={18} />
                  立即生成
                </button>
              </div>
            </motion.div>
          )}

          {/* loading 作为中间态，不入 history，防止返回键落在无意义页面 */}
          {view === 'loading' && (
            // 加载页：仅用于等待反馈，不纳入 history 独立层级
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh]"
            >
              <div className="w-16 h-16 border-4 border-brand-800/20 border-t-brand-800 rounded-full animate-spin mb-6"></div>
              <p className="font-serif text-brand-900 text-lg">{LOADING_STAGE_TEXTS[loadingStageIndex]}</p>
              <p className="text-brand-800/50 text-sm mt-2">这可能需要几秒钟</p>
            </motion.div>
          )}

          {view === 'results' && (
            // 结果页：展示生成结果，并提供复制/收藏/满意度反馈
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-brand-900">{modeHints.title}</h2>
                <span className="text-sm text-brand-800/50">{results.length} 个结果</span>
              </div>
              
              <div className="space-y-4">
                {results.map(renderCard)}
              </div>

              {/* 结果页轻量反馈模块：用于快速收集主观满意度 */}
              <div className="mt-6 bg-white rounded-2xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
                <p className="text-sm text-brand-900 mb-3 font-medium">这组名字你满意吗？</p>
                {satisfactionStatus === 'idle' && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => void submitSatisfaction('satisfied')}
                        disabled={satisfactionSubmitting}
                        className="flex-1 bg-brand-50 text-brand-900 rounded-xl py-2.5 text-sm hover:bg-brand-100 transition-colors disabled:opacity-50"
                      >
                        满意
                      </button>
                      <button
                        onClick={() => setSatisfactionStatus('unsatisfied_selecting')}
                        disabled={satisfactionSubmitting}
                        className="flex-1 bg-brand-50 text-brand-900 rounded-xl py-2.5 text-sm hover:bg-brand-100 transition-colors disabled:opacity-50"
                      >
                        不满意
                      </button>
                    </div>
                  </div>
                )}

                {satisfactionStatus === 'unsatisfied_selecting' && (
                  <div className="space-y-3">
                    <p className="text-xs text-brand-800/70">告诉我们原因，帮助我们做得更好：</p>
                    <div className="flex flex-wrap gap-2">
                      {UNSATISFIED_REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => void submitSatisfaction('unsatisfied', reason)}
                          disabled={satisfactionSubmitting}
                          className="text-xs px-3 py-1.5 rounded-full bg-brand-50 text-brand-900 hover:bg-brand-100 transition-colors disabled:opacity-50"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {satisfactionStatus === 'satisfied' && (
                  <p className="text-sm text-emerald-600">收到，谢谢你的肯定。</p>
                )}

                {satisfactionStatus === 'unsatisfied_submitted' && (
                  <p className="text-sm text-brand-800/80">已收到你的反馈，我们会继续优化。</p>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => {
                    fireTrack('back_modify', {
                      page_name: 'results',
                      generation_id: currentGenerationId,
                    });
                    goBackInApp();
                  }}
                  className="flex-1 bg-white text-brand-900 rounded-full py-4 font-medium flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors border border-brand-900/10"
                >
                  <ChevronLeft size={18} />
                  重新编辑
                </button>
                <button
                  onClick={() => {
                    fireTrack('click_regenerate', {
                      page_name: 'results',
                      generation_id: currentGenerationId,
                      keywords_count: keywords.length + (keywordInput.trim() ? 1 : 0),
                      meaning_tag: meaning || '',
                      style_tag: style || '',
                    });
                    void handleGenerate();
                  }}
                  className="flex-1 bg-[#5A5A40] text-white rounded-full py-4 font-medium flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-colors shadow-lg shadow-[#5A5A40]/20"
                >
                  <RefreshCw size={18} />
                  换一批
                </button>
              </div>
            </motion.div>
          )}

          {view === 'favorites' && (
            // 收藏页：复用结果卡片，支持返回与空态展示
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pt-4"
            >
              <div className="mb-6 flex items-center gap-3">
                <button 
                  onClick={goBackInApp}
                  className="p-2 -ml-2 text-brand-800 hover:bg-black/5 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-serif text-2xl text-brand-900">我的收藏</h2>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-20">
                  <Heart size={48} className="mx-auto text-brand-800/20 mb-4" />
                  <p className="text-brand-800/50">还没有收藏任何网名</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map(renderCard)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 全局反馈入口：在任意页面都可提交建议 */}
      <button
        onClick={() => setFeedbackModalOpen(true)}
        className="fixed right-6 bottom-8 z-20 bg-[#5A5A40] text-white px-4 py-2.5 rounded-full shadow-lg shadow-[#5A5A40]/20 flex items-center gap-2 text-sm"
      >
        <MessageSquare size={16} />
        意见反馈
      </button>

      {/* 提交建议后的轻提示，不阻断当前操作 */}
      <AnimatePresence>
        {feedbackModalOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setFeedbackModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed z-40 left-4 right-4 bottom-6 bg-white rounded-2xl p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-brand-900">意见反馈</p>
                <button onClick={() => setFeedbackModalOpen(false)} className="p-1 text-brand-800/60">
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="告诉我们你的建议或遇到的问题..."
                className="w-full min-h-[110px] rounded-xl border border-brand-900/10 p-3 text-sm outline-none focus:ring-2 focus:ring-brand-800/20 resize-none"
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => setFeedbackModalOpen(false)}
                  className="flex-1 bg-brand-50 text-brand-900 rounded-xl py-2.5 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => void submitGeneralFeedback()}
                  disabled={!feedbackText.trim() || feedbackSubmitting}
                  className="flex-1 bg-[#5A5A40] text-white rounded-xl py-2.5 text-sm disabled:opacity-50"
                >
                  提交
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2.5 rounded-full text-sm shadow-lg ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {feedbackNotice.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

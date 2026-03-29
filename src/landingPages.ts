import type { NameMode } from './types';

export interface LandingModeExample {
  name: string;
  input: string;
  descTitle: string;
  desc: string;
}

export interface LandingValueProp {
  title: string;
  desc: string;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export interface LandingPageMeta {
  title: string;
  description: string;
  keywords: string[];
  canonicalPath: string;
}

export interface LandingHero {
  eyebrow: string;
  titleLines: string[];
  description: string;
}

export interface LandingSceneSection {
  title: string;
  description: string;
  scenes: string[];
}

export interface LandingKeywordSuggestion {
  label: string;
  keywords: string[];
  meaning?: string;
  mode?: NameMode;
}

export interface LandingPageConfig {
  key: string;
  path: string;
  analyticsPageName: string;
  navLabel: string;
  navBadge: string;
  navDescription: string;
  defaultNameMode: NameMode;
  meta: LandingPageMeta;
  hero: LandingHero;
  heroHighlights: string[];
  keywordLabel: string;
  keywordHint: string;
  keywordPlaceholder: string;
  keywordPlaceholderFilled: string;
  keywordSuggestionsTitle: string;
  keywordSuggestions: LandingKeywordSuggestion[];
  modeRecommendation: string;
  examplesTitle: string;
  generateButtonLabel: string;
  sceneSection: LandingSceneSection;
  valuePropsTitle: string;
  valueProps: LandingValueProp[];
  faqTitle: string;
  faqItems: LandingFaqItem[];
  modeExamples: Record<NameMode, LandingModeExample[]>;
}

const BASE_MODE_EXAMPLES: Record<NameMode, LandingModeExample[]> = {
  cn: [
    {
      name: '月渡星桥',
      input: '月亮、自由探索',
      descTitle: '清逸浪漫：',
      desc: '勾勒出月光漫过星子点缀的桥畔夜景，自带缥缈出尘的诗意与温柔氛围感。',
    },
    {
      name: '砚池听松',
      input: '月亮、治愈安定',
      descTitle: '雅静悠然：',
      desc: '以砚池映松影的清寂画面，传递出沉静内敛、不逐浮华的文人气质。',
    },
  ],
  en: [
    {
      name: 'Lumiere Vey',
      input: '月亮、治愈安定',
      descTitle: '暖光归处：',
      desc: '像傍晚巷口晕开的暖黄灯光，自带温柔治愈的松弛感，适合想要氛围感英文名的人。',
    },
    {
      name: 'Elowen Gray',
      input: '月亮、清冷高级',
      descTitle: '静谧高级：',
      desc: '带着低饱和、安静且有距离感的审美气质，很适合主页名字和英文社媒名。',
    },
  ],
  mix: [
    {
      name: '泽空·Zephyr',
      input: 'zk、自由探索',
      descTitle: '风过旷野的清寂：',
      desc: '中文和英文意象一致，既有清冷感，也有小众高级的辨识度。',
    },
    {
      name: '栀葵·Zinnia',
      input: 'zk、治愈安定',
      descTitle: '花野里的鲜活：',
      desc: '明亮却不浮夸，适合想要自然、轻盈、带一点氛围感的中英混合昵称。',
    },
  ],
};

function withModeExamples(
  overrides: Partial<Record<NameMode, LandingModeExample[]>>
): Record<NameMode, LandingModeExample[]> {
  return {
    cn: overrides.cn ?? BASE_MODE_EXAMPLES.cn,
    en: overrides.en ?? BASE_MODE_EXAMPLES.en,
    mix: overrides.mix ?? BASE_MODE_EXAMPLES.mix,
  };
}

const HOME_VALUE_PROPS: LandingValueProp[] = [
  {
    title: '不是随机拼词',
    desc: '结合你的缩写、生日、情绪和期待寓意，让名字更像你，而不是模板化随机结果。',
  },
  {
    title: '每个名字都有解释',
    desc: '不只给你一个词，还会告诉你这个名字背后的意象、气质和适合表达的状态。',
  },
  {
    title: '适合直接拿去用',
    desc: '适配微信、小红书、游戏和英文社媒等常见场景，生成后可以立即复制、收藏、换一批。',
  },
];

const HOME_FAQ_ITEMS: LandingFaqItem[] = [
  {
    question: '输入什么样的关键词更容易出好结果？',
    answer: '建议优先输入姓名缩写、生日月份、愿望词、情绪词或你想表达的气质，比如“zk、7月”“自由、海”“治愈、桂花”。',
  },
  {
    question: '支持哪些名字类型？',
    answer: '当前支持中文网名、英文网名和中英混合网名，适合做 QQ / 微信昵称、小红书 / 抖音昵称、游戏 ID 或英文社媒名。',
  },
  {
    question: '生成的名字会不会很普通？',
    answer: '名有意会尽量把你的输入和寓意方向一起理解，再输出名字、寓意标题和解释，目标是让结果更有辨识度、更像你。',
  },
  {
    question: '如果这批结果不满意怎么办？',
    answer: '你可以直接换一批，也可以返回调整关键词或寓意方向；如果仍然不满意，还可以在结果页提交反馈帮助我们优化。',
  },
];

export const HOME_LANDING_PAGE: LandingPageConfig = {
  key: 'home',
  path: '/',
  analyticsPageName: 'home',
  navLabel: 'AI 网名生成器首页',
  navBadge: '通用入口',
  navDescription: '适合先从通用入口开始，按场景继续分流到微信昵称、小红书昵称、英文网名和游戏 ID 页面。',
  defaultNameMode: 'cn',
  meta: {
    title: '名有意 | AI网名生成器，生成有寓意、像你的专属网名',
    description: '名有意是一款 AI 网名生成器。输入缩写、生日、情绪或愿望词，快速生成中文网名、英文网名和中英混合昵称，每个结果都附带寓意解释。',
    keywords: ['AI网名生成器', '网名生成器', '昵称生成器', '英文网名', '微信昵称', '小红书昵称', '游戏ID'],
    canonicalPath: '/',
  },
  hero: {
    eyebrow: 'AI 寓意网名生成器',
    titleLines: ['把你的缩写、生日和情绪，', '生成成一个有寓意、像你的专属网名。'],
    description:
      '输入 1-2 个关键词，快速获得 3 个适合 QQ / 微信昵称、小红书 / 抖音昵称、游戏 ID 或英文社媒名的结果，每个都附带寓意解释。',
  },
  heroHighlights: ['支持中文 / 英文 / 中英混合', '每个名字都附寓意解释', '适合微信 / 小红书 / 游戏场景'],
  keywordLabel: '你的个人线索',
  keywordHint: '推荐输入缩写、月份、情绪词或意象词，1-2 个就够，更容易生成像你的名字。',
  keywordPlaceholder: '例如 zk、7月 或 月亮、治愈',
  keywordPlaceholderFilled: '再补一个词会更像你',
  keywordSuggestionsTitle: '不知道怎么写？试试这些输入',
  keywordSuggestions: [
    { label: 'zk + 7月', keywords: ['zk', '7月'], meaning: '治愈安定', mode: 'cn' },
    { label: '月亮 + 清醒', keywords: ['月亮', '清醒'], meaning: '自由探索', mode: 'mix' },
    { label: '海 + 松弛', keywords: ['海', '松弛'], meaning: '治愈安定', mode: 'en' },
  ],
  modeRecommendation: '不确定时先试中文；想更有辨识度，再试英文或中英混合。',
  examplesTitle: '结果示例',
  generateButtonLabel: '生成专属网名',
  sceneSection: {
    title: '适合这些起名场景',
    description:
      '如果你正在找 QQ / 微信昵称、想换一个更有辨识度的小红书或抖音昵称、想做游戏 ID，或者想要一个高级感英文社媒名，这里都可以作为灵感入口。',
    scenes: ['QQ 昵称', '微信昵称', '小红书昵称', '抖音昵称', '游戏 ID', '英文社媒名'],
  },
  valuePropsTitle: '为什么大家会喜欢名有意',
  valueProps: HOME_VALUE_PROPS,
  faqTitle: '常见问题',
  faqItems: HOME_FAQ_ITEMS,
  modeExamples: BASE_MODE_EXAMPLES,
};

export const WECHAT_LANDING_PAGE: LandingPageConfig = {
  key: 'wechat-nickname',
  path: '/wechat-nickname',
  analyticsPageName: 'wechat_nickname',
  navLabel: '微信昵称生成器',
  navBadge: '熟人社交',
  navDescription: '更适合找低调耐看、适合熟人社交和长期使用的微信昵称。',
  defaultNameMode: 'cn',
  meta: {
    title: '微信昵称生成器 | AI生成有寓意、像你的微信昵称 - 名有意',
    description: '想换一个更像你的微信昵称？输入缩写、生日、情绪或愿望词，快速生成适合微信场景的有寓意昵称，结果自带解释，低调耐看又有辨识度。',
    keywords: ['微信昵称', '微信昵称生成器', '有寓意的微信昵称', '小众微信昵称', 'AI微信昵称生成器'],
    canonicalPath: '/wechat-nickname',
  },
  hero: {
    eyebrow: 'AI 微信昵称生成器',
    titleLines: ['想换一个更像你的微信昵称，', '可以先把缩写、生日和情绪输进去。'],
    description:
      '输入 1-2 个关键词，快速获得适合微信昵称、熟人社交展示和长期使用场景的有寓意名字，每个结果都附带解释。',
  },
  heroHighlights: ['更适合长期挂着的微信昵称', '优先低调耐看，不尴尬', '推荐从缩写 / 月份 / 情绪开始'],
  keywordLabel: '你想放进微信昵称里的线索',
  keywordHint: '先输缩写、月份或情绪词，更容易得到耐看的微信昵称。',
  keywordPlaceholder: '例如 zk、10月 或 月亮、松弛',
  keywordPlaceholderFilled: '再补一个词，会更像你平时会用的微信昵称',
  keywordSuggestionsTitle: '直接试试这些微信昵称输入',
  keywordSuggestions: [
    { label: 'zk + 10月', keywords: ['zk', '10月'], meaning: '治愈安定', mode: 'cn' },
    { label: '月亮 + 松弛', keywords: ['月亮', '松弛'], meaning: '治愈安定', mode: 'cn' },
    { label: '海 + 清醒', keywords: ['海', '清醒'], meaning: '成长进阶', mode: 'mix' },
  ],
  modeRecommendation: '微信昵称优先试中文；想更有辨识度，再切到中英混合。',
  examplesTitle: '微信昵称示例',
  generateButtonLabel: '生成微信昵称',
  sceneSection: {
    title: '适合这些微信昵称场景',
    description:
      '如果你想找一个低调耐看、不尴尬、能在熟人社交里长期使用的微信昵称，这一页会更适合你直接开始。',
    scenes: ['微信昵称', '熟人社交', '低调耐看', '温柔气质', '清冷风格', '重新开始'],
  },
  valuePropsTitle: '为什么这页更适合找微信昵称',
  valueProps: [
    {
      title: '更适合长期使用',
      desc: '优先围绕“低调耐看、不过度用力、适合熟人场景”来理解昵称气质。',
    },
    {
      title: '输入个人线索会更像你',
      desc: '缩写、月份、情绪词这种输入方式，比直接搜“好听昵称”更容易得到有个人感的结果。',
    },
    {
      title: '看名字，也看解释',
      desc: '每个结果都带寓意说明，方便你判断它是不是你愿意在微信里长期挂着的名字。',
    },
  ],
  faqTitle: '微信昵称常见问题',
  faqItems: [
    {
      question: '微信昵称更适合选中文还是中英混合？',
      answer: '如果你想要更稳妥、更耐看，优先试中文模式；如果你想要更有辨识度，也可以试试中英混合模式。',
    },
    {
      question: '输入什么关键词更容易得到耐看的微信昵称？',
      answer: '推荐输入缩写、生日月份、情绪词和愿望词，例如“zk、7月”“治愈、海”“清醒、月亮”。',
    },
    {
      question: '如果想要更低调一点的微信昵称，应该怎么输？',
      answer: '可以多用“安静、清醒、松弛、月亮、风、山、云”这类低刺激的词，结果通常会更耐看。',
    },
    {
      question: '如果这组微信昵称不满意怎么办？',
      answer: '你可以直接换一批，也可以保留原本的个人线索，只替换情绪或愿望词继续试。',
    },
  ],
  modeExamples: withModeExamples({
    cn: [
      {
        name: '时安',
        input: '10月、治愈安定',
        descTitle: '时光安暖顺遂：',
        desc: '适合微信场景里那种不喧哗、但很耐看的名字，温润、安静，也不会显得刻意。',
      },
      {
        name: '渡川',
        input: '海、清醒坚定',
        descTitle: '从容笃定：',
        desc: '像一个走过很多路却仍然稳稳往前的人，气质沉静，也很适合做熟人社交昵称。',
      },
    ],
  }),
};

export const XHS_LANDING_PAGE: LandingPageConfig = {
  key: 'xiaohongshu-nickname',
  path: '/xiaohongshu-nickname',
  analyticsPageName: 'xiaohongshu_nickname',
  navLabel: '小红书昵称生成器',
  navBadge: '主页名字',
  navDescription: '更适合找主页昵称、人设号名字和更有辨识度的小红书账号名。',
  defaultNameMode: 'mix',
  meta: {
    title: '小红书昵称生成器 | AI生成高辨识度主页昵称 - 名有意',
    description: '想换一个更有辨识度的小红书昵称？输入缩写、生日、情绪或愿望词，快速生成适合主页、人设号和内容账号的昵称灵感，支持中文、英文和中英混合。',
    keywords: ['小红书昵称', '小红书昵称生成器', '主页昵称', '小红书名字', 'AI小红书昵称'],
    canonicalPath: '/xiaohongshu-nickname',
  },
  hero: {
    eyebrow: 'AI 小红书昵称生成器',
    titleLines: ['想要一个更有辨识度的主页名字，', '先从小红书昵称开始。'],
    description:
      '输入 1-2 个关键词，快速获得适合小红书主页、人设号、内容账号和英文社媒名场景的昵称灵感，每个结果都附带寓意解释。',
  },
  heroHighlights: ['适合主页名字和内容账号', '默认更推荐中英混合', '更强调氛围感和辨识度'],
  keywordLabel: '你希望主页名字带上的感觉',
  keywordHint: '推荐把缩写、月份、情绪词和意象词组合着输，更容易出主页感。',
  keywordPlaceholder: '例如 zk、自由 或 月亮、清醒',
  keywordPlaceholderFilled: '再补一个词，会更像一个主页名字',
  keywordSuggestionsTitle: '试试这些更适合主页昵称的输入',
  keywordSuggestions: [
    { label: 'zk + 自由', keywords: ['zk', '自由'], meaning: '自由探索', mode: 'mix' },
    { label: '月亮 + 清醒', keywords: ['月亮', '清醒'], meaning: '成长进阶', mode: 'mix' },
    { label: '7月 + 治愈', keywords: ['7月', '治愈'], meaning: '治愈安定', mode: 'en' },
  ],
  modeRecommendation: '做主页昵称时优先试中英混合；做英文内容号可直接切英文模式。',
  examplesTitle: '小红书昵称示例',
  generateButtonLabel: '生成小红书昵称',
  sceneSection: {
    title: '适合这些小红书昵称场景',
    description:
      '如果你在找一个更像自己、也更适合主页展示的小红书昵称，这一页会比通用首页更直接，尤其适合内容账号和风格化主页。',
    scenes: ['小红书昵称', '主页名字', '人设号昵称', '清冷氛围感', '小众高级', '英文社媒名'],
  },
  valuePropsTitle: '为什么这页更适合做主页昵称',
  valueProps: [
    {
      title: '优先考虑辨识度',
      desc: '内容账号和主页名字更需要“让人记住”，所以这里更强调氛围感、小众感和辨识度。',
    },
    {
      title: '中英混合更容易出高级感',
      desc: '对小红书主页来说，中英混合和英文模式往往更容易做出审美感和账号记忆点。',
    },
    {
      title: '结果适合直接截图分享',
      desc: '昵称 + 寓意解释本身就适合做主页灵感合集，也方便你筛选更贴近账号气质的名字。',
    },
  ],
  faqTitle: '小红书昵称常见问题',
  faqItems: [
    {
      question: '小红书昵称更适合中文、英文还是中英混合？',
      answer: '想要更稳妥可以先试中文，想要更有辨识度和审美感，优先试中英混合或英文模式。',
    },
    {
      question: '什么样的输入更适合小红书主页昵称？',
      answer: '推荐用缩写、月份、情绪词和意象词组合，例如“zk、自由”“7月、治愈”“月亮、清醒”。',
    },
    {
      question: '如果我做的是穿搭/日常/英文内容账号，应该怎么选？',
      answer: '穿搭和审美类账号更适合中英混合，英文内容账号优先试英文模式，日常号则可以先从中文开始。',
    },
    {
      question: '怎样避免主页昵称太像模板？',
      answer: '尽量不要只输“高级、温柔”这种泛词，叠加缩写、月份、情绪和具体意象，结果会更像你。',
    },
  ],
  modeExamples: withModeExamples({
    mix: [
      {
        name: '泽空·Zephyr',
        input: 'zk、自由探索',
        descTitle: '清冷氛围感：',
        desc: '很适合做主页名字，既有画面，又不会太重，非常符合小红书偏爱的轻审美风格。',
      },
      {
        name: '竹珂·Kaelin',
        input: 'zk、治愈安定',
        descTitle: '温柔知性：',
        desc: '中文和英文意象顺着走，整体看起来会比单纯拼字母更高级，也更像一个账号名字。',
      },
    ],
  }),
};

export const ENGLISH_LANDING_PAGE: LandingPageConfig = {
  key: 'english-nickname',
  path: '/english-nickname',
  analyticsPageName: 'english_nickname',
  navLabel: '英文网名生成器',
  navBadge: '高级感英文名',
  navDescription: '更适合找英文主页名、小众英文昵称和带氛围感的英文网名。',
  defaultNameMode: 'en',
  meta: {
    title: '英文网名生成器 | AI生成高级感英文昵称 - 名有意',
    description: '想找一个高级感英文昵称？输入月亮、海、风、缩写或情绪词，快速生成适合社媒主页、英文网名和小众人设的英文名字，每个结果都带寓意解释。',
    keywords: ['英文网名', '英文网名生成器', '英文昵称', '高级感英文名', '小众英文名'],
    canonicalPath: '/english-nickname',
  },
  hero: {
    eyebrow: 'AI 英文网名生成器',
    titleLines: ['想找一个高级感英文昵称，', '不用再翻英文名大全了。'],
    description:
      '输入 1-2 个关键词，快速获得适合英文网名、社媒主页、英文人设和小众风格表达的名字结果，每个结果都附带寓意解释。',
  },
  heroHighlights: ['中文词也能生成英文昵称', '更适合主页和社媒展示', '默认推荐英文模式'],
  keywordLabel: '你想放进英文昵称里的感觉',
  keywordHint: '不会写英文提示词也没关系，直接输中文意象和情绪词就行。',
  keywordPlaceholder: '例如 月亮、治愈 或 海、清醒',
  keywordPlaceholderFilled: '再补一个词，会更容易出高级感英文昵称',
  keywordSuggestionsTitle: '试试这些英文昵称输入',
  keywordSuggestions: [
    { label: '月亮 + 治愈', keywords: ['月亮', '治愈'], meaning: '治愈安定', mode: 'en' },
    { label: '海 + 清醒', keywords: ['海', '清醒'], meaning: '成长进阶', mode: 'en' },
    { label: '风 + 浪漫', keywords: ['风', '浪漫'], meaning: '浪漫心动', mode: 'en' },
  ],
  modeRecommendation: '这页默认就适合英文模式；如果想要更特别，也可以切中英混合。',
  examplesTitle: '英文昵称示例',
  generateButtonLabel: '生成英文昵称',
  sceneSection: {
    title: '适合这些英文昵称场景',
    description:
      '如果你想找一个既不普通、也不模板化的英文昵称，这一页更适合直接开始，尤其适合社媒主页和风格化账号。',
    scenes: ['英文网名', '英文昵称', '社媒主页', '小众英文名', '高级感', '氛围感'],
  },
  valuePropsTitle: '为什么这页更适合做英文昵称',
  valueProps: [
    {
      title: '不只给常见英文名',
      desc: '这里更偏向意象感、气质感和画面感，而不是单纯从常见英文名列表里挑一个。',
    },
    {
      title: '适合社媒和主页表达',
      desc: '结果会更关注英文昵称在主页上的展示气质，适合内容账号和英文社媒名场景。',
    },
    {
      title: '可以用中文词来找英文名',
      desc: '即使你不会写英文提示词，也可以直接输入“月亮、海、风、治愈”这类中文关键词开始。',
    },
  ],
  faqTitle: '英文昵称常见问题',
  faqItems: [
    {
      question: '不会写英文关键词，也能生成英文昵称吗？',
      answer: '可以，直接输入中文关键词也行，比如“月亮、海、治愈”，系统会把它们转成英文名方向。',
    },
    {
      question: '怎样避免英文昵称太普通？',
      answer: '尽量不要只输入“好听、英文名”，而是输入具体意象和情绪词，这样更容易得到小众感结果。',
    },
    {
      question: '英文昵称更适合哪类平台？',
      answer: '适合英文社媒主页、小红书英文风格账号、游戏英文ID，以及想做轻人设表达的场景。',
    },
    {
      question: '如果想更高级一点，应该怎么输？',
      answer: '推荐用“月亮、海、风、灰调、松弛、清醒、浪漫”这类词，结果通常会更有氛围感。',
    },
  ],
  modeExamples: withModeExamples({
    en: [
      {
        name: 'Lumiere Vey',
        input: '月亮、治愈安定',
        descTitle: '暖光归处：',
        desc: '像傍晚巷口晕开的暖黄灯光，柔和、松弛，适合想要温柔高级感的人。',
      },
      {
        name: 'Soren Reed',
        input: '月亮、清冷高级',
        descTitle: '旷野松风：',
        desc: '带一点距离感和文艺气质，不会太常见，也很适合主页展示。',
      },
    ],
  }),
};

export const GAME_ID_LANDING_PAGE: LandingPageConfig = {
  key: 'game-id',
  path: '/game-id',
  analyticsPageName: 'game_id',
  navLabel: '游戏 ID 生成器',
  navBadge: '不撞名',
  navDescription: '更适合找不撞名、有记忆点、不过度中二的游戏昵称和圈层名字。',
  defaultNameMode: 'cn',
  meta: {
    title: '游戏ID生成器 | AI生成不撞名游戏昵称 - 名有意',
    description: '想要一个不撞名、不过度中二、又有记忆点的游戏 ID？输入缩写、夜色、海、风等关键词，快速生成适合游戏昵称和圈层身份表达的名字。',
    keywords: ['游戏ID', '游戏ID生成器', '游戏昵称', '不撞名游戏名字', 'AI游戏ID'],
    canonicalPath: '/game-id',
  },
  hero: {
    eyebrow: 'AI 游戏 ID 生成器',
    titleLines: ['游戏 ID 不想撞名，', '可以先把个人线索输进去。'],
    description:
      '输入 1-2 个关键词，快速获得适合游戏 ID、圈层昵称和高辨识度名字场景的结果，每个都附带寓意解释，方便你筛选更有记忆点的方向。',
  },
  heroHighlights: ['更偏不撞名和记忆点', '不过度中二，也不过于平', '适合游戏 ID / 战队昵称 / 圈层名'],
  keywordLabel: '你想放进游戏 ID 的线索',
  keywordHint: '推荐用缩写、意象词和状态词组合输入，更容易出不撞名的方向。',
  keywordPlaceholder: '例如 zk、夜色 或 海、清醒',
  keywordPlaceholderFilled: '再补一个词，会更容易出有记忆点的游戏 ID',
  keywordSuggestionsTitle: '试试这些更适合游戏 ID 的输入',
  keywordSuggestions: [
    { label: 'zk + 夜色', keywords: ['zk', '夜色'], meaning: '自由探索', mode: 'cn' },
    { label: '海 + 清醒', keywords: ['海', '清醒'], meaning: '成长进阶', mode: 'cn' },
    { label: '风 + 月亮', keywords: ['风', '月亮'], meaning: '浪漫心动', mode: 'mix' },
  ],
  modeRecommendation: '游戏 ID 先试中文更稳，再按你玩的品类切到英文或中英混合。',
  examplesTitle: '游戏 ID 示例',
  generateButtonLabel: '生成游戏 ID',
  sceneSection: {
    title: '适合这些游戏 ID 场景',
    description:
      '如果你想找一个不夸张、又不容易撞名的游戏 ID，这一页会更适合你直接开始，也适合战队名和圈层昵称的灵感获取。',
    scenes: ['游戏 ID', '不撞名', '战队昵称', '圈层昵称', '有记忆点', '风格化名字'],
  },
  valuePropsTitle: '为什么这页更适合找游戏 ID',
  valueProps: [
    {
      title: '优先考虑辨识度和记忆点',
      desc: '不是只给“看起来能用”的名字，而是尽量让结果更有独特感、更不容易撞名。',
    },
    {
      title: '不过度中二，也不过于平',
      desc: '更适合想要低调、有气质、但仍然能让人记住的游戏昵称场景。',
    },
    {
      title: '可以直接从意象和状态出发',
      desc: '夜色、海、风、山、月亮、清醒、自由，这类输入比“游戏名字推荐”更容易得到有辨识度的结果。',
    },
  ],
  faqTitle: '游戏 ID 常见问题',
  faqItems: [
    {
      question: '游戏 ID 更适合中文、英文还是中英混合？',
      answer: '想稳妥先试中文，想更有新鲜感可以再试英文或中英混合模式，不同游戏的风格适配也会不同。',
    },
    {
      question: '怎样更不容易撞名？',
      answer: '不要只输入“好听、帅气”，多加一个个人线索，比如缩写、月份或情绪词，辨识度会明显更高。',
    },
    {
      question: '怎样避免名字太中二？',
      answer: '多用“夜色、风、海、山、月亮”这类意象词，少用太直白的战斗类词，结果通常会更耐看。',
    },
    {
      question: '如果我还想做战队昵称，也能用吗？',
      answer: '可以，这一页的生成思路同样适合战队昵称和圈层名字的灵感获取。',
    },
  ],
  modeExamples: withModeExamples({
    cn: [
      {
        name: '云岫归',
        input: '夜色、自由探索',
        descTitle: '沉静淡然：',
        desc: '比起直接堆叠酷炫词，更像一个有故事感、也有辨识度的游戏 ID。',
      },
      {
        name: '松月渡',
        input: '夜色、清醒坚定',
        descTitle: '清冷风骨：',
        desc: '名字本身很有画面，又不会太重，适合想要低调但有记忆点的玩家。',
      },
    ],
  }),
};

export const LANDING_PAGES: LandingPageConfig[] = [
  HOME_LANDING_PAGE,
  WECHAT_LANDING_PAGE,
  XHS_LANDING_PAGE,
  ENGLISH_LANDING_PAGE,
  GAME_ID_LANDING_PAGE,
];

export function resolveLandingPage(pathname: string): LandingPageConfig {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return LANDING_PAGES.find((page) => page.path === normalizedPath) ?? HOME_LANDING_PAGE;
}

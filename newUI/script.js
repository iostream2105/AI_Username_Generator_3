const modeMap = {
  cn: "中文网名",
  en: "英文网名",
  mix: "中英混合"
};

const scenePresets = {
  "微信昵称": ["阿屿", "松弛感"],
  "小红书昵称": ["桂花", "氛围感"],
  "游戏 ID": ["夜航", "锋芒"],
  "英文社媒名": ["Luna", "August"]
};

const library = {
  cn: [
    {
      name: "昼穹客",
      tone: "轻盈旷野",
      title: "云间寻踪",
      desc: "像在高处风层里缓慢行走，既有探索欲，也保留一点与世界轻轻拉开的距离感。"
    },
    {
      name: "知年桂",
      tone: "温柔安定",
      title: "岁时留香",
      desc: "把时间感和花香感揉进同一个名字里，既熟悉又有一点被认真修饰过的高级感。"
    },
    {
      name: "望舒泽",
      tone: "克制浪漫",
      title: "星辉缓落",
      desc: "名字像月色落在水面，柔和但不软弱，适合想保留温润气质的人。"
    },
    {
      name: "听山迟",
      tone: "安静松弛",
      title: "向内留白",
      desc: "把山风、慢节奏和不急着解释自己的状态做进名字里，气质很稳。"
    },
    {
      name: "曜川",
      tone: "成长锋感",
      title: "光感推进",
      desc: "简短干净，但自带向前走的能量，适合希望名字更有行动感的人。"
    },
    {
      name: "沐星野",
      tone: "好运松弛",
      title: "发光旷野",
      desc: "像被暖光照亮的空地，既有祝福感，也有轻松向外生长的姿态。"
    }
  ],
  en: [
    {
      name: "Dove Key",
      tone: "clean lucky",
      title: "Open the bright side",
      desc: "Soft and memorable, with a clear premium rhythm that works well for social handles and lifestyle identities."
    },
    {
      name: "Wander Mark",
      tone: "free traveler",
      title: "Leave motion behind",
      desc: "Feels like a moving passport stamp: easy to remember, slightly adventurous, and not overly literal."
    },
    {
      name: "Lunar Vale",
      tone: "quiet romantic",
      title: "Moonlit reserve",
      desc: "A softer, polished English naming direction with cinematic calm and a strong visual mood."
    },
    {
      name: "Amber Relay",
      tone: "warm progress",
      title: "Carry your spark",
      desc: "Made for users who want the name to sound bright, modern, and slightly future-facing."
    },
    {
      name: "Velvet North",
      tone: "cool premium",
      title: "Soft with edge",
      desc: "A more branded direction, balancing smooth texture with a directional pull."
    },
    {
      name: "Aster Room",
      tone: "healing retreat",
      title: "A calm private world",
      desc: "Gentle, private, and atmospheric, especially suited for a creator-style personal account."
    }
  ],
  mix: [
    {
      name: "望牧 Meadow",
      tone: "松弛旷野",
      title: "草地与风",
      desc: "中文部分带人情味，英文部分拉开空间感，适合希望昵称更像作品名的人。"
    },
    {
      name: "望舒泽 Solis",
      tone: "暖光幸运",
      title: "光晕落在名字里",
      desc: "保留中文韵味，又用英文把整体气质拉得更国际化、更高级。"
    },
    {
      name: "听海 Echo",
      tone: "安静治愈",
      title: "把回声留给风景",
      desc: "轻柔、好记、有一点文艺性，适合内容型账号或偏生活方式的使用场景。"
    },
    {
      name: "星屿 Current",
      tone: "流动成长",
      title: "沿着光去走",
      desc: "兼具清澈感与行动感，适合喜欢简洁但又不想太普通的用户。"
    },
    {
      name: "南枝 Vale",
      tone: "温柔高级",
      title: "留白里的气质",
      desc: "偏 editorial 的混合命名方式，会比直接拼接单词更像一个被设计过的名字。"
    },
    {
      name: "曜川 Pulse",
      tone: "利落动感",
      title: "向前的节拍",
      desc: "更适合游戏 ID 或带一点锋感的个人标签，短促有力但不粗糙。"
    }
  ]
};

const loadingTexts = [
  "正在理解你的关键词...",
  "正在匹配更像你的语气...",
  "正在整理结果册..."
];

const state = {
  mode: "cn",
  meaning: "自由探索",
  scene: "微信昵称",
  keywords: ["阿屿"],
  view: "composer",
  results: [],
  favorites: [],
  activeShareItem: null
};

const elements = {
  keywordInput: document.getElementById("keyword-input"),
  keywordTags: document.getElementById("keyword-tags"),
  addKeyword: document.getElementById("add-keyword"),
  generateButton: document.getElementById("generate-button"),
  randomizeButton: document.getElementById("randomize-button"),
  regenerateButton: document.getElementById("regenerate-button"),
  resultList: document.getElementById("result-list"),
  favoriteList: document.getElementById("favorite-list"),
  favoriteEmpty: document.getElementById("favorite-empty"),
  favoritesCount: document.getElementById("favorites-count"),
  resultsIntro: document.getElementById("results-intro"),
  selectionSummary: document.getElementById("selection-summary"),
  heroPreviewList: document.getElementById("hero-preview-list"),
  heroModePill: document.getElementById("hero-mode-pill"),
  heroMeaningPill: document.getElementById("hero-meaning-pill"),
  heroKeywordPill: document.getElementById("hero-keyword-pill"),
  posterMode: document.getElementById("poster-mode"),
  posterName: document.getElementById("poster-name"),
  posterMeaning: document.getElementById("poster-meaning"),
  posterMeta: document.getElementById("poster-meta"),
  overviewTitle: document.getElementById("overview-title"),
  overviewText: document.getElementById("overview-text"),
  loadingText: document.getElementById("loading-text"),
  shareSheet: document.getElementById("share-sheet"),
  feedbackSheet: document.getElementById("feedback-sheet"),
  shareMode: document.getElementById("share-mode"),
  shareName: document.getElementById("share-name"),
  shareDesc: document.getElementById("share-desc"),
  shareMeta: document.getElementById("share-meta"),
  feedbackInput: document.getElementById("feedback-input"),
  sheetBackdrop: document.getElementById("sheet-backdrop"),
  toast: document.getElementById("toast"),
  topStart: document.getElementById("top-start"),
  topFavorites: document.getElementById("top-favorites"),
  heroStart: document.getElementById("hero-start"),
  heroDemo: document.getElementById("hero-demo"),
  bottomStart: document.getElementById("bottom-start"),
  openFeedback: document.getElementById("open-feedback"),
  mockDownload: document.getElementById("mock-download"),
  submitFeedback: document.getElementById("submit-feedback")
};

function init() {
  state.results = buildResults();
  bindEvents();
  initRevealObserver();
  render();
}

function bindEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      render();
    });
  });

  document.querySelectorAll("[data-meaning]").forEach((button) => {
    button.addEventListener("click", () => {
      state.meaning = button.dataset.meaning;
      render();
    });
  });

  document.querySelectorAll("[data-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      state.scene = button.dataset.scene;
      state.keywords = [...scenePresets[state.scene]];
      render();
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
      scrollWorkspaceIntoView();
    });
  });

  elements.addKeyword.addEventListener("click", addKeywordFromInput);
  elements.keywordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addKeywordFromInput();
    }
  });

  elements.generateButton.addEventListener("click", generateWithLoading);
  elements.randomizeButton.addEventListener("click", randomizeKeywords);
  elements.regenerateButton.addEventListener("click", generateWithLoading);

  elements.resultList.addEventListener("click", handleCardAction);
  elements.favoriteList.addEventListener("click", handleCardAction);

  elements.topStart.addEventListener("click", () => jumpToWorkspace("composer"));
  elements.heroStart.addEventListener("click", () => jumpToWorkspace("composer"));
  elements.bottomStart.addEventListener("click", () => jumpToWorkspace("composer"));
  elements.heroDemo.addEventListener("click", () => jumpToWorkspace("results"));
  elements.topFavorites.addEventListener("click", () => jumpToWorkspace("favorites"));

  elements.openFeedback.addEventListener("click", () => openSheet("feedback"));
  elements.submitFeedback.addEventListener("click", submitFeedback);
  elements.mockDownload.addEventListener("click", () => {
    closeSheet();
    showToast("已模拟保存海报，可继续用于设计评审。");
  });

  document.querySelectorAll("[data-close-sheet]").forEach((button) => {
    button.addEventListener("click", closeSheet);
  });

  elements.sheetBackdrop.addEventListener("click", closeSheet);
}

function initRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll(".reveal").forEach((section) => observer.observe(section));
}

function addKeywordFromInput() {
  const value = elements.keywordInput.value.trim();
  if (!value) return;

  if (state.keywords.includes(value)) {
    elements.keywordInput.value = "";
    showToast("这个关键词已经在列表里了。");
    return;
  }

  if (state.keywords.length >= 2) {
    showToast("这版原型保留 1-2 个关键词输入节奏。");
    return;
  }

  state.keywords = [...state.keywords, value];
  elements.keywordInput.value = "";
  render();
}

function removeKeyword(keyword) {
  state.keywords = state.keywords.filter((item) => item !== keyword);
  render();
}

function randomizeKeywords() {
  const pool = Object.values(scenePresets).flat();
  const next = [];

  while (next.length < 2) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (!next.includes(candidate)) next.push(candidate);
  }

  state.keywords = next;
  showToast("已替你换一组关键词灵感。");
  render();
}

function buildResults() {
  const base = shuffle([...library[state.mode]]).slice(0, 3);
  const keywordsText = state.keywords.length ? state.keywords.join(" / ") : "你的气质线索";

  return base.map((item, index) => ({
    ...item,
    id: `${state.mode}-${item.name}-${index}`,
    title: `${item.title} · ${state.meaning}`,
    desc: `${item.desc} 当前把“${keywordsText}”映射成“${state.meaning}”的语气，更适合用于 ${state.scene}。`
  }));
}

function generateWithLoading() {
  if (!state.keywords.length) {
    showToast("先加 1 个关键词，我们再继续往下走。");
    return;
  }

  showView("loading");
  let textIndex = 0;
  elements.loadingText.textContent = loadingTexts[textIndex];

  const textTimer = window.setInterval(() => {
    textIndex = (textIndex + 1) % loadingTexts.length;
    elements.loadingText.textContent = loadingTexts[textIndex];
  }, 340);

  window.setTimeout(() => {
    window.clearInterval(textTimer);
    state.results = buildResults();
    showView("results");
    render();
    showToast("结果册已刷新。");
  }, 1100);
}

function handleCardAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const cardId = button.dataset.id;
  const item = [...state.results, ...state.favorites].find((entry) => entry.id === cardId);
  if (!item) return;

  if (action === "copy") copyName(item.name);
  if (action === "favorite") toggleFavorite(item);
  if (action === "share") openShare(item);
}

function copyName(name) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(name).catch(() => undefined);
  }

  showToast(`已复制“${name}”`);
}

function toggleFavorite(item) {
  const exists = state.favorites.some((entry) => entry.name === item.name);

  if (exists) {
    state.favorites = state.favorites.filter((entry) => entry.name !== item.name);
    showToast("已从收藏夹移除。");
  } else {
    state.favorites = [{ ...item, id: `${item.id}-fav` }, ...state.favorites];
    showToast("已加入收藏夹。");
  }

  render();
}

function openShare(item) {
  state.activeShareItem = item;
  openSheet("share");
  renderShareSheet();
}

function openSheet(type) {
  elements.sheetBackdrop.hidden = false;
  elements.shareSheet.hidden = type !== "share";
  elements.feedbackSheet.hidden = type !== "feedback";
}

function closeSheet() {
  elements.sheetBackdrop.hidden = true;
  elements.shareSheet.hidden = true;
  elements.feedbackSheet.hidden = true;
}

function submitFeedback() {
  const content = elements.feedbackInput.value.trim();
  if (!content) {
    showToast("先写一点想法，我再帮你提交。");
    return;
  }

  elements.feedbackInput.value = "";
  closeSheet();
  showToast("反馈已记录，这个抽屉交互也会保留到正式实现建议里。");
}

function render() {
  renderModeButtons();
  renderMeaningButtons();
  renderSceneButtons();
  renderKeywordTags();
  renderHero();
  renderOverview();
  renderResults();
  renderFavorites();
  renderViews();
  renderDock();
  renderShareSheet();
}

function renderModeButtons() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });
}

function renderMeaningButtons() {
  document.querySelectorAll("[data-meaning]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.meaning === state.meaning);
  });
}

function renderSceneButtons() {
  document.querySelectorAll("[data-scene]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.scene === state.scene);
  });
}

function renderKeywordTags() {
  elements.keywordTags.innerHTML = "";

  state.keywords.forEach((keyword) => {
    const tag = document.createElement("span");
    tag.className = "keyword-tag";
    tag.innerHTML = `<span>${keyword}</span><button type="button" aria-label="移除 ${keyword}">×</button>`;
    tag.querySelector("button").addEventListener("click", () => removeKeyword(keyword));
    elements.keywordTags.appendChild(tag);
  });
}

function renderHero() {
  const previewData = state.results.length ? state.results : buildResults();
  elements.heroModePill.textContent = modeMap[state.mode];
  elements.heroMeaningPill.textContent = state.meaning;
  elements.heroKeywordPill.textContent = state.keywords.length ? state.keywords.join(" / ") : "关键词待输入";

  elements.heroPreviewList.innerHTML = previewData
    .slice(0, 3)
    .map(
      (item) => `
        <li class="hero-preview-card">
          <div class="hero-preview-card__top">
            <strong>${item.name}</strong>
            <span class="hero-preview-card__tone">${item.tone}</span>
          </div>
          <p class="hero-preview-card__desc">${item.title}</p>
        </li>
      `
    )
    .join("");
}

function renderOverview() {
  const reference = state.results[0] || library[state.mode][0];
  elements.overviewTitle.textContent =
    state.mode === "cn"
      ? "让名字像你，而不是像模板"
      : state.mode === "en"
        ? "Build a handle with mood, not just letters"
        : "让中文情绪和英文调性在一个昵称里共存";

  elements.overviewText.textContent = `当前设定为“${modeMap[state.mode]} / ${state.meaning} / ${state.scene}”，输入区会把“${state.keywords.join(" / ") || "关键词"}”转成更明确的结果期待。`;
  elements.posterMode.textContent = modeMap[state.mode];
  elements.posterName.textContent = reference.name;
  elements.posterMeaning.textContent = `${reference.title}。当前以“${state.meaning}”为结果语气。`;
  elements.posterMeta.innerHTML = `
    <span>${state.scene}</span>
    <span>${state.keywords[0] || "关键词"}</span>
    <span>${state.meaning}</span>
  `;
}

function renderResults() {
  elements.selectionSummary.textContent = `${modeMap[state.mode]} · ${state.meaning}`;
  elements.resultsIntro.textContent = `当前组合：${state.scene} / ${state.keywords.join(" / ") || "关键词待输入"}。每张卡片都对应正式版可拆分的结果组件。`;

  elements.resultList.innerHTML = state.results
    .map((item, index) => buildResultCard(item, index + 1, isFavorited(item.name)))
    .join("");
}

function renderFavorites() {
  elements.favoritesCount.textContent = `${state.favorites.length} 个收藏`;
  elements.favoriteEmpty.hidden = state.favorites.length > 0;
  elements.favoriteList.innerHTML = state.favorites
    .map((item, index) => buildResultCard(item, index + 1, true))
    .join("");
}

function renderViews() {
  const viewIds = ["composer", "loading", "results", "favorites"];
  viewIds.forEach((view) => {
    const panel = document.getElementById(`${view}-view`);
    const isCurrent = state.view === view;
    panel.hidden = !isCurrent;
    panel.classList.toggle("is-active", isCurrent);
  });

  document.querySelectorAll(".view-switch__button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function renderDock() {
  document.querySelectorAll(".mobile-dock__item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function renderShareSheet() {
  const item = state.activeShareItem || state.results[0];
  if (!item) return;

  elements.shareMode.textContent = modeMap[state.mode];
  elements.shareName.textContent = item.name;
  elements.shareDesc.textContent = item.desc;
  elements.shareMeta.innerHTML = `
    <span>${state.scene}</span>
    <span>${state.meaning}</span>
    <span>${state.keywords[0] || "关键词"}</span>
  `;
}

function buildResultCard(item, index, favorited) {
  return `
    <article class="name-card">
      <div class="name-card__top">
        <div>
          <p class="name-card__eyebrow">Result ${String(index).padStart(2, "0")}</p>
          <h4>${item.name}</h4>
        </div>
        <button
          class="favorite-toggle ${favorited ? "is-active" : ""}"
          data-action="favorite"
          data-id="${item.id}"
          type="button"
        >
          ${favorited ? "已收藏" : "收藏"}
        </button>
      </div>

      <div class="tag-row">
        <span>${modeMap[state.mode]}</span>
        <span>${state.meaning}</span>
        <span>${item.tone}</span>
        <span>${state.scene}</span>
      </div>

      <p class="name-card__title">${item.title}</p>
      <p class="name-card__desc">${item.desc}</p>

      <div class="card-actions">
        <button class="result-action" data-action="copy" data-id="${item.id}" type="button">复制名字</button>
        <button class="result-action" data-action="share" data-id="${item.id}" type="button">分享海报</button>
      </div>
    </article>
  `;
}

function showView(view) {
  state.view = view;
  renderViews();
  renderDock();
}

function jumpToWorkspace(view) {
  showView(view);
  scrollWorkspaceIntoView();
}

function scrollWorkspaceIntoView() {
  document.getElementById("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}

function isFavorited(name) {
  return state.favorites.some((item) => item.name === name);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2200);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

init();

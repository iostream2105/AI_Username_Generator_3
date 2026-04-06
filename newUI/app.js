(() => {
  const STORAGE_KEY = "mingyouyi_new_ui_state_v1";
  const MAX_KEYWORDS = 2;
  const LOADING_STAGE_TEXTS = [
    "正在理解关键词...",
    "正在为你寻找灵感...",
    "正在创作...",
    "正在润色..."
  ];

  const MODE_LABELS = {
    cn: "中文网名",
    en: "英文网名",
    mix: "中英混合网名"
  };

  const MODE_HINTS = {
    cn: "默认推荐中文模式，稳定且贴近日常昵称习惯。",
    en: "英文模式更适合社媒主页和英文风格表达。",
    mix: "中英混合模式更强调辨识度和氛围感。"
  };

  const NAME_LIBRARY = {
    cn: [
      {
        name: "云岫归",
        meaning_title: "沉静中的坚定",
        meaning_desc: "像山岚回谷，整体气质安静但不软弱，适合长期使用。", 
        style_tags: ["文艺", "清冷", "耐看"]
      },
      {
        name: "栖潮",
        meaning_title: "自由与流动感",
        meaning_desc: "带一点海风和流动感，适合表达松弛、自由和向前的状态。",
        style_tags: ["轻盈", "松弛", "氛围感"]
      },
      {
        name: "知霁",
        meaning_title: "雨后见晴",
        meaning_desc: "克制、干净、内敛，适合想要“低调但有记忆点”的用户。",
        style_tags: ["简约", "治愈", "高级"]
      },
      {
        name: "渡川南",
        meaning_title: "向远处生长",
        meaning_desc: "有一种在路上的方向感，适合成长进阶主题。",
        style_tags: ["成长", "沉稳", "叙事感"]
      }
    ],
    en: [
      {
        name: "Lumen Vale",
        meaning_title: "柔光与边界",
        meaning_desc: "既温和又有距离，适合社媒主页与长期展示。",
        style_tags: ["Elegant", "Soft", "Editorial"]
      },
      {
        name: "Cinder Sol",
        meaning_title: "克制的热度",
        meaning_desc: "有力量但不过度张扬，适合想要中性高级感的用户。",
        style_tags: ["Cool", "Minimal", "Bold"]
      },
      {
        name: "Mira Cove",
        meaning_title: "温柔且明确",
        meaning_desc: "发音轻盈，辨识度高，适合短视频与小红书账号名。",
        style_tags: ["Bright", "Calm", "Fresh"]
      },
      {
        name: "Rowan Drift",
        meaning_title: "漫游者气质",
        meaning_desc: "像风从林间走过，适合自由探索和旅行向内容账号。",
        style_tags: ["Traveler", "Natural", "Loose"]
      }
    ],
    mix: [
      {
        name: "望汐 Waver",
        meaning_title: "潮汐一样的张力",
        meaning_desc: "中文部分温柔，英文部分有速度感，适合高辨识度主页昵称。",
        style_tags: ["中英混搭", "辨识度", "高级"]
      },
      {
        name: "栀川 North",
        meaning_title: "克制的浪漫",
        meaning_desc: "整体结构干净，既有画面感也保留轻微的距离感。",
        style_tags: ["清冷", "叙事", "氛围感"]
      },
      {
        name: "松野 Lumi",
        meaning_title: "温柔发光",
        meaning_desc: "更轻快，适合治愈方向和生活方式内容账号。",
        style_tags: ["治愈", "轻盈", "小众"]
      },
      {
        name: "夜澜 Aster",
        meaning_title: "夜色中的笃定",
        meaning_desc: "带有暗色浪漫气质，适合游戏 ID 与风格主页场景。",
        style_tags: ["深色系", "个性", "记忆点"]
      }
    ]
  };

  const state = {
    view: "home",
    mode: "cn",
    meaning: "",
    keywords: [],
    results: [],
    favorites: [],
    loadingIndex: 0,
    satisfaction: "idle",
    shareTarget: null,
    shareOpen: false,
    feedbackOpen: false
  };

  const els = {
    views: {
      home: document.getElementById("view-home"),
      loading: document.getElementById("view-loading"),
      results: document.getElementById("view-results"),
      favorites: document.getElementById("view-favorites")
    },
    keywordPills: document.getElementById("keywordPills"),
    keywordInput: document.getElementById("keywordInput"),
    addKeywordBtn: document.getElementById("addKeywordBtn"),
    quickKeywordWrap: document.getElementById("quickKeywordWrap"),
    modeSegment: document.getElementById("modeSegment"),
    modeTip: document.getElementById("modeTip"),
    meaningWrap: document.getElementById("meaningWrap"),
    generateBtn: document.getElementById("generateBtn"),
    loadingStageText: document.getElementById("loadingStageText"),
    backToHomeBtn: document.getElementById("backToHomeBtn"),
    resultCount: document.getElementById("resultCount"),
    resultsList: document.getElementById("resultsList"),
    quickSatisfiedBtn: document.getElementById("quickSatisfiedBtn"),
    quickUnsatisfiedBtn: document.getElementById("quickUnsatisfiedBtn"),
    unsatisfiedReasonWrap: document.getElementById("unsatisfiedReasonWrap"),
    satisfactionStatus: document.getElementById("satisfactionStatus"),
    editAgainBtn: document.getElementById("editAgainBtn"),
    regenerateBtn: document.getElementById("regenerateBtn"),
    backFromFavoriteBtn: document.getElementById("backFromFavoriteBtn"),
    favoriteCount: document.getElementById("favoriteCount"),
    favoriteList: document.getElementById("favoriteList"),
    favoriteEmpty: document.getElementById("favoriteEmpty"),
    bottomNavButtons: Array.from(document.querySelectorAll(".nav-btn")),
    openFeedbackFab: document.getElementById("openFeedbackFab"),
    openFeedbackTop: document.getElementById("openFeedbackTop"),
    shareModal: document.getElementById("shareModal"),
    closeShareBtn: document.getElementById("closeShareBtn"),
    savePosterBtn: document.getElementById("savePosterBtn"),
    posterModeLabel: document.getElementById("posterModeLabel"),
    posterName: document.getElementById("posterName"),
    posterMeaningTitle: document.getElementById("posterMeaningTitle"),
    posterMeaningDesc: document.getElementById("posterMeaningDesc"),
    posterTags: document.getElementById("posterTags"),
    posterInputMeta: document.getElementById("posterInputMeta"),
    posterMeaningMeta: document.getElementById("posterMeaningMeta"),
    feedbackModal: document.getElementById("feedbackModal"),
    feedbackText: document.getElementById("feedbackText"),
    closeFeedbackBtn: document.getElementById("closeFeedbackBtn"),
    cancelFeedbackBtn: document.getElementById("cancelFeedbackBtn"),
    submitFeedbackBtn: document.getElementById("submitFeedbackBtn"),
    toast: document.getElementById("toast")
  };

  let loadingStageTimer = null;
  let loadingFinishTimer = null;
  let toastTimer = null;
  let idSeed = Date.now();

  function createId(prefix) {
    idSeed += 1;
    return `${prefix}_${idSeed}`;
  }

  function showToast(message) {
    if (!message || !els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 1800);
  }

  function normalizeKeyword(raw) {
    if (!raw) return "";
    return raw.replace(/[，,]/g, " ").trim().replace(/\s+/g, " ");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getViewSnapshot() {
    return {
      view: state.view,
      shareOpen: state.shareOpen,
      feedbackOpen: state.feedbackOpen
    };
  }

  function persistState() {
    const payload = {
      view: state.view,
      mode: state.mode,
      meaning: state.meaning,
      keywords: state.keywords,
      results: state.results,
      favorites: state.favorites,
      satisfaction: state.satisfaction,
      shareTarget: state.shareTarget,
      shareOpen: state.shareOpen,
      feedbackOpen: state.feedbackOpen
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 忽略存储失败，保持页面可用。
    }
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      const validView = ["home", "loading", "results", "favorites"].includes(parsed.view) ? parsed.view : "home";
      const validMode = ["cn", "en", "mix"].includes(parsed.mode) ? parsed.mode : "cn";
      state.view = validView;
      state.mode = validMode;
      state.meaning = typeof parsed.meaning === "string" ? parsed.meaning : "";
      state.keywords = Array.isArray(parsed.keywords) ? parsed.keywords.filter((item) => typeof item === "string").slice(0, MAX_KEYWORDS) : [];
      state.results = Array.isArray(parsed.results) ? parsed.results.filter(Boolean) : [];
      state.favorites = Array.isArray(parsed.favorites) ? parsed.favorites.filter(Boolean) : [];
      state.satisfaction = typeof parsed.satisfaction === "string" ? parsed.satisfaction : "idle";
      state.shareTarget = parsed.shareTarget && typeof parsed.shareTarget === "object" ? parsed.shareTarget : null;
      state.shareOpen = Boolean(parsed.shareOpen && state.shareTarget);
      state.feedbackOpen = Boolean(parsed.feedbackOpen);

      if (state.view === "loading") {
        state.view = state.results.length > 0 ? "results" : "home";
      }
    } catch {
      // Ignore restore errors.
    }
  }

  function updateHistory(replace = false) {
    const payload = getViewSnapshot();
    if (replace) {
      window.history.replaceState(payload, "");
      return;
    }
    window.history.pushState(payload, "");
  }

  function applyViewState(viewName, pushHistory = true) {
    if (!["home", "loading", "results", "favorites"].includes(viewName)) {
      return;
    }

    if (state.view !== viewName) {
      clearLoadingTimers();
    }

    state.view = viewName;
    renderViews();
    renderBottomNav();
    persistState();

    if (pushHistory) {
      updateHistory(false);
    }
  }

  function renderViews() {
    Object.entries(els.views).forEach(([key, node]) => {
      if (!node) return;
      node.classList.toggle("active", key === state.view);
    });
  }

  function renderBottomNav() {
    els.bottomNavButtons.forEach((btn) => {
      const target = btn.dataset.nav;
      const activeTarget = state.view === "favorites" ? "favorites" : "home";
      btn.classList.toggle("active", target === activeTarget);
    });
  }

  function renderKeywordPills() {
    if (!els.keywordPills) return;
    if (state.keywords.length === 0) {
      els.keywordPills.innerHTML = "";
      return;
    }

    els.keywordPills.innerHTML = state.keywords
      .map(
        (keyword) => `
          <span class="keyword-pill">
            ${escapeHtml(keyword)}
            <button type="button" data-remove-keyword="${escapeHtml(keyword)}" aria-label="删除关键词">×</button>
          </span>
        `
      )
      .join("");
  }

  function renderMode() {
    if (!els.modeSegment || !els.modeTip) return;
    const buttons = Array.from(els.modeSegment.querySelectorAll(".mode-btn"));
    buttons.forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.mode === state.mode);
    });
    els.modeTip.textContent = MODE_HINTS[state.mode];
  }

  function renderMeaning() {
    if (!els.meaningWrap) return;
    const chips = Array.from(els.meaningWrap.querySelectorAll(".meaning-chip"));
    chips.forEach((chip) => {
      chip.classList.toggle("selected", chip.dataset.meaning === state.meaning);
    });
  }

  function renderSatisfaction() {
    if (!els.satisfactionStatus || !els.unsatisfiedReasonWrap) return;

    if (state.satisfaction === "satisfied") {
      els.satisfactionStatus.textContent = "收到你的肯定，感谢反馈。";
      els.unsatisfiedReasonWrap.classList.add("hidden");
      return;
    }

    if (state.satisfaction.startsWith("unsatisfied:")) {
      const reason = state.satisfaction.split(":")[1] || "已收到";
      els.satisfactionStatus.textContent = `已记录不满意原因：${reason}，我们会继续优化。`;
      els.unsatisfiedReasonWrap.classList.add("hidden");
      return;
    }

    if (state.satisfaction === "selecting") {
      els.satisfactionStatus.textContent = "告诉我们原因，后续会针对性优化这类结果。";
      els.unsatisfiedReasonWrap.classList.remove("hidden");
      return;
    }

    els.satisfactionStatus.textContent = "你的反馈会帮助后续优化生成质量。";
    els.unsatisfiedReasonWrap.classList.add("hidden");
  }

  function isFavorited(item) {
    return state.favorites.some((fav) => fav.name === item.name && fav.favorite_name_mode === item.favorite_name_mode);
  }

  function modeLabel(mode) {
    return MODE_LABELS[mode] || MODE_LABELS.cn;
  }

  function createCardHtml(item, sourceType) {
    const favoriteActive = isFavorited(item);
    const favoriteLabel = favoriteActive ? "已收藏" : "收藏";
    const tags = Array.isArray(item.style_tags) ? item.style_tags : [];
    const mode = item.favorite_name_mode || state.mode;
    return `
      <article class="name-card">
        <div class="card-top">
          <p class="card-mode">${escapeHtml(modeLabel(mode))}</p>
          <p class="card-mode">#${escapeHtml(String(item.rank || ""))}</p>
        </div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="name-meaning-title">${escapeHtml(item.meaning_title)}</p>
        <p class="name-desc">${escapeHtml(item.meaning_desc)}</p>
        <div class="tag-row">
          ${tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="card-actions">
          <button type="button" class="card-action" data-source="${sourceType}" data-item-id="${escapeHtml(item.id)}" data-action="copy">复制</button>
          <button type="button" class="card-action ${favoriteActive ? "active" : ""}" data-source="${sourceType}" data-item-id="${escapeHtml(item.id)}" data-action="favorite">${favoriteLabel}</button>
          <button type="button" class="card-action" data-source="${sourceType}" data-item-id="${escapeHtml(item.id)}" data-action="share">分享海报</button>
        </div>
      </article>
    `;
  }

  function renderResults() {
    if (!els.resultsList || !els.resultCount) return;
    els.resultCount.textContent = `${state.results.length} 条`;
    els.resultsList.innerHTML = state.results.map((item) => createCardHtml(item, "results")).join("");
  }

  function renderFavorites() {
    if (!els.favoriteList || !els.favoriteEmpty || !els.favoriteCount) return;
    els.favoriteCount.textContent = `${state.favorites.length} 条`;
    if (state.favorites.length === 0) {
      els.favoriteEmpty.classList.remove("hidden");
      els.favoriteList.innerHTML = "";
      return;
    }
    els.favoriteEmpty.classList.add("hidden");
    els.favoriteList.innerHTML = state.favorites.map((item) => createCardHtml(item, "favorites")).join("");
  }

  function renderPoster() {
    if (!state.shareTarget) return;
    const item = state.shareTarget;
    const mode = item.favorite_name_mode || state.mode;
    const keywords = Array.isArray(item.favorite_keywords) && item.favorite_keywords.length > 0
      ? item.favorite_keywords
      : state.keywords;
    const meaning = item.favorite_meaning || state.meaning || "未选择";

    els.posterModeLabel.textContent = modeLabel(mode);
    els.posterName.textContent = item.name;
    els.posterMeaningTitle.textContent = item.meaning_title;
    els.posterMeaningDesc.textContent = item.meaning_desc;
    els.posterInputMeta.textContent = `关键词：${keywords.length > 0 ? keywords.join("、") : "-"}`;
    els.posterMeaningMeta.textContent = `寓意方向：${meaning}`;
    els.posterTags.innerHTML = (item.style_tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("");
  }

  function renderShareModal() {
    if (!els.shareModal) return;
    els.shareModal.classList.toggle("hidden", !state.shareOpen);
  }

  function renderFeedbackModal() {
    if (!els.feedbackModal) return;
    els.feedbackModal.classList.toggle("hidden", !state.feedbackOpen);
  }

  function renderLoadingText() {
    if (!els.loadingStageText) return;
    els.loadingStageText.textContent = LOADING_STAGE_TEXTS[state.loadingIndex] || LOADING_STAGE_TEXTS[0];
  }

  function renderAll() {
    renderViews();
    renderBottomNav();
    renderKeywordPills();
    renderMode();
    renderMeaning();
    renderResults();
    renderFavorites();
    renderSatisfaction();
    renderShareModal();
    renderFeedbackModal();
    renderLoadingText();
  }

  function addKeyword(keyword) {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return false;
    if (state.keywords.includes(normalized)) {
      showToast("这个关键词已经添加过了。");
      return false;
    }
    if (state.keywords.length >= MAX_KEYWORDS) {
      showToast("最多添加 2 个关键词。");
      return false;
    }
    state.keywords.push(normalized);
    renderKeywordPills();
    persistState();
    return true;
  }

  function commitKeywordInput() {
    if (!els.keywordInput) return;
    const value = els.keywordInput.value;
    if (!value.trim()) return;
    const chunks = value
      .split(/[\s,，\n]+/)
      .map((item) => normalizeKeyword(item))
      .filter(Boolean);

    for (const chunk of chunks) {
      if (state.keywords.length >= MAX_KEYWORDS) break;
      addKeyword(chunk);
    }

    els.keywordInput.value = "";
    renderKeywordPills();
    persistState();
  }

  function buildMockResults() {
    const pool = [...NAME_LIBRARY[state.mode]];
    pool.sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, 3);

    const keywordChunk = state.keywords.length > 0 ? `关键词「${state.keywords.join("、")}」` : "";
    const meaningChunk = state.meaning ? `并向「${state.meaning}」倾斜` : "并保持自然的个人表达";

    return selected.map((item, index) => ({
      id: createId("result"),
      rank: index + 1,
      name: item.name,
      meaning_title: item.meaning_title,
      meaning_desc: `${item.meaning_desc}${keywordChunk ? ` 结果会自然融合${keywordChunk}，` : " "}并${meaningChunk}。`,
      style_tags: item.style_tags,
      favorite_keywords: [...state.keywords],
      favorite_meaning: state.meaning,
      favorite_name_mode: state.mode
    }));
  }

  function clearLoadingTimers() {
    window.clearInterval(loadingStageTimer);
    window.clearTimeout(loadingFinishTimer);
    loadingStageTimer = null;
    loadingFinishTimer = null;
  }

  function startGenerationFlow() {
    commitKeywordInput();
    if (state.keywords.length === 0) {
      showToast("请先输入 1-2 个关键词。");
      return;
    }

    clearLoadingTimers();
    state.loadingIndex = 0;
    renderLoadingText();
    state.satisfaction = "idle";
    applyViewState("loading", true);

    loadingStageTimer = window.setInterval(() => {
      state.loadingIndex = (state.loadingIndex + 1) % LOADING_STAGE_TEXTS.length;
      renderLoadingText();
    }, 850);

    loadingFinishTimer = window.setTimeout(() => {
      clearLoadingTimers();
      state.results = buildMockResults();
      renderResults();
      renderSatisfaction();
      applyViewState("results", true);
      persistState();
    }, 3000);
  }

  function toggleFavorite(item) {
    const targetMode = item.favorite_name_mode || state.mode;
    const index = state.favorites.findIndex((fav) => fav.name === item.name && fav.favorite_name_mode === targetMode);
    if (index >= 0) {
      state.favorites.splice(index, 1);
      showToast("已取消收藏。");
    } else {
      state.favorites.unshift({
        ...item,
        id: createId("fav"),
        favorite_keywords: item.favorite_keywords || [...state.keywords],
        favorite_meaning: item.favorite_meaning || state.meaning,
        favorite_name_mode: targetMode
      });
      showToast("已加入收藏。");
    }
    renderResults();
    renderFavorites();
    persistState();
  }

  async function copyName(name) {
    if (!name) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(name);
      } else {
        const temp = document.createElement("textarea");
        temp.value = name;
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
      showToast(`已复制：${name}`);
    } catch {
      showToast("复制失败，请手动复制。");
    }
  }

  function getItemBySource(source, itemId) {
    if (!itemId) return null;
    if (source === "favorites") {
      return state.favorites.find((item) => item.id === itemId) || null;
    }
    return state.results.find((item) => item.id === itemId) || null;
  }

  function openShareModal(item, pushHistory = true) {
    state.shareTarget = item;
    state.shareOpen = true;
    renderPoster();
    renderShareModal();
    persistState();
    if (pushHistory) updateHistory(false);
  }

  function closeShareModal(pushHistory = false) {
    if (!state.shareOpen) return;
    state.shareOpen = false;
    renderShareModal();
    persistState();
    if (pushHistory) updateHistory(false);
  }

  function openFeedbackModal(pushHistory = true) {
    state.feedbackOpen = true;
    renderFeedbackModal();
    persistState();
    if (pushHistory) updateHistory(false);
  }

  function closeFeedbackModal(pushHistory = false) {
    if (!state.feedbackOpen) return;
    state.feedbackOpen = false;
    renderFeedbackModal();
    persistState();
    if (pushHistory) updateHistory(false);
  }

  function handleCardAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const source = button.dataset.source;
    const itemId = button.dataset.itemId;
    const item = getItemBySource(source, itemId);
    if (!item) return;

    if (action === "copy") {
      void copyName(item.name);
      return;
    }
    if (action === "favorite") {
      toggleFavorite(item);
      return;
    }
    if (action === "share") {
      openShareModal(item, true);
    }
  }

  function goBack(fallbackView) {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    closeShareModal(false);
    closeFeedbackModal(false);
    applyViewState(fallbackView, false);
    updateHistory(true);
  }

  function bindEvents() {
    els.addKeywordBtn.addEventListener("click", () => {
      commitKeywordInput();
    });

    els.keywordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "," || event.key === "，") {
        event.preventDefault();
        commitKeywordInput();
      }
    });

    els.keywordPills.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-remove-keyword]");
      if (!target) return;
      const keyword = target.dataset.removeKeyword;
      state.keywords = state.keywords.filter((item) => item !== keyword);
      renderKeywordPills();
      persistState();
    });

    els.quickKeywordWrap.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-keyword]");
      if (!target) return;
      const value = target.dataset.keyword;
      addKeyword(value);
      persistState();
    });

    els.modeSegment.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-mode]");
      if (!target) return;
      const mode = target.dataset.mode;
      if (!["cn", "en", "mix"].includes(mode)) return;
      state.mode = mode;
      renderMode();
      persistState();
    });

    els.meaningWrap.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-meaning]");
      if (!target) return;
      const meaning = target.dataset.meaning;
      state.meaning = state.meaning === meaning ? "" : meaning;
      renderMeaning();
      persistState();
    });

    els.generateBtn.addEventListener("click", () => {
      startGenerationFlow();
    });

    els.backToHomeBtn.addEventListener("click", () => {
      goBack("home");
    });

    els.editAgainBtn.addEventListener("click", () => {
      goBack("home");
    });

    els.regenerateBtn.addEventListener("click", () => {
      startGenerationFlow();
    });

    els.backFromFavoriteBtn.addEventListener("click", () => {
      goBack("home");
    });

    els.resultsList.addEventListener("click", handleCardAction);
    els.favoriteList.addEventListener("click", handleCardAction);

    els.quickSatisfiedBtn.addEventListener("click", () => {
      state.satisfaction = "satisfied";
      renderSatisfaction();
      persistState();
    });

    els.quickUnsatisfiedBtn.addEventListener("click", () => {
      state.satisfaction = "selecting";
      renderSatisfaction();
      persistState();
    });

    els.unsatisfiedReasonWrap.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-reason]");
      if (!target) return;
      const reason = target.dataset.reason;
      state.satisfaction = `unsatisfied:${reason}`;
      renderSatisfaction();
      persistState();
    });

    els.bottomNavButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const nav = btn.dataset.nav;
        if (nav === "home") {
          applyViewState("home", true);
          return;
        }
        if (nav === "favorites") {
          applyViewState("favorites", true);
          return;
        }
        if (nav === "feedback") {
          openFeedbackModal(true);
        }
      });
    });

    els.openFeedbackFab.addEventListener("click", () => openFeedbackModal(true));
    els.openFeedbackTop.addEventListener("click", () => openFeedbackModal(true));

    els.closeShareBtn.addEventListener("click", () => closeShareModal(false));
    els.shareModal.addEventListener("click", (event) => {
      if (event.target && event.target.dataset.closeShare === "true") {
        closeShareModal(false);
      }
    });
    els.savePosterBtn.addEventListener("click", () => {
      showToast("原型模式：这里可接入保存 PNG 的真实导出逻辑。");
    });

    els.closeFeedbackBtn.addEventListener("click", () => closeFeedbackModal(false));
    els.cancelFeedbackBtn.addEventListener("click", () => closeFeedbackModal(false));
    els.feedbackModal.addEventListener("click", (event) => {
      if (event.target && event.target.dataset.closeFeedback === "true") {
        closeFeedbackModal(false);
      }
    });
    els.submitFeedbackBtn.addEventListener("click", () => {
      const text = normalizeKeyword(els.feedbackText.value);
      if (!text) {
        showToast("先写一点反馈内容再提交。");
        return;
      }
      els.feedbackText.value = "";
      closeFeedbackModal(false);
      showToast("感谢反馈，我们已经收到。");
    });

    window.addEventListener("popstate", (event) => {
      const snapshot = event.state;
      if (!snapshot || typeof snapshot !== "object") {
        state.shareOpen = false;
        state.feedbackOpen = false;
        state.view = "home";
        renderAll();
        persistState();
        updateHistory(true);
        return;
      }

      if (snapshot.view && ["home", "loading", "results", "favorites"].includes(snapshot.view)) {
        state.view = snapshot.view;
      }
      state.shareOpen = Boolean(snapshot.shareOpen && state.shareTarget);
      state.feedbackOpen = Boolean(snapshot.feedbackOpen);
      renderAll();
      persistState();
    });
  }

  function init() {
    restoreState();
    renderAll();
    bindEvents();
    updateHistory(true);

    if (state.view === "results" && state.results.length === 0) {
      state.view = "home";
      renderViews();
    }
  }

  init();
})();

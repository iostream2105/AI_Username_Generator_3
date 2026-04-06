(() => {
  const STORAGE_KEY = "mingyouyi_new_ui_v2_state";
  const MAX_KEYWORDS = 2;
  const LOADING_STEPS = [
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
    cn: "中文模式更适合微信、QQ、小红书昵称场景。",
    en: "英文模式适合社媒主页、游戏 ID 和海外平台账号名。",
    mix: "中英混合更有辨识度，适合需要风格表达的展示昵称。"
  };

  const MOCK_LIBRARY = {
    cn: [
      {
        name: "云峤",
        meaning_title: "沉静中的坚定",
        meaning_desc: "像雾从山脊缓缓划过，克制但有力量，适合长期使用的个人昵称。",
        style_tags: ["清冷", "文艺", "耐看"]
      },
      {
        name: "栖潮",
        meaning_title: "自由与流动感",
        meaning_desc: "带一点海风和远行感，表达松弛、开放和持续向前的状态。",
        style_tags: ["轻盈", "自然", "氛围感"]
      },
      {
        name: "知省",
        meaning_title: "雨后见晴",
        meaning_desc: "简短有记忆点，不张扬但有辨识度，适合熟人社交环境。",
        style_tags: ["简约", "克制", "高级"]
      },
      {
        name: "时野",
        meaning_title: "在路上的成长",
        meaning_desc: "兼顾温和与行动感，适合“成长进阶”方向的表达。",
        style_tags: ["成长", "稳感", "故事性"]
      },
      {
        name: "澄岚",
        meaning_title: "清醒且柔和",
        meaning_desc: "语感通透，画面感轻，适合治愈与安定主题。",
        style_tags: ["治愈", "温柔", "纯净"]
      }
    ],
    en: [
      {
        name: "Lumen Vale",
        meaning_title: "柔光与边界",
        meaning_desc: "有温度但不过分亲近，适合社媒主页和长期身份展示。",
        style_tags: ["Elegant", "Soft", "Editorial"]
      },
      {
        name: "Cinder Sol",
        meaning_title: "克制的热度",
        meaning_desc: "力量感和简洁感并存，适合偏中性或先锋感昵称。",
        style_tags: ["Bold", "Cool", "Minimal"]
      },
      {
        name: "Mira Cove",
        meaning_title: "温柔且明晰",
        meaning_desc: "发音顺滑、识别度高，适合短视频和内容账号名称。",
        style_tags: ["Fresh", "Calm", "Clean"]
      },
      {
        name: "Rowan Drift",
        meaning_title: "漫游者气质",
        meaning_desc: "轻松、自由、具叙事感，适合旅行与生活方式场景。",
        style_tags: ["Traveler", "Natural", "Loose"]
      },
      {
        name: "Nora Flint",
        meaning_title: "冷静与锋芒",
        meaning_desc: "短促有力，不显冗长，适合游戏或科技感个人页。",
        style_tags: ["Sharp", "Modern", "Neutral"]
      }
    ],
    mix: [
      {
        name: "栖野 North",
        meaning_title: "克制的浪漫",
        meaning_desc: "中文意象稳住情绪，英文尾部拉高辨识度，适合主页昵称。",
        style_tags: ["辨识度", "清冷", "中英混搭"]
      },
      {
        name: "望澄 Waver",
        meaning_title: "向远处流动",
        meaning_desc: "兼具方向感和动势，适合表达“自由探索”的状态。",
        style_tags: ["自由", "叙事感", "灵动"]
      },
      {
        name: "松野 Lumi",
        meaning_title: "柔和发光",
        meaning_desc: "有轻快感也保留高级感，适合治愈风格账号命名。",
        style_tags: ["治愈", "轻盈", "小众"]
      },
      {
        name: "夜澜 Aster",
        meaning_title: "夜色里的清醒",
        meaning_desc: "风格更鲜明，适合游戏 ID 或内容主页展示。",
        style_tags: ["个性", "深色系", "记忆点"]
      },
      {
        name: "岚序 Nova",
        meaning_title: "秩序中的新鲜",
        meaning_desc: "结构稳定、听感简洁，适合偏专业感的人设场景。",
        style_tags: ["简洁", "理性", "新锐"]
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
    shareTarget: null
  };

  let loadingStepTimer = null;
  let loadingFinishTimer = null;
  let toastTimer = null;
  let idSeed = Date.now();

  const refs = {
    views: {
      home: document.getElementById("view-home"),
      loading: document.getElementById("view-loading"),
      results: document.getElementById("view-results"),
      favorites: document.getElementById("view-favorites")
    },
    keywordBox: document.getElementById("keywordBox"),
    keywordInput: document.getElementById("keywordInput"),
    addKeywordBtn: document.getElementById("addKeywordBtn"),
    quickKeywordRow: document.getElementById("quickKeywordRow"),
    modeSegment: document.getElementById("modeSegment"),
    modeHint: document.getElementById("modeHint"),
    meaningRow: document.getElementById("meaningRow"),
    generateBtn: document.getElementById("generateBtn"),
    loadingTitle: document.getElementById("loadingTitle"),
    resultBackBtn: document.getElementById("resultBackBtn"),
    resultCount: document.getElementById("resultCount"),
    resultStack: document.getElementById("resultStack"),
    satisfiedBtn: document.getElementById("satisfiedBtn"),
    unsatisfiedBtn: document.getElementById("unsatisfiedBtn"),
    satisfactionText: document.getElementById("satisfactionText"),
    reasonRow: document.getElementById("reasonRow"),
    editBtn: document.getElementById("editBtn"),
    regenBtn: document.getElementById("regenBtn"),
    favoriteBackBtn: document.getElementById("favoriteBackBtn"),
    favoriteCount: document.getElementById("favoriteCount"),
    favoriteEmpty: document.getElementById("favoriteEmpty"),
    favoriteStack: document.getElementById("favoriteStack"),
    tabButtons: Array.from(document.querySelectorAll("[data-tab]")),
    openFeedbackTop: document.getElementById("openFeedbackTop"),
    shareModal: document.getElementById("shareModal"),
    closeShareBtn: document.getElementById("closeShareBtn"),
    savePosterBtn: document.getElementById("savePosterBtn"),
    posterMode: document.getElementById("posterMode"),
    posterName: document.getElementById("posterName"),
    posterTitle: document.getElementById("posterTitle"),
    posterDesc: document.getElementById("posterDesc"),
    posterTags: document.getElementById("posterTags"),
    posterKeywords: document.getElementById("posterKeywords"),
    posterMeaning: document.getElementById("posterMeaning"),
    feedbackModal: document.getElementById("feedbackModal"),
    closeFeedbackBtn: document.getElementById("closeFeedbackBtn"),
    cancelFeedbackBtn: document.getElementById("cancelFeedbackBtn"),
    submitFeedbackBtn: document.getElementById("submitFeedbackBtn"),
    feedbackInput: document.getElementById("feedbackInput"),
    toast: document.getElementById("toast")
  };

  function createId(prefix) {
    idSeed += 1;
    return `${prefix}_${idSeed}`;
  }

  function cleanKeyword(value) {
    return String(value || "")
      .replace(/[，,]/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showToast(message) {
    if (!refs.toast || !message) return;
    refs.toast.textContent = message;
    refs.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      refs.toast.classList.remove("show");
    }, 1700);
  }

  function persistState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        view: state.view,
        mode: state.mode,
        meaning: state.meaning,
        keywords: state.keywords,
        results: state.results,
        favorites: state.favorites
      }));
    } catch {
      // 忽略持久化失败，保证页面可用。
    }
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      state.view = ["home", "results", "favorites"].includes(parsed.view) ? parsed.view : "home";
      state.mode = ["cn", "en", "mix"].includes(parsed.mode) ? parsed.mode : "cn";
      state.meaning = typeof parsed.meaning === "string" ? parsed.meaning : "";
      state.keywords = Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((item) => typeof item === "string").slice(0, MAX_KEYWORDS)
        : [];
      state.results = Array.isArray(parsed.results) ? parsed.results.filter(Boolean) : [];
      state.favorites = Array.isArray(parsed.favorites) ? parsed.favorites.filter(Boolean) : [];
    } catch {
      // 忽略恢复失败，使用默认状态。
    }
  }

  function renderView() {
    Object.entries(refs.views).forEach(([key, node]) => {
      if (!node) return;
      node.classList.toggle("is-active", key === state.view);
    });
  }

  function renderTabs() {
    refs.tabButtons.forEach((btn) => {
      const tab = btn.dataset.tab;
      const active = state.view === "favorites" ? tab === "favorites" : tab === "home";
      btn.classList.toggle("is-active", active);
    });
  }

  function setView(nextView, options = {}) {
    const { pushHistory = true } = options;
    if (!["home", "loading", "results", "favorites"].includes(nextView)) return;
    state.view = nextView;
    renderView();
    renderTabs();
    persistState();
    if (pushHistory) {
      window.history.pushState({ appView: nextView }, "");
    }
  }

  function renderKeywords() {
    if (!refs.keywordBox) return;

    if (state.keywords.length === 0) {
      refs.keywordBox.innerHTML = "";
      return;
    }

    refs.keywordBox.innerHTML = state.keywords
      .map((keyword) => (
        `<span class="keyword-token">${escapeHtml(keyword)}
          <button type="button" data-remove="${escapeHtml(keyword)}" aria-label="删除关键词">×</button>
        </span>`
      ))
      .join("");
  }

  function renderMode() {
    if (!refs.modeSegment || !refs.modeHint) return;
    refs.modeHint.textContent = MODE_HINTS[state.mode];
    refs.modeSegment.querySelectorAll("[data-mode]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.mode === state.mode);
    });
  }

  function renderMeaning() {
    if (!refs.meaningRow) return;
    refs.meaningRow.querySelectorAll("[data-meaning]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.meaning === state.meaning);
    });
  }

  function isFavorited(name) {
    return state.favorites.some((item) => item.name === name);
  }

  function createCardTemplate(item, source) {
    const tags = Array.isArray(item.style_tags) ? item.style_tags.slice(0, 3) : [];
    const token = encodeURIComponent(item.name);
    const favoriteText = isFavorited(item.name) ? "已收藏" : "收藏";
    const favoriteClassName = isFavorited(item.name) ? "ghost-btn is-fav" : "ghost-btn";

    return `
      <article class="name-card">
        <h3>${escapeHtml(item.name)}</h3>
        <p class="name-title">${escapeHtml(item.meaning_title || "专属寓意")}</p>
        <p class="name-desc">${escapeHtml(item.meaning_desc || "")}</p>
        <div class="tag-row">
          ${tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="card-actions">
          <button type="button" class="ghost-btn" data-action="copy" data-source="${source}" data-token="${token}">复制</button>
          <button type="button" class="${favoriteClassName}" data-action="favorite" data-source="${source}" data-token="${token}">${favoriteText}</button>
          <button type="button" class="ghost-btn" data-action="share" data-source="${source}" data-token="${token}">海报</button>
        </div>
      </article>
    `;
  }

  function renderResults() {
    if (!refs.resultStack || !refs.resultCount) return;
    refs.resultCount.textContent = `${state.results.length} 条`;
    refs.resultStack.innerHTML = state.results.map((item) => createCardTemplate(item, "results")).join("");
  }

  function renderFavorites() {
    if (!refs.favoriteStack || !refs.favoriteCount || !refs.favoriteEmpty) return;
    refs.favoriteCount.textContent = `${state.favorites.length} 条`;
    refs.favoriteEmpty.classList.toggle("hidden", state.favorites.length > 0);
    refs.favoriteStack.innerHTML = state.favorites.map((item) => createCardTemplate(item, "favorites")).join("");
  }

  function closeLoadingTimers() {
    window.clearInterval(loadingStepTimer);
    window.clearTimeout(loadingFinishTimer);
    loadingStepTimer = null;
    loadingFinishTimer = null;
  }

  function shuffle(list) {
    const next = [...list];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function buildMockResults() {
    const selected = shuffle(MOCK_LIBRARY[state.mode]).slice(0, 3);
    return selected.map((item, index) => ({
      ...item,
      id: createId("result"),
      result_rank: index + 1,
      source_keywords: [...state.keywords],
      source_meaning: state.meaning,
      source_mode: state.mode
    }));
  }

  function runGenerateFlow() {
    if (state.keywords.length === 0) {
      showToast("请先输入至少 1 个关键词");
      refs.keywordInput?.focus();
      return;
    }

    closeLoadingTimers();
    setView("loading");

    let stepIndex = 0;
    if (refs.loadingTitle) refs.loadingTitle.textContent = LOADING_STEPS[0];
    loadingStepTimer = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % LOADING_STEPS.length;
      if (refs.loadingTitle) refs.loadingTitle.textContent = LOADING_STEPS[stepIndex];
    }, 760);

    loadingFinishTimer = window.setTimeout(() => {
      closeLoadingTimers();
      state.results = buildMockResults();
      renderResults();
      refs.reasonRow?.classList.add("hidden");
      if (refs.satisfactionText) {
        refs.satisfactionText.textContent = "你的反馈会用于优化生成质量与结果风格。";
      }
      setView("results");
      showToast("已生成 3 个候选结果");
      persistState();
    }, 2600);
  }

  function decodeToken(token) {
    try {
      return decodeURIComponent(token || "");
    } catch {
      return "";
    }
  }

  function getItemByToken(token, source) {
    const name = decodeToken(token);
    if (!name) return null;

    const sourceList = source === "favorites" ? state.favorites : state.results;
    return sourceList.find((item) => item.name === name) || null;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // 降级到传统复制方案。
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return Boolean(success);
    } catch {
      return false;
    }
  }

  async function handleCopy(item) {
    if (!item) return;
    const ok = await copyText(item.name);
    showToast(ok ? "已复制网名" : "复制失败，请手动复制");
  }

  function toggleFavorite(item) {
    if (!item) return;

    const existingIndex = state.favorites.findIndex((fav) => fav.name === item.name);
    if (existingIndex >= 0) {
      state.favorites.splice(existingIndex, 1);
      showToast("已取消收藏");
    } else {
      state.favorites.unshift({
        ...item,
        favorite_time: Date.now()
      });
      showToast("已加入收藏");
    }

    renderResults();
    renderFavorites();
    persistState();
  }

  function updatePoster(item) {
    if (!item) return;

    if (refs.posterMode) refs.posterMode.textContent = MODE_LABELS[item.source_mode || state.mode || "cn"];
    if (refs.posterName) refs.posterName.textContent = item.name || "-";
    if (refs.posterTitle) refs.posterTitle.textContent = item.meaning_title || "专属寓意";
    if (refs.posterDesc) refs.posterDesc.textContent = item.meaning_desc || "";
    if (refs.posterKeywords) {
      const keywords = Array.isArray(item.source_keywords) ? item.source_keywords.join(" / ") : "";
      refs.posterKeywords.textContent = `关键词：${keywords || "-"}`;
    }
    if (refs.posterMeaning) {
      refs.posterMeaning.textContent = `寓意方向：${item.source_meaning || "未填写"}`;
    }
    if (refs.posterTags) {
      refs.posterTags.innerHTML = (item.style_tags || [])
        .slice(0, 3)
        .map((tag) => `<span>#${escapeHtml(tag)}</span>`)
        .join("");
    }
  }

  function openShareModal(item) {
    if (!item || !refs.shareModal) return;
    state.shareTarget = item;
    updatePoster(item);
    refs.shareModal.classList.remove("hidden");
    persistState();
  }

  function closeShareModal() {
    refs.shareModal?.classList.add("hidden");
  }

  function openFeedbackModal() {
    refs.feedbackModal?.classList.remove("hidden");
    refs.feedbackInput?.focus();
  }

  function closeFeedbackModal() {
    refs.feedbackModal?.classList.add("hidden");
  }

  function addKeyword(rawKeyword) {
    const keyword = cleanKeyword(rawKeyword);
    if (!keyword) return;

    if (state.keywords.includes(keyword)) {
      showToast("这个关键词已经添加过了");
      return;
    }
    if (state.keywords.length >= MAX_KEYWORDS) {
      showToast("最多添加 2 个关键词");
      return;
    }

    state.keywords.push(keyword);
    renderKeywords();
    persistState();
  }

  function removeKeyword(keyword) {
    state.keywords = state.keywords.filter((item) => item !== keyword);
    renderKeywords();
    persistState();
  }

  function bindCardActions(container, source) {
    if (!container) return;
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const { action, token } = button.dataset;
      const item = getItemByToken(token, source);
      if (!item) return;

      if (action === "copy") {
        void handleCopy(item);
        return;
      }
      if (action === "favorite") {
        toggleFavorite(item);
        return;
      }
      if (action === "share") {
        openShareModal(item);
      }
    });
  }

  function bindEvents() {
    refs.addKeywordBtn?.addEventListener("click", () => {
      addKeyword(refs.keywordInput?.value);
      if (refs.keywordInput) refs.keywordInput.value = "";
    });

    refs.keywordInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addKeyword(refs.keywordInput?.value);
      if (refs.keywordInput) refs.keywordInput.value = "";
    });

    refs.keywordBox?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      removeKeyword(button.dataset.remove || "");
    });

    refs.quickKeywordRow?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-keyword]");
      if (!button) return;
      addKeyword(button.dataset.keyword || "");
    });

    refs.modeSegment?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;
      state.mode = button.dataset.mode || "cn";
      renderMode();
      persistState();
    });

    refs.meaningRow?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-meaning]");
      if (!button) return;
      const meaning = button.dataset.meaning || "";
      state.meaning = state.meaning === meaning ? "" : meaning;
      renderMeaning();
      persistState();
    });

    refs.generateBtn?.addEventListener("click", () => {
      runGenerateFlow();
    });

    refs.regenBtn?.addEventListener("click", () => {
      runGenerateFlow();
    });

    refs.resultBackBtn?.addEventListener("click", () => {
      setView("home");
    });

    refs.editBtn?.addEventListener("click", () => {
      setView("home");
    });

    refs.favoriteBackBtn?.addEventListener("click", () => {
      setView("home");
    });

    refs.satisfiedBtn?.addEventListener("click", () => {
      refs.reasonRow?.classList.add("hidden");
      if (refs.satisfactionText) refs.satisfactionText.textContent = "收到你的满意反馈，感谢支持。";
      showToast("感谢反馈");
    });

    refs.unsatisfiedBtn?.addEventListener("click", () => {
      refs.reasonRow?.classList.remove("hidden");
      if (refs.satisfactionText) refs.satisfactionText.textContent = "可以点选不满意原因，帮助我们继续优化。";
    });

    refs.reasonRow?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reason]");
      if (!button) return;
      if (refs.satisfactionText) refs.satisfactionText.textContent = `已记录：${button.dataset.reason}。我们会继续优化。`;
      showToast("已记录你的反馈");
    });

    refs.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tab = button.dataset.tab;
        if (tab === "home") {
          setView("home");
          return;
        }
        if (tab === "favorites") {
          setView("favorites");
          return;
        }
        openFeedbackModal();
      });
    });

    refs.openFeedbackTop?.addEventListener("click", () => {
      openFeedbackModal();
    });

    refs.closeFeedbackBtn?.addEventListener("click", closeFeedbackModal);
    refs.cancelFeedbackBtn?.addEventListener("click", closeFeedbackModal);

    refs.submitFeedbackBtn?.addEventListener("click", () => {
      const text = refs.feedbackInput?.value.trim();
      if (!text) {
        showToast("请先输入反馈内容");
        refs.feedbackInput?.focus();
        return;
      }
      if (refs.feedbackInput) refs.feedbackInput.value = "";
      closeFeedbackModal();
      showToast("感谢你的反馈");
    });

    refs.feedbackModal?.addEventListener("click", (event) => {
      const shouldClose = event.target.closest("[data-close-feedback]");
      if (shouldClose) closeFeedbackModal();
    });

    refs.closeShareBtn?.addEventListener("click", closeShareModal);
    refs.shareModal?.addEventListener("click", (event) => {
      const shouldClose = event.target.closest("[data-close-share]");
      if (shouldClose) closeShareModal();
    });

    refs.savePosterBtn?.addEventListener("click", () => {
      showToast("演示版已触发保存动作");
    });

    bindCardActions(refs.resultStack, "results");
    bindCardActions(refs.favoriteStack, "favorites");

    window.addEventListener("popstate", (event) => {
      const next = event.state && event.state.appView;
      if (["home", "loading", "results", "favorites"].includes(next)) {
        setView(next, { pushHistory: false });
      }
    });
  }

  function initialize() {
    restoreState();
    if (state.view === "loading") state.view = "home";
    if (state.view === "results" && state.results.length === 0) state.view = "home";

    renderKeywords();
    renderMode();
    renderMeaning();
    renderResults();
    renderFavorites();
    setView(state.view, { pushHistory: false });

    window.history.replaceState({ appView: state.view }, "");
    bindEvents();
  }

  initialize();
})();

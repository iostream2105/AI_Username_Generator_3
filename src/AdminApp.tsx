import { useEffect, useMemo, useState } from "react";
import {
  adminLogin,
  clearAdminToken,
  exportAdminCsv,
  getAdminToken,
  getEvents,
  getFavorites,
  getFeedback,
  getGenerations,
  getOverview,
} from "./admin/service";
import {
  AdminEventRow,
  AdminFavoriteRow,
  AdminFeedbackRow,
  AdminGenerationRow,
  AdminOverviewResponse,
  AdminPagination,
} from "./admin/types";

type AdminTab = "overview" | "generations" | "events" | "favorites" | "feedback";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end.getTime());
  start.setDate(end.getDate() - 6);
  return { startDate: formatDateInput(start), endDate: formatDateInput(end) };
}

const EVENT_LABELS: Record<string, string> = {
  home_exposure: "首页曝光",
  click_generate: "点击生成",
  generate_success: "生成成功",
  click_copy: "点击复制",
  click_favorite: "点击收藏",
  click_share: "点击分享",
  save_poster: "保存海报",
};

const PAGE_LABELS: Record<string, string> = {
  home: "首页",
  results: "结果页",
  favorites: "我的收藏",
  admin: "后台管理端",
};

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  satisfaction: "满意度反馈",
  general: "通用建议",
};

const SATISFACTION_LABELS: Record<string, string> = {
  satisfied: "满意",
  unsatisfied: "不满意",
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatAdminDateTime(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const matched = raw.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (matched) {
    return `${matched[1]} ${matched[2]}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return [
    parsed.getFullYear(),
    pad2(parsed.getMonth() + 1),
    pad2(parsed.getDate()),
  ].join("-") + ` ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}:${pad2(parsed.getSeconds())}`;
}

function formatEventName(eventName: string) {
  const label = EVENT_LABELS[eventName];
  return label ? `${label}（${eventName}）` : eventName || "-";
}

function formatFeedbackType(feedbackType: string) {
  return FEEDBACK_TYPE_LABELS[feedbackType] || feedbackType || "-";
}

function formatSatisfactionValue(value: string) {
  return SATISFACTION_LABELS[value] || value || "-";
}

function formatPageName(pageName: string) {
  const label = PAGE_LABELS[pageName];
  return label ? `${label}（${pageName}）` : pageName || "-";
}

const TAB_LABELS: Record<AdminTab, string> = {
  overview: "总览看板",
  generations: "生成记录",
  events: "事件日志",
  favorites: "收藏",
  feedback: "反馈",
};

const EMPTY_PAGINATION: AdminPagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

function PaginationBar({
  pagination,
  onChange,
}: {
  pagination: AdminPagination;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-brand-800/80">
      <span>
        第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
      </span>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-brand-900/10 bg-white px-3 py-1 disabled:opacity-40"
          disabled={pagination.page <= 1}
          onClick={() => onChange(pagination.page - 1)}
        >
          上一页
        </button>
        <button
          className="rounded-lg border border-brand-900/10 bg-white px-3 py-1 disabled:opacity-40"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onChange(pagination.page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function TopActions({
  title,
  onRefresh,
  onExport,
}: {
  title: string;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-serif text-2xl text-brand-900">{title}</h2>
      <div className="flex gap-2">
        <button className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm" onClick={onRefresh}>
          手动刷新
        </button>
        <button className="rounded-lg bg-[#5A5A40] px-3 py-2 text-sm text-white" onClick={onExport}>
          导出 CSV
        </button>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [isAuthed, setIsAuthed] = useState(Boolean(getAdminToken()));
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState<AdminOverviewResponse["data"] | null>(null);

  const [generationRows, setGenerationRows] = useState<AdminGenerationRow[]>([]);
  const [generationPagination, setGenerationPagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [generationPage, setGenerationPage] = useState(1);
  const [isSuccess, setIsSuccess] = useState("");
  const [meaningTag, setMeaningTag] = useState("");
  const [styleTag, setStyleTag] = useState("");

  const [eventRows, setEventRows] = useState<AdminEventRow[]>([]);
  const [eventPagination, setEventPagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [eventPage, setEventPage] = useState(1);
  const [eventName, setEventName] = useState("");
  const [eventGenerationId, setEventGenerationId] = useState("");

  const [favoriteRows, setFavoriteRows] = useState<AdminFavoriteRow[]>([]);
  const [favoritePagination, setFavoritePagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [favoritePage, setFavoritePage] = useState(1);
  const [favoriteUserKey, setFavoriteUserKey] = useState("");
  const [favoriteName, setFavoriteName] = useState("");

  const [feedbackRows, setFeedbackRows] = useState<AdminFeedbackRow[]>([]);
  const [feedbackPagination, setFeedbackPagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackType, setFeedbackType] = useState("");
  const [satisfactionValue, setSatisfactionValue] = useState("");

  useEffect(() => {
    if (!isAuthed) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "overview") {
          const res = await getOverview({ startDate, endDate });
          setOverview(res.data);
          return;
        }
        if (activeTab === "generations") {
          const res = await getGenerations({
            startDate,
            endDate,
            page: generationPage,
            pageSize: 20,
            isSuccess,
            meaningTag,
            styleTag,
          });
          setGenerationRows(res.data);
          setGenerationPagination(res.pagination);
          return;
        }
        if (activeTab === "events") {
          const res = await getEvents({
            startDate,
            endDate,
            page: eventPage,
            pageSize: 20,
            eventName,
            generationId: eventGenerationId,
          });
          setEventRows(res.data);
          setEventPagination(res.pagination);
          return;
        }
        if (activeTab === "favorites") {
          const res = await getFavorites({
            startDate,
            endDate,
            page: favoritePage,
            pageSize: 20,
            userKey: favoriteUserKey,
            name: favoriteName,
          });
          setFavoriteRows(res.data);
          setFavoritePagination(res.pagination);
          return;
        }
        const res = await getFeedback({
          startDate,
          endDate,
          page: feedbackPage,
          pageSize: 20,
          feedbackType,
          satisfactionValue,
        });
        setFeedbackRows(res.data);
        setFeedbackPagination(res.pagination);
      } catch (e: any) {
        const message = String(e?.message || "加载失败");
        if (message.includes("401") || message.includes("Unauthorized")) {
          clearAdminToken();
          setIsAuthed(false);
          setLoginError("登录已过期，请重新登录。");
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [
    isAuthed,
    activeTab,
    startDate,
    endDate,
    reloadKey,
    generationPage,
    isSuccess,
    meaningTag,
    styleTag,
    eventPage,
    eventName,
    eventGenerationId,
    favoritePage,
    favoriteUserKey,
    favoriteName,
    feedbackPage,
    feedbackType,
    satisfactionValue,
  ]);

  const onRefresh = () => setReloadKey((prev) => prev + 1);

  const onExport = async () => {
    try {
      let exported: { blob: Blob; fileName: string };
      if (activeTab === "overview") {
        exported = await exportAdminCsv("overview", { startDate, endDate });
      } else if (activeTab === "generations") {
        exported = await exportAdminCsv("generations", { startDate, endDate, isSuccess, meaningTag, styleTag });
      } else if (activeTab === "events") {
        exported = await exportAdminCsv("events", { startDate, endDate, eventName, generationId: eventGenerationId });
      } else if (activeTab === "favorites") {
        exported = await exportAdminCsv("favorites", { startDate, endDate, userKey: favoriteUserKey, name: favoriteName });
      } else {
        exported = await exportAdminCsv("feedback", { startDate, endDate, feedbackType, satisfactionValue });
      }

      const objectUrl = URL.createObjectURL(exported.blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = exported.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      const message = String(e?.message || "导出失败");
      if (message.includes("401") || message.includes("Unauthorized")) {
        clearAdminToken();
        setIsAuthed(false);
        setLoginError("登录已过期，请重新登录。");
        return;
      }
      setError(message);
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("请输入账号和密码");
      return;
    }

    setLoginSubmitting(true);
    setLoginError("");
    try {
      await adminLogin(loginUsername.trim(), loginPassword);
      setIsAuthed(true);
      setLoginPassword("");
      setReloadKey((prev) => prev + 1);
    } catch (e: any) {
      setLoginError(String(e?.message || "登录失败"));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAuthed(false);
    setLoginPassword("");
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-brand-50 px-6 py-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="font-serif text-2xl text-brand-900">后台管理登录</h1>
          <p className="mt-1 text-sm text-brand-800/70">请输入管理员账号密码</p>
          <div className="mt-5 space-y-3">
            <input
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="账号"
              className="w-full rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="密码"
              className="w-full rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLogin();
              }}
            />
            {loginError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{loginError}</p>}
            <button
              onClick={() => void handleLogin()}
              disabled={loginSubmitting}
              className="w-full rounded-lg bg-[#5A5A40] px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {loginSubmitting ? "登录中..." : "登录"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 px-6 py-6">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl text-brand-900">名有意 后台管理端</h1>
              <p className="mt-1 text-sm text-brand-800/70">只读分析面板，默认近 7 天，手动刷新</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-brand-900/10 bg-white px-3 py-2 text-sm"
            >
              退出登录
            </button>
          </div>
        </header>

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-brand-800/80">
              开始日期
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="ml-2 rounded-lg border border-brand-900/10 px-2 py-1"
              />
            </label>
            <label className="text-sm text-brand-800/80">
              结束日期
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ml-2 rounded-lg border border-brand-900/10 px-2 py-1"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(TAB_LABELS) as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm ${
                  activeTab === tab ? "bg-[#5A5A40] text-white" : "bg-brand-50 text-brand-900"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <TopActions title={TAB_LABELS[activeTab]} onRefresh={onRefresh} onExport={() => void onExport()} />
          {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          {loading && <p className="mb-3 text-sm text-brand-800/70">加载中...</p>}

          {activeTab === "overview" && overview && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs text-brand-800/70">首页曝光</p>
                  <p className="text-2xl font-semibold text-brand-900">{overview.kpi.home_exposure}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs text-brand-800/70">点击生成</p>
                  <p className="text-2xl font-semibold text-brand-900">{overview.kpi.click_generate}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs text-brand-800/70">生成成功</p>
                  <p className="text-2xl font-semibold text-brand-900">{overview.kpi.generate_success}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs text-brand-800/70">点击分享</p>
                  <p className="text-2xl font-semibold text-brand-900">{overview.kpi.click_share}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs text-brand-800/70">保存海报</p>
                  <p className="text-2xl font-semibold text-brand-900">{overview.kpi.save_poster}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs text-brand-800/70">平均耗时（ms）</p>
                  <p className="text-2xl font-semibold text-brand-900">{overview.kpi.avg_latency_ms}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                <div className="rounded-xl border border-brand-900/10 p-3">生成成功率：{overview.kpi.generate_success_rate}%</div>
                <div className="rounded-xl border border-brand-900/10 p-3">复制率：{overview.kpi.copy_rate}%</div>
                <div className="rounded-xl border border-brand-900/10 p-3">收藏率：{overview.kpi.favorite_rate}%</div>
                <div className="rounded-xl border border-brand-900/10 p-3">分享点击率：{overview.kpi.share_click_rate}%</div>
                <div className="rounded-xl border border-brand-900/10 p-3">海报保存率：{overview.kpi.poster_save_rate}%</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-900/10 text-left">
                      <th className="py-2">日期</th>
                      <th>首页曝光</th>
                      <th>点击生成</th>
                      <th>生成成功</th>
                      <th>点击分享</th>
                      <th>保存海报</th>
                      <th>成功率%</th>
                      <th>分享点击率%</th>
                      <th>海报保存率%</th>
                      <th>复制率%</th>
                      <th>收藏率%</th>
                      <th>平均耗时（ms）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.trend.map((item) => (
                      <tr key={item.date} className="border-b border-brand-900/5">
                        <td className="py-2">{item.date}</td>
                        <td>{item.home_exposure}</td>
                        <td>{item.click_generate}</td>
                        <td>{item.generate_success}</td>
                        <td>{item.click_share}</td>
                        <td>{item.save_poster}</td>
                        <td>{item.generate_success_rate}</td>
                        <td>{item.share_click_rate}</td>
                        <td>{item.poster_save_rate}</td>
                        <td>{item.copy_rate}</td>
                        <td>{item.favorite_rate}</td>
                        <td>{item.avg_latency_ms}</td>
                      </tr>
                    ))}
                    {!overview.trend.length && (
                      <tr>
                        <td className="py-4 text-brand-800/60" colSpan={12}>
                          当前筛选下暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "generations" && (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={meaningTag}
                  onChange={(e) => {
                    setMeaningTag(e.target.value);
                    setGenerationPage(1);
                  }}
                  placeholder="寓意标签"
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                />
                <input
                  value={styleTag}
                  onChange={(e) => {
                    setStyleTag(e.target.value);
                    setGenerationPage(1);
                  }}
                  placeholder="风格标签"
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                />
                <select
                  value={isSuccess}
                  onChange={(e) => {
                    setIsSuccess(e.target.value);
                    setGenerationPage(1);
                  }}
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="true">成功</option>
                  <option value="false">失败</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-900/10 text-left">
                      <th className="py-2">生成批次 ID</th>
                      <th>输入关键词</th>
                      <th>期望寓意</th>
                      <th>风格标签</th>
                      <th>状态</th>
                      <th>耗时（ms）</th>
                      <th>结果数</th>
                      <th>请求时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generationRows.map((row) => (
                      <tr key={row.generation_id} className="border-b border-brand-900/5">
                        <td className="py-2">{row.generation_id}</td>
                        <td>{row.keywords_text}</td>
                        <td>{row.meaning_tag || "-"}</td>
                        <td>{row.style_tag || "-"}</td>
                        <td>{row.is_success ? "成功" : "失败"}</td>
                        <td>{row.latency_ms}</td>
                        <td>{row.result_count}</td>
                        <td>{formatAdminDateTime(row.requested_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!generationRows.length && <p className="py-4 text-sm text-brand-800/60">当前筛选下暂无数据</p>}
              </div>
              <PaginationBar pagination={generationPagination} onChange={setGenerationPage} />
            </div>
          )}

          {activeTab === "events" && (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    setEventPage(1);
                  }}
                  placeholder="事件标识（如 click_share）"
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                />
                <input
                  value={eventGenerationId}
                  onChange={(e) => {
                    setEventGenerationId(e.target.value);
                    setEventPage(1);
                  }}
                  placeholder="生成批次 ID"
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-900/10 text-left">
                      <th className="py-2">发生时间</th>
                      <th>事件名称</th>
                      <th>生成批次 ID</th>
                      <th>结果名称</th>
                      <th>执行结果</th>
                      <th>错误码</th>
                      <th>附加信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRows.map((row, idx) => (
                      <tr key={`${row.event_id}_${idx}`} className="border-b border-brand-900/5 align-top">
                        <td className="py-2">{formatAdminDateTime(row.event_time)}</td>
                        <td>{formatEventName(row.event_name)}</td>
                        <td>{row.generation_id || "-"}</td>
                        <td>{row.result_name || "-"}</td>
                        <td>{row.is_success ? "成功" : "失败"}</td>
                        <td>{row.error_code || "-"}</td>
                        <td className="max-w-[420px] break-all">{row.properties ? JSON.stringify(row.properties) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!eventRows.length && <p className="py-4 text-sm text-brand-800/60">当前筛选下暂无数据</p>}
              </div>
              <PaginationBar pagination={eventPagination} onChange={setEventPage} />
            </div>
          )}

          {activeTab === "favorites" && (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={favoriteUserKey}
                  onChange={(e) => {
                    setFavoriteUserKey(e.target.value);
                    setFavoritePage(1);
                  }}
                  placeholder="用户标识"
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                />
                <input
                  value={favoriteName}
                  onChange={(e) => {
                    setFavoriteName(e.target.value);
                    setFavoritePage(1);
                  }}
                  placeholder="网名包含"
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-900/10 text-left">
                      <th className="py-2">用户标识</th>
                      <th>网名</th>
                      <th>寓意标题</th>
                      <th>风格标签</th>
                      <th>收藏时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {favoriteRows.map((row, idx) => (
                      <tr key={`${row.user_key}_${row.name}_${idx}`} className="border-b border-brand-900/5">
                        <td className="py-2">{row.user_key}</td>
                        <td>{row.name}</td>
                        <td>{row.meaning_title}</td>
                        <td>{(row.style_tags || []).join(", ") || "-"}</td>
                        <td>{formatAdminDateTime(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!favoriteRows.length && <p className="py-4 text-sm text-brand-800/60">当前筛选下暂无数据</p>}
              </div>
              <PaginationBar pagination={favoritePagination} onChange={setFavoritePage} />
            </div>
          )}

          {activeTab === "feedback" && (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <select
                  value={feedbackType}
                  onChange={(e) => {
                    setFeedbackType(e.target.value);
                    setFeedbackPage(1);
                  }}
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                >
                  <option value="">全部类型</option>
                  <option value="satisfaction">满意度反馈</option>
                  <option value="general">通用建议</option>
                </select>
                <select
                  value={satisfactionValue}
                  onChange={(e) => {
                    setSatisfactionValue(e.target.value);
                    setFeedbackPage(1);
                  }}
                  className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm"
                >
                  <option value="">全部满意度</option>
                  <option value="satisfied">满意</option>
                  <option value="unsatisfied">不满意</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-900/10 text-left">
                      <th className="py-2">提交时间</th>
                      <th>反馈类型</th>
                      <th>满意度</th>
                      <th>原因标签</th>
                      <th>反馈内容</th>
                      <th>所在页面</th>
                      <th>生成批次 ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackRows.map((row, idx) => (
                      <tr key={`${row.user_key}_${row.created_at}_${idx}`} className="border-b border-brand-900/5">
                        <td className="py-2">{formatAdminDateTime(row.created_at)}</td>
                        <td>{formatFeedbackType(row.feedback_type)}</td>
                        <td>{formatSatisfactionValue(row.satisfaction_value)}</td>
                        <td>{row.reason_tag || "-"}</td>
                        <td className="max-w-[420px] break-all">{row.content || "-"}</td>
                        <td>{formatPageName(row.page_name)}</td>
                        <td>{row.generation_id || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!feedbackRows.length && <p className="py-4 text-sm text-brand-800/60">当前筛选下暂无数据</p>}
              </div>
              <PaginationBar pagination={feedbackPagination} onChange={setFeedbackPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

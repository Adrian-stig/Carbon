"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CategoryKey =
  | "clothing"
  | "food"
  | "home"
  | "travel"
  | "shopping"
  | "waste";

type CategoryTotals = Record<CategoryKey, number>;

type Profile = {
  email: string;
  displayName: string;
  city: string;
  householdSize: number;
  billingDays: number;
  electricityKwh: number;
  gasM3: number;
  waterM3: number;
  reminderEnabled: boolean;
  onboarded: boolean;
};

type Submission = {
  id: number;
  weekStart: string;
  totalKg: number;
  factorVersion: string;
  submittedAt: string;
  responses: Record<string, number>;
  categories: CategoryTotals;
};

type AppData = {
  identity: { displayName: string; email: string };
  profile: Profile | null;
  submissions: Submission[];
  currentWeek: string;
};

type LocalState = {
  version: 1;
  profile: Profile | null;
  submissions: Submission[];
};

type View = "overview" | "history" | "enterprise";

const EMPTY_CATEGORIES: CategoryTotals = {
  clothing: 0,
  food: 0,
  home: 0,
  travel: 0,
  shopping: 0,
  waste: 0,
};

const LOCAL_STORAGE_KEY = "carbon-tracker:local-state";
const LOCAL_STATE_VERSION = 1;

function currentWeekStart() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function readLocalState(): LocalState {
  const fallback: LocalState = {
    version: LOCAL_STATE_VERSION,
    profile: null,
    submissions: [],
  };
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return fallback;

  try {
    const value = JSON.parse(raw) as Partial<LocalState>;
    if (
      value.version !== LOCAL_STATE_VERSION ||
      (value.profile !== null && typeof value.profile !== "object") ||
      !Array.isArray(value.submissions)
    ) {
      return fallback;
    }
    return {
      version: LOCAL_STATE_VERSION,
      profile: value.profile ?? null,
      submissions: value.submissions,
    };
  } catch {
    return fallback;
  }
}

function writeLocalState(data: AppData) {
  const localState: LocalState = {
    version: LOCAL_STATE_VERSION,
    profile: data.profile,
    submissions: data.submissions,
  };
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localState));
}

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; short: string; color: string; pale: string; description: string }
> = {
  clothing: {
    label: "衣物消费",
    short: "衣",
    color: "#8967b1",
    pale: "#eee8f5",
    description: "只记录本周实际留下的新购衣物",
  },
  food: {
    label: "饮食",
    short: "食",
    color: "#e58a58",
    pale: "#f9ede4",
    description: "按一周实际食用重量估算",
  },
  home: {
    label: "居住能耗",
    short: "住",
    color: "#3b8e79",
    pale: "#e0f0eb",
    description: "由家庭账单自动折算个人周均值",
  },
  travel: {
    label: "交通出行",
    short: "行",
    color: "#3a7fa7",
    pale: "#e2eef5",
    description: "按不同交通方式的人公里计算",
  },
  shopping: {
    label: "网购物流",
    short: "购",
    color: "#bc735e",
    pale: "#f5e8e4",
    description: "仅计算配送、包装和退货",
  },
  waste: {
    label: "垃圾处理",
    short: "弃",
    color: "#6f806e",
    pale: "#e9eee8",
    description: "采用上海焚烧与资源化处理口径",
  },
};

const STEP_FIELDS: Record<
  CategoryKey,
  { key: string; label: string; unit: string; hint?: string }[]
> = {
  clothing: [
    { key: "tops", label: "上衣、衬衫或T恤", unit: "件" },
    { key: "trousers", label: "裤装或裙装", unit: "件" },
    { key: "coats", label: "外套", unit: "件" },
    { key: "shoes", label: "鞋", unit: "双" },
    { key: "secondhand", label: "其中二手衣物", unit: "件", hint: "二手购买按较低影响估算" },
  ],
  food: [
    { key: "grains", label: "米面与其他谷物", unit: "kg" },
    { key: "pork", label: "猪肉", unit: "kg" },
    { key: "beefLamb", label: "牛肉与羊肉", unit: "kg" },
    { key: "poultry", label: "禽肉", unit: "kg" },
    { key: "seafood", label: "水产", unit: "kg" },
    { key: "eggsDairy", label: "蛋与奶制品", unit: "kg / L" },
    { key: "tofu", label: "豆制品", unit: "kg" },
    { key: "produce", label: "蔬菜与水果", unit: "kg" },
  ],
  home: [],
  travel: [
    { key: "metroKm", label: "地铁", unit: "km" },
    { key: "busKm", label: "公交", unit: "km" },
    { key: "carKm", label: "燃油私家车", unit: "km" },
    { key: "evKm", label: "纯电动汽车", unit: "km" },
    { key: "taxiKm", label: "出租车或网约车", unit: "km" },
    { key: "trainKm", label: "火车", unit: "km" },
    { key: "flightKm", label: "飞机", unit: "km" },
    { key: "walkBikeKm", label: "步行与骑行", unit: "km" },
  ],
  shopping: [
    { key: "localPackages", label: "同城或近距离包裹", unit: "件" },
    { key: "domesticPackages", label: "跨省包裹", unit: "件" },
    { key: "expressPackages", label: "加急包裹", unit: "件" },
    { key: "returnedPackages", label: "退货包裹", unit: "件" },
    { key: "packageWeight", label: "包裹总重量", unit: "kg", hint: "不清楚时可按每件1 kg估算" },
  ],
  waste: [
    { key: "dryWaste", label: "干垃圾", unit: "kg" },
    { key: "wetWaste", label: "湿垃圾", unit: "kg" },
    { key: "paperRecycle", label: "回收废纸", unit: "kg" },
    { key: "plasticRecycle", label: "回收塑料", unit: "kg" },
    { key: "glassMetalRecycle", label: "回收玻璃与金属", unit: "kg" },
    { key: "textileRecycle", label: "回收废织物", unit: "kg" },
  ],
};

const STEPS = Object.keys(CATEGORY_META) as CategoryKey[];

const FACTOR_NOTES = [
  ["上海居民用电", "0.5737 kgCO₂/kWh", "生态环境部，2023省级电力因子"],
  ["上海轨道交通", "0.033 kgCO₂/人公里", "上海碳普惠方法学"],
  ["上海地面公交", "0.064 kgCO₂/人公里", "上海碳普惠方法学"],
  ["上海机动化基准", "0.130 kgCO₂/人公里", "仅用于减排建议，不冲减总量"],
  ["可回收物", "按纸、塑料、玻璃、金属、织物分类", "减排效益单列展示"],
];

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatWeek(dateValue: string) {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getMonth() + 1}.${start.getDate()}–${end.getMonth() + 1}.${end.getDate()}`;
}

function homeWeekly(profile: Profile | null) {
  if (!profile) return 0;
  const scale = 7 / Math.max(1, profile.billingDays) / Math.max(1, profile.householdSize);
  return (
    profile.electricityKwh * scale * 0.5737 +
    profile.gasM3 * scale * 2.16 +
    profile.waterM3 * scale * 0.377
  );
}

function calculateCategories(values: Record<string, number>, profile: Profile | null) {
  const clothing =
    (values.tops || 0) * 4.1 +
    (values.trousers || 0) * 11.2 +
    (values.coats || 0) * 18.7 +
    (values.shoes || 0) * 12 +
    (values.secondhand || 0) * 0.5;
  const food =
    (values.grains || 0) * 2.51 +
    (values.pork || 0) * 3.83 +
    (values.beefLamb || 0) * 19.56 +
    (values.poultry || 0) * 4.42 +
    (values.seafood || 0) * 5.4 +
    (values.eggsDairy || 0) * 1.8 +
    (values.tofu || 0) * 1.6 +
    (values.produce || 0) * 0.42;
  const travel =
    (values.metroKm || 0) * 0.033 +
    (values.busKm || 0) * 0.064 +
    (values.carKm || 0) * 0.18 +
    (values.evKm || 0) * 0.055 +
    (values.taxiKm || 0) * 0.21 +
    (values.trainKm || 0) * 0.0265 +
    (values.flightKm || 0) * 0.094;
  const shopping =
    (values.localPackages || 0) * 0.16 +
    (values.domesticPackages || 0) * 0.38 +
    (values.expressPackages || 0) * 0.22 +
    (values.returnedPackages || 0) * 0.34 +
    (values.packageWeight || 0) * 0.05;
  const waste = (values.dryWaste || 0) * 0.254 + (values.wetWaste || 0) * 0.1;

  return {
    clothing: round(clothing, 2),
    food: round(food, 2),
    home: round(homeWeekly(profile), 2),
    travel: round(travel, 2),
    shopping: round(shopping, 2),
    waste: round(waste, 2),
  } satisfies CategoryTotals;
}

function totalOf(categories: CategoryTotals) {
  return Object.values(categories).reduce((sum, value) => sum + Number(value || 0), 0);
}

function dominantCategory(categories: CategoryTotals) {
  return (Object.entries(categories) as [CategoryKey, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "food";
}

function buildSuggestions(categories: CategoryTotals) {
  const order = (Object.entries(categories) as [CategoryKey, number][]).sort((a, b) => b[1] - a[1]);
  const suggestions: Record<CategoryKey, { title: string; body: string; impact: string }> = {
    clothing: { title: "延长衣物使用周期", body: "下次购买前先整理衣柜，优先选择二手或耐穿单品。", impact: "少购1件上衣 ≈ 4.1 kg" },
    food: { title: "从一餐开始替换红肉", body: "将约500克牛羊肉替换为禽肉或豆制品，营养选择更轻盈。", impact: "预计减少 7.6 kg / 周" },
    home: { title: "关注家中待机用电", body: "睡前关闭非必要插座，并将空调设置在合理温度。", impact: "每节省10 kWh ≈ 5.7 kg" },
    travel: { title: "把短途交给地铁", body: "将20公里燃油车行程替换为上海地铁，变化会很明显。", impact: "预计减少 2.9 kg / 周" },
    shopping: { title: "把订单合在一起", body: "关闭不必要的加急配送，尽量一次下单并减少退货。", impact: "合并2个包裹 ≈ 0.4 kg" },
    waste: { title: "继续做好分类回收", body: "废塑料与废织物的资源化收益尤其显著，请保持干净投放。", impact: "1 kg废塑料回收 ≈ 3.6 kg减排" },
  };
  return order.slice(0, 3).map(([key]) => ({ key, ...suggestions[key] }));
}

function donutGradient(categories: CategoryTotals) {
  const total = Math.max(totalOf(categories), 0.0001);
  let cursor = 0;
  const stops = (Object.keys(categories) as CategoryKey[]).map((key) => {
    const start = cursor;
    cursor += (categories[key] / total) * 100;
    return `${CATEGORY_META[key].color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function CarbonDashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<View>("overview");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [factorOpen, setFactorOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadData() {
    setError("");
    try {
      const localState = readLocalState();
      setData({
        identity: { displayName: "新用户", email: "" },
        profile: localState.profile,
        submissions: localState.submissions,
        currentWeek: currentWeekStart(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "浏览器本地数据加载失败");
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const latest = data?.submissions.at(-1);
  const previous = data?.submissions.at(-2);
  const categories = latest?.categories ?? EMPTY_CATEGORIES;
  const currentTotal = latest?.totalKg ?? 0;
  const change = previous?.totalKg
    ? ((currentTotal - previous.totalKg) / previous.totalKg) * 100
    : 0;
  const suggestions = useMemo(() => buildSuggestions(categories), [categories]);
  const draftCategories = useMemo(
    () => calculateCategories(responses, data?.profile ?? null),
    [responses, data?.profile],
  );

  function openCheckin() {
    const existing = data?.submissions.find((item) => item.weekStart === data.currentWeek);
    setResponses(existing?.responses ?? {});
    setStep(0);
    setCheckinOpen(true);
  }

  function submitCheckin() {
    if (!data) return;
    setSaving(true);
    setError("");
    try {
      const existing = data.submissions.find(
        (item) => item.weekStart === data.currentWeek,
      );
      const submission: Submission = {
        id: existing?.id ?? Date.now(),
        weekStart: data.currentWeek,
        responses,
        categories: draftCategories,
        factorVersion: "SH-2026.1",
        totalKg: round(totalOf(draftCategories), 2),
        submittedAt: new Date().toISOString(),
      };
      const submissions = existing
        ? data.submissions.map((item) =>
            item.weekStart === data.currentWeek ? submission : item,
          )
        : [...data.submissions, submission];
      const nextData = {
        ...data,
        submissions: submissions.toSorted((a, b) =>
          a.weekStart.localeCompare(b.weekStart),
        ),
      };
      writeLocalState(nextData);
      setData(nextData);
      setCheckinOpen(false);
      setView("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function saveProfile(profile: Profile) {
    setSaving(true);
    setError("");
    try {
      if (!data) return;
      const nextData = { ...data, profile };
      writeLocalState(nextData);
      setData(nextData);
      setProfileOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <main className="loading-screen">
        <div className="brand-mark">碳</div>
        <p>{error || "正在准备你的低碳空间…"}</p>
        {error ? (
          <button onClick={() => void loadData()}>重新加载</button>
        ) : null}
      </main>
    );
  }

  if (!data.profile?.onboarded) {
    return (
      <Onboarding
        identity={data.identity}
        saving={saving}
        error={error}
        onSave={saveProfile}
      />
    );
  }

  const dominant = dominantCategory(categories);
  const currentSubmitted = data.submissions.some((item) => item.weekStart === data.currentWeek);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("overview")} aria-label="返回个人概览">
          <span className="brand-mark">碳</span>
          <span>碳迹</span>
          <small>SHANGHAI</small>
        </button>
        <nav aria-label="主要导航">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>个人概览</button>
          <button onClick={openCheckin}>本周打卡</button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>历史记录</button>
          <button className={view === "enterprise" ? "active" : ""} onClick={() => setView("enterprise")}>企业总览</button>
        </nav>
        <div className="header-actions">
          <button className="method-button" onClick={() => setFactorOpen(true)}>核算说明</button>
          <button className="profile-button" onClick={() => setProfileOpen(true)}>
            <span className="avatar">{data.profile.displayName.slice(0, 1)}</span>
            <span className="profile-copy"><strong>{data.profile.displayName}</strong><small>{data.profile.city}</small></span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {view === "overview" ? (
          <Overview
            data={data}
            categories={categories}
            currentTotal={currentTotal}
            change={change}
            dominant={dominant}
            suggestions={suggestions}
            currentSubmitted={currentSubmitted}
            onCheckin={openCheckin}
            onHistory={() => setView("history")}
          />
        ) : null}
        {view === "history" ? <HistoryView submissions={data.submissions} /> : null}
        {view === "enterprise" ? (
          <EnterpriseView currentWeek={data.currentWeek} />
        ) : null}
      </main>

      <footer>
        <span>碳迹 · 上海员工低碳行动</span>
        <span>数据保存在本浏览器 · 因子版本 SH-2026.1</span>
      </footer>

      {checkinOpen ? (
        <CheckinModal
          profile={data.profile}
          step={step}
          values={responses}
          categories={draftCategories}
          saving={saving}
          error={error}
          onStep={setStep}
          onChange={(key, value) => setResponses((current) => ({ ...current, [key]: value }))}
          onClose={() => setCheckinOpen(false)}
          onSubmit={submitCheckin}
        />
      ) : null}
      {profileOpen ? (
        <ProfileModal
          profile={data.profile}
          saving={saving}
          error={error}
          onClose={() => setProfileOpen(false)}
          onSave={saveProfile}
        />
      ) : null}
      {factorOpen ? <FactorModal onClose={() => setFactorOpen(false)} /> : null}
    </div>
  );
}

function Overview({
  data,
  categories,
  currentTotal,
  change,
  dominant,
  suggestions,
  currentSubmitted,
  onCheckin,
  onHistory,
}: {
  data: AppData;
  categories: CategoryTotals;
  currentTotal: number;
  change: number;
  dominant: CategoryKey;
  suggestions: { key: CategoryKey; title: string; body: string; impact: string }[];
  currentSubmitted: boolean;
  onCheckin: () => void;
  onHistory: () => void;
}) {
  const maxTrend = Math.max(...data.submissions.map((item) => item.totalKg), 1);
  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">星期五 · 上海</p>
          <h1>下午好，{data.profile?.displayName}</h1>
          <p className="lede">每一周的小选择，都会在这里留下清晰的变化。</p>
        </div>
        <div className={`checkin-card ${currentSubmitted ? "done" : ""}`}>
          <span className="status-dot" />
          <div><strong>{currentSubmitted ? "本周已完成" : "本周待完成"}</strong><small>{currentSubmitted ? "可在截止前更新记录" : "记录上周的六类生活数据"}</small></div>
          <button onClick={onCheckin}>{currentSubmitted ? "查看并更新" : "开始打卡"}<span>→</span></button>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card hero-metric">
          <span className="metric-label">最近一周碳足迹</span>
          <div className="metric-value"><strong>{round(currentTotal)}</strong><span>kg CO₂e</span></div>
          <div className={`change-pill ${change <= 0 ? "good" : "up"}`}>{change <= 0 ? "↓" : "↑"} {Math.abs(round(change))}% <span>较前一周</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-label">最大来源</span>
          <div className="source-badge" style={{ background: CATEGORY_META[dominant].pale, color: CATEGORY_META[dominant].color }}>{CATEGORY_META[dominant].short}</div>
          <strong className="source-name">{CATEGORY_META[dominant].label}</strong>
          <small>{round(categories[dominant])} kg CO₂e</small>
        </article>
        <article className="metric-card">
          <span className="metric-label">连续记录</span>
          <div className="metric-value small"><strong>{data.submissions.length}</strong><span>周</span></div>
          <div className="week-dots" aria-label="最近七周记录"><i/><i/><i/><i/><i/><i/><i className="today"/></div>
        </article>
        <article className="metric-card company-pulse">
          <span className="metric-label">当前保存方式</span>
          <div className="metric-value local-mode"><strong>本地</strong><span>浏览器</span></div>
          <div className="mini-progress"><span style={{ width: "100%" }} /></div>
          <small>企业汇总将在启用数据库后提供</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel trend-panel">
          <div className="panel-heading"><div><span className="eyebrow">我的变化</span><h2>近八周趋势</h2></div><button onClick={onHistory}>查看全部 →</button></div>
          <div className="trend-chart" aria-label="近八周碳排放柱状趋势图">
            {data.submissions.slice(-8).map((item, index, array) => (
              <div className="trend-column" key={item.weekStart}>
                <span className="bar-value">{round(item.totalKg)}</span>
                <div className={`trend-bar ${index === array.length - 1 ? "latest" : ""}`} style={{ height: `${Math.max(14, (item.totalKg / maxTrend) * 150)}px` }} />
                <small>{formatWeek(item.weekStart).split("–")[0]}</small>
              </div>
            ))}
          </div>
          <div className="trend-note"><span>↘</span><p><strong>方向很好</strong>　最近四周比此前四周平均低 {round(Math.max(0, Math.abs(change)))}%。</p></div>
        </article>

        <article className="panel category-panel">
          <div className="panel-heading"><div><span className="eyebrow">排放构成</span><h2>六类占比</h2></div><span className="week-tag">最近一周</span></div>
          <div className="category-layout">
            <div className="donut" style={{ background: donutGradient(categories) }}><div><strong>{round(currentTotal)}</strong><span>kg CO₂e</span></div></div>
            <div className="category-list">
              {(Object.keys(categories) as CategoryKey[]).map((key) => (
                <div key={key}><span className="legend-dot" style={{ background: CATEGORY_META[key].color }} /><span>{CATEGORY_META[key].label}</span><strong>{round(categories[key])}</strong></div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="suggestions-section">
        <div className="section-heading"><div><span className="eyebrow">为你生成</span><h2>下周可以从这里开始</h2></div><p>建议依据你的最高排放类别生成，不参与员工排名。</p></div>
        <div className="suggestion-grid">
          {suggestions.map((item, index) => (
            <article className="suggestion-card" key={item.key}>
              <div className="suggestion-top"><span className="suggestion-number">0{index + 1}</span><span className="source-badge small" style={{ background: CATEGORY_META[item.key].pale, color: CATEGORY_META[item.key].color }}>{CATEGORY_META[item.key].short}</span></div>
              <h3>{item.title}</h3><p>{item.body}</p><strong>{item.impact}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="reminder-strip">
        <div className="reminder-icon">信</div>
        <div><strong>邮件提醒暂未启用</strong><p>当前邮箱只保存在本浏览器；接入邮件服务后再启用每周提醒。</p></div>
        <span>{data.profile?.email || "未填写邮箱"}</span>
      </section>
    </>
  );
}

function HistoryView({ submissions }: { submissions: Submission[] }) {
  const reversed = [...submissions].reverse();
  return (
    <section className="page-section">
      <div className="page-title"><div><p className="eyebrow">个人记录</p><h1>每一周，都看得见</h1><p>历史结果保留提交时使用的因子版本，不会因后续更新而改变。</p></div><span className="record-count">已记录 {submissions.length} 周</span></div>
      <div className="history-list">
        {reversed.map((item, index) => {
          const max = Math.max(...Object.values(item.categories), 1);
          return (
            <article className="history-card" key={item.id}>
              <div className="history-date"><small>{index === 0 ? "最近一周" : "已完成"}</small><strong>{formatWeek(item.weekStart)}</strong><span>因子 {item.factorVersion}</span></div>
              <div className="history-total"><strong>{round(item.totalKg)}</strong><span>kg CO₂e</span></div>
              <div className="history-bars">
                {(Object.keys(item.categories) as CategoryKey[]).map((key) => (
                  <div key={key} title={`${CATEGORY_META[key].label} ${round(item.categories[key])} kg`}><span style={{ height: `${Math.max(5, (item.categories[key] / max) * 52)}px`, background: CATEGORY_META[key].color }} /><small>{CATEGORY_META[key].short}</small></div>
                ))}
              </div>
              <span className="history-dominant">主要来源 · {CATEGORY_META[dominantCategory(item.categories)].label}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EnterpriseView({ currentWeek }: { currentWeek: string }) {
  return (
    <section className="page-section">
      <div className="page-title"><div><p className="eyebrow">企业汇总 · 稍后启用</p><h1>当前仅保存个人记录</h1><p>尚未配置数据库，因此系统不会上传、合并或展示员工数据。</p></div><span className="week-tag">{formatWeek(currentWeek)}</span></div>
      <div className="enterprise-unavailable panel">
        <span className="enterprise-unavailable-icon">企</span>
        <div>
          <p className="eyebrow">本地原型模式</p>
          <h2>企业统计将在接入数据库后提供</h2>
          <p>届时可生成填报率、总排放、人均值、六类占比和变化趋势；当前不会显示占位数字或模拟员工数据。</p>
        </div>
      </div>
      <div className="privacy-note"><strong>当前数据范围</strong><p>姓名、邮箱、家庭基线和每周打卡均只存于当前浏览器；清除网站数据或更换设备后无法恢复。</p></div>
    </section>
  );
}

function CheckinModal({
  profile,
  step,
  values,
  categories,
  saving,
  error,
  onStep,
  onChange,
  onClose,
  onSubmit,
}: {
  profile: Profile;
  step: number;
  values: Record<string, number>;
  categories: CategoryTotals;
  saving: boolean;
  error: string;
  onStep: (step: number) => void;
  onChange: (key: string, value: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const key = STEPS[step];
  const meta = CATEGORY_META[key];
  const fields = STEP_FIELDS[key];
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="checkin-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title">
        <aside className="checkin-aside">
          <div className="brand light"><span className="brand-mark">碳</span><span>本周打卡</span></div>
          <p>回顾过去七天。没有发生的项目可以保留为 0。</p>
          <ol>
            {STEPS.map((item, index) => <li key={item} className={index === step ? "active" : index < step ? "done" : ""}><button onClick={() => onStep(index)}><span>{index < step ? "✓" : index + 1}</span><div><strong>{CATEGORY_META[item].label}</strong><small>{CATEGORY_META[item].description}</small></div></button></li>)}
          </ol>
          <div className="live-total"><small>当前估算</small><strong>{round(totalOf(categories))}</strong><span>kg CO₂e</span></div>
        </aside>
        <div className="checkin-main">
          <button className="close-button" onClick={onClose} aria-label="关闭">×</button>
          <div className="step-header"><span className="source-badge" style={{ background: meta.pale, color: meta.color }}>{meta.short}</span><div><p>第 {step + 1} / 6 步</p><h2 id="checkin-title">{meta.label}</h2><span>{meta.description}</span></div></div>
          {key === "home" ? (
            <div className="home-summary">
              <div><span>家庭人数</span><strong>{profile.householdSize} 人</strong></div><div><span>账单周期</span><strong>{profile.billingDays} 天</strong></div><div><span>月用电</span><strong>{profile.electricityKwh} kWh</strong></div><div><span>月燃气</span><strong>{profile.gasM3} m³</strong></div><div><span>月用水</span><strong>{profile.waterM3} m³</strong></div><div className="home-result"><span>个人周均</span><strong>{round(categories.home)} kg CO₂e</strong></div>
              <p>由最近账单按天数和家庭人数自动分摊。如账单已变化，可在个人设置中更新。</p>
            </div>
          ) : (
            <div className="field-grid">
              {fields.map((field) => (
                <label key={field.key}><span>{field.label}</span><div className="number-field"><input type="number" min="0" step="0.1" inputMode="decimal" value={values[field.key] ?? ""} placeholder="0" onChange={(event) => onChange(field.key, Math.max(0, Number(event.target.value) || 0))}/><em>{field.unit}</em></div>{field.hint ? <small>{field.hint}</small> : null}</label>
              ))}
            </div>
          )}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions"><button className="secondary" disabled={step === 0} onClick={() => onStep(step - 1)}>上一步</button>{step < STEPS.length - 1 ? <button className="primary" onClick={() => onStep(step + 1)}>下一步 <span>→</span></button> : <button className="primary" disabled={saving} onClick={onSubmit}>{saving ? "正在保存…" : `提交 · ${round(totalOf(categories))} kg`} <span>→</span></button>}</div>
        </div>
      </section>
    </div>
  );
}

function ProfileModal({ profile, saving, error, onClose, onSave }: { profile: Profile; saving: boolean; error: string; onClose: () => void; onSave: (profile: Profile) => void }) {
  const [form, setForm] = useState(profile);
  function update<K extends keyof Profile>(key: K, value: Profile[K]) { setForm((current) => ({ ...current, [key]: value })); }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="simple-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button className="close-button" onClick={onClose} aria-label="关闭">×</button><p className="eyebrow">家庭基线</p><h2 id="profile-title">更新居住信息</h2><p>填写最近一期账单中的实际用量，系统将自动折算成个人每周用量。</p>
        <form onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
          <div className="two-fields"><label><span>姓名</span><input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} /></label><label><span>常住城市</span><input value={form.city} onChange={(e) => update("city", e.target.value)} /></label></div>
          <label><span>企业邮箱（可选）</span><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
          <div className="two-fields"><label><span>家庭人数</span><input type="number" min="1" value={form.householdSize} onChange={(e) => update("householdSize", Number(e.target.value))} /></label><label><span>账单覆盖天数</span><input type="number" min="1" value={form.billingDays} onChange={(e) => update("billingDays", Number(e.target.value))} /></label></div>
          <div className="three-fields"><label><span>用电 kWh</span><input type="number" min="0" step="0.1" value={form.electricityKwh} onChange={(e) => update("electricityKwh", Number(e.target.value))} /></label><label><span>天然气 m³</span><input type="number" min="0" step="0.1" value={form.gasM3} onChange={(e) => update("gasM3", Number(e.target.value))} /></label><label><span>自来水 m³</span><input type="number" min="0" step="0.1" value={form.waterM3} onChange={(e) => update("waterM3", Number(e.target.value))} /></label></div>
          <label className="toggle-row"><input type="checkbox" checked={form.reminderEnabled} onChange={(e) => update("reminderEnabled", e.target.checked)} /><span><strong>保存每周提醒偏好</strong><small>接入邮件服务后生效，当前不会发送邮件</small></span></label>
          {error ? <p className="form-error">{error}</p> : null}<button className="primary full" type="submit" disabled={saving}>{saving ? "正在保存…" : "保存家庭基线"}</button>
        </form>
      </section>
    </div>
  );
}

function FactorModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="simple-modal factor-modal" role="dialog" aria-modal="true" aria-labelledby="factor-title">
        <button className="close-button" onClick={onClose} aria-label="关闭">×</button><p className="eyebrow">方法透明</p><h2 id="factor-title">核算口径与因子</h2><p>这是一套用于行为反馈的筛查型个人碳足迹估算，不用于正式碳盘查或碳信用签发。</p>
        <div className="factor-list">{FACTOR_NOTES.map(([label, value, source]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{source}</small></div>)}</div>
        <div className="formula-box"><span>基本公式</span><strong>活动数量 × 排放因子 × 个人分摊系数</strong><p>提交记录会保存当时的因子版本，后续更新不会改动历史结果。</p></div>
        <button className="primary full" onClick={onClose}>我知道了</button>
      </section>
    </div>
  );
}

function Onboarding({ identity, saving, error, onSave }: { identity: AppData["identity"]; saving: boolean; error: string; onSave: (profile: Profile) => void }) {
  const [form, setForm] = useState<Profile>({ email: identity.email, displayName: identity.displayName, city: "上海", householdSize: 1, billingDays: 30, electricityKwh: 0, gasM3: 0, waterM3: 0, reminderEnabled: false, onboarded: true });
  function update<K extends keyof Profile>(key: K, value: Profile[K]) { setForm((current) => ({ ...current, [key]: value })); }
  return (
    <main className="onboarding-page">
      <section className="onboarding-intro"><div className="brand light"><span className="brand-mark">碳</span><span>碳迹</span></div><div><p className="eyebrow">WELCOME · SHANGHAI</p><h1>从一张家庭账单，开始看见自己的碳足迹。</h1><p>这一步只需完成一次。之后每周的居住能耗会自动按家庭人数和账单周期分摊。</p></div><div className="onboarding-promise"><span>01</span><p>不做员工排名</p><span>02</span><p>历史因子可追溯</p><span>03</span><p>数据只留在本机</p></div></section>
      <section className="onboarding-form"><p className="eyebrow">首次登记 · 约2分钟</p><h2>你的家庭基线</h2><form onSubmit={(event: FormEvent) => { event.preventDefault(); onSave(form); }}><div className="two-fields"><label><span>姓名</span><input required value={form.displayName} onChange={(e) => update("displayName", e.target.value)} /></label><label><span>常住城市</span><input required value={form.city} onChange={(e) => update("city", e.target.value)} /></label></div><label><span>企业邮箱（可选）</span><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label><div className="two-fields"><label><span>家庭常住人数</span><input required type="number" min="1" value={form.householdSize} onChange={(e) => update("householdSize", Number(e.target.value))} /></label><label><span>账单覆盖天数</span><input required type="number" min="1" value={form.billingDays} onChange={(e) => update("billingDays", Number(e.target.value))} /></label></div><p className="form-group-title">最近一期家庭账单用量</p><div className="three-fields"><label><span>用电 kWh</span><input required type="number" min="0" step="0.1" value={form.electricityKwh || ""} onChange={(e) => update("electricityKwh", Number(e.target.value))} /></label><label><span>天然气 m³</span><input type="number" min="0" step="0.1" value={form.gasM3 || ""} onChange={(e) => update("gasM3", Number(e.target.value))} /></label><label><span>自来水 m³</span><input type="number" min="0" step="0.1" value={form.waterM3 || ""} onChange={(e) => update("waterM3", Number(e.target.value))} /></label></div>{error ? <p className="form-error">{error}</p> : null}<button className="primary full" type="submit" disabled={saving}>{saving ? "正在建立基线…" : "完成登记，进入碳迹"}<span>→</span></button></form></section>
    </main>
  );
}

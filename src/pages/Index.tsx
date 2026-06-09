import { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  Sparkles,
  ChevronRight,
  UserCog,
  Home,
  CalendarClock,
  Flame,
  Shield,
  BarChart3,
  Users,
  Bot,
  Gauge,
  GraduationCap,
  Headphones,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { counterparties, type Counterparty, type RiskType, type ProcessStage } from "@/lib/mock-data";
import { CounterpartyModal } from "@/components/counterparty/CounterpartyModal";
import { riskMeta, allChipMeta, riskOrder } from "@/components/counterparty/risk-meta";
import { AssessmentModal, type AssessmentStatus, type Disagreement } from "@/components/counterparty/AssessmentModal";
import { buildAssessment, type Assessment } from "@/lib/assessment-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProcessFilterDrawer } from "@/components/counterparty/ProcessFilterDrawer";
import { processMeta, processOrder } from "@/lib/process-meta";


type CategoryKey = "risk" | "overdue_risk" | "no_risk" | "overdue";

const tiles: {
  key: CategoryKey;
  title: string;
  pct: string;
  amount: string;
  count: string;
  bg: string;
  pctBg: string;
  ring: string;
  dot: string;
}[] = [
  {
    key: "risk",
    title: "Риск дефолта",
    pct: "9.5 %",
    amount: "1,3 млн. ₽",
    count: "5 деб.",
    bg: "bg-[#FBF1D6]/60",
    pctBg: "bg-[#F4E1A1]/70 text-[#8B6B14]",
    ring: "ring-[#E9C657]",
    dot: "#E9C657",
  },
  {
    key: "overdue_risk",
    title: "Просрочено с риском дефолта",
    pct: "10 %",
    amount: "1,4 млн. ₽",
    count: "5 деб.",
    bg: "bg-[#FBE3D6]/60",
    pctBg: "bg-[#F5C9B0]/70 text-[#8B4A1F]",
    ring: "ring-[#E89669]",
    dot: "#E89669",
  },
  {
    key: "no_risk",
    title: "Нет риска",
    pct: "74.5 %",
    amount: "1,2 млн. ₽",
    count: "5 деб.",
    bg: "bg-[#D6F0E2]/60",
    pctBg: "bg-[#A6E0BE]/70 text-[#1E6B43]",
    ring: "ring-[#5BC48C]",
    dot: "#5BC48C",
  },
  {
    key: "overdue",
    title: "Просрочено",
    pct: "9.5 %",
    amount: "1,2 млн. ₽",
    count: "5 деб.",
    bg: "bg-[#FBE9D6]/60",
    pctBg: "bg-[#F6D2A2]/70 text-[#8B5A14]",
    ring: "ring-[#EDB05A]",
    dot: "#EDB05A",
  },
];

type Segment = { key: string; value: number; color: string; label: string };

const defaultSegments: Segment[] = [
  { key: "no_risk", value: 74.5, color: "#5BC48C", label: "Без просрочки" },
  { key: "risk", value: 9.5, color: "#E9C657", label: "Просроч. на 0-30 д" },
  { key: "overdue", value: 9.5, color: "#EDB05A", label: "Просроч. на 30-60 д" },
  { key: "overdue_risk", value: 6.5, color: "#E26B3A", label: "Просроч. на 60+ д" },
];

const categoryPalette: Record<CategoryKey, { amount: string; segments: Segment[] }> = {
  risk: {
    amount: "1,3",
    segments: [
      { key: "a", label: "Без просрочки", value: 45, color: "#FBE9A8" },
      { key: "b", label: "Просроч. на 0-30 д", value: 25, color: "#F4D470" },
      { key: "c", label: "Просроч. на 30-60 д", value: 18, color: "#E9C657" },
      { key: "d", label: "Просроч. на 60+ д", value: 12, color: "#B5912F" },
    ],
  },
  overdue_risk: {
    amount: "1,4",
    segments: [
      { key: "a", label: "Без просрочки", value: 40, color: "#F8D2BE" },
      { key: "b", label: "Просроч. на 0-30 д", value: 25, color: "#F0A788" },
      { key: "c", label: "Просроч. на 30-60 д", value: 20, color: "#E26B3A" },
      { key: "d", label: "Просроч. на 60+ д", value: 15, color: "#9A3A18" },
    ],
  },
  no_risk: {
    amount: "1,2",
    segments: [
      { key: "a", label: "Без просрочки", value: 50, color: "#C5ECD4" },
      { key: "b", label: "Просроч. на 0-30 д", value: 22, color: "#8FD8AE" },
      { key: "c", label: "Просроч. на 30-60 д", value: 18, color: "#5BC48C" },
      { key: "d", label: "Просроч. на 60+ д", value: 10, color: "#1E6B43" },
    ],
  },
  overdue: {
    amount: "1,2",
    segments: [
      { key: "a", label: "Без просрочки", value: 38, color: "#FBE0BC" },
      { key: "b", label: "Просроч. на 0-30 д", value: 27, color: "#F4C384" },
      { key: "c", label: "Просроч. на 30-60 д", value: 20, color: "#EDB05A" },
      { key: "d", label: "Просроч. на 60+ д", value: 15, color: "#8B5A14" },
    ],
  },
};

function Donut({ amount, segments }: { amount: string; segments: Segment[] }) {
  const size = 170;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const gap = 1.5;
  let acc = 0;
  const innerR = r - stroke / 2;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((s) => {
          const len = Math.max((s.value / total) * c - gap, 0);
          const dash = `${len} ${c - len}`;
          const offset = -acc;
          acc += len + gap;
          return (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              opacity={0.55}
              className="transition-all duration-300"
            />
          );
        })}
        {/* Inner soft contour ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerR + 1.5}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={2}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-semibold tracking-tight">
          {amount} <span className="text-xs font-normal text-muted-foreground">млн. ₽</span>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

type RiskChipKey = "all" | RiskType;

export default function Index() {
  const [active, setActive] = useState<Counterparty | null>(null);
  const [filter, setFilter] = useState<CategoryKey | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskChipKey>("all");
  const [processStage, setProcessStage] = useState<ProcessStage | null>(null);
  const [processDrawerOpen, setProcessDrawerOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [runInn, setRunInn] = useState("");
  const [runError, setRunError] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [manualAssessment, setManualAssessment] = useState<Assessment | null>(null);
  const [manualAssessmentOpen, setManualAssessmentOpen] = useState(false);
  const [manualStatus, setManualStatus] = useState<AssessmentStatus>("updated");
  const [manualDisagreement, setManualDisagreement] = useState<Disagreement | null>(null);


  const handleStartAssessment = () => {
    const inn = runInn.trim();
    if (!inn) {
      setRunError("Введите ИНН контрагента");
      return;
    }
    setRunError(null);
    setRunLoading(true);
    setTimeout(() => {
      const today = new Date().toLocaleDateString("ru-RU");
      setManualAssessment(buildAssessment("Новый контрагент", inn, "manual", today));
      setManualStatus("updated");
      setManualDisagreement(null);
      setRunLoading(false);
      setRunDialogOpen(false);
      setManualAssessmentOpen(true);
      setRunInn("");
    }, 1500);
  };


  const processCounts = useMemo(() => {
    const map = { monitoring: 0, risk_confirmation: 0, settlement: 0, writeoff: 0 } as Record<ProcessStage, number>;
    for (const c of counterparties) map[c.processStage]++;
    return map;
  }, []);

  const byProcess = useMemo(() => {
    if (!processStage) return counterparties;
    return counterparties.filter((c) => c.processStage === processStage);
  }, [processStage]);

  const allowedCategories = useMemo(() => {
    if (!processStage) return null;
    return new Set(processMeta[processStage].allowedCategories);
  }, [processStage]);

  const byCategory = useMemo(() => {
    if (!filter) return byProcess;
    return byProcess.filter((c) => c.status === filter);
  }, [byProcess, filter]);

  const showRiskChips = filter !== "no_risk" && filter !== "overdue";

  const riskCounts = useMemo(() => {
    const map: Record<string, number> = { all: byCategory.length };
    for (const c of byCategory) {
      const types = new Set(c.risks.map((r) => r.type));
      types.forEach((t) => {
        map[t] = (map[t] ?? 0) + 1;
      });
    }
    return map;
  }, [byCategory]);

  const filtered = useMemo(() => {
    if (!showRiskChips || riskFilter === "all") return byCategory;
    return byCategory.filter((c) => c.risks.some((r) => r.type === riskFilter));
  }, [byCategory, riskFilter, showRiskChips]);

  const applyProcessStage = (stage: ProcessStage | null) => {
    setProcessStage(stage);
    if (stage && filter && !processMeta[stage].allowedCategories.includes(filter)) {
      setFilter(null);
      setRiskFilter("all");
    }
  };


  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white px-4 py-5 lg:flex">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-lg font-semibold tracking-tight">НОРМ</div>
          </div>

          <div className="mb-5 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Организация</div>
              <div className="text-sm font-medium">Не выбрана</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1">
            <SidebarItem icon={UserCog} label="Администратор" />
            <SidebarItem icon={Home} label="Главная" />
            <SidebarItem icon={CalendarClock} label="События" />
            <SidebarItem icon={Flame} label="Риски" />
            <SidebarItem icon={Shield} label="Меры" />
            <SidebarItem icon={BarChart3} label="Аналитика" />
            <SidebarItem icon={Users} label="Контрагенты" active />
            <SidebarItem icon={Bot} label="AI мониторинг" />
            <SidebarItem icon={Gauge} label="Лимитная кампания" />
            <SidebarItem icon={GraduationCap} label="База знаний" />
          </nav>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">МЕ</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Михайлова Екатерина</div>
                <div className="truncate text-[11px] text-muted-foreground">Риск-менеджер (ЦА)</div>
              </div>
            </div>
            <SidebarItem icon={Headphones} label="Служба поддержки" />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">Контрагенты</h1>
                <span className="text-sm text-muted-foreground">1002</span>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Найти…"
                  className="h-10 w-full rounded-full border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* AI banner */}
            <div className="mb-8 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">
                    Я проанализировал дебиторскую задолженность на 30.09.2025: в зоне внимания 5 дебеторов и 3,9 млн руб
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    Оценивается задолженность ЮЛ и ИП, зарегистрированных на территории РФ с задолженностью свыше 10 млн
                  </div>
                </div>
              </div>
            </div>

            {/* Дебиторская задолженность */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Дебиторская задолженность</h2>
              <button
                onClick={() => setProcessDrawerOpen(true)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
                  processStage
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Фильтр
                {processStage && (
                  <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold">
                    1
                  </span>
                )}
              </button>
            </div>
            <div className="mb-8 rounded-2xl border border-border bg-white p-5">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tiles.map((t) => {
                    const isActive = filter === t.key;
                    const disabled = !!allowedCategories && !allowedCategories.has(t.key);
                    return (
                      <button
                        key={t.key}
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          setFilter(isActive ? null : t.key);
                          setRiskFilter("all");
                        }}
                        className={`rounded-2xl px-4 py-4 text-left transition ${
                          isActive
                            ? `${t.bg.replace("/60", "")} ring-2 ${t.ring} shadow-md brightness-105 saturate-150`
                            : `${t.bg} ring-1 ring-inset ring-transparent hover:ring-2 ${filter ? "opacity-60" : ""}`
                        } ${disabled ? "!opacity-40 !cursor-not-allowed hover:ring-0" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm text-foreground/80">{t.title}</div>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${t.pctBg}`}>
                            {t.pct}
                          </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <div className="text-2xl font-semibold tracking-tight">{t.amount}</div>
                          <div className="text-xs text-muted-foreground">{t.count}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>


                <div className="flex items-center gap-6">
                  <ul className="space-y-2 text-sm">
                    {(filter ? categoryPalette[filter].segments : defaultSegments).map((s) => (
                      <li key={s.key} className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span>{s.label}</span>
                      </li>
                    ))}
                  </ul>
                  <Donut
                    amount={filter ? categoryPalette[filter].amount : "4,7"}
                    segments={filter ? categoryPalette[filter].segments : defaultSegments}
                  />
                </div>
              </div>
            </div>

            {/* Список дебиторов */}
            <h2 className="mb-3 text-xl font-semibold">Список дебиторов</h2>

            {showRiskChips && (
              <div className="mb-5 flex flex-wrap gap-2">
                {(["all", ...riskOrder] as RiskChipKey[]).map((key) => {
                  const meta = key === "all" ? allChipMeta : riskMeta[key as RiskType];
                  const Icon = meta.icon;
                  const count = riskCounts[key] ?? 0;
                  const isActive = riskFilter === key;
                  const disabled = key !== "all" && count === 0;
                  return (
                    <button
                      key={key}
                      disabled={disabled}
                      onClick={() =>
                        setRiskFilter(isActive && key !== "all" ? "all" : key)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? `${meta.activeBg} ${meta.activeBorder} ${meta.activeText} shadow-sm`
                          : `bg-white border-slate-200 text-slate-600 hover:bg-slate-50`
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          isActive ? meta.iconColor : meta.idleIconColor
                        }`}
                      />
                      {meta.label}
                      <span
                        className={`rounded-full px-1.5 py-px text-[10px] ${
                          isActive ? "bg-white/70" : "bg-slate-100 text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {filter && (
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                Фильтр: <b className="text-foreground">{tiles.find((t) => t.key === filter)?.title}</b>
                <button
                  className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] hover:bg-accent"
                  onClick={() => setFilter(null)}
                >
                  Сбросить
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
                  Нет дебиторов в этой категории
                </div>
              )}
              {filtered.map((c) => {
                const stage = c.collection.find((s) => s.status === "current")?.stage ?? "—";
                const types = Array.from(new Set(c.risks.map((r) => r.type)));
                const shownIcons = types.slice(0, 3);
                const restIcons = types.length - shownIcons.length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-left transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(() => {
                          const catMeta: Record<CategoryKey, { label: string; cls: string }> = {
                            risk: { label: "Риск дефолта", cls: "bg-[#FBF1D6] border-[#E9C657]/60 text-[#8B6B14]" },
                            no_risk: { label: "Нет риска", cls: "bg-[#D6F0E2] border-[#5BC48C]/60 text-[#1E6B43]" },
                            overdue_risk: { label: "Просрочено с риском дефолта", cls: "bg-[#FBE3D6] border-[#E89669]/60 text-[#8B4A1F]" },
                            overdue: { label: "Просрочено", cls: "bg-[#FBE9D6] border-[#EDB05A]/60 text-[#8B5A14]" },
                          };
                          const cm = catMeta[c.status];
                          return (
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${cm.cls}`}>
                              {cm.label}
                            </span>
                          );
                        })()}
                        {shownIcons.map((t) => {
                          const m = riskMeta[t];
                          const Icon = m.icon;
                          return (
                            <span
                              key={t}
                              title={m.label}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${m.activeBorder} ${m.activeBg}`}
                            >
                              <Icon className={`h-3.5 w-3.5 ${m.iconColor}`} />
                            </span>
                          );
                        })}
                        {restIcons > 0 && (
                          <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-600">
                            +{restIcons}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-foreground">{c.name}</div>
                      <div className="text-[12px] text-muted-foreground">
                        {c.inn} · {c.contracts.length} дог. · {stage} · изм. {c.lastUpdate}
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Задолженность
                      </div>
                      <div className="text-sm font-semibold">{c.totalDebt}</div>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Просроченная
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          c.overdueAmountNum > 0 ? "text-rose-600" : "text-muted-foreground"
                        }`}
                      >
                        {c.overdueAmountNum > 0 ? c.overdueDebt : "—"}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Floating CTA */}
            <div className="sticky bottom-6 z-30 mt-8 flex justify-center pointer-events-none">
              <Button
                onClick={() => {
                  setRunInn("");
                  setRunError(null);
                  setRunDialogOpen(true);
                }}
                className="pointer-events-auto h-12 gap-2 rounded-full px-6 text-sm font-semibold shadow-lg shadow-primary/25"
              >
                <Sparkles className="h-4 w-4" />
                Оценить контрагента
              </Button>
            </div>

          </div>
        </main>
      </div>

      <CounterpartyModal
        counterparty={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />

      {/* Run assessment by INN dialog */}
      <Dialog
        open={runDialogOpen}
        onOpenChange={(o) => {
          if (runLoading) return;
          setRunDialogOpen(o);
          if (!o) setRunError(null);
        }}
      >
        <DialogContent className="max-w-md gap-0 rounded-2xl p-0 [&>button]:hidden">
          <div className="flex items-start gap-3 border-b border-border px-5 pt-5 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Оценить контрагента</div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Агент проверит контрагента по 43 критериям благонадёжности. Укажите ИНН.
              </p>
            </div>
            <button
              onClick={() => !runLoading && setRunDialogOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-4">
            <label className="text-[11px] font-medium text-muted-foreground">ИНН для оценки</label>
            <Input
              value={runInn}
              onChange={(e) => {
                setRunInn(e.target.value);
                if (runError) setRunError(null);
              }}
              placeholder="Введите ИНН контрагента"
              className="mt-1 bg-white"
              disabled={runLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStartAssessment();
              }}
            />
            {runError && (
              <div className="mt-2 text-[12px] text-rose-600">{runError}</div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRunDialogOpen(false)}
              disabled={runLoading}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleStartAssessment}
              disabled={runLoading || !runInn.trim()}
            >
              {runLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Запуск…
                </>
              ) : (
                "Запустить оценку"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AssessmentModal
        assessment={manualAssessment}
        open={manualAssessmentOpen}
        onOpenChange={(o) => {
          setManualAssessmentOpen(o);
          if (!o) {
            setManualDisagreement(null);
          }
        }}
        status={manualStatus}
        disagreement={manualDisagreement}
        defaultInn={manualAssessment?.inn}
        onConfirm={() => setManualStatus("confirmed")}
        onDisagree={(d) => {
          setManualDisagreement(d);
          setManualStatus("disagreed");
        }}
      />
    </div>
  );
}


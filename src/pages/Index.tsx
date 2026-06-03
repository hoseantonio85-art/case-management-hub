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
  ArrowDown,
  Briefcase,
  UsersRound,
} from "lucide-react";
import { counterparties, type Counterparty } from "@/lib/mock-data";
import { CounterpartyModal } from "@/components/counterparty/CounterpartyModal";

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
  { key: "no_risk", value: 74.5, color: "#5BC48C", label: "В срок" },
  { key: "risk", value: 9.5, color: "#E9C657", label: "Просроч. на 0-30 д" },
  { key: "overdue", value: 9.5, color: "#EDB05A", label: "Просроч. на 30-60 д" },
  { key: "overdue_risk", value: 6.5, color: "#E26B3A", label: "Просроч. на 60+ д" },
];

const categoryPalette: Record<CategoryKey, { amount: string; segments: Segment[] }> = {
  risk: {
    amount: "1,3",
    segments: [
      { key: "a", label: "В срок", value: 45, color: "#FBE9A8" },
      { key: "b", label: "Просроч. на 0-30 д", value: 25, color: "#F4D470" },
      { key: "c", label: "Просроч. на 30-60 д", value: 18, color: "#E9C657" },
      { key: "d", label: "Просроч. на 60+ д", value: 12, color: "#B5912F" },
    ],
  },
  overdue_risk: {
    amount: "1,4",
    segments: [
      { key: "a", label: "В срок", value: 40, color: "#F8D2BE" },
      { key: "b", label: "Просроч. на 0-30 д", value: 25, color: "#F0A788" },
      { key: "c", label: "Просроч. на 30-60 д", value: 20, color: "#E26B3A" },
      { key: "d", label: "Просроч. на 60+ д", value: 15, color: "#9A3A18" },
    ],
  },
  no_risk: {
    amount: "1,2",
    segments: [
      { key: "a", label: "В срок", value: 50, color: "#C5ECD4" },
      { key: "b", label: "Просроч. на 0-30 д", value: 22, color: "#8FD8AE" },
      { key: "c", label: "Просроч. на 30-60 д", value: 18, color: "#5BC48C" },
      { key: "d", label: "Просроч. на 60+ д", value: 10, color: "#1E6B43" },
    ],
  },
  overdue: {
    amount: "1,2",
    segments: [
      { key: "a", label: "В срок", value: 38, color: "#FBE0BC" },
      { key: "b", label: "Просроч. на 0-30 д", value: 27, color: "#F4C384" },
      { key: "c", label: "Просроч. на 30-60 д", value: 20, color: "#EDB05A" },
      { key: "d", label: "Просроч. на 60+ д", value: 15, color: "#8B5A14" },
    ],
  },
};

function Donut({ amount, segments }: { amount: string; segments: Segment[] }) {
  const size = 220;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" opacity={0.25} />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const dash = `${len} ${c - len}`;
          const offset = -acc;
          acc += len;
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
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold tracking-tight">{amount}</div>
        <div className="-mt-0.5 text-xs text-muted-foreground">млн. ₽</div>
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

export default function Index() {
  const [active, setActive] = useState<Counterparty | null>(null);
  const [filter, setFilter] = useState<CategoryKey | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return counterparties;
    return counterparties.filter((c) => c.status === filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-[#F6F6F4]">
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
            <h2 className="mb-3 text-xl font-semibold">Дебиторская задолженность</h2>
            <div className="mb-8 rounded-2xl border border-border bg-white p-5">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tiles.map((t) => {
                    const isActive = filter === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setFilter(isActive ? null : t.key)}
                        className={`rounded-2xl ${t.bg} px-4 py-4 text-left transition ring-1 ring-inset ring-transparent hover:ring-2 ${
                          isActive ? `ring-2 ${t.ring} shadow-sm` : ""
                        }`}
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

            <div className="mb-5 flex flex-wrap gap-2">
              {[
                { label: "Ухудшилось фин. состояние", icon: ArrowDown },
                { label: "Банкротство/ликвидация", icon: Briefcase },
                { label: "Просрочена задолженность в группе", icon: UsersRound },
              ].map((f) => (
                <button
                  key={f.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <f.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {f.label}
                  <span className="rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">5</span>
                </button>
              ))}
            </div>

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

            <div className="overflow-hidden rounded-xl border border-border bg-white">
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Нет дебиторов в этой категории
                </div>
              )}
              {filtered.map((c, idx) => {
                const openSignals = c.risks.filter(
                  (r) => r.status === "pending" || r.status === "verification",
                ).length;
                const stage = c.collection.find((s) => s.status === "current")?.stage ?? "—";
                const tagCls =
                  c.status === "overdue_risk"
                    ? "bg-amber-100 text-amber-900"
                    : c.status === "risk"
                      ? "bg-amber-50 text-amber-800"
                      : c.status === "overdue"
                        ? "bg-orange-50 text-orange-800"
                        : "bg-emerald-50 text-emerald-800";
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className={`grid w-full grid-cols-12 items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 ${
                      idx > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="col-span-12 sm:col-span-4">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        ИНН {c.inn} · {c.contracts.length} дог.
                      </div>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Задолженность
                      </div>
                      <div className="text-sm font-medium">{c.totalDebt}</div>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Просрочено
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          c.overdueAmountNum > 0 ? "text-amber-700" : ""
                        }`}
                      >
                        {c.overdueDebt}
                      </div>
                    </div>
                    <div className="col-span-12 flex flex-wrap items-center gap-1.5 sm:col-span-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagCls}`}>
                        {c.tag}
                      </span>
                      {openSignals > 0 && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                          {openSignals} сигн.
                        </span>
                      )}
                      <div className="mt-0.5 w-full text-[11px] text-muted-foreground">
                        Этап: {stage} · обн. {c.lastUpdate}
                      </div>
                    </div>
                    <div className="col-span-12 hidden justify-end sm:col-span-1 sm:flex">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </main>
      </div>

      <CounterpartyModal
        counterparty={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </div>
  );
}

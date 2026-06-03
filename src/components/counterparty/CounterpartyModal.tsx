import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronDown,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import type {
  Counterparty,
  Contract,
  RiskSignal,
  CollectionSubStep,
  OverdueRecord,
} from "@/lib/mock-data";
import { RiskDrawer, type DecisionKind, type RiskSavePayload } from "./RiskDrawer";
import { ContractDrawer } from "./ContractDrawer";
import { DebtStepper } from "./DebtStepper";
import { DebtSummaryCard } from "./DebtSummaryCard";
import { DebtProcessDrawer } from "./DebtProcessDrawer";
import { getToneForTag, toneStyles } from "./header-theme";

const priorityBadge: Record<string, { label: string; cls: string }> = {
  high: { label: "Высокий приоритет", cls: "bg-amber-100 text-amber-900" },
  medium: { label: "Средний приоритет", cls: "bg-amber-50 text-amber-800" },
  low: { label: "Низкий приоритет", cls: "bg-muted text-muted-foreground" },
};

export function CounterpartyModal({
  counterparty,
  open,
  onOpenChange,
}: {
  counterparty: Counterparty | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [risks, setRisks] = useState<RiskSignal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [steps, setSteps] = useState<CollectionSubStep[]>([]);
  const [editing, setEditing] = useState<RiskSignal | null>(null);
  const [initialDecision, setInitialDecision] = useState<DecisionKind>("confirm");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contractDrawer, setContractDrawer] = useState<Contract | null>(null);
  const [stepperError, setStepperError] = useState<string | null>(null);
  const [showAllPending, setShowAllPending] = useState(false);
  const [debtDrawerOpen, setDebtDrawerOpen] = useState(false);

  useEffect(() => {
    if (counterparty && open) {
      setRisks(counterparty.risks.map((r) => ({ ...r })));
      setContracts(counterparty.contracts.map((c) => ({ ...c, overdueHistory: [...c.overdueHistory] })));
      setSteps(counterparty.collection.map((s) => ({ ...s })));
      setStepperError(null);
    }
  }, [counterparty, open]);

  const pending = useMemo(() => risks.filter((r) => r.status === "pending"), [risks]);
  const verification = useMemo(() => risks.filter((r) => r.status === "verification"), [risks]);
  const confirmed = useMemo(() => risks.filter((r) => r.status === "confirmed"), [risks]);
  const dismissed = useMemo(() => risks.filter((r) => r.status === "dismissed"), [risks]);
  const decidedCount = confirmed.length + dismissed.length + verification.length;
  const totalOverdue = contracts.reduce((acc, c) => acc + c.overdue, 0);
  const currentStage = steps.find((s) => s.status === "current");
  const allMeasures = confirmed.flatMap((r) => r.decision?.measures ?? []);

  const sortedPending = useMemo(() => {
    const typeOrder: Record<string, number> = {
      "Банкротство / ликвидация": 7,
      "Уголовное дело": 6,
      "Ограничения деятельности": 5,
      "Административные нарушения": 4,
      "Неисполнение контракта группы": 3,
      "Ухудшилось финансовое состояние": 2,
    };
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return [...pending].sort((a, b) => {
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
    });
  }, [pending]);

  const visiblePending = showAllPending ? sortedPending : sortedPending.slice(0, 2);
  const hiddenPendingCount = sortedPending.length - visiblePending.length;

  if (!counterparty) return null;

  const openDrawer = (r: RiskSignal, decision: DecisionKind) => {
    setEditing(r);
    setInitialDecision(decision);
    setDrawerOpen(true);
  };

  const handleSave = (riskId: string, payload: RiskSavePayload) => {
    setRisks((prev) =>
      prev.map((r) => {
        if (r.id !== riskId) return r;
        if (payload.kind === "confirm")
          return {
            ...r,
            status: "confirmed",
            decision: {
              date: payload.date,
              measures: payload.measures,
              comment: payload.comment,
              responsible: payload.responsible,
            },
            verification: undefined,
            dismissal: undefined,
          };
        if (payload.kind === "dismiss")
          return {
            ...r,
            status: "dismissed",
            dismissal: { date: payload.date, comment: payload.comment, responsible: payload.responsible },
            decision: undefined,
            verification: undefined,
          };
        return {
          ...r,
          status: "verification",
          verification: {
            date: payload.date,
            plannedDate: payload.plannedDate,
            comment: payload.comment,
            responsible: payload.responsible,
          },
          decision: undefined,
          dismissal: undefined,
        };
      }),
    );
  };

  const advanceStage = () => {
    setStepperError(null);
    const idx = steps.findIndex((s) => s.status === "current");
    if (idx === -1) return;
    const cur = steps[idx];
    const next = steps[idx + 1];
    if (!next) return;
    if (
      next.title === "Ведется исполнительное производство" &&
      cur.title !== "Получен судебный акт"
    ) {
      setStepperError("Нельзя перейти к исполнительному производству без этапа «Получен судебный акт».");
      return;
    }
    if (next.title === "Задолженность погашена" && totalOverdue > 0) {
      setStepperError("Нельзя закрыть кейс: остаётся просроченная задолженность.");
      return;
    }
    setSteps((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], status: "done", overdue: false };
      arr[idx + 1] = {
        ...arr[idx + 1],
        status: "current",
        startDate: new Date().toLocaleDateString("ru-RU"),
        sla: "7 дней",
        plannedDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString("ru-RU"),
        overdue: false,
        nextAction: arr[idx + 1].nextAction ?? "Запланировать следующее действие",
      };
      return arr;
    });
  };

  const advanceContractStage = (id: string) => {
    const stageOrder = [
      "Досудебное урегулирование",
      "Судебная работа",
      "Принудительное взыскание",
      "Завершение работы",
    ];
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const i = stageOrder.indexOf(c.collectionStage ?? "");
        return { ...c, collectionStage: stageOrder[Math.min(i + 1, stageOrder.length - 1)] || stageOrder[0] };
      }),
    );
  };

  const addOverdue = (id: string, record: OverdueRecord) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              overdue: c.overdue + record.amount,
              overdueDays: Math.max(c.overdueDays, record.days),
              overdueHistory: [record, ...c.overdueHistory],
            }
          : c,
      ),
    );
    setContractDrawer((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            overdue: prev.overdue + record.amount,
            overdueDays: Math.max(prev.overdueDays, record.days),
            overdueHistory: [record, ...prev.overdueHistory],
          }
        : prev,
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-5xl gap-0 overflow-y-auto p-0 [&>button]:hidden">
          {/* Header */}
          {(() => {
            const tone = getToneForTag(counterparty.tag);
            const styles = toneStyles[tone];
            return (
              <div className={`relative border-b border-border px-7 pt-6 pb-5 ${styles.gradient}`}>
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute right-5 top-5 rounded-full bg-white/70 p-1.5 text-muted-foreground backdrop-blur hover:bg-white"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles.badge}`}>
                  {counterparty.tag}
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{counterparty.name}</h2>
                <div className="mt-1 text-sm text-muted-foreground">{counterparty.inn}</div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DebtCard label="Общая задолженность" value={counterparty.totalDebt} />
                  <DebtCard
                    label="Просроченная задолженность"
                    value={`${totalOverdue.toFixed(1)} млн. ₽`}
                    accent={totalOverdue > 0}
                  />
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 gap-6 bg-[#F6F6F4] px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 min-w-0">
            {/* Section: Requires decision */}
            <section>
              <SectionTitle title="Требуют решения" count={sortedPending.length} tone="warn" />
              {sortedPending.length === 0 ? (
                <EmptyState text="Все сигналы обработаны" />
              ) : (
                <div className="space-y-2.5">
                  {visiblePending.map((r) => {
                    const p = priorityBadge[r.priority];
                    return (
                      <div key={r.id} className="rounded-xl border border-border bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{r.type}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.cls}`}>
                                  {p.label}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  Требует проверки
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">{r.description}</div>
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                <span>Источник: <b className="text-foreground">{r.source}</b></span>
                                <span>Обнаружено: <b className="text-foreground">{r.detectedAt}</b></span>
                              </div>
                              <div className="mt-1.5 text-[11px]">
                                <span className="text-muted-foreground">Рекомендуется: </span>
                                <span className="font-medium">{r.recommendedAction}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => openDrawer(r, "confirm")}>
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Подтвердить
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDrawer(r, "dismiss")}>
                            <XCircle className="mr-1.5 h-4 w-4" /> Снять
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDrawer(r, "verify")}>
                            <Search className="mr-1.5 h-4 w-4" /> На проверку
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {hiddenPendingCount > 0 && (
                    <button
                      onClick={() => setShowAllPending((s) => !s)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-white py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                    >
                      {showAllPending ? (
                        <>
                          <ChevronDown className="h-4 w-4 rotate-180" /> Скрыть
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" /> Показать ещё {hiddenPendingCount} {hiddenPendingCount === 1 ? "сигнал" : hiddenPendingCount < 5 ? "сигнала" : "сигналов"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Section: Decisions */}
            {decidedCount > 0 && (
              <section>
                <SectionTitle title="Принятые решения" count={decidedCount} />
                <div className="space-y-2.5">
                  {confirmed.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-white p-4">
                      <DecisionHeader
                        icon={<ShieldCheck className="h-4 w-4" />}
                        iconCls="bg-primary/10 text-primary"
                        title={r.type}
                        statusLabel="Подтверждено"
                        statusCls="bg-primary/10 text-primary"
                        date={r.decision?.date}
                        responsible={r.decision?.responsible}
                        onEdit={() => openDrawer(r, "confirm")}
                      />
                      {r.decision?.measures && r.decision.measures.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.decision.measures.map((m) => (
                            <span
                              key={m}
                              className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px]"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.decision?.comment && (
                        <div className="mt-2 text-xs text-muted-foreground">«{r.decision.comment}»</div>
                      )}
                    </div>
                  ))}
                  {verification.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-slate-50 p-4">
                      <DecisionHeader
                        icon={<Clock className="h-4 w-4" />}
                        iconCls="bg-slate-200 text-slate-700"
                        title={r.type}
                        statusLabel="На дополнительной проверке"
                        statusCls="bg-slate-200 text-slate-800"
                        date={r.verification?.date}
                        responsible={r.verification?.responsible}
                        onEdit={() => openDrawer(r, "verify")}
                      />
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Плановая проверка:{" "}
                          <b className="text-foreground">{r.verification?.plannedDate}</b>
                        </span>
                      </div>
                      {r.verification?.comment && (
                        <div className="mt-2 text-xs text-muted-foreground">«{r.verification.comment}»</div>
                      )}
                    </div>
                  ))}
                  {dismissed.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-muted/40 p-4">
                      <DecisionHeader
                        icon={<XCircle className="h-4 w-4" />}
                        iconCls="bg-muted text-muted-foreground"
                        title={r.type}
                        statusLabel="Риск снят"
                        statusCls="bg-muted text-muted-foreground"
                        date={r.dismissal?.date}
                        responsible={r.dismissal?.responsible}
                        onEdit={() => openDrawer(r, "dismiss")}
                        muted
                      />
                      {r.dismissal?.comment && (
                        <div className="mt-2 text-xs text-muted-foreground">«{r.dismissal.comment}»</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Contracts */}
            <section>
              <SectionTitle title="Договоры" count={contracts.length} muted />
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                {contracts.map((c, i) => {
                  const overdue = c.overdue > 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setContractDrawer(c)}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/40 ${
                        i > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
                        <Cell label="Договор" value={c.number} sub={`от ${c.date}`} />
                        <Cell label="Сумма" value={`${c.amount.toFixed(1)} млн. ₽`} />
                        <Cell label="Задолженность" value={`${c.debt.toFixed(1)} млн. ₽`} />
                        <Cell
                          label="Просрочено"
                          value={overdue ? `${c.overdue.toFixed(1)} млн. ₽` : "нет"}
                          sub={overdue ? `${c.overdueDays} дн.` : undefined}
                          accent={overdue}
                        />
                        <Cell label="Этап" value={c.collectionStage ?? "—"} />
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </section>
            </div>

            {/* Right column: meta */}
            <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <DebtSummaryCard steps={steps} onOpenDetails={() => setDebtDrawerOpen(true)} />
            </aside>
          </div>
        </DialogContent>
      </Dialog>


      <RiskDrawer
        risk={editing}
        initialDecision={initialDecision}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <ContractDrawer
        counterpartyName={counterparty.name}
        contract={contractDrawer}
        measures={allMeasures}
        open={!!contractDrawer}
        onOpenChange={(o) => !o && setContractDrawer(null)}
        onAddOverdue={addOverdue}
        onAdvanceStage={(id) => {
          advanceContractStage(id);
          setContractDrawer((prev) => {
            if (!prev) return prev;
            const stages = [
              "Досудебное урегулирование",
              "Судебная работа",
              "Принудительное взыскание",
              "Завершение работы",
            ];
            const i = stages.indexOf(prev.collectionStage ?? "");
            return { ...prev, collectionStage: stages[Math.min(i + 1, stages.length - 1)] || stages[0] };
          });
        }}
      />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${accent ? "text-amber-700" : ""}`}>{value}</div>
    </div>
  );
}

function DebtCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-rose-600" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  count,
  tone,
  muted,
}: {
  title: string;
  count: number;
  tone?: "warn";
  muted?: boolean;
}) {
  const cls =
    tone === "warn"
      ? "bg-amber-100 text-amber-900"
      : muted
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";
  return (
    <div className="mb-3 flex items-center gap-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{count}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function DecisionHeader({
  icon,
  iconCls,
  title,
  statusLabel,
  statusCls,
  date,
  responsible,
  onEdit,
  muted,
}: {
  icon: React.ReactNode;
  iconCls: string;
  title: string;
  statusLabel: string;
  statusCls: string;
  date?: string;
  responsible?: string;
  onEdit?: () => void;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconCls}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className={`font-medium ${muted ? "text-muted-foreground" : ""}`}>{title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className={`rounded-full px-2 py-0.5 font-medium ${statusCls}`}>{statusLabel}</span>
            {date && <span>{date}</span>}
            {responsible && <span>· {responsible}</span>}
          </div>
        </div>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`truncate text-sm font-medium ${accent ? "text-amber-700" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

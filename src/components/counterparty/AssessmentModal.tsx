import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Sparkles, CheckCircle2, AlertTriangle, Download, ChevronRight, Info, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type Assessment,
  type AssessmentGroup,
  groupCounts,
  toneStyles,
} from "@/lib/assessment-data";
import { AssessmentGroupDrawer } from "./AssessmentGroupDrawer";

export type AssessmentStatus = "pending" | "confirmed" | "disagreed" | "updated";

const statusMeta: Record<
  AssessmentStatus,
  { label: string; chip: string; headerBg: string }
> = {
  pending: {
    label: "Требует подтверждения",
    chip: "bg-amber-100 text-amber-900",
    headerBg: "bg-gradient-to-b from-amber-50 to-white",
  },
  confirmed: {
    label: "Подтверждена",
    chip: "bg-emerald-100 text-emerald-800",
    headerBg: "bg-gradient-to-b from-emerald-50 to-white",
  },
  disagreed: {
    label: "Не согласовано",
    chip: "bg-orange-100 text-orange-900",
    headerBg: "bg-gradient-to-b from-orange-50 to-white",
  },
  updated: {
    label: "Обновлена",
    chip: "bg-sky-100 text-sky-900",
    headerBg: "bg-gradient-to-b from-sky-50 to-white",
  },
};

const toneLabel: Record<"rose" | "amber" | "slate" | "emerald", string> = {
  rose: "Критический маркер",
  amber: "Требует согласования",
  slate: "Потенциальный маркер",
  emerald: "Позитивный маркер",
};

const REASONS = [
  "Данные неактуальны",
  "Источник ошибочный",
  "Требуется дополнительная проверка",
  "Другое",
];

export type Disagreement = { reason: string; text: string };

export function AssessmentModal({
  assessment,
  open,
  onOpenChange,
  status,
  disagreement,
  defaultInn,
  running,
  onRun,
  onConfirm,
  onDisagree,
}: {
  assessment: Assessment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  status: AssessmentStatus;
  disagreement: Disagreement | null;
  defaultInn?: string;
  running?: boolean;
  onRun?: (inn: string) => void;
  onConfirm: () => void;
  onDisagree: (d: Disagreement) => void;
}) {
  const [notice, setNotice] = useState<{ tone: "success" | "info"; text: string } | null>(null);
  const [disagreeOpen, setDisagreeOpen] = useState(false);
  const [disagreeText, setDisagreeText] = useState("");
  const [disagreeReason, setDisagreeReason] = useState(REASONS[0]);
  const [groupDrawer, setGroupDrawer] = useState<AssessmentGroup | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runInn, setRunInn] = useState(defaultInn ?? "");
  const wasRunning = useRef(false);

  useEffect(() => {
    setRunInn(defaultInn ?? "");
  }, [defaultInn, assessment?.counterpartyName]);

  useEffect(() => {
    if (wasRunning.current && !running) {
      setRunOpen(false);
      setNotice({ tone: "success", text: "Оценка обновлена. Требуется подтверждение." });
    }
    wasRunning.current = !!running;
  }, [running]);

  if (!assessment) return null;

  const meta = statusMeta[status];
  const sourceLabel =
    assessment.source === "auto" ? "Автоматический мониторинг" : "Запущено пользователем";
  const savedDisagreement = disagreement;

  const handleConfirm = () => {
    onConfirm();
    setNotice({
      tone: "success",
      text: "Оценка подтверждена. Результаты зафиксированы в карточке контрагента.",
    });
  };

  const handleSaveDisagree = () => {
    if (!disagreeText.trim()) return;
    onDisagree({ reason: disagreeReason, text: disagreeText.trim() });
    setDisagreeOpen(false);
    setDisagreeText("");
    setNotice({ tone: "info", text: "Комментарий сохранён" });
  };

  const handleDownload = () => {
    setNotice({ tone: "info", text: "Отчёт по оценке скачан" });
  };


  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/10 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 grid h-[calc(100dvh-32px)] max-h-[calc(100dvh-32px)] w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-3xl border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-3xl">
        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className={cn("relative border-b border-border px-7 pt-6 pb-5", meta.headerBg)}>
            <div className="absolute right-5 top-5 flex items-center gap-2">
              {onRun && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setRunOpen((v) => !v)}
                  disabled={running}
                >
                  {running ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Запуск…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" /> Запустить новую оценку
                    </>
                  )}
                </Button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full bg-white/70 p-1.5 text-muted-foreground backdrop-blur hover:bg-white"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.chip}`}>
                {meta.label}
              </span>
              <span className="text-[11px] text-muted-foreground">Оценка контрагента</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              {assessment.counterpartyName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{assessment.inn}</span>
              <span>·</span>
              <span>Оценка: {assessment.date}</span>
              <span>·</span>
              <span>{sourceLabel}</span>
              {assessment.nextCheck && (
                <>
                  <span>·</span>
                  <span>Следующая проверка: {assessment.nextCheck}</span>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-5 overflow-y-auto bg-white px-6 py-5">
            {notice && (
              <div
                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                  notice.tone === "success"
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                    : "border-border bg-slate-50 text-foreground"
                }`}
                role="status"
              >
                {notice.tone === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 leading-snug">{notice.text}</div>
                <button
                  onClick={() => setNotice(null)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-black/5"
                  aria-label="Закрыть"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {runOpen && onRun && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Запустить новую оценку</div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Агент проверит контрагента по 43 критериям благонадёжности. Можно указать любой ИНН.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          ИНН для оценки
                        </label>
                        <Input
                          value={runInn}
                          onChange={(e) => setRunInn(e.target.value)}
                          placeholder="ИНН"
                          className="mt-1 bg-white"
                          disabled={running}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRunOpen(false)}
                          disabled={running}
                        >
                          Отмена
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => runInn.trim() && onRun(runInn.trim())}
                          disabled={running || !runInn.trim()}
                        >
                          {running ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Запуск…
                            </>
                          ) : (
                            "Запустить"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Assistant summary — left, row 1 */}
              <div className="order-1 lg:col-start-1 lg:row-start-1">
                <div className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        NORM AI · Резюме оценки
                      </div>
                      <p className="mt-1 text-sm leading-snug text-foreground">{assessment.summary}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Выявленные критерии могут быть использованы как основание для сигналов риска.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What changed — right, spans both rows */}
              <aside className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <div className="rounded-2xl border border-border bg-white p-4 lg:sticky lg:top-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Что изменилось</div>
                      <div className="text-[11px] text-muted-foreground">За последний период</div>
                    </div>
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                      {assessment.changes.length}
                    </span>
                  </div>
                  <div className="mt-3">
                    {assessment.changes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        За последний период новых факторов не обнаружено
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {assessment.changes.map((c, i) => (
                          <li key={i} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneStyles[c.tone].dot}`} />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs leading-snug text-foreground">{c.text}</div>
                              <div className="mt-0.5 text-[10px] text-muted-foreground">
                                {toneLabel[c.tone]}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </aside>

              {/* Groups — left, row 2 */}
              <section className="order-3 lg:col-start-1 lg:row-start-2">
                <h3 className="mb-2 text-sm font-semibold">Группы оценки</h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {assessment.groups.map((g) => {
                    const counts = groupCounts(g);
                    const t = toneStyles[g.tone];
                    const isPositive = g.id === "positive";
                    const groupStatus =
                      counts.detected > 0 && !isPositive
                        ? "Требует внимания"
                        : isPositive && counts.detected > 0
                          ? "Подтверждено частично"
                          : "Без замечаний";
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGroupDrawer(g)}
                        className={`group flex items-start gap-3 rounded-xl border border-border border-l-4 ${t.border} bg-white p-3.5 text-left transition hover:bg-muted/30`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground">{g.title}</div>
                          <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                            {g.description}
                          </div>
                          <div className="mt-2 text-[11px] text-muted-foreground">
                            {g.total} {pluralCriteria(g.total)}
                            {" · "}
                            <span className={counts.detected > 0 ? t.iconText : ""}>
                              {isPositive
                                ? `${counts.detected} подтверждено`
                                : `${counts.detected} выявлено`}
                            </span>
                            {" · "}
                            {isPositive
                              ? `${counts.review + counts.clear} не подтверждено`
                              : `${counts.clear} без замечаний`}
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${t.chip}`}>
                              {groupStatus}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {savedDisagreement && (
              <section className="rounded-xl border border-border bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Комментарий к несогласию
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Причина: {savedDisagreement.reason}
                </div>
                <div className="mt-1 text-sm text-foreground">«{savedDisagreement.text}»</div>
              </section>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-border bg-white px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleConfirm}
                className="h-12 flex-1 rounded-full text-sm font-medium"
              >
                <CheckCircle2 className="h-4 w-4" /> Подтвердить
              </Button>
              <Button
                variant="outline"
                onClick={() => setDisagreeOpen((v) => !v)}
                className="h-12 flex-1 rounded-full text-sm font-medium"
              >
                Не согласен
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="h-12 flex-1 rounded-full text-sm font-medium"
              >
                <Download className="h-4 w-4" /> Скачать
              </Button>
            </div>
          </div>


          {/* Disagree inline panel */}
          {disagreeOpen && (
            <>
              <div
                className="absolute inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px]"
                onClick={() => setDisagreeOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-border bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Комментарий к несогласию</h4>
                  <button
                    onClick={() => setDisagreeOpen(false)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Причина</label>
                    <select
                      value={disagreeReason}
                      onChange={(e) => setDisagreeReason(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                    >
                      {REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Опишите, с чем вы не согласны
                    </label>
                    <Textarea
                      className="mt-1 min-h-[80px]"
                      value={disagreeText}
                      onChange={(e) => setDisagreeText(e.target.value)}
                      placeholder="Комментарий"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setDisagreeOpen(false)}>
                      Отмена
                    </Button>
                    <Button size="sm" onClick={handleSaveDisagree} disabled={!disagreeText.trim()}>
                      Сохранить комментарий
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <AssessmentGroupDrawer
            group={groupDrawer}
            open={!!groupDrawer}
            onOpenChange={(o) => !o && setGroupDrawer(null)}
          />
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function pluralCriteria(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "критерий";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "критерия";
  return "критериев";
}

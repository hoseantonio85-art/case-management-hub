import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2, Paperclip, FileText, Clock, History as HistoryIcon } from "lucide-react";
import type { CollectionSubStep } from "@/lib/mock-data";
import { InModalDrawer } from "./InModalDrawer";
import type { StepAnim } from "./DebtSummaryCard";
import {
  stageOrder,
  stepMetaByTitle,
  computeDue,
  formatDDMMYYYY,
  diffDays,
  TODAY,
  type RequiredField,
} from "@/lib/debt-process";

export interface DebtHistoryEntry {
  date: string;
  action: string;
  step: string;
  user: string;
  comment?: string;
}

export interface DebtSummary {
  overdueAmount: string;
  overdueStartDate: string;
  overdueDays: number;
  responsible: string;
}

export type CompletedFields = Record<string, Record<string, string>>;

export function DebtProcessDrawer({
  steps,
  stepAnim,
  open,
  onOpenChange,
  onAdvance,
  onRollback,
  onFieldChange,
  completedFields,
  history,
  summary,
  error,
}: {
  steps: CollectionSubStep[];
  stepAnim?: StepAnim;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdvance: () => void;
  onRollback: (comment: string) => void;
  onFieldChange: (stepId: string, key: string, value: string) => void;
  completedFields: CompletedFields;
  history: DebtHistoryEntry[];
  summary: DebtSummary;
  error?: string | null;
}) {
  const currentIdx = steps.findIndex((s) => s.status === "current");
  const current = currentIdx === -1 ? null : steps[currentIdx];
  const currentMeta = current ? stepMetaByTitle[current.title] : null;

  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackComment, setRollbackComment] = useState("");

  const handleRollback = () => {
    if (!rollbackComment.trim()) return;
    onRollback(rollbackComment.trim());
    setRollbackComment("");
    setRollbackOpen(false);
  };

  const canRollback = currentIdx > 0;

  return (
    <InModalDrawer open={open} onOpenChange={onOpenChange}>
      <div className="bg-gradient-to-b from-slate-50 via-slate-50/40 to-transparent px-6 pt-6 pb-5">
        <h2 className="text-2xl font-semibold tracking-tight">Работа с задолженностью</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Контроль этапов взыскания, SLA и обязательных данных
        </p>
      </div>

      <div className="px-6 pb-6 pt-2 space-y-5">
        {/* Summary */}
        <section className="rounded-2xl border border-border bg-white p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <SummaryItem label="Просроченная задолженность" value={summary.overdueAmount} accent={summary.overdueDays > 0} />
            <SummaryItem label="Дата возникновения" value={summary.overdueStartDate || "—"} />
            <SummaryItem label="Дней просрочки" value={summary.overdueDays > 0 ? `${summary.overdueDays}` : "—"} />
            <SummaryItem label="Текущий этап" value={current?.title ?? "—"} />
            <SummaryItem label="Плановая дата" value={current?.plannedDate ?? "—"} />
            <SummaryItem label="Ответственный" value={summary.responsible} />
          </div>
        </section>

        {/* Timeline grouped by stage */}
        <section className="space-y-4">
          {stageOrder.map((stage) => {
            const stageSteps = steps
              .map((s, i) => ({ s, i }))
              .filter(({ s }) => s.stage === stage);
            const stageActive = stageSteps.some(({ s }) => s.status === "current");
            const stageDone =
              stageSteps.length > 0 && stageSteps.every(({ s }) => s.status === "done");
            return (
              <div key={stage}>
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      stageDone || stageActive ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      stageActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage}
                  </div>
                </div>
                <div className="space-y-2">
                  {stageSteps.map(({ s, i }) => (
                    <StepCard
                      key={s.id}
                      step={s}
                      globalIndex={i}
                      animating={s.status === "current" && !!stepAnim}
                      animTick={stepAnim?.tick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Required fields for current step */}
        {current && currentMeta && (
          <section className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold">Данные для перехода</h3>
              <span className="text-[11px] text-muted-foreground">этап: {current.title}</span>
            </div>
            {currentMeta.requiredFields && currentMeta.requiredFields.length > 0 ? (
              <div className="space-y-3">
                {currentMeta.requiredFields.map((f) => (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={completedFields[current.id]?.[f.key] ?? ""}
                    onChange={(v) => onFieldChange(current.id, f.key, v)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Для перехода с этого этапа дополнительные данные не требуются
              </div>
            )}
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onAdvance}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            <ArrowRight className="h-4 w-4" /> Перевести на следующий этап
          </button>
          {canRollback && !rollbackOpen && (
            <button
              onClick={() => setRollbackOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Вернуть на предыдущий этап
            </button>
          )}
          {canRollback && rollbackOpen && (
            <div className="rounded-xl border border-border bg-slate-50/60 p-3 space-y-2">
              <div className="text-xs font-medium text-foreground">
                Укажите причину отката этапа
              </div>
              <textarea
                value={rollbackComment}
                onChange={(e) => setRollbackComment(e.target.value)}
                rows={2}
                placeholder="Комментарий обязателен"
                className="w-full resize-none rounded-md border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-foreground/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRollback}
                  disabled={!rollbackComment.trim()}
                  className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-40"
                >
                  Подтвердить откат
                </button>
                <button
                  onClick={() => {
                    setRollbackOpen(false);
                    setRollbackComment("");
                  }}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <section className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <HistoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">История этапов</h3>
          </div>
          {history.length === 0 ? (
            <div className="text-xs text-muted-foreground">История пуста</div>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 3).map((h, i) => (
                <li key={i} className="text-xs leading-snug text-muted-foreground">
                  <span className="text-foreground">{h.date}</span> · {h.action} ·{" "}
                  <span className="text-foreground">{h.step}</span> · {h.user}
                  {h.comment && (
                    <div className="mt-0.5 text-[11px] italic text-muted-foreground/80">
                      «{h.comment}»
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </InModalDrawer>
  );
}

function SummaryItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${accent ? "text-amber-700" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function StepCard({
  step,
  globalIndex,
  animating,
  animTick,
}: {
  step: CollectionSubStep;
  globalIndex: number;
  animating: boolean;
  animTick?: number;
}) {
  const meta = stepMetaByTitle[step.title];
  const isCurrent = step.status === "current";
  const isDone = step.status === "done";
  const dueDate = useMemo(() => {
    if (!isCurrent || !meta || !step.startDate) return null;
    return computeDue(step.startDate, meta);
  }, [isCurrent, meta, step.startDate]);
  const remaining = dueDate ? diffDays(TODAY, dueDate) : null;
  const overdue = remaining !== null && remaining < 0;

  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-500 ${
        isCurrent
          ? "border-emerald-200 bg-emerald-50/30"
          : isDone
            ? "border-border bg-white"
            : "border-border bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          key={`dot-${animTick ?? "static"}-${step.id}`}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-transform duration-500 ${
            isCurrent
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-border bg-white text-muted-foreground"
          } ${animating ? "scale-110" : "scale-100"}`}
        >
          {globalIndex + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm leading-tight ${
              isCurrent
                ? "font-semibold text-foreground"
                : isDone
                  ? "text-muted-foreground line-through decoration-muted-foreground/40"
                  : "text-muted-foreground"
            }`}
          >
            {step.title}
          </div>
          {meta && (
            <div className="mt-1 text-[11px] text-muted-foreground">{meta.description}</div>
          )}
          {(meta || isCurrent) && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {meta?.slaLabel && (
                <span>
                  SLA: <b className="text-foreground">{meta.slaLabel}</b>
                </span>
              )}
              {isCurrent && step.startDate && (
                <span>
                  Старт: <b className="text-foreground">{step.startDate}</b>
                </span>
              )}
              {isCurrent && dueDate && (
                <span>
                  План: <b className="text-foreground">{formatDDMMYYYY(dueDate)}</b>
                </span>
              )}
              {isCurrent && remaining !== null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    overdue
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {overdue ? (
                    <>
                      <AlertTriangle className="h-3 w-3" /> Срок истёк на {Math.abs(remaining)} дн.
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" /> Осталось {remaining} дн.
                    </>
                  )}
                </span>
              )}
              {isCurrent && !dueDate && meta?.slaType === "none" && (
                <span className="rounded-full bg-muted px-2 py-0.5">Без SLA</span>
              )}
            </div>
          )}
          {isCurrent && meta?.control && (
            <div className="mt-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <span className="text-muted-foreground">Контроль: </span>
              <span className="text-foreground">{meta.control}</span>
            </div>
          )}
        </div>
        {isDone && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: RequiredField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "file") {
    const mockName =
      field.key === "actSverki"
        ? "Акт сверки.pdf"
        : field.key === "execListFile"
          ? "Исполнительный лист.pdf"
          : "Документ.pdf";
    const attached = !!value;
    return (
      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground">
          {field.label}
        </label>
        {attached ? (
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-900">
              <FileText className="h-3.5 w-3.5" /> {value}
            </span>
            <button
              onClick={() => onChange("")}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Удалить
            </button>
          </div>
        ) : (
          <button
            onClick={() => onChange(mockName)}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-white px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Paperclip className="h-3.5 w-3.5" /> Прикрепить файл
          </button>
        )}
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-foreground">
        {field.label}
      </label>
      <input
        type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-foreground/30"
      />
    </div>
  );
}

import { AlertTriangle, Info } from "lucide-react";
import type { CollectionSubStep } from "@/lib/mock-data";

export type StepAnim = { direction: "forward" | "backward"; tick: number } | null;

export function DebtSummaryCard({
  steps,
  stepAnim,
  onOpenDetails,
}: {
  steps: CollectionSubStep[];
  stepAnim?: StepAnim;
  onOpenDetails: () => void;
}) {
  const currentIdx = steps.findIndex((s) => s.status === "current");
  // Resolve a window of 3 step indices centered on the current step,
  // clamped to the array edges. Falls back to [0,1,2] if no current step.
  const anchor = currentIdx === -1 ? 0 : currentIdx;
  const n = steps.length;
  let start = anchor - 1;
  if (start < 0) start = 0;
  if (start + 3 > n) start = Math.max(0, n - 3);
  const visibleIndices: number[] = [];
  for (let i = start; i < Math.min(start + 3, n); i++) visibleIndices.push(i);

  type Kind = "previous" | "current" | "next";
  const items = visibleIndices.map<{ step: CollectionSubStep; kind: Kind; index: number }>(
    (idx) => ({
      step: steps[idx],
      index: idx,
      kind: idx < anchor ? "previous" : idx === anchor ? "current" : "next",
    }),
  );

  const animating = !!stepAnim;
  const isForward = stepAnim?.direction === "forward";
  const flashClass = animating
    ? isForward
      ? "border-emerald-300 bg-emerald-50/40 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
      : "border-slate-300 bg-slate-50/60 shadow-[0_0_0_4px_rgba(100,116,139,0.08)]"
    : "border-border bg-white";

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-700 ${flashClass}`}
    >
      <div className="mb-4 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold">Работа с задолженностью</h3>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="space-y-0">
        {items.map((it, i) => {
          const isCurrent = it.kind === "current";
          const isPrev = it.kind === "previous";
          const overdue = isCurrent && it.step.overdue;
          const isLast = i === items.length - 1;
          const animateThis = isCurrent && animating;
          const dotCls = isCurrent
            ? overdue
              ? "border-amber-500 text-amber-700 bg-white"
              : "border-rose-400 text-rose-600 bg-white"
            : isPrev
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-border bg-white text-muted-foreground";
          return (
            <div key={it.step.id} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  key={`dot-${stepAnim?.tick ?? "static"}-${it.index}`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-transform duration-500 ${dotCls} ${animateThis ? "scale-110" : "scale-100"}`}
                >
                  {it.index + 1}
                </div>
                {!isLast && <div className="my-1 w-px flex-1 bg-border" />}
              </div>
              <div className={`flex-1 ${isLast ? "" : "pb-4"}`}>
                <div
                  key={`title-${it.step.id}-${isCurrent ? stepAnim?.tick ?? "static" : "static"}`}
                  className={`text-sm leading-tight ${
                    isCurrent
                      ? "font-semibold text-foreground"
                      : isPrev
                        ? "text-muted-foreground line-through decoration-muted-foreground/40"
                        : "text-muted-foreground"
                  } ${animateThis ? "animate-fade-in" : ""}`}
                >
                  {it.step.title}
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  {isCurrent ? (
                    overdue ? (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> Срок истёк
                      </span>
                    ) : it.step.plannedDate ? (
                      <>Дедлайн: {it.step.plannedDate}</>
                    ) : it.step.sla ? (
                      <>SLA: {it.step.sla}</>
                    ) : (
                      "В работе"
                    )
                  ) : isPrev ? (
                    "Пройдено"
                  ) : it.step.sla ? (
                    `План: ${it.step.sla}`
                  ) : (
                    "Следующий этап"
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onOpenDetails}
        className="mt-4 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
      >
        Подробнее
      </button>
    </div>
  );
}

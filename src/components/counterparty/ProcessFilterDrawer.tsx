import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { processMeta, processOrder } from "@/lib/process-meta";
import type { ProcessStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProcessFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProcessStage | null;
  onApply: (value: ProcessStage | null) => void;
  counts: Record<ProcessStage, number>;
}

export function ProcessFilterDrawer({
  open,
  onOpenChange,
  value,
  onApply,
  counts,
}: ProcessFilterDrawerProps) {
  const [draft, setDraft] = useState<ProcessStage | null>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const apply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const reset = () => {
    setDraft(null);
    onApply(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-white p-0 sm:max-w-md [&>button]:hidden"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 pt-6 pb-4">
          <div>
            <div className="text-lg font-semibold tracking-tight text-foreground">
              Фильтр по процессу
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Выберите этап работы с дебитором
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            {processOrder.map((key) => {
              const m = processMeta[key];
              const Icon = m.icon;
              const selected = draft === key;
              const count = counts[key] ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft(selected ? null : key)}
                  className={cn(
                    "group w-full rounded-2xl border bg-white p-4 text-left transition",
                    selected
                      ? `${m.selectedBorder} ${m.selectedBg} shadow-sm`
                      : "border-slate-200 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        m.accentBg,
                        m.accentText,
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-foreground">
                          {m.label}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {count} {pluralDebtors(count)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {m.description}
                      </p>
                      {key === "settlement" && (
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                          <span>Досудебная</span>
                          <span className="opacity-50">→</span>
                          <span>ДРПА</span>
                          <span className="opacity-50">→</span>
                          <span>Суд</span>
                          <span className="opacity-50">→</span>
                          <span>Банкротство</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white px-6 py-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            Сбросить
          </Button>
          <Button size="sm" onClick={apply}>
            Применить
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function pluralDebtors(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "дебитор";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дебитора";
  return "дебиторов";
}

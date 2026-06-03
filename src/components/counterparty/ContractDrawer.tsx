import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowRight } from "lucide-react";
import type { Contract, OverdueRecord } from "@/lib/mock-data";
import { toneStyles } from "./header-theme";

export function ContractDrawer({
  contract,
  counterpartyName,
  measures,
  open,
  onOpenChange,
  onAddOverdue,
  onAdvanceStage,
}: {
  contract: Contract | null;
  counterpartyName?: string;
  measures: string[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAddOverdue: (id: string, record: OverdueRecord) => void;
  onAdvanceStage: (id: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [comment, setComment] = useState("");

  if (!contract) return null;
  const overdue = contract.overdue > 0;
  const tone = overdue ? "danger" : "safe";
  const styles = toneStyles[tone];
  const tagLabel = overdue ? "Есть просроченная задолженность" : "Без просрочки";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <div className={`px-6 pt-6 pb-5 ${styles.gradient}`}>
          <SheetHeader className="space-y-0 text-left">
            <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles.badge}`}>
              {tagLabel}
            </span>
            <SheetTitle className="!mt-3 text-2xl font-semibold tracking-tight">{contract.number}</SheetTitle>
            {counterpartyName && (
              <p className="!mt-1 text-sm text-muted-foreground">{counterpartyName}</p>
            )}
          </SheetHeader>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DebtCard label="Задолженность" value={`${contract.debt.toFixed(1)} млн. ₽`} />
            <DebtCard
              label="Просроченная задолженность"
              value={`${contract.overdue.toFixed(1)} млн. ₽`}
              accent={overdue}
            />
          </div>
        </div>
        <div className="px-6 pb-6 pt-2">
        <div className="mt-4 space-y-5">
          <div className="rounded-xl border border-border bg-white p-4 text-sm">
            <Row label="Дней просрочки" value={contract.overdueDays ? String(contract.overdueDays) : "—"} />
            <Row label="Этап взыскания" value={contract.collectionStage ?? "Не начато"} />
          </div>


          <div>
            <div className="mb-2 text-sm font-semibold">Меры по контрагенту</div>
            {measures.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {measures.map((m) => (
                  <span key={m} className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Меры пока не выбраны</div>
            )}
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">История просрочек</div>
            {contract.overdueHistory.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Записей нет
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                {contract.overdueHistory.map((h, i) => (
                  <div
                    key={i}
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium">{h.date} · {h.amount.toFixed(2)} млн. ₽ · {h.days} дн.</div>
                      {h.comment && <div className="text-muted-foreground">{h.comment}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <div className="mb-3 text-sm font-semibold">Добавить просрочку</div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Сумма, ₽" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input placeholder="Дней" value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
            <Input
              className="mt-2"
              placeholder="Комментарий (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                if (!amount) return;
                onAddOverdue(contract.id, {
                  date: new Date().toLocaleDateString("ru-RU"),
                  amount: Number(amount) / 1_000_000,
                  days: Number(days) || 0,
                  comment: comment || undefined,
                });
                setAmount("");
                setDays("");
                setComment("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Добавить запись
            </Button>
          </div>

          <Button className="w-full" variant="secondary" onClick={() => onAdvanceStage(contract.id)}>
            <ArrowRight className="mr-2 h-4 w-4" /> Перевести этап взыскания
          </Button>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
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


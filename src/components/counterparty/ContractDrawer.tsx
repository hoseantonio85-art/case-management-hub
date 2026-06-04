import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  History as HistoryIcon,
  Info as InfoIcon,
} from "lucide-react";
import type { Contract, OverdueRecord } from "@/lib/mock-data";
import { toneStyles } from "./header-theme";
import { InModalDrawer } from "./InModalDrawer";
import {
  stepMetaByTitle,
  parseDDMMYYYY,
  formatDDMMYYYY,
  computeDue,
  diffDays,
  TODAY,
  type RequiredField,
} from "@/lib/debt-process";

// Full 10-step process (must align with debt-process.ts)
const STEPS = [
  "Коммуникация с должником",
  "Сверка взаиморасчетов",
  "Достигнуты договоренности",
  "Подготовка к обращению в суд",
  "Ведется судебная работа",
  "Получен судебный акт",
  "Ведется исполнительное производство",
  "Банкротство должника",
  "Задолженность погашена",
  "Создание резерва / списание",
] as const;

const stageByStep: Record<string, string> = {
  "Коммуникация с должником": "Досудебное урегулирование",
  "Сверка взаиморасчетов": "Досудебное урегулирование",
  "Достигнуты договоренности": "Досудебное урегулирование",
  "Подготовка к обращению в суд": "Судебная работа",
  "Ведется судебная работа": "Судебная работа",
  "Получен судебный акт": "Судебная работа",
  "Ведется исполнительное производство": "Принудительное взыскание",
  "Банкротство должника": "Принудительное взыскание",
  "Задолженность погашена": "Завершение работы",
  "Создание резерва / списание": "Завершение работы",
};

const stageToStartStep: Record<string, number> = {
  "Досудебное урегулирование": 1,
  "Судебная работа": 3,
  "Принудительное взыскание": 6,
  "Завершение работы": 8,
};

type StepHistoryEntry = {
  date: string;
  action: string;
  step: string;
  user: string;
  comment?: string;
};

type LocalOverdue = OverdueRecord & { source?: string };

const DEFAULT_RESPONSIBLE = "Михайлова Екатерина";

export function ContractDrawer({
  contract,
  counterpartyName,
  caseStatusLabel,
  confirmedRisks = [],
  measures,
  open,
  onOpenChange,
  onAddOverdue,
  onAdvanceStage,
}: {
  contract: Contract | null;
  counterpartyName?: string;
  caseStatusLabel?: string;
  confirmedRisks?: string[];
  measures: string[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAddOverdue: (id: string, record: OverdueRecord) => void;
  onAdvanceStage: (id: string) => void;
}) {
  const [stepIdx, setStepIdx] = useState(1);
  const [stepStartedAt, setStepStartedAt] = useState<string>(formatDDMMYYYY(TODAY));
  const [completedFields, setCompletedFields] = useState<
    Record<number, Record<string, string>>
  >({});
  const [history, setHistory] = useState<StepHistoryEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [transitionComment, setTransitionComment] = useState("");
  const [completionDate, setCompletionDate] = useState(formatDDMMYYYY(TODAY));
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Overdue add form
  const [amount, setAmount] = useState("");
  const [occurDate, setOccurDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [overdueComment, setOverdueComment] = useState("");
  const [localOverdues, setLocalOverdues] = useState<LocalOverdue[]>([]);

  useEffect(() => {
    if (!contract || !open) return;
    const stageStart = stageToStartStep[contract.collectionStage ?? ""] ?? 1;
    setStepIdx(stageStart);
    setStepStartedAt(formatDDMMYYYY(TODAY));
    setCompletedFields({});
    setEditing(false);
    setTransitionComment("");
    setTransitionError(null);
    setNotice(null);
    setCompletionDate(formatDDMMYYYY(TODAY));
    setAmount("");
    setOccurDate("");
    setDueDate("");
    setOverdueComment("");
    setLocalOverdues([]);
    setHistory([
      {
        date: formatDDMMYYYY(TODAY),
        action: "Создан этап",
        step: STEPS[stageStart],
        user: "NORM AI",
      },
    ]);
  }, [contract, open]);

  const currentTitle = STEPS[stepIdx];
  const nextTitle = STEPS[stepIdx + 1];
  const prevTitle = stepIdx > 0 ? STEPS[stepIdx - 1] : null;
  const curMeta = stepMetaByTitle[currentTitle];

  const dueDateObj = useMemo(
    () => (curMeta ? computeDue(stepStartedAt, curMeta) : null),
    [curMeta, stepStartedAt],
  );

  const daysRemaining = dueDateObj ? diffDays(TODAY, dueDateObj) : null;

  if (!contract) return null;

  const overdue = contract.overdue > 0;
  const tone = overdue ? "danger" : "safe";
  const styles = toneStyles[tone];
  const tagLabel = overdue ? "Есть просроченная задолженность" : "Без просрочки";

  const computedDays = (() => {
    const base = parseDDMMYYYY(dueDate) ?? parseDDMMYYYY(occurDate);
    if (!base) return null;
    const d = diffDays(base, TODAY);
    return d > 0 ? d : 0;
  })();

  const requiredFields: RequiredField[] = curMeta?.requiredFields ?? [];
  const curFields = completedFields[stepIdx] ?? {};

  const validateTransition = (): string | null => {
    if (!nextTitle) return "Это последний этап процесса.";
    const missing = requiredFields.filter(
      (f) => !curFields[f.key]?.toString().trim(),
    );
    if (missing.length > 0) return "Заполните обязательные данные для перехода";

    // Rule: act of reconciliation required to enter Судебная работа
    if (
      stageByStep[nextTitle] === "Судебная работа" &&
      stageByStep[currentTitle] === "Досудебное урегулирование"
    ) {
      // current step must either be "Сверка взаиморасчетов" with file uploaded,
      // or previously completed.
      const sverkaIdx = STEPS.indexOf("Сверка взаиморасчетов");
      const sverkaDone =
        stepIdx > sverkaIdx ||
        !!completedFields[sverkaIdx]?.actSverki ||
        (currentTitle === "Сверка взаиморасчетов" && !!curFields.actSverki);
      if (!sverkaDone) {
        return "Для перехода к судебной работе приложите акт сверки взаиморасчетов";
      }
    }
    // Rule: cannot enter ИП without judicial act
    if (nextTitle === "Ведется исполнительное производство") {
      const sudIdx = STEPS.indexOf("Получен судебный акт");
      if (stepIdx < sudIdx) {
        return "Нельзя перейти к исполнительному производству без судебного акта";
      }
    }
    // Rule: cannot close as paid with overdue > 0
    if (nextTitle === "Задолженность погашена" && contract.overdue > 0) {
      return "Нельзя закрыть договор: остается просроченная задолженность";
    }
    return null;
  };

  const handleConfirmTransition = () => {
    const err = validateTransition();
    if (err) {
      setTransitionError(err);
      return;
    }
    const newIdx = stepIdx + 1;
    const prevStage = stageByStep[currentTitle];
    const nextStage = stageByStep[STEPS[newIdx]];
    setStepIdx(newIdx);
    setStepStartedAt(formatDDMMYYYY(TODAY));
    setEditing(false);
    setTransitionError(null);
    setHistory((h) => [
      {
        date: formatDDMMYYYY(TODAY),
        action: "Переведен этап",
        step: STEPS[newIdx],
        user: DEFAULT_RESPONSIBLE,
        comment: transitionComment || undefined,
      },
      ...h,
    ]);
    setTransitionComment("");
    if (prevStage !== nextStage) {
      onAdvanceStage(contract.id);
      setNotice(
        "Этап по договору обновлен. Общий этап кейса обновится по правилам процесса.",
      );
    } else {
      setNotice("Этап по договору обновлен. Общий этап кейса не изменился");
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setCompletedFields((prev) => ({
      ...prev,
      [stepIdx]: { ...(prev[stepIdx] ?? {}), [key]: value },
    }));
    setTransitionError(null);
  };

  const handleAddOverdue = () => {
    if (!amount || !occurDate) return;
    const days = computedDays ?? 0;
    const record: OverdueRecord = {
      date: occurDate,
      amount: Number(amount) / 1_000_000,
      days,
      comment: overdueComment || undefined,
    };
    onAddOverdue(contract.id, record);
    setLocalOverdues((prev) => [{ ...record, source: "Ручной ввод" }, ...prev]);
    setHistory((h) => [
      {
        date: formatDDMMYYYY(TODAY),
        action: "Добавлена просрочка",
        step: currentTitle,
        user: DEFAULT_RESPONSIBLE,
        comment: `${record.amount.toFixed(2)} млн ₽ · ${days} дн.`,
      },
      ...h,
    ]);
    setAmount("");
    setOccurDate("");
    setDueDate("");
    setOverdueComment("");
  };

  const allOverdues: LocalOverdue[] = [
    ...localOverdues,
    ...contract.overdueHistory.map((h) => ({ ...h, source: "NORM AI" })),
  ];

  return (
    <InModalDrawer open={open} onOpenChange={onOpenChange}>
      {/* HEADER */}
      <div className={`px-6 pt-6 pb-5 ${styles.gradient}`}>
        <span
          className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles.badge}`}
        >
          {tagLabel}
        </span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{contract.number}</h2>
        {counterpartyName && (
          <p className="mt-1 text-sm text-muted-foreground">{counterpartyName}</p>
        )}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DebtCard label="Задолженность" value={`${contract.debt.toFixed(1)} млн. ₽`} />
          <DebtCard
            label="Просроченная задолженность"
            value={`${contract.overdue.toFixed(1)} млн. ₽`}
            accent={overdue}
          />
        </div>
      </div>

      <div className="space-y-4 px-6 pb-6 pt-4">
        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{notice}</div>
            <button
              onClick={() => setNotice(null)}
              className="text-emerald-700 hover:underline"
            >
              Скрыть
            </button>
          </div>
        )}

        {/* CASE LINK */}
        <Card title="Связь с кейсом контрагента">
          <Row label="Статус кейса" value={caseStatusLabel ?? "—"} />
          <div className="mt-2">
            <div className="text-xs text-muted-foreground">Подтвержденные риски</div>
            {confirmedRisks.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {confirmedRisks.map((r) => (
                  <Chip key={r}>{r}</Chip>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Нет подтвержденных рисков</div>
            )}
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">Принятые меры</div>
            {measures.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {measures.map((m) => (
                  <Chip key={m}>{m}</Chip>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">
                Меры по контрагенту пока не выбраны
              </div>
            )}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              Влияние на договор:{" "}
              {measures.length > 0
                ? "договор участвует в кейсе взыскания, меры применяются ко всем договорам контрагента."
                : "договор пока не вовлечен в активные меры по кейсу."}
            </div>
          </div>
        </Card>

        {/* WORK ON CONTRACT */}
        <Card title="Работа по договору">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row label="Стадия" value={stageByStep[currentTitle] ?? "—"} />
            <Row label="Этап" value={currentTitle} />
            <Row label="Дата начала" value={stepStartedAt} />
            <Row label="SLA" value={curMeta?.slaLabel ?? "—"} />
            <Row
              label="Плановая дата"
              value={dueDateObj ? formatDDMMYYYY(dueDateObj) : "—"}
            />
            <Row
              label="Статус срока"
              value={
                daysRemaining === null
                  ? "—"
                  : daysRemaining >= 0
                    ? `осталось ${daysRemaining} дн.`
                    : `просрочено на ${-daysRemaining} дн.`
              }
              valueClass={
                daysRemaining !== null && daysRemaining < 0 ? "text-amber-700" : ""
              }
            />
            <Row label="Ответственный" value={DEFAULT_RESPONSIBLE} />
          </div>

          {daysRemaining !== null && daysRemaining < 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Срок истек на {-daysRemaining} дн.
            </div>
          )}

          {/* mini-timeline */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Этапы взыскания
            </div>
            <MiniTimeline currentIdx={stepIdx} prev={prevTitle} cur={currentTitle} next={nextTitle ?? null} />
          </div>

          {/* Change stage */}
          <div className="mt-4 border-t border-border pt-4">
            {!editing ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEditing(true);
                  setTransitionError(null);
                }}
                disabled={!nextTitle}
              >
                <ChevronDown className="mr-2 h-4 w-4" /> Изменить этап
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Переход на следующий этап</div>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    <ChevronUp className="inline h-3.5 w-3.5" /> Свернуть
                  </button>
                </div>
                <Row label="Текущий этап" value={currentTitle} />
                <Row label="Следующий этап" value={nextTitle ?? "—"} />

                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    Дата завершения текущего этапа
                  </div>
                  <Input
                    placeholder="ДД.ММ.ГГГГ"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                  />
                </div>

                {requiredFields.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-foreground">
                      Обязательные данные текущего этапа
                    </div>
                    {requiredFields.map((f) => (
                      <FieldInput
                        key={f.key}
                        field={f}
                        value={curFields[f.key] ?? ""}
                        onChange={(v) => handleFieldChange(f.key, v)}
                      />
                    ))}
                  </div>
                )}

                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Комментарий</div>
                  <Textarea
                    placeholder="Контекст перехода (необязательно)"
                    value={transitionComment}
                    onChange={(e) => setTransitionComment(e.target.value)}
                  />
                </div>

                {transitionError && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {transitionError}
                  </div>
                )}

                <Button className="w-full" onClick={handleConfirmTransition}>
                  Подтвердить переход
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* OVERDUE HISTORY */}
        <Card title="История просрочек">
          {allOverdues.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Записей нет
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              {allOverdues.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 text-xs ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="font-medium">
                    {h.date} · {h.amount.toFixed(2)} млн ₽ · {h.days} дн.
                  </div>
                  <div className="text-muted-foreground">
                    Источник: {h.source ?? "NORM AI"}
                  </div>
                  {h.comment && <div className="text-muted-foreground">{h.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ADD OVERDUE */}
        <Card title="Добавить просрочку">
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput
              label="Сумма просроченной ДЗ, ₽"
              value={amount}
              onChange={setAmount}
              placeholder="100000"
            />
            <LabeledInput
              label="Дата возникновения"
              value={occurDate}
              onChange={setOccurDate}
              placeholder="ДД.ММ.ГГГГ"
            />
            <LabeledInput
              label="Срок исполнения"
              value={dueDate}
              onChange={setDueDate}
              placeholder="ДД.ММ.ГГГГ"
            />
            <LabeledInput
              label="Комментарий"
              value={overdueComment}
              onChange={setOverdueComment}
              placeholder="—"
            />
          </div>
          {computedDays !== null && (
            <div className="mt-2 text-xs text-muted-foreground">
              Дней просрочки: <span className="font-medium text-foreground">{computedDays}</span>
            </div>
          )}
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={handleAddOverdue}
            disabled={!amount || !occurDate}
          >
            <Plus className="mr-2 h-4 w-4" /> Добавить запись
          </Button>
        </Card>

        {/* STAGE HISTORY */}
        <Card title="История этапов договора" icon={<HistoryIcon className="h-3.5 w-3.5" />}>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">История пока пуста</div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              {history.slice(0, 3).map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 text-xs ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="font-medium">
                    {h.date} · {h.action} · {h.step}
                  </div>
                  <div className="text-muted-foreground">{h.user}</div>
                  {h.comment && <div className="text-muted-foreground">{h.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </InModalDrawer>
  );
}

function MiniTimeline({
  currentIdx,
  prev,
  cur,
  next,
}: {
  currentIdx: number;
  prev: string | null;
  cur: string;
  next: string | null;
}) {
  const items: { num: number; title: string; status: "prev" | "cur" | "next" }[] = [];
  if (prev) items.push({ num: currentIdx, title: prev, status: "prev" });
  items.push({ num: currentIdx + 1, title: cur, status: "cur" });
  if (next) items.push({ num: currentIdx + 2, title: next, status: "next" });

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const isCur = it.status === "cur";
        return (
          <div key={it.num} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                isCur
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              {it.num}
            </div>
            <div className={`text-sm ${isCur ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {it.title}
            </div>
          </div>
        );
      })}
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
    const fileName = value || `${field.label}.pdf`;
    return (
      <div>
        <div className="mb-1 text-xs text-muted-foreground">{field.label}</div>
        {value ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <Paperclip className="h-3.5 w-3.5" /> {fileName}
            <button
              onClick={() => onChange("")}
              className="ml-auto text-emerald-700 hover:underline"
            >
              удалить
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onChange(`${field.label}.pdf`)}
          >
            <Paperclip className="mr-2 h-3.5 w-3.5" /> Прикрепить {field.label.toLowerCase()}
          </Button>
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{field.label}</div>
      <Input
        placeholder={field.placeholder ?? (field.type === "date" ? "ДД.ММ.ГГГГ" : "")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs">
      {children}
    </span>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function DebtCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-rose-600" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

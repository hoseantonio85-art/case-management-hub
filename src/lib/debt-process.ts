// Helpers and metadata for the "Работа с задолженностью" process.
//
// Each step (matched by Russian title from mock-data.ts) carries:
//   description, SLA (days + calendar/working/none), control rule,
//   and optional required fields that must be filled before advance.

export type SLAType = "calendar" | "working" | "none";

export type FieldType = "text" | "date" | "file" | "number";

export interface RequiredField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
}

export interface StepMeta {
  description: string;
  slaDays?: number;
  slaType: SLAType;
  slaLabel: string;
  control: string;
  requiredFields?: RequiredField[];
}

export const stageOrder = [
  "Досудебное урегулирование",
  "Судебная работа",
  "Принудительное взыскание",
  "Завершение работы",
] as const;

export const stepMetaByTitle: Record<string, StepMeta> = {
  "Коммуникация с должником": {
    description: "Первичный контакт, звонки, email, переговоры",
    slaDays: 10,
    slaType: "calendar",
    slaLabel: "до 10 календарных дней",
    control: "Автонапоминание при отсутствии смены статуса",
  },
  "Сверка взаиморасчетов": {
    description: "Выяснение наличия / отсутствия спора по сумме, подготовка акта",
    slaDays: 10,
    slaType: "working",
    slaLabel: "до 10 рабочих дней",
    control: "Нельзя перейти в суд, если не загружен акт сверки",
    requiredFields: [{ key: "actSverki", label: "Акт сверки", type: "file" }],
  },
  "Достигнуты договоренности": {
    description: "Утвержден график погашения или реструктуризация",
    slaType: "none",
    slaLabel: "на период графика",
    control: "Контроль первого пропущенного платежа",
    requiredFields: [
      { key: "firstPaymentDate", label: "Дата первого платежа", type: "date" },
      { key: "monthlyAmount", label: "Сумма ежемесячного платежа, ₽", type: "number" },
    ],
  },
  "Подготовка к обращению в суд": {
    description: "Сбор документов, расчёт госпошлины, финализация иска",
    slaDays: 14,
    slaType: "calendar",
    slaLabel: "до 14 календарных дней",
    control: "Проверка комплектности документов",
  },
  "Ведется судебная работа": {
    description: "Иск подан, идёт судебный процесс",
    slaDays: 75,
    slaType: "calendar",
    slaLabel: "по АПК/ГПК, ориентир 2–3 месяца",
    control: "Дата ближайшего заседания, результат заседания",
  },
  "Получен судебный акт": {
    description: "Решение вступило в силу, получен исполнительный лист",
    slaDays: 10,
    slaType: "working",
    slaLabel: "до 10 рабочих дней на предъявление листа",
    control: "Задача на передачу документов приставам",
    requiredFields: [
      { key: "caseNumber", label: "Номер дела", type: "text", placeholder: "А40-…" },
      { key: "decisionDate", label: "Дата решения", type: "date" },
      { key: "execListFile", label: "Скан исполнительного листа", type: "file" },
    ],
  },
  "Ведется исполнительное производство": {
    description: "Лист у приставов, идут мероприятия взыскания",
    slaDays: 60,
    slaType: "calendar",
    slaLabel: "2 месяца по ФЗ-229",
    control: "Флаг контроля бездействия пристава на 45-й день",
    requiredFields: [
      { key: "ipNumber", label: "Номер ИП", type: "text" },
      { key: "fsspDept", label: "Наименование отдела ФССП", type: "text" },
    ],
  },
  "Банкротство должника": {
    description: "Наблюдение или конкурсное производство",
    slaType: "none",
    slaLabel: "согласно плану УУ",
    control: "Связка с судебными делами",
  },
  "Задолженность погашена": {
    description: "Полное поступление денежных средств",
    slaType: "none",
    slaLabel: "—",
    control: "Закрытие карточки долга",
  },
  "Создание резерва / списание": {
    description: "Признание долга безнадёжным",
    slaType: "none",
    slaLabel: "—",
    control: "Приложить постановление об окончании ИП",
  },
};

// --- Date helpers ---

export function parseDDMMYYYY(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

export function formatDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function addDays(date: Date, days: number, type: SLAType): Date {
  const r = new Date(date);
  if (type === "working") {
    let added = 0;
    while (added < days) {
      r.setDate(r.getDate() + 1);
      const day = r.getDay();
      if (day !== 0 && day !== 6) added++;
    }
  } else {
    r.setDate(r.getDate() + days);
  }
  return r;
}

export function computeDue(startDate: string | undefined, meta: StepMeta): Date | null {
  if (!meta.slaDays || meta.slaType === "none") return null;
  const start = parseDDMMYYYY(startDate);
  if (!start) return null;
  return addDays(start, meta.slaDays, meta.slaType);
}

export function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / 86400000);
}

// "today" anchor matches mock-data.ts
export const TODAY = new Date(2026, 5, 3);

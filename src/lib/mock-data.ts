export type RiskStatus = "pending" | "confirmed" | "dismissed" | "verification";
export type RiskPriority = "high" | "medium" | "low";

export interface MeasureDef {
  name: string;
  hint: string;
  kind: "required" | "recommended" | "situational";
}

export interface RiskSignal {
  id: string;
  type: RiskType;
  source: string;
  detectedAt: string;
  description: string;
  status: RiskStatus;
  priority: RiskPriority;
  recommendedAction: string;
  decision?: {
    date: string;
    measures: string[];
    comment: string;
    responsible?: string;
  };
  dismissal?: {
    date: string;
    comment: string;
    responsible?: string;
  };
  verification?: {
    date: string;
    plannedDate: string;
    comment: string;
    responsible: string;
  };
}

export interface OverdueRecord {
  date: string;
  amount: number;
  days: number;
  comment?: string;
}

export interface Contract {
  id: string;
  number: string;
  date: string;
  amount: number;
  debt: number;
  overdue: number;
  overdueDays: number;
  measures: string;
  collectionStage?: string;
  overdueHistory: OverdueRecord[];
}

export interface CollectionSubStep {
  id: string;
  title: string;
  stage: string;
  status: "done" | "current" | "upcoming";
  startDate?: string;
  sla?: string;
  plannedDate?: string;
  overdue?: boolean;
  nextAction?: string;
}

export type ProcessStage = "monitoring" | "risk_confirmation" | "settlement" | "writeoff";

export interface Counterparty {
  id: string;
  name: string;
  inn: string;
  tag: string;
  status: "risk" | "overdue_risk" | "overdue" | "no_risk";
  totalDebt: string;
  overdueDebt: string;
  overdueAmountNum: number;
  lastUpdate: string;
  contracts: Contract[];
  risks: RiskSignal[];
  collection: CollectionSubStep[];
  processStage: ProcessStage;
}

export type RiskType =
  | "Ухудшилось финансовое состояние"
  | "Уголовное дело"
  | "Административные нарушения"
  | "Неисполнение контракта группы"
  | "Ограничения деятельности"
  | "Банкротство / ликвидация";

export const measuresByRisk: Record<RiskType, MeasureDef[]> = {
  "Ухудшилось финансовое состояние": [
    { name: "Блокировка поставок", hint: "Приостановить отгрузку до погашения", kind: "required" },
    { name: "Реструктуризация долга", hint: "Согласовать новый график платежей", kind: "recommended" },
    { name: "Запрос обеспечения", hint: "Залог, поручительство, банковская гарантия", kind: "recommended" },
    { name: "Уступка прав требования", hint: "Передать долг третьему лицу", kind: "situational" },
    { name: "Ускоренное взыскание", hint: "Сократить досудебные сроки", kind: "situational" },
    { name: "Контроль движения средств", hint: "Мониторинг операций по счетам", kind: "recommended" },
  ],
  "Уголовное дело": [
    { name: "Подача заявления в правоохранительные органы", hint: "Зафиксировать ущерб", kind: "required" },
    { name: "Арест имущества", hint: "Через обеспечительные меры суда", kind: "recommended" },
    { name: "Оспаривание сделок", hint: "Проверить подозрительные операции", kind: "recommended" },
    { name: "Гражданский иск", hint: "Заявить в рамках уголовного дела", kind: "situational" },
    { name: "Приостановка отгрузок", hint: "До прояснения ситуации", kind: "required" },
  ],
  "Банкротство / ликвидация": [
    { name: "Подать иск о признании банкротом", hint: "Если есть основания", kind: "situational" },
    { name: "Включиться в реестр требований кредиторов", hint: "В установленный срок", kind: "required" },
    { name: "Оспорить сделки должника", hint: "Сделки за период подозрительности", kind: "recommended" },
  ],
  "Административные нарушения": [
    { name: "Приостановка отгрузок", hint: "До устранения нарушений", kind: "recommended" },
    { name: "Запрос обеспечения", hint: "Залог или поручительство", kind: "situational" },
    { name: "Ускоренное взыскание", hint: "Сокращение сроков претензионки", kind: "situational" },
  ],
  "Неисполнение контракта группы": [
    { name: "Блокировка поставок", hint: "По всем компаниям группы", kind: "required" },
    { name: "Реструктуризация долга", hint: "По группе компаний", kind: "recommended" },
    { name: "Запрос обеспечения", hint: "От головной компании группы", kind: "recommended" },
    { name: "Ускоренное взыскание", hint: "По всем договорам группы", kind: "situational" },
  ],
  "Ограничения деятельности": [
    { name: "Проверка полномочий подписанта", hint: "Актуальность доверенностей", kind: "required" },
    { name: "Оспаривание договора", hint: "Если заключен с нарушением", kind: "situational" },
    { name: "Запрос подтверждения факта запрета", hint: "Официальный запрос в орган", kind: "recommended" },
    { name: "Подача заявления о принудительной ликвидации", hint: "При систематических нарушениях", kind: "situational" },
  ],
};

const today = "03.06.2026";

export const counterparties: Counterparty[] = [
  {
    id: "omega",
    name: "ООО «ОмегаСервис»",
    inn: "7746792749",
    tag: "Просрочено с риском дефолта",
    status: "overdue_risk",
    totalDebt: "1,5 млн. ₽",
    overdueDebt: "0,2 млн. ₽",
    overdueAmountNum: 0.2,
    lastUpdate: "02.06.2026",
    contracts: [
      {
        id: "c1",
        number: "№ 08-Г/2023",
        date: "12.03.2023",
        amount: 1.5,
        debt: 0.5,
        overdue: 0.2,
        overdueDays: 20,
        measures: "Подписан акт сверки",
        collectionStage: "Досудебное урегулирование",
        overdueHistory: [
          { date: "14.05.2026", amount: 0.1, days: 5, comment: "Не оплачена накладная №142" },
          { date: "24.05.2026", amount: 0.1, days: 15, comment: "Не оплачена накладная №158" },
        ],
      },
      { id: "c2", number: "№ 09-Г/2023", date: "01.07.2023", amount: 0.7, debt: 0.7, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
      { id: "c3", number: "№ 10-Г/2023", date: "20.11.2023", amount: 0.3, debt: 0.3, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
    ],
    risks: [
      {
        id: "r1",
        type: "Ухудшилось финансовое состояние",
        source: "ФНС",
        detectedAt: "01.06.2026",
        description: "Действующее решение ФНС о приостановлении операций по счетам",
        status: "pending",
        priority: "high",
        recommendedAction: "Подтвердить и заблокировать поставки",
      },
      {
        id: "r2",
        type: "Уголовное дело",
        source: "Судебные дела",
        detectedAt: "29.05.2026",
        description: "Возбуждено уголовное дело в отношении генерального директора",
        status: "pending",
        priority: "high",
        recommendedAction: "Эскалация в службу безопасности",
      },
      {
        id: "r3",
        type: "Административные нарушения",
        source: "Федресурс",
        detectedAt: "24.05.2026",
        description: "3 новых исполнительных производства за последние 30 дней",
        status: "pending",
        priority: "medium",
        recommendedAction: "Доп. проверка контрагента",
      },
      {
        id: "r4",
        type: "Банкротство / ликвидация",
        source: "Федресурс",
        detectedAt: "20.05.2026",
        description: "Опубликовано намерение кредитора подать заявление о банкротстве",
        status: "pending",
        priority: "high",
        recommendedAction: "Подготовка к включению в реестр кредиторов",
      },
    ],
    collection: makeCollection("Сверка взаиморасчетов", { startDate: "28.05.2026", sla: "10 дней", plannedDate: "07.06.2026", overdue: false, nextAction: "Получить подписанный акт сверки" }),
    processStage: "settlement",
  },
  {
    id: "gamma",
    name: "ООО «Гамма Плюс»",
    inn: "7723451180",
    tag: "Просрочено",
    status: "overdue",
    totalDebt: "1,2 млн. ₽",
    overdueDebt: "0,1 млн. ₽",
    overdueAmountNum: 0.1,
    lastUpdate: "01.06.2026",
    contracts: [
      { id: "g1", number: "№ 11-Г/2024", date: "15.02.2024", amount: 0.6, debt: 0.6, overdue: 0.1, overdueDays: 12, measures: "Направлена претензия", collectionStage: "Досудебное урегулирование",
        overdueHistory: [{ date: "22.05.2026", amount: 0.1, days: 12, comment: "Не оплачен этап работ" }] },
      { id: "g2", number: "№ 12-Г/2024", date: "10.05.2024", amount: 0.4, debt: 0.4, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
      { id: "g3", number: "№ 13-Г/2024", date: "01.09.2024", amount: 0.2, debt: 0.2, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
    ],
    risks: [],
    collection: makeCollection("Коммуникация с должником", { startDate: "20.05.2026", sla: "7 дней", plannedDate: "27.05.2026", overdue: true, nextAction: "Направить повторное требование" }),
    processStage: "writeoff",
  },
  {
    id: "delta",
    name: "АО «Дельта-Строй»",
    inn: "7714067922",
    tag: "Подтвержденный риск",
    status: "risk",
    totalDebt: "3,4 млн. ₽",
    overdueDebt: "0,0 млн. ₽",
    overdueAmountNum: 0,
    lastUpdate: "30.05.2026",
    contracts: [
      { id: "d1", number: "№ 22-С/2024", date: "10.01.2024", amount: 2.0, debt: 2.0, overdue: 0, overdueDays: 0, measures: "Запрос обеспечения", overdueHistory: [] },
      { id: "d2", number: "№ 23-С/2024", date: "01.04.2024", amount: 1.4, debt: 1.4, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
    ],
    risks: [
      {
        id: "d-r1",
        type: "Ухудшилось финансовое состояние",
        source: "Контур.Фокус",
        detectedAt: "10.05.2026",
        description: "Снижение выручки на 38% за квартал, рост кредиторской задолженности",
        status: "confirmed",
        priority: "medium",
        recommendedAction: "Контроль и обеспечение",
        decision: {
          date: "12.05.2026",
          measures: ["Запрос обеспечения", "Контроль движения средств"],
          comment: "Согласовано усиление контроля, обеспечение запрошено у поручителя",
          responsible: "Михайлова Е.",
        },
      },
    ],
    collection: makeCollection("Коммуникация с должником", { startDate: "15.05.2026", sla: "14 дней", plannedDate: "29.05.2026", overdue: false, nextAction: "Запросить документы по обеспечению" }),
    processStage: "risk_confirmation",
  },
  {
    id: "sigma",
    name: "ООО «Сигма-Логистик»",
    inn: "7702345678",
    tag: "Снятый риск",
    status: "no_risk",
    totalDebt: "0,8 млн. ₽",
    overdueDebt: "0,0 млн. ₽",
    overdueAmountNum: 0,
    lastUpdate: "28.05.2026",
    contracts: [
      { id: "sg1", number: "№ 05-Л/2024", date: "20.02.2024", amount: 0.8, debt: 0.8, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
    ],
    risks: [
      {
        id: "sg-r1",
        type: "Административные нарушения",
        source: "ФНС",
        detectedAt: "15.04.2026",
        description: "Зафиксировано нарушение по уплате НДС, впоследствии устранено",
        status: "dismissed",
        priority: "low",
        recommendedAction: "—",
        dismissal: {
          date: "20.04.2026",
          comment: "Контрагент предоставил подтверждение уплаты, риск не подтвердился",
          responsible: "Михайлова Е.",
        },
      },
    ],
    collection: makeCollection(null),
    processStage: "monitoring",
  },
  {
    id: "vector",
    name: "ООО «Вектор-Трейд»",
    inn: "7710456001",
    tag: "На дополнительной проверке",
    status: "risk",
    totalDebt: "2,1 млн. ₽",
    overdueDebt: "0,0 млн. ₽",
    overdueAmountNum: 0,
    lastUpdate: "29.05.2026",
    contracts: [
      { id: "v1", number: "№ 14-Т/2024", date: "11.03.2024", amount: 1.2, debt: 1.2, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
      { id: "v2", number: "№ 15-Т/2024", date: "22.05.2024", amount: 0.9, debt: 0.9, overdue: 0, overdueDays: 0, measures: "—", overdueHistory: [] },
    ],
    risks: [
      {
        id: "v-r1",
        type: "Неисполнение контракта группы",
        source: "ЦС мониторинг",
        detectedAt: "25.05.2026",
        description: "Связанная компания группы не исполнила обязательства по другому договору",
        status: "verification",
        priority: "medium",
        recommendedAction: "Запросить пояснения и проверить группу",
        verification: {
          date: "26.05.2026",
          plannedDate: "10.06.2026",
          comment: "Запрос направлен в СБ для проверки структуры группы и связанных компаний",
          responsible: "Соколов А. (СБ)",
        },
      },
      {
        id: "v-r2",
        type: "Ограничения деятельности",
        source: "Стоп-лист ПАО",
        detectedAt: "27.05.2026",
        description: "Контрагент включен во внутренний стоп-лист аффилированной структуры",
        status: "pending",
        priority: "low",
        recommendedAction: "Уточнить причину включения",
      },
    ],
    collection: makeCollection(null),
    processStage: "risk_confirmation",
  },
];

function makeCollection(
  currentTitle: string | null,
  meta?: Partial<CollectionSubStep>,
): CollectionSubStep[] {
  const all: { title: string; stage: string }[] = [
    { title: "Коммуникация с должником", stage: "Досудебное урегулирование" },
    { title: "Сверка взаиморасчетов", stage: "Досудебное урегулирование" },
    { title: "Достигнуты договоренности", stage: "Досудебное урегулирование" },
    { title: "Подготовка к обращению в суд", stage: "Судебная работа" },
    { title: "Ведется судебная работа", stage: "Судебная работа" },
    { title: "Получен судебный акт", stage: "Судебная работа" },
    { title: "Ведется исполнительное производство", stage: "Принудительное взыскание" },
    { title: "Банкротство должника", stage: "Принудительное взыскание" },
    { title: "Задолженность погашена", stage: "Завершение работы" },
    { title: "Создание резерва / списание", stage: "Завершение работы" },
  ];
  const currentIdx = currentTitle ? all.findIndex((s) => s.title === currentTitle) : -1;
  return all.map((s, i) => {
    const base: CollectionSubStep = {
      id: `s${i + 1}`,
      title: s.title,
      stage: s.stage,
      status: currentIdx === -1 ? "upcoming" : i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming",
    };
    if (i === currentIdx && meta) return { ...base, ...meta };
    return base;
  });
}

export const todayLabel = today;

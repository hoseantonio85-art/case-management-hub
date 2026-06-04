// Mapping between confirmed risk measures and the target collection step title.
// Used to advance "Работа с задолженностью" when a risk is confirmed.

export const measureToStepTitle: Record<string, string> = {
  "Ускоренное взыскание": "Подготовка к обращению в суд",
  "Ускоренное взыскание в досудебном порядке": "Подготовка к обращению в суд",
  "Реструктуризация долга": "Достигнуты договоренности",
  "Запрос обеспечения": "Сверка взаиморасчетов",
  "Блокировка поставок": "Коммуникация с должником",
  "Приостановка отгрузок": "Коммуникация с должником",
  "Подать иск о признании банкротом": "Банкротство должника",
  "Включиться в реестр требований кредиторов": "Банкротство должника",
  "Арест имущества": "Ведется судебная работа",
  "Гражданский иск": "Ведется судебная работа",
};

/**
 * Pick the "furthest" target step title from selected measures, using the
 * provided ordered list of step titles. Returns null if none of the measures
 * map to a known step.
 */
export function pickFurthestStepTitle(
  measures: string[],
  orderedStepTitles: string[],
): string | null {
  let bestIdx = -1;
  let best: string | null = null;
  for (const m of measures) {
    const target = measureToStepTitle[m];
    if (!target) continue;
    const idx = orderedStepTitles.indexOf(target);
    if (idx > bestIdx) {
      bestIdx = idx;
      best = target;
    }
  }
  return best;
}

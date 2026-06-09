import { Eye, ShieldAlert, Scale, Archive, type LucideIcon } from "lucide-react";
import type { ProcessStage } from "./mock-data";

type CategoryKey = "risk" | "overdue_risk" | "no_risk" | "overdue";

export interface ProcessMeta {
  key: ProcessStage;
  step: number;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Which problem tiles are valid inside this process */
  allowedCategories: CategoryKey[];
  /** Visual accent classes */
  accentBg: string;
  accentText: string;
  accentBorder: string;
  /** Selected card classes */
  selectedBorder: string;
  selectedBg: string;
}

export const processMeta: Record<ProcessStage, ProcessMeta> = {
  monitoring: {
    key: "monitoring",
    step: 1,
    label: "Мониторинг",
    description:
      "Есть ДЗ, признаков дефолта нет. Плановое наблюдение до возникновения просрочки.",
    icon: Eye,
    allowedCategories: ["no_risk"],
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-600",
    accentBorder: "border-emerald-200",
    selectedBorder: "border-emerald-400",
    selectedBg: "bg-emerald-50/60",
  },
  risk_confirmation: {
    key: "risk_confirmation",
    step: 2,
    label: "Подтверждение риска",
    description:
      "Есть ДЗ и признаки дефолта. Безопасность подтверждает риск и определяет дальнейший горизонт работы.",
    icon: ShieldAlert,
    allowedCategories: ["risk"],
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
    accentBorder: "border-amber-200",
    selectedBorder: "border-amber-400",
    selectedBg: "bg-amber-50/60",
  },
  settlement: {
    key: "settlement",
    step: 3,
    label: "Урегулирование",
    description: "ПДЗ и риск дефолта. Работа по этапам взыскания.",
    icon: Scale,
    allowedCategories: ["overdue", "overdue_risk"],
    accentBg: "bg-orange-50",
    accentText: "text-orange-600",
    accentBorder: "border-orange-200",
    selectedBorder: "border-orange-400",
    selectedBg: "bg-orange-50/60",
  },
  writeoff: {
    key: "writeoff",
    step: 4,
    label: "Списание / резерв",
    description:
      "ПДЗ без перспективы взыскания. Подготовка к списанию с указанием основания.",
    icon: Archive,
    allowedCategories: ["overdue", "overdue_risk"],
    accentBg: "bg-slate-100",
    accentText: "text-slate-600",
    accentBorder: "border-slate-200",
    selectedBorder: "border-slate-400",
    selectedBg: "bg-slate-50",
  },
};

export const processOrder: ProcessStage[] = [
  "monitoring",
  "risk_confirmation",
  "settlement",
  "writeoff",
];

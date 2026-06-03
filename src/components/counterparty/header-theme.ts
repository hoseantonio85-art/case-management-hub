export type HeaderTone = "danger" | "warn" | "caution" | "safe" | "neutral";

export function getToneForTag(tag: string): HeaderTone {
  const t = tag.toLowerCase();
  if (t.includes("просрочено с риском") || t.includes("дефолт") && t.includes("просроч")) return "danger";
  if (t.includes("риск дефолта")) return "caution";
  if (t.includes("просроч")) return "warn";
  if (t.includes("нет риска")) return "safe";
  if (t.includes("снят")) return "safe";
  if (t.includes("подтвержд")) return "danger";
  return "neutral";
}

export const toneStyles: Record<HeaderTone, { gradient: string; badge: string }> = {
  danger: {
    gradient: "bg-gradient-to-b from-rose-50 via-rose-50/40 to-transparent",
    badge: "bg-rose-100/80 text-rose-900",
  },
  warn: {
    gradient: "bg-gradient-to-b from-orange-50 via-orange-50/40 to-transparent",
    badge: "bg-orange-100/80 text-orange-900",
  },
  caution: {
    gradient: "bg-gradient-to-b from-amber-50 via-amber-50/40 to-transparent",
    badge: "bg-amber-100/80 text-amber-900",
  },
  safe: {
    gradient: "bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-transparent",
    badge: "bg-emerald-100/80 text-emerald-900",
  },
  neutral: {
    gradient: "bg-gradient-to-b from-slate-50 via-slate-50/40 to-transparent",
    badge: "bg-slate-100 text-slate-800",
  },
};

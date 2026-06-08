import { cn } from "@/lib/utils";

export type RegistrationInfo = {
  registrationDate: string;
  businessAge: string;
  okvedCode: string;
  okvedName: string;
  legalAddress: string;
  egrulStatus: string;
};

export const defaultRegistrationInfo: RegistrationInfo = {
  registrationDate: "14.03.2016",
  businessAge: "10 лет 3 месяца",
  okvedCode: "71.11",
  okvedName: "Деятельность в области архитектуры и инженерных изысканий",
  legalAddress: "Москва, ул. Большая Полянка, д. 24, стр. 1",
  egrulStatus: "Действующее, ликвидация не запущена",
};

export const defaultOgrn = "1167746123456";

export function RegistrationInfoWidget({
  registrationInfo = defaultRegistrationInfo,
  className,
}: {
  registrationInfo?: RegistrationInfo;
  className?: string;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Дата регистрации",
      value: `${registrationInfo.registrationDate} (${registrationInfo.businessAge})`,
    },
    {
      label: "Основной ОКВЭД",
      value: `${registrationInfo.okvedCode} · ${registrationInfo.okvedName}`,
    },
    { label: "Юридический адрес", value: registrationInfo.legalAddress },
    { label: "Текущий статус ЕГРЮЛ", value: registrationInfo.egrulStatus },
  ];

  return (
    <div className={cn("rounded-2xl border border-border bg-white p-4", className)}>
      <div className="text-sm font-semibold text-foreground">Регистрационные данные</div>
      <div className="text-[11px] text-muted-foreground">Сведения из ЕГРЮЛ</div>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.label} className="py-2.5 first:pt-0 last:pb-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {r.label}
            </div>
            <div className="mt-0.5 text-xs leading-snug text-foreground break-words">
              {r.value}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { CollectionSubStep } from "@/lib/mock-data";
import { DebtStepper } from "./DebtStepper";

export function DebtProcessDrawer({
  steps,
  open,
  onOpenChange,
  onAdvance,
  error,
}: {
  steps: CollectionSubStep[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdvance: () => void;
  error?: string | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <div className="bg-gradient-to-b from-slate-50 via-slate-50/40 to-transparent px-6 pt-6 pb-5">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              Работа с задолженностью
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Полный процесс по стадиям и этапам взыскания
            </p>
          </SheetHeader>
        </div>
        <div className="px-6 pb-6 pt-2 space-y-4">
          <DebtStepper steps={steps} error={error} />
          <Button className="w-full" variant="secondary" onClick={onAdvance}>
            <ArrowRight className="mr-2 h-4 w-4" /> Перевести на следующий этап
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

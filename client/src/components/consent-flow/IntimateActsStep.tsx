import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { intimateActOptions } from "@/lib/consentFlowConstants";

interface IntimateActsStepProps {
  stepNumber: number;
  intimateActs: Record<string, "yes" | "no">;
  onToggle: (act: string) => void;
  onShowAdvancedOptions: () => void;
}

export function IntimateActsStep({
  stepNumber,
  intimateActs,
  onToggle,
  onShowAdvancedOptions,
}: IntimateActsStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Step {stepNumber}: Intimate Acts</h2>
        <p className="text-sm text-muted-foreground">
          Tap once for YES (green ✓), twice for NO (red ✗), three times to unselect
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {intimateActOptions.map((act) => {
          const actState = intimateActs[act];
          const isYes = actState === "yes";
          const isNo = actState === "no";
          
          return (
            <Card
              key={act}
              className={`p-3 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                isYes
                  ? "border-success bg-success/5"
                  : isNo
                  ? "border-destructive bg-destructive/5"
                  : ""
              }`}
              onClick={() => onToggle(act)}
              data-testid={`option-act-${act}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  isYes
                    ? "border-success bg-success"
                    : isNo
                    ? "border-destructive bg-destructive"
                    : "border-muted-foreground"
                }`}>
                  {isYes && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isNo && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-medium leading-tight">{act}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={onShowAdvancedOptions}
        data-testid="button-advanced"
      >
        Advanced Options
      </Button>
    </div>
  );
}

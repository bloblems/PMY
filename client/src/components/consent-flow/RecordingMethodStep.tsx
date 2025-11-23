import { Card } from "@/components/ui/card";
import { recordingMethods, type RecordingMethod } from "@/lib/consentFlowConstants";

interface RecordingMethodStepProps {
  selectedMethod: RecordingMethod | null;
  stepNumber: number;
  onSelect: (method: RecordingMethod) => void;
}

export function RecordingMethodStep({
  selectedMethod,
  stepNumber,
  onSelect,
}: RecordingMethodStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Step {stepNumber}: Recording Method</h2>
        <p className="text-sm text-muted-foreground">How would you like to document consent?</p>
      </div>
      <div className="space-y-3">
        {recordingMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Card
              key={method.id}
              className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                selectedMethod === method.id
                  ? "border-success bg-success/5"
                  : ""
              }`}
              onClick={() => onSelect(method.id)}
              data-testid={`option-method-${method.id}`}
            >
              <div className="flex items-center gap-4">
                <Icon className={`h-6 w-6 ${selectedMethod === method.id ? "text-success" : ""}`} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{method.label}</div>
                  <div className="text-xs text-muted-foreground">{method.description}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

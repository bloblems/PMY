import { Card } from "@/components/ui/card";
import { intimateEncounterType, encounterTypes, otherEncounterType } from "@/lib/consentFlowConstants";

interface EncounterTypeStepProps {
  selectedEncounterType: string;
  stepNumber: number;
  onSelect: (encounterType: string) => void;
  onShowCustomDialog: () => void;
}

export function EncounterTypeStep({
  selectedEncounterType,
  stepNumber,
  onSelect,
  onShowCustomDialog,
}: EncounterTypeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Step {stepNumber}: Encounter Type</h2>
        <p className="text-sm text-muted-foreground">What kind of encounter is this consent for?</p>
      </div>
      <Card
        className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
          selectedEncounterType === intimateEncounterType.id
            ? "border-pink-500/30 bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-purple-500/20 dark:from-pink-500/30 dark:via-rose-500/25 dark:to-purple-500/30"
            : ""
        }`}
        onClick={() => onSelect(intimateEncounterType.id)}
        data-testid={`option-encounter-${intimateEncounterType.id}`}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <intimateEncounterType.icon className={`h-6 w-6 ${selectedEncounterType === intimateEncounterType.id ? "text-pink-500" : ""}`} />
          <span className="text-sm font-medium">{intimateEncounterType.label}</span>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {encounterTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedEncounterType === type.id;
          const getGradient = () => {
            switch(type.id) {
              case "date":
                return "border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-violet-500/15 to-indigo-500/20 dark:from-purple-500/30 dark:via-violet-500/25 dark:to-indigo-500/30";
              case "conversation":
                return "border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-green-500/20 dark:from-emerald-500/30 dark:via-teal-500/25 dark:to-green-500/30";
              case "medical":
                return "border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-teal-500/20 dark:from-blue-500/30 dark:via-cyan-500/25 dark:to-teal-500/30";
              case "professional":
                return "border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/20 dark:from-amber-500/30 dark:via-orange-500/25 dark:to-yellow-500/30";
              default:
                return "";
            }
          };
          const getIconColor = () => {
            switch(type.id) {
              case "date": return "text-purple-500";
              case "conversation": return "text-emerald-500";
              case "medical": return "text-blue-500";
              case "professional": return "text-amber-500";
              default: return "";
            }
          };
          return (
            <Card
              key={type.id}
              className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                isSelected ? getGradient() : ""
              }`}
              onClick={() => onSelect(type.id)}
              data-testid={`option-encounter-${type.id}`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Icon className={`h-6 w-6 ${isSelected ? getIconColor() : ""}`} />
                <span className="text-sm font-medium">{type.label}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <Card
        className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
        onClick={onShowCustomDialog}
        data-testid="option-encounter-custom"
      >
        <div className="flex items-center justify-center gap-3">
          <otherEncounterType.icon className="h-6 w-6" />
          <span className="text-sm font-medium">Other (Custom)</span>
        </div>
      </Card>
    </div>
  );
}

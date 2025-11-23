import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, Scale, ArrowRight } from "lucide-react";
import UniversitySelector from "@/components/UniversitySelector";
import StateSelector from "@/components/StateSelector";
import UniversityPolicyPreview from "@/components/UniversityPolicyPreview";
import type { University } from "@/lib/consentFlowConstants";

interface UniversitySelectionStepProps {
  stepNumber: number;
  selectionMode: "select-university" | "select-state" | "not-applicable";
  selectedUniversity: University | null;
  selectedState: { code: string; name: string } | null;
  universities: University[];
  onSelectionModeChange: (mode: "select-university" | "select-state" | "not-applicable") => void;
  onUniversitySelect: (university: University | null) => void;
  onStateSelect: (state: { code: string; name: string } | null) => void;
  onNavigateToTitleIX: () => void;
  onNavigateToStateLaws: () => void;
}

export function UniversitySelectionStep({
  stepNumber,
  selectionMode,
  selectedUniversity,
  selectedState,
  universities,
  onSelectionModeChange,
  onUniversitySelect,
  onStateSelect,
  onNavigateToTitleIX,
  onNavigateToStateLaws,
}: UniversitySelectionStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Step {stepNumber}: Select Your State or Institution</h2>
        <p className="text-sm text-muted-foreground">Choose your state or university for compliance information</p>
      </div>
      
      <RadioGroup
        value={selectionMode}
        onValueChange={onSelectionModeChange}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="select-university" id="select-university" data-testid="radio-select-university" />
          <Label htmlFor="select-university" className="font-normal cursor-pointer">
            Select My University
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="select-state" id="select-state" data-testid="radio-select-state" />
          <Label htmlFor="select-state" className="font-normal cursor-pointer">
            Select My State
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem 
            value="not-applicable" 
            id="not-applicable" 
            data-testid="radio-not-applicable"
          />
          <Label 
            htmlFor="not-applicable" 
            className="font-normal cursor-pointer"
          >
            Not Applicable
          </Label>
        </div>
      </RadioGroup>

      {selectionMode === "select-university" && (
        <>
          <UniversitySelector
            universities={universities}
            selectedUniversity={selectedUniversity}
            onSelect={onUniversitySelect}
          />
          {selectedUniversity && (
            <UniversityPolicyPreview
              universityId={selectedUniversity.id}
              universityName={selectedUniversity.name}
              titleIXInfo={selectedUniversity.titleIXInfo}
              titleIXUrl={selectedUniversity.titleIXUrl}
              lastUpdated={selectedUniversity.lastUpdated}
              verifiedAt={selectedUniversity.verifiedAt}
            />
          )}
        </>
      )}

      {selectionMode === "select-state" && (
        <StateSelector
          selectedState={selectedState}
          onSelect={onStateSelect}
        />
      )}

      {selectionMode === "select-university" && (
        <Card className="mt-6 border-primary/20 bg-primary/5" data-testid="card-title-ix-tool">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Need to research Title IX policies?</CardTitle>
                <CardDescription className="text-sm">
                  Access our comprehensive Title IX information tool
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              className="w-full"
              onClick={onNavigateToTitleIX}
              data-testid="button-goto-title-ix"
            >
              View Title IX Tool
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {selectionMode === "select-state" && (
        <Card className="mt-6 border-primary/20 bg-primary/5" data-testid="card-state-law-tool">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Need to research state consent laws?</CardTitle>
                <CardDescription className="text-sm">
                  Access detailed consent law information for all 50 states
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              className="w-full"
              onClick={onNavigateToStateLaws}
              data-testid="button-goto-state-laws"
            >
              View State Laws Tool
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

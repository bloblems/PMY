import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularDurationPicker } from "@/components/CircularDurationPicker";
import { addMinutes } from "date-fns";

interface ContractDurationStepProps {
  contractStartTime?: string;
  contractDuration?: number;
  contractEndTime?: string;
  onUpdate: (updates: {
    contractStartTime?: string;
    contractDuration?: number;
    contractEndTime?: string;
  }) => void;
}

export default function ContractDurationStep({
  contractStartTime,
  contractDuration,
  contractEndTime,
  onUpdate,
}: ContractDurationStepProps) {
  // Track whether user has explicitly enabled duration
  const [isDurationEnabled, setIsDurationEnabled] = useState(() => {
    return !!(contractStartTime || contractDuration || contractEndTime);
  });

  // Parse existing values or use defaults for UI display
  const [startDateTime, setStartDateTime] = useState<Date>(() => {
    if (contractStartTime) {
      return new Date(contractStartTime);
    }
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });

  const [duration, setDuration] = useState<number>(() => {
    return contractDuration || 120; // Default 2 hours
  });

  // Create stable string representation of startDateTime for dependency tracking
  const startDateTimeKey = useMemo(() => startDateTime.toISOString(), [startDateTime]);

  // Track last sent values to prevent redundant updates
  const lastSentRef = useRef<{
    contractStartTime?: string;
    contractDuration?: number;
    contractEndTime?: string;
  }>({});

  // Only update parent when duration is explicitly enabled
  useEffect(() => {
    if (!isDurationEnabled) {
      // Only clear if we previously had duration enabled
      if (lastSentRef.current.contractDuration !== undefined) {
        console.log("[ContractDuration] Clearing duration (disabled)");
        onUpdate({
          contractStartTime: undefined,
          contractDuration: undefined,
          contractEndTime: undefined,
        });
        lastSentRef.current = {};
      }
      return;
    }

    // Don't allow zero or negative duration
    if (duration <= 0) {
      return;
    }

    // Calculate end time
    const calculatedEndDateTime = addMinutes(startDateTime, duration);

    const updates = {
      contractStartTime: startDateTime.toISOString(),
      contractDuration: duration,
      contractEndTime: calculatedEndDateTime.toISOString(),
    };

    // Only call onUpdate if values have actually changed
    const hasChanged = 
      lastSentRef.current.contractStartTime !== updates.contractStartTime ||
      lastSentRef.current.contractDuration !== updates.contractDuration ||
      lastSentRef.current.contractEndTime !== updates.contractEndTime;

    if (hasChanged) {
      console.log("[ContractDuration] Updating parent with duration:", updates);
      lastSentRef.current = updates;
      onUpdate(updates);
    }
  }, [isDurationEnabled, startDateTimeKey, duration, onUpdate]);

  const enableDuration = () => {
    setIsDurationEnabled(true);
  };

  const disableDuration = () => {
    setIsDurationEnabled(false);
    // Reset to defaults for UI
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setStartDateTime(now);
    setDuration(120);
  };

  return (
    <div className="space-y-6">
      {!isDurationEnabled ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Contract Duration</CardTitle>
            <CardDescription>
              Define when this consent starts and how long it's valid (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              By default, consent remains valid until revoked by either party. 
              You can optionally set a specific duration for this contract.
            </p>
            <Button
              onClick={enableDuration}
              className="w-full"
              data-testid="button-enable-duration"
            >
              Set Contract Duration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Contract Duration</CardTitle>
            <CardDescription>
              Drag the handles on the clock to set start time and duration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CircularDurationPicker
              startTime={startDateTime}
              duration={duration}
              onStartTimeChange={setStartDateTime}
              onDurationChange={setDuration}
            />

            <Button
              variant="outline"
              onClick={disableDuration}
              className="w-full"
              data-testid="button-disable-duration"
            >
              Remove Duration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">Optional:</strong> Setting a duration helps establish clear boundaries and expectations. 
            If no duration is set, the consent remains valid until revoked by either party.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

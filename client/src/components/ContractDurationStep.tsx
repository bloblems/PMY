import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircularDurationPicker } from "@/components/CircularDurationPicker";
import { addMinutes, format, addHours, addDays, addWeeks } from "date-fns";
import { Calendar, Clock, AlertTriangle, Zap, Gauge, Edit3 } from "lucide-react";

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

type PanelType = 'presets' | 'picker' | 'manual' | null;

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

  // Track which panel is expanded (all start collapsed)
  const [expandedPanel, setExpandedPanel] = useState<PanelType>(null);

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

  // Duration presets in minutes
  const durationPresets = [
    { label: "1 Hour", minutes: 60 },
    { label: "4 Hours", minutes: 240 },
    { label: "1 Day", minutes: 1440 },
    { label: "3 Days", minutes: 4320 },
    { label: "1 Week", minutes: 10080 },
  ];

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    
    return parts.length > 0 ? parts.join(" ") : "0m";
  };

  // Format datetime-local input value
  const formatDateTimeLocal = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  // Parse datetime-local input value
  const parseDateTimeLocal = (value: string) => {
    return new Date(value);
  };

  const handleStartTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateTimeLocal(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setStartDateTime(newDate);
    }
  };

  // Check if start time is in the past
  const isStartTimeInPast = startDateTime.getTime() < Date.now();

  const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10);
    if (!isNaN(minutes) && minutes > 0) {
      setDuration(minutes);
    }
  };

  const handlePresetClick = (minutes: number) => {
    setDuration(minutes);
  };

  const togglePanel = (panel: PanelType) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  // Determine if circular picker should be available
  const showCircularPicker = duration <= 720;

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
        <div className="space-y-4">
          {/* Panel 1: Quick Presets */}
          <div className="space-y-2">
            {expandedPanel !== 'presets' ? (
              <Button
                variant="outline"
                onClick={() => togglePanel('presets')}
                className="w-full justify-start gap-2"
                data-testid="button-toggle-presets"
              >
                <Zap className="h-4 w-4" />
                Quick Presets
              </Button>
            ) : (
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Presets
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePanel('presets')}
                      data-testid="button-collapse-presets"
                    >
                      Collapse
                    </Button>
                  </div>
                  <CardDescription>
                    Select a common duration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {durationPresets.map((preset) => {
                      const isSelected = duration === preset.minutes;
                      return (
                        <Card
                          key={preset.label}
                          className={`p-3 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                          onClick={() => handlePresetClick(preset.minutes)}
                          data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <div className="text-center text-sm font-medium">
                            {preset.label}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel 2: Circular Picker (only available for durations ≤12 hours) */}
          {showCircularPicker && (
            <div className="space-y-2">
              {expandedPanel !== 'picker' ? (
                <Button
                  variant="outline"
                  onClick={() => togglePanel('picker')}
                  className="w-full justify-start gap-2"
                  data-testid="button-toggle-picker"
                >
                  <Gauge className="h-4 w-4" />
                  Time Picker
                </Button>
              ) : (
                <Card>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Time Picker
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePanel('picker')}
                        data-testid="button-collapse-picker"
                      >
                        Collapse
                      </Button>
                    </div>
                    <CardDescription>
                      Drag the handles to adjust start time and end time visually
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <CircularDurationPicker
                        startTime={startDateTime}
                        duration={duration}
                        onStartTimeChange={setStartDateTime}
                        onDurationChange={setDuration}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Panel 3: Manual Entry */}
          <div className="space-y-2">
            {expandedPanel !== 'manual' ? (
              <Button
                variant="outline"
                onClick={() => togglePanel('manual')}
                className="w-full justify-start gap-2"
                data-testid="button-toggle-manual"
              >
                <Edit3 className="h-4 w-4" />
                Manual Entry
              </Button>
            ) : (
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Manual Entry
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePanel('manual')}
                      data-testid="button-collapse-manual"
                    >
                      Collapse
                    </Button>
                  </div>
                  <CardDescription>
                    Set custom start time and duration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date & Time
                    </Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={formatDateTimeLocal(startDateTime)}
                      onChange={handleStartTimeInputChange}
                      data-testid="input-start-datetime"
                    />
                    {isStartTimeInPast && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 mt-1">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span>This start time is in the past. You can use this to document consent that was previously given.</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={handleDurationInputChange}
                      data-testid="input-duration-minutes"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(duration)} • Ends: {format(addMinutes(startDateTime, duration), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Button
            variant="outline"
            onClick={disableDuration}
            className="w-full"
            data-testid="button-disable-duration"
          >
            Remove Duration
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
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

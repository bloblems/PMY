import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Calendar as CalendarIcon, Hourglass } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";

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

  // Parse existing values or use defaults for UI display only
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    if (contractStartTime) {
      return new Date(contractStartTime);
    }
    return new Date();
  });

  const [startTime, setStartTime] = useState(() => {
    if (contractStartTime) {
      const date = new Date(contractStartTime);
      return format(date, "HH:mm");
    }
    return format(new Date(), "HH:mm");
  });

  const [durationHours, setDurationHours] = useState(() => {
    if (contractDuration) {
      return Math.floor(contractDuration / 60).toString();
    }
    return "2";
  });

  const [durationMinutes, setDurationMinutes] = useState(() => {
    if (contractDuration) {
      return (contractDuration % 60).toString();
    }
    return "0";
  });

  // Create stable string representation of startDate for dependency tracking
  const startDateKey = useMemo(() => startDate ? startDate.toISOString() : "", [startDate]);

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

    if (!startDate || !startTime) return;

    // Validate hours and minutes are valid numbers
    const hours = parseInt(durationHours);
    const minutes = parseInt(durationMinutes);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
      return; // Don't update with invalid values
    }

    // Combine date and time into a single Date object
    const [timeHours, timeMinutes] = startTime.split(":").map(Number);
    const combinedStartDateTime = new Date(startDate);
    combinedStartDateTime.setHours(timeHours, timeMinutes, 0, 0);

    // Calculate duration in minutes
    const totalDurationMinutes = hours * 60 + minutes;

    // Don't allow zero or negative duration
    if (totalDurationMinutes <= 0) {
      return;
    }

    // Calculate end time
    const calculatedEndDateTime = addMinutes(combinedStartDateTime, totalDurationMinutes);

    const updates = {
      contractStartTime: combinedStartDateTime.toISOString(),
      contractDuration: totalDurationMinutes,
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
  }, [isDurationEnabled, startDateKey, startTime, durationHours, durationMinutes, onUpdate]);

  const enableDuration = () => {
    setIsDurationEnabled(true);
  };

  const disableDuration = () => {
    setIsDurationEnabled(false);
    // Reset to defaults for UI
    setStartDate(new Date());
    setStartTime(format(new Date(), "HH:mm"));
    setDurationHours("2");
    setDurationMinutes("0");
  };

  // Calculate end time for display
  const getEndTimeDisplay = () => {
    if (!startDate || !startTime) return "—";
    
    const [hours, minutes] = startTime.split(":").map(Number);
    const combinedStartDateTime = new Date(startDate);
    combinedStartDateTime.setHours(hours, minutes, 0, 0);
    
    const totalDurationMinutes = (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);
    const endDateTime = addMinutes(combinedStartDateTime, totalDurationMinutes);
    
    return format(endDateTime, "MMM d, yyyy 'at' h:mm a");
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
              Define when this consent starts and how long it's valid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Start Date & Time */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Start Date & Time
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                        data-testid="button-start-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        data-testid="calendar-start-date"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Time Picker */}
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                      data-testid="input-start-time"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Hourglass className="h-4 w-4" />
                Duration
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="duration-hours" className="text-sm text-muted-foreground">
                    Hours
                  </Label>
                  <Input
                    id="duration-hours"
                    type="number"
                    min="0"
                    max="168"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="0"
                    data-testid="input-duration-hours"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration-minutes" className="text-sm text-muted-foreground">
                    Minutes
                  </Label>
                  <Input
                    id="duration-minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="0"
                    data-testid="input-duration-minutes"
                  />
                </div>
              </div>
            </div>

            {/* End Time Display */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Contract Ends</div>
              <div className="text-lg font-semibold" data-testid="text-end-time">
                {getEndTimeDisplay()}
              </div>
            </div>

            {/* Remove Duration Button */}
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

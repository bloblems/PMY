import { useState, useRef } from "react";
import { format, addMinutes, startOfDay, differenceInMinutes } from "date-fns";

interface LinearDurationPickerProps {
  startTime: Date;
  duration: number; // in minutes
  onStartTimeChange: (date: Date) => void;
  onDurationChange: (minutes: number) => void;
}

export function LinearDurationPicker({
  startTime,
  duration,
  onStartTimeChange,
  onDurationChange,
}: LinearDurationPickerProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const activePointerRef = useRef<number | null>(null);

  // Calculate positions as percentages of a 24-hour day
  // Clamp to 24-hour window for timeline display
  const dayStart = startOfDay(startTime);
  const startMinutesFromDayStart = Math.min(1440, Math.max(0, differenceInMinutes(startTime, dayStart)));
  const startPercent = (startMinutesFromDayStart / 1440) * 100; // 1440 = 24 hours in minutes
  
  // Clamp duration to fit within 24-hour window
  const maxDuration = 1440 - startMinutesFromDayStart;
  const clampedDuration = Math.min(duration, maxDuration);
  const endMinutesFromDayStart = startMinutesFromDayStart + clampedDuration;
  const endPercent = (endMinutesFromDayStart / 1440) * 100;
  
  const endTime = addMinutes(startTime, duration);
  
  // Show warning if duration exceeds 24 hours
  const isMultiDay = duration > 1440;

  const getMinutesFromPosition = (clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = (x / rect.width) * 100;
    return Math.round((percent / 100) * 1440);
  };

  const handlePointerDown = (e: React.PointerEvent, handle?: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timelineRef.current) return;
    
    activePointerRef.current = e.pointerId;
    
    if (handle === 'start') {
      setIsDraggingStart(true);
      timelineRef.current.setPointerCapture(e.pointerId);
    } else if (handle === 'end') {
      setIsDraggingEnd(true);
      timelineRef.current.setPointerCapture(e.pointerId);
    } else {
      // Clicked on timeline background - move nearest handle
      const clickedMinutes = getMinutesFromPosition(e.clientX);
      const distToStart = Math.abs(clickedMinutes - startMinutesFromDayStart);
      const distToEnd = Math.abs(clickedMinutes - endMinutesFromDayStart);
      
      if (distToStart < distToEnd) {
        setIsDraggingStart(true);
        // Immediately update to clicked position
        const newStartTime = addMinutes(dayStart, clickedMinutes);
        const newDuration = endMinutesFromDayStart - clickedMinutes;
        if (newDuration > 0) {
          onStartTimeChange(newStartTime);
          onDurationChange(newDuration);
        }
      } else {
        setIsDraggingEnd(true);
        // Immediately update to clicked position
        const newDuration = clickedMinutes - startMinutesFromDayStart;
        if (newDuration > 0) {
          onDurationChange(newDuration);
        }
      }
      timelineRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingStart && !isDraggingEnd) return;
    if (!timelineRef.current) return;
    if (activePointerRef.current !== e.pointerId) return;

    const minutes = getMinutesFromPosition(e.clientX);

    if (isDraggingStart) {
      // Prevent crossing over end handle
      const maxStartMinutes = endMinutesFromDayStart - 15; // Minimum 15 min duration
      const clampedMinutes = Math.min(minutes, maxStartMinutes);
      
      const newStartTime = addMinutes(dayStart, clampedMinutes);
      const newDuration = endMinutesFromDayStart - clampedMinutes;
      
      onStartTimeChange(newStartTime);
      onDurationChange(newDuration);
    } else if (isDraggingEnd) {
      // Prevent crossing over start handle
      const minEndMinutes = startMinutesFromDayStart + 15; // Minimum 15 min duration
      const clampedMinutes = Math.max(minutes, minEndMinutes);
      
      const newDuration = clampedMinutes - startMinutesFromDayStart;
      onDurationChange(newDuration);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerRef.current === e.pointerId) {
      if (timelineRef.current && timelineRef.current.hasPointerCapture(e.pointerId)) {
        timelineRef.current.releasePointerCapture(e.pointerId);
      }
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      activePointerRef.current = null;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    handlePointerUp(e);
  };

  // Generate hour markers
  const hours = Array.from({ length: 25 }, (_, i) => i); // 0-24

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Multi-day warning */}
      {isMultiDay && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
          <p className="text-xs text-amber-900 dark:text-amber-200">
            This duration extends beyond 24 hours. The timeline below shows only the first day. Use Manual Entry to see the full duration.
          </p>
        </div>
      )}

      {/* Time labels */}
      <div className="flex items-center justify-between text-sm font-medium">
        <div className="text-primary">
          <div>Start</div>
          <div className="text-lg">{format(startTime, "h:mm a")}</div>
        </div>
        <div className="text-center text-muted-foreground">
          <div>Duration</div>
          <div className="text-lg font-semibold text-foreground">
            {duration < 60 
              ? `${duration}m` 
              : duration < 1440
              ? `${Math.floor(duration / 60)}h ${duration % 60}m`
              : `${Math.floor(duration / 1440)}d ${Math.floor((duration % 1440) / 60)}h`
            }
          </div>
        </div>
        <div className="text-primary">
          <div>End</div>
          <div className="text-lg">{format(endTime, "h:mm a")}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Day/Night background */}
        <div className="absolute inset-0 flex">
          {/* Night (12am-6am) */}
          <div className="w-1/4 bg-slate-900/10 dark:bg-slate-900/30" />
          {/* Day (6am-6pm) */}
          <div className="w-1/2 bg-amber-100/30 dark:bg-amber-900/10" />
          {/* Night (6pm-12am) */}
          <div className="w-1/4 bg-slate-900/10 dark:bg-slate-900/30" />
        </div>

        {/* Hour markers */}
        <div className="relative h-16 border-t border-b border-border">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 border-l border-border/50"
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              {hour % 6 === 0 && (
                <div className="absolute -bottom-6 -translate-x-1/2 text-xs text-muted-foreground">
                  {hour === 0 || hour === 24 ? "12am" : hour === 12 ? "12pm" : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Interactive timeline */}
        <div
          ref={timelineRef}
          className="absolute inset-0 cursor-pointer touch-none"
          onPointerDown={(e) => handlePointerDown(e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          data-testid="timeline-track"
        >
          {/* Selected duration bar */}
          <div
            className="absolute top-0 bottom-0 bg-primary/30 border-y-2 border-primary pointer-events-none"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />

          {/* Start handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-primary border-2 border-white dark:border-gray-900 rounded-full cursor-grab active:cursor-grabbing shadow-lg z-10"
            style={{ left: `${startPercent}%` }}
            onPointerDown={(e) => handlePointerDown(e, 'start')}
            data-testid="handle-start"
          />

          {/* End handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-primary border-2 border-white dark:border-gray-900 rounded-full cursor-grab active:cursor-grabbing shadow-lg z-10"
            style={{ left: `${endPercent}%` }}
            onPointerDown={(e) => handlePointerDown(e, 'end')}
            data-testid="handle-end"
          />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        Tap anywhere on the timeline or drag the handles to adjust times
      </p>
    </div>
  );
}

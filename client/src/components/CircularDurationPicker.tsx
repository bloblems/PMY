import { useEffect, useRef, useState } from "react";

interface CircularDurationPickerProps {
  startTime: Date;
  duration: number;
  onStartTimeChange: (date: Date) => void;
  onDurationChange: (minutes: number) => void;
}

export function CircularDurationPicker({
  startTime,
  duration,
  onStartTimeChange,
  onDurationChange,
}: CircularDurationPickerProps) {
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const radius = 140;
  const centerX = 200;
  const centerY = 200;
  const handleRadius = 16;

  const timeToAngle = (hours: number, minutes: number): number => {
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / 720) * 360 - 90;
  };

  const angleToTime = (angle: number): { hours: number; minutes: number } => {
    let normalizedAngle = (angle + 90) % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    const totalMinutes = Math.round((normalizedAngle / 360) * 720);
    const hours = Math.floor(totalMinutes / 60) % 12;
    const minutes = totalMinutes % 60;
    return { hours: hours === 0 ? 12 : hours, minutes };
  };

  const startHours = startTime.getHours() % 12;
  const startMinutes = startTime.getMinutes();
  const startAngle = timeToAngle(startHours, startMinutes);

  const endTime = new Date(startTime.getTime() + duration * 60000);
  const endHours = endTime.getHours() % 12;
  const endMinutes = endTime.getMinutes();
  const endAngle = timeToAngle(endHours, endMinutes);

  const polarToCartesian = (angle: number, r: number = radius) => {
    const angleRad = (angle * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleRad),
      y: centerY + r * Math.sin(angleRad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    let adjustedEndAngle = endAngle;
    if (endAngle <= startAngle) {
      adjustedEndAngle += 360;
    }

    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(adjustedEndAngle);

    const largeArcFlag = adjustedEndAngle - startAngle > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const getAngleFromPoint = (clientX: number, clientY: number): number => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    return (Math.atan2(y, x) * 180) / Math.PI;
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingStart && !isDraggingEnd) return;

    const angle = getAngleFromPoint(e.clientX, e.clientY);
    const time = angleToTime(angle);

    if (isDraggingStart) {
      const hours24 = time.hours === 12 ? 0 : time.hours;
      
      const candidates = [
        new Date(startTime),
        new Date(startTime),
        new Date(startTime.getTime() + 24 * 60 * 60 * 1000),
        new Date(startTime.getTime() + 24 * 60 * 60 * 1000),
        new Date(startTime.getTime() - 24 * 60 * 60 * 1000),
        new Date(startTime.getTime() - 24 * 60 * 60 * 1000),
      ];
      
      candidates[0].setHours(hours24, time.minutes, 0, 0);
      candidates[1].setHours(hours24 + 12, time.minutes, 0, 0);
      candidates[2].setHours(hours24, time.minutes, 0, 0);
      candidates[3].setHours(hours24 + 12, time.minutes, 0, 0);
      candidates[4].setHours(hours24, time.minutes, 0, 0);
      candidates[5].setHours(hours24 + 12, time.minutes, 0, 0);
      
      let closestCandidate = candidates[0];
      let minDiff = Math.abs(candidates[0].getTime() - startTime.getTime());
      
      for (const candidate of candidates) {
        const diff = Math.abs(candidate.getTime() - startTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestCandidate = candidate;
        }
      }
      
      onStartTimeChange(closestCandidate);
    } else if (isDraggingEnd) {
      const hours24 = time.hours === 12 ? 0 : time.hours;
      
      const candidateAM = new Date(startTime);
      candidateAM.setHours(hours24, time.minutes, 0, 0);
      
      const candidatePM = new Date(startTime);
      candidatePM.setHours(hours24 + 12, time.minutes, 0, 0);
      
      let endDate = candidateAM;
      
      if (candidateAM <= startTime) {
        candidateAM.setTime(candidateAM.getTime() + 24 * 60 * 60 * 1000);
      }
      if (candidatePM <= startTime) {
        candidatePM.setTime(candidatePM.getTime() + 24 * 60 * 60 * 1000);
      }
      
      const durationAM = Math.round((candidateAM.getTime() - startTime.getTime()) / 60000);
      const durationPM = Math.round((candidatePM.getTime() - startTime.getTime()) / 60000);
      
      if (durationAM > 0 && durationAM <= 720) {
        endDate = candidateAM;
      } else if (durationPM > 0 && durationPM <= 720) {
        endDate = candidatePM;
      } else if (durationAM > 0) {
        endDate = candidateAM;
      } else if (durationPM > 0) {
        endDate = candidatePM;
      }
      
      const newDuration = Math.round((endDate.getTime() - startTime.getTime()) / 60000);
      if (newDuration > 0 && newDuration <= 720) {
        onDurationChange(newDuration);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDraggingStart, isDraggingEnd, startTime, duration]);

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const formatTime12Hour = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "AM" : "PM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const startPos = polarToCartesian(startAngle);
  const endPos = polarToCartesian(endAngle);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">START TIME</div>
          <div className="text-2xl font-semibold">{formatTime12Hour(startTime)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">END TIME</div>
          <div className="text-2xl font-semibold">{formatTime12Hour(endTime)}</div>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          width="400"
          height="400"
          className="select-none"
          style={{ touchAction: "none" }}
        >
          <circle cx={centerX} cy={centerY} r={radius + 30} fill="hsl(var(--card))" />
          
          <circle cx={centerX} cy={centerY} r={radius} fill="hsl(var(--muted))" opacity="0.3" />

          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => {
            const angle = timeToAngle(hour, 0);
            const pos = polarToCartesian(angle, radius - 25);
            const displayHour = hour === 0 ? 12 : hour;
            return (
              <text
                key={hour}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm fill-muted-foreground font-medium"
              >
                {displayHour}
              </text>
            );
          })}

          {/* Moon icon for 12 AM (midnight/night) */}
          <g transform={`translate(${centerX - 20}, ${centerY - 30})`}>
            <circle cx="10" cy="10" r="8" fill="hsl(var(--muted-foreground))" opacity="0.6" />
            <circle cx="13" cy="10" r="6.5" fill="hsl(var(--card))" opacity="1" />
          </g>
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            12AM
          </text>

          {/* Sun icon for 12 PM (noon/day) */}
          <g transform={`translate(${centerX - 20}, ${centerY + 10})`}>
            <circle cx="10" cy="10" r="6" fill="hsl(248 100% 70%)" opacity="0.8" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 10 + Math.cos(rad) * 8;
              const y1 = 10 + Math.sin(rad) * 8;
              const x2 = 10 + Math.cos(rad) * 11;
              const y2 = 10 + Math.sin(rad) * 11;
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(248 100% 70%)"
                  strokeWidth="1.5"
                  opacity="0.8"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          <text
            x={centerX}
            y={centerY + 30}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            12PM
          </text>

          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.9"
          />

          <circle
            cx={startPos.x}
            cy={startPos.y}
            r={handleRadius}
            fill="hsl(var(--primary))"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsDraggingStart(true);
            }}
          />
          <circle
            cx={startPos.x}
            cy={startPos.y}
            r={handleRadius - 6}
            fill="hsl(var(--primary-foreground))"
            className="pointer-events-none"
          />

          <circle
            cx={endPos.x}
            cy={endPos.y}
            r={handleRadius}
            fill="hsl(var(--primary))"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsDraggingEnd(true);
            }}
          />
          <circle
            cx={endPos.x}
            cy={endPos.y}
            r={handleRadius - 6}
            fill="hsl(var(--primary-foreground))"
            className="pointer-events-none"
          />
        </svg>
      </div>

      <div className="text-center">
        <div className="text-3xl font-semibold">
          {hours} hr {minutes} min
        </div>
      </div>
    </div>
  );
}

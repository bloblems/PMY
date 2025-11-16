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
      const newStartTime = new Date(startTime);
      const isPM = startTime.getHours() >= 12;
      const hours24 = time.hours === 12 ? 0 : time.hours;
      newStartTime.setHours(isPM ? hours24 + 12 : hours24, time.minutes, 0, 0);
      onStartTimeChange(newStartTime);
    } else if (isDraggingEnd) {
      const newEndTime = new Date(startTime);
      const isPM = startTime.getHours() >= 12;
      let hours24 = time.hours === 12 ? 0 : time.hours;
      
      let endDate = new Date(startTime);
      endDate.setHours(isPM ? hours24 + 12 : hours24, time.minutes, 0, 0);
      
      if (endDate <= startTime) {
        endDate = new Date(endDate.getTime() + 12 * 60 * 60 * 1000);
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

          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            12AM
          </text>
          <text
            x={centerX}
            y={centerY + 20}
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

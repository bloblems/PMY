import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, G, Line } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography } from '@/lib/theme';

interface CircularDurationPickerProps {
  startTime: Date;
  duration: number;
  onStartTimeChange: (date: Date) => void;
  onDurationChange: (minutes: number) => void;
}

export default function CircularDurationPicker({
  startTime,
  duration,
  onStartTimeChange,
  onDurationChange,
}: CircularDurationPickerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const svgRef = useRef<View>(null);
  const [svgLayout, setSvgLayout] = useState({ x: 0, y: 0, width: 300, height: 300 });

  const size = 300;
  const radius = 110;
  const centerX = size / 2;
  const centerY = size / 2;
  const handleRadius = 14;

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

  const describeArc = (startAng: number, endAng: number) => {
    let adjustedEndAngle = endAng;
    if (endAng <= startAng) {
      adjustedEndAngle += 360;
    }

    const start = polarToCartesian(startAng);
    const end = polarToCartesian(adjustedEndAngle);
    const largeArcFlag = adjustedEndAngle - startAng > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const getAngleFromPoint = (x: number, y: number): number => {
    const dx = x - centerX;
    const dy = y - centerY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const formatTime12Hour = (date: Date) => {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const startPos = polarToCartesian(startAngle);
  const endPos = polarToCartesian(endAngle);

  const handleStartDrag = (x: number, y: number) => {
    const angle = getAngleFromPoint(x, y);
    const time = angleToTime(angle);
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
  };

  const handleEndDrag = (x: number, y: number) => {
    const angle = getAngleFromPoint(x, y);
    const time = angleToTime(angle);
    const hours24 = time.hours === 12 ? 0 : time.hours;

    const candidateAM = new Date(startTime);
    candidateAM.setHours(hours24, time.minutes, 0, 0);

    const candidatePM = new Date(startTime);
    candidatePM.setHours(hours24 + 12, time.minutes, 0, 0);

    if (candidateAM <= startTime) {
      candidateAM.setTime(candidateAM.getTime() + 24 * 60 * 60 * 1000);
    }
    if (candidatePM <= startTime) {
      candidatePM.setTime(candidatePM.getTime() + 24 * 60 * 60 * 1000);
    }

    const durationAM = Math.round((candidateAM.getTime() - startTime.getTime()) / 60000);
    const durationPM = Math.round((candidatePM.getTime() - startTime.getTime()) / 60000);

    let endDate = candidateAM;
    if (durationAM > 0) {
      endDate = candidateAM;
    } else if (durationPM > 0) {
      endDate = candidatePM;
    }

    const newDuration = Math.round((endDate.getTime() - startTime.getTime()) / 60000);
    if (newDuration > 0) {
      onDurationChange(newDuration);
    }
  };

  const startHandleGesture = Gesture.Pan()
    .onUpdate((event) => {
      const localX = event.x;
      const localY = event.y;
      handleStartDrag(localX, localY);
    });

  const endHandleGesture = Gesture.Pan()
    .onUpdate((event) => {
      const localX = event.x;
      const localY = event.y;
      handleEndDrag(localX, localY);
    });

  return (
    <View style={styles.container}>
      <View style={styles.timeLabels}>
        <View style={styles.timeLabel}>
          <Text style={styles.timeLabelTitle}>START TIME</Text>
          <Text style={styles.timeLabelValue}>{formatTime12Hour(startTime)}</Text>
        </View>
        <View style={styles.timeLabel}>
          <Text style={styles.timeLabelTitle}>END TIME</Text>
          <Text style={styles.timeLabelValue}>{formatTime12Hour(endTime)}</Text>
        </View>
      </View>

      <View
        ref={svgRef}
        onLayout={(e) => setSvgLayout(e.nativeEvent.layout)}
        style={styles.svgContainer}
      >
        <GestureDetector gesture={Gesture.Race(startHandleGesture, endHandleGesture)}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius + 25}
              fill={colors.background.card}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill={colors.background.secondary}
              opacity={0.3}
            />

            {/* Hour markers */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => {
              const angle = timeToAngle(hour, 0);
              const pos = polarToCartesian(angle, radius - 20);
              const displayHour = hour === 0 ? 12 : hour;
              return (
                <SvgText
                  key={hour}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={12}
                  fill={colors.text.secondary}
                  fontWeight="500"
                >
                  {displayHour}
                </SvgText>
              );
            })}

            {/* Moon icon for 12 AM */}
            <G transform={`translate(${centerX - 15}, ${centerY - 25})`}>
              <Circle cx={8} cy={8} r={6} fill={colors.text.secondary} opacity={0.6} />
              <Circle cx={10} cy={8} r={5} fill={colors.background.card} />
            </G>
            <SvgText
              x={centerX}
              y={centerY - 8}
              textAnchor="middle"
              fontSize={10}
              fill={colors.text.secondary}
            >
              12AM
            </SvgText>

            {/* Sun icon for 12 PM */}
            <G transform={`translate(${centerX - 15}, ${centerY + 10})`}>
              <Circle cx={8} cy={8} r={5} fill={colors.brand.primary} opacity={0.8} />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 8 + Math.cos(rad) * 6;
                const y1 = 8 + Math.sin(rad) * 6;
                const x2 = 8 + Math.cos(rad) * 9;
                const y2 = 8 + Math.sin(rad) * 9;
                return (
                  <Line
                    key={angle}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={colors.brand.primary}
                    strokeWidth={1.5}
                    opacity={0.8}
                    strokeLinecap="round"
                  />
                );
              })}
            </G>
            <SvgText
              x={centerX}
              y={centerY + 28}
              textAnchor="middle"
              fontSize={10}
              fill={colors.text.secondary}
            >
              12PM
            </SvgText>

            {/* Duration arc */}
            <Path
              d={describeArc(startAngle, endAngle)}
              fill="none"
              stroke={colors.brand.primary}
              strokeWidth={16}
              strokeLinecap="round"
              opacity={0.9}
            />

            {/* Start handle */}
            <Circle
              cx={startPos.x}
              cy={startPos.y}
              r={handleRadius}
              fill={colors.brand.primary}
            />
            <Circle
              cx={startPos.x}
              cy={startPos.y}
              r={handleRadius - 5}
              fill="#FFFFFF"
            />

            {/* End handle */}
            <Circle
              cx={endPos.x}
              cy={endPos.y}
              r={handleRadius}
              fill={colors.brand.primary}
            />
            <Circle
              cx={endPos.x}
              cy={endPos.y}
              r={handleRadius - 5}
              fill="#FFFFFF"
            />
          </Svg>
        </GestureDetector>
      </View>

      <View style={styles.durationContainer}>
        <Text style={styles.durationText}>
          {hours} hr {minutes} min
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.lg,
    },
    timeLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: 300,
    },
    timeLabel: {
      alignItems: 'center',
    },
    timeLabelTitle: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    timeLabelValue: {
      fontSize: typography.size.xl,
      fontWeight: '600',
      color: colors.text.primary,
    },
    svgContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationContainer: {
      alignItems: 'center',
    },
    durationText: {
      fontSize: typography.size.xxl,
      fontWeight: '600',
      color: colors.text.primary,
    },
  });

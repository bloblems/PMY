import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addMinutes, format } from 'date-fns';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

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

const CLOCK_SIZE = 280;
const CLOCK_RADIUS = CLOCK_SIZE / 2;
const HANDLE_SIZE = 36;
const TRACK_WIDTH = 12;
const INNER_RADIUS = CLOCK_RADIUS - 44;

// Duration presets in minutes
const DURATION_PRESETS = [
  { label: '1h', minutes: 60, color: '#10B981' },
  { label: '3h', minutes: 180, color: '#3B82F6' },
  { label: '6h', minutes: 360, color: '#8B5CF6' },
  { label: '12h', minutes: 720, color: '#F59E0B' },
  { label: '24h', minutes: 1440, color: '#EF4444' },
];

// Max duration is 24 hours (1440 minutes) - one full rotation
const MAX_DURATION = 1440;
const MIN_DURATION = 15;
const SNAP_INCREMENT = 15; // Snap to 15-minute increments

export default function ContractDurationStep({
  contractStartTime,
  contractDuration,
  contractEndTime,
  onUpdate,
}: ContractDurationStepProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [isDurationEnabled, setIsDurationEnabled] = useState(() => {
    return !!(contractStartTime || contractDuration || contractEndTime);
  });

  const [duration, setDuration] = useState<number>(() => {
    return contractDuration || 120; // Default 2 hours
  });

  const [isDragging, setIsDragging] = useState(false);
  const handleScale = useRef(new Animated.Value(1)).current;
  const lastHapticHour = useRef(-1);

  // Track clock center position
  const clockCenterRef = useRef({ x: 0, y: 0 });

  const [startDateTime] = useState<Date>(() => {
    if (contractStartTime) {
      return new Date(contractStartTime);
    }
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });

  const lastSentRef = useRef<{
    contractStartTime?: string;
    contractDuration?: number;
    contractEndTime?: string;
  }>({});

  // Update parent when duration changes
  useEffect(() => {
    if (!isDurationEnabled) {
      if (lastSentRef.current.contractDuration !== undefined) {
        onUpdate({
          contractStartTime: undefined,
          contractDuration: undefined,
          contractEndTime: undefined,
        });
        lastSentRef.current = {};
      }
      return;
    }

    if (duration <= 0) return;

    const calculatedEndDateTime = addMinutes(startDateTime, duration);

    const updates = {
      contractStartTime: startDateTime.toISOString(),
      contractDuration: duration,
      contractEndTime: calculatedEndDateTime.toISOString(),
    };

    const hasChanged =
      lastSentRef.current.contractStartTime !== updates.contractStartTime ||
      lastSentRef.current.contractDuration !== updates.contractDuration ||
      lastSentRef.current.contractEndTime !== updates.contractEndTime;

    if (hasChanged) {
      lastSentRef.current = updates;
      onUpdate(updates);
    }
  }, [isDurationEnabled, startDateTime, duration, onUpdate]);

  // Convert angle (0-360) to duration with snapping
  const angleToDuration = useCallback((angle: number): number => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const minutes = (normalizedAngle / 360) * MAX_DURATION;
    const snapped = Math.round(minutes / SNAP_INCREMENT) * SNAP_INCREMENT;
    return Math.max(MIN_DURATION, Math.min(MAX_DURATION, snapped));
  }, []);

  // Convert duration to angle
  const durationToAngle = useCallback((mins: number): number => {
    return (mins / MAX_DURATION) * 360;
  }, []);

  const currentAngle = durationToAngle(duration);

  // Trigger haptic feedback at hour boundaries
  const triggerHapticIfNeeded = useCallback((newDuration: number) => {
    const currentHour = Math.floor(newDuration / 60);
    if (currentHour !== lastHapticHour.current && lastHapticHour.current !== -1) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    }
    lastHapticHour.current = currentHour;
  }, []);

  // Apple-style: Direct angle from touch position
  const getAngleFromPageCoords = useCallback((pageX: number, pageY: number) => {
    const dx = pageX - clockCenterRef.current.x;
    const dy = pageY - clockCenterRef.current.y;
    // Convert to angle where 0 = top (12 o'clock), clockwise positive
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  // Pan responder - Apple style: touch anywhere to set position directly
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        
        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          lastHapticHour.current = Math.floor(duration / 60);
          
          Animated.spring(handleScale, {
            toValue: 1.15,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }).start();

          // Set duration directly from touch position
          const { pageX, pageY } = evt.nativeEvent;
          const angle = getAngleFromPageCoords(pageX, pageY);
          const newDuration = angleToDuration(angle);
          triggerHapticIfNeeded(newDuration);
          setDuration(newDuration);
        },
        
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          const angle = getAngleFromPageCoords(pageX, pageY);
          const newDuration = angleToDuration(angle);
          triggerHapticIfNeeded(newDuration);
          setDuration(newDuration);
        },
        
        onPanResponderRelease: () => {
          setIsDragging(false);
          lastHapticHour.current = -1;
          
          Animated.spring(handleScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }).start();
        },
      }),
    [getAngleFromPageCoords, angleToDuration, triggerHapticIfNeeded, duration, handleScale]
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const endDateTime = addMinutes(startDateTime, duration);

  // Calculate handle position (0 degrees = top)
  const handleAngleRad = (currentAngle - 90) * (Math.PI / 180);
  const handleX = CLOCK_RADIUS + Math.cos(handleAngleRad) * INNER_RADIUS - HANDLE_SIZE / 2;
  const handleY = CLOCK_RADIUS + Math.sin(handleAngleRad) * INNER_RADIUS - HANDLE_SIZE / 2;

  // Generate hour tick marks
  const hourMarkers = useMemo(() => {
    const markers = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15 - 90) * (Math.PI / 180);
      const isMajor = i % 6 === 0;
      const outerRadius = CLOCK_RADIUS - 8;
      const innerRadius = outerRadius - (isMajor ? 14 : 8);
      
      markers.push({
        key: i,
        x1: CLOCK_RADIUS + Math.cos(angle) * outerRadius,
        y1: CLOCK_RADIUS + Math.sin(angle) * outerRadius,
        x2: CLOCK_RADIUS + Math.cos(angle) * innerRadius,
        y2: CLOCK_RADIUS + Math.sin(angle) * innerRadius,
        isMajor,
        label: `${i}h`,
        labelX: CLOCK_RADIUS + Math.cos(angle) * (CLOCK_RADIUS - 30),
        labelY: CLOCK_RADIUS + Math.sin(angle) * (CLOCK_RADIUS - 30),
      });
    }
    return markers;
  }, []);

  const enableDuration = () => {
    setIsDurationEnabled(true);
  };

  const disableDuration = () => {
    setIsDurationEnabled(false);
    setDuration(120);
  };

  const handlePresetSelect = (minutes: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDuration(minutes);
  };

  // SVG arc calculation
  const svgSize = CLOCK_SIZE;
  const svgCenter = svgSize / 2;
  const arcRadius = INNER_RADIUS;
  const circumference = 2 * Math.PI * arcRadius;
  const progressLength = (currentAngle / 360) * circumference;
  const strokeDashoffset = circumference - progressLength;

  // Create gradient arc path for the filled portion
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = ((startAngle - 90) * Math.PI) / 180;
    const end = ((endAngle - 90) * Math.PI) / 180;
    const x1 = svgCenter + radius * Math.cos(start);
    const y1 = svgCenter + radius * Math.sin(start);
    const x2 = svgCenter + radius * Math.cos(end);
    const y2 = svgCenter + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  if (!isDurationEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Set a duration?</Text>
        <Text style={styles.subtitle}>Optional time limit for this consent</Text>

        <TouchableOpacity onPress={enableDuration} activeOpacity={0.8}>
          <View style={styles.enableCard}>
            <View style={styles.enableIconCircle}>
              <Ionicons name="time-outline" size={32} color={colors.text.secondary} />
            </View>
            <Text style={styles.enableTitle}>Add Time Limit</Text>
            <Text style={styles.enableDescription}>
              Set when this consent expires
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.tertiary} />
          <Text style={styles.infoText}>
            Without a limit, consent remains valid until revoked
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How long?</Text>
      <Text style={styles.subtitle}>Touch and drag around the dial</Text>

      {/* Clock Face - entire area is draggable */}
      <View 
        style={styles.clockContainer}
        onLayout={(e) => {
          e.target.measure((x, y, width, height, pageX, pageY) => {
            clockCenterRef.current = {
              x: pageX + width / 2,
              y: pageY + height / 2,
            };
          });
        }}
        {...panResponder.panHandlers}
      >
        {/* SVG for track and progress */}
        <Svg width={svgSize} height={svgSize} style={styles.svgOverlay}>
          {/* Background track */}
          <Circle
            cx={svgCenter}
            cy={svgCenter}
            r={arcRadius}
            stroke={colors.background.highlight}
            strokeWidth={TRACK_WIDTH}
            fill="none"
          />
          
          {/* Outer glow for progress (wider, faded) */}
          <G rotation={-90} origin={`${svgCenter}, ${svgCenter}`}>
            <Circle
              cx={svgCenter}
              cy={svgCenter}
              r={arcRadius}
              stroke={colors.brand.primary}
              strokeWidth={TRACK_WIDTH + 12}
              strokeOpacity={0.12}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
          
          {/* Main progress arc */}
          <G rotation={-90} origin={`${svgCenter}, ${svgCenter}`}>
            <Circle
              cx={svgCenter}
              cy={svgCenter}
              r={arcRadius}
              stroke={colors.brand.primary}
              strokeWidth={TRACK_WIDTH}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>

          {/* Hour tick marks */}
          {hourMarkers.map((marker) => (
            <Path
              key={marker.key}
              d={`M ${marker.x1} ${marker.y1} L ${marker.x2} ${marker.y2}`}
              stroke={marker.isMajor ? colors.text.secondary : colors.text.tertiary + '60'}
              strokeWidth={marker.isMajor ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          ))}
        </Svg>

        {/* Clock face center content */}
        <View style={styles.clockFace} pointerEvents="none">
          {/* Hour labels for major markers */}
          {hourMarkers.filter(m => m.isMajor).map((marker) => (
            <Text
              key={`label-${marker.key}`}
              style={[
                styles.hourLabel,
                {
                  left: marker.labelX - 12,
                  top: marker.labelY - 8,
                },
              ]}
            >
              {marker.label}
            </Text>
          ))}

          {/* Duration display in center */}
          <View style={styles.centerDisplay}>
            <Text style={[styles.durationText, isDragging && styles.durationTextActive]}>
              {formatDuration(duration)}
            </Text>
            <Text style={styles.endTimeText}>
              Until {format(endDateTime, 'h:mm a')}
            </Text>
          </View>
        </View>

        {/* Draggable handle */}
        <Animated.View
          style={[
            styles.handle,
            {
              left: handleX,
              top: handleY,
              transform: [{ scale: handleScale }],
            },
          ]}
          pointerEvents="none"
        >
          {/* Glow ring */}
          <View style={[styles.handleGlow, { backgroundColor: colors.brand.primary }]} />
          <View style={[styles.handleInner, { backgroundColor: colors.brand.primary }]}>
            <Ionicons name="time" size={18} color="#fff" />
          </View>
        </Animated.View>
      </View>

      {/* Quick presets */}
      <View style={styles.presetsRow}>
        {DURATION_PRESETS.map((preset) => {
          const isSelected = duration === preset.minutes;
          return (
            <TouchableOpacity
              key={preset.label}
              onPress={() => handlePresetSelect(preset.minutes)}
              activeOpacity={0.7}
              style={[
                styles.presetChip,
                isSelected && { backgroundColor: preset.color + '25', borderColor: preset.color },
              ]}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSelected && { color: preset.color, fontWeight: '700' },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Remove duration button */}
      <TouchableOpacity onPress={disableDuration} style={styles.removeButton}>
        <Ionicons name="close-circle-outline" size={18} color={colors.text.tertiary} />
        <Text style={styles.removeButtonText}>Remove time limit</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('../../lib/theme').getColors>) => StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  enableCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.borderDark,
    overflow: 'hidden',
    width: 280,
  },
  enableIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  enableTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  enableDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  clockContainer: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgOverlay: {
    position: 'absolute',
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    width: 24,
    textAlign: 'center',
  },
  centerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text.inverse,
    fontVariant: ['tabular-nums'],
  },
  durationTextActive: {
    color: colors.brand.primary,
  },
  endTimeText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGlow: {
    position: 'absolute',
    width: HANDLE_SIZE + 16,
    height: HANDLE_SIZE + 16,
    borderRadius: (HANDLE_SIZE + 16) / 2,
    opacity: 0.3,
  },
  handleInner: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.ui.borderDark,
  },
  presetChipText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  removeButtonText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
});

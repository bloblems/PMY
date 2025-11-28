import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import { formatDuration } from '@/lib/utils';

interface LinearDurationPickerProps {
  startTime: Date;
  duration: number; // in minutes
  onStartTimeChange: (date: Date) => void;
  onDurationChange: (minutes: number) => void;
}

export default function LinearDurationPicker({
  startTime,
  duration,
  onStartTimeChange,
  onDurationChange,
}: LinearDurationPickerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(Dimensions.get('window').width - 64);
  const trackWidthRef = useRef(trackWidth);

  // Calculate positions as percentages of a 24-hour day
  const dayStart = new Date(startTime);
  dayStart.setHours(0, 0, 0, 0);

  const startMinutesFromDayStart = Math.min(
    1440,
    Math.max(0, (startTime.getTime() - dayStart.getTime()) / 60000)
  );
  const startPercent = (startMinutesFromDayStart / 1440) * 100;

  // Clamp duration to fit within 24-hour window
  const maxDuration = 1440 - startMinutesFromDayStart;
  const clampedDuration = Math.min(duration, maxDuration);
  const endMinutesFromDayStart = startMinutesFromDayStart + clampedDuration;
  const endPercent = (endMinutesFromDayStart / 1440) * 100;

  const endTime = new Date(startTime.getTime() + duration * 60000);
  const isMultiDay = duration > 1440;

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const getMinutesFromPosition = (x: number): number => {
    const percent = Math.max(0, Math.min(100, (x / trackWidthRef.current) * 100));
    return Math.round((percent / 100) * 1440);
  };

  const updateStartTime = (x: number) => {
    const minutes = getMinutesFromPosition(x);
    const maxStartMinutes = endMinutesFromDayStart - 15; // Minimum 15 min duration
    const clampedMinutes = Math.min(minutes, maxStartMinutes);

    const newStartTime = new Date(dayStart);
    newStartTime.setMinutes(clampedMinutes);
    const newDuration = endMinutesFromDayStart - clampedMinutes;

    onStartTimeChange(newStartTime);
    onDurationChange(newDuration);
  };

  const updateEndTime = (x: number) => {
    const minutes = getMinutesFromPosition(x);
    const minEndMinutes = startMinutesFromDayStart + 15; // Minimum 15 min duration
    const clampedMinutes = Math.max(minutes, minEndMinutes);

    const newDuration = clampedMinutes - startMinutesFromDayStart;
    onDurationChange(newDuration);
  };

  const startHandleX = useSharedValue((startPercent / 100) * trackWidth);
  const endHandleX = useSharedValue((endPercent / 100) * trackWidth);

  const startGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(endHandleX.value - 20, event.absoluteX - 32));
      startHandleX.value = newX;
      runOnJS(updateStartTime)(newX);
    });

  const endGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newX = Math.max(startHandleX.value + 20, Math.min(trackWidthRef.current, event.absoluteX - 32));
      endHandleX.value = newX;
      runOnJS(updateEndTime)(newX);
    });

  const startHandleStyle = useAnimatedStyle(() => ({
    left: (startPercent / 100) * trackWidthRef.current - 16,
  }));

  const endHandleStyle = useAnimatedStyle(() => ({
    left: (endPercent / 100) * trackWidthRef.current - 16,
  }));

  const hours = [0, 6, 12, 18, 24];
  const hourLabels = ['12am', '6am', '12pm', '6pm', '12am'];

  return (
    <View style={styles.container}>
      {/* Multi-day warning */}
      {isMultiDay && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            This duration extends beyond 24 hours. The timeline shows only the first day.
          </Text>
        </View>
      )}

      {/* Time labels */}
      <View style={styles.timeLabels}>
        <View style={styles.timeLabelStart}>
          <Text style={styles.timeLabelTitle}>Start</Text>
          <Text style={styles.timeLabelValue}>{formatTime(startTime)}</Text>
        </View>
        <View style={styles.timeLabelCenter}>
          <Text style={styles.timeLabelTitle}>Duration</Text>
          <Text style={styles.timeLabelValueBold}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.timeLabelEnd}>
          <Text style={styles.timeLabelTitle}>End</Text>
          <Text style={styles.timeLabelValue}>{formatTime(endTime)}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timelineWrapper}>
        {/* Day/Night background */}
        <View style={styles.dayNightBg}>
          <View style={[styles.nightSection, { backgroundColor: colors.background.secondary }]} />
          <View style={[styles.daySection, { backgroundColor: colors.brand.primary + '15' }]} />
          <View style={[styles.nightSection, { backgroundColor: colors.background.secondary }]} />
        </View>

        {/* Hour markers */}
        <View
          ref={trackRef}
          style={styles.track}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            setTrackWidth(width);
            trackWidthRef.current = width;
          }}
        >
          {hours.map((hour, index) => (
            <View
              key={hour}
              style={[
                styles.hourMarker,
                { left: `${(hour / 24) * 100}%` },
              ]}
            >
              <View style={styles.hourLine} />
              <Text style={styles.hourLabel}>{hourLabels[index]}</Text>
            </View>
          ))}

          {/* Selected duration bar */}
          <View
            style={[
              styles.durationBar,
              {
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
                backgroundColor: colors.brand.primary + '40',
                borderColor: colors.brand.primary,
              },
            ]}
          />

          {/* Start handle */}
          <GestureDetector gesture={startGesture}>
            <Animated.View style={[styles.handle, startHandleStyle, { backgroundColor: colors.brand.primary }]} />
          </GestureDetector>

          {/* End handle */}
          <GestureDetector gesture={endGesture}>
            <Animated.View style={[styles.handle, endHandleStyle, { backgroundColor: colors.brand.primary }]} />
          </GestureDetector>
        </View>
      </View>

      {/* Helper text */}
      <Text style={styles.helperText}>
        Tap anywhere on the timeline or drag the handles to adjust times
      </Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: spacing.md,
    },
    warningBanner: {
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#F59E0B',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
    },
    warningText: {
      fontSize: typography.size.xs,
      color: '#92400E',
    },
    timeLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeLabelStart: {
      alignItems: 'flex-start',
    },
    timeLabelCenter: {
      alignItems: 'center',
    },
    timeLabelEnd: {
      alignItems: 'flex-end',
    },
    timeLabelTitle: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.text.primary,
    },
    timeLabelValue: {
      fontSize: typography.size.lg,
      color: colors.brand.primary,
    },
    timeLabelValueBold: {
      fontSize: typography.size.lg,
      fontWeight: '600',
      color: colors.text.primary,
    },
    timelineWrapper: {
      position: 'relative',
      height: 80,
    },
    dayNightBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 24,
      flexDirection: 'row',
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
    },
    nightSection: {
      flex: 1,
    },
    daySection: {
      flex: 2,
    },
    track: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.background.cardBorder,
    },
    hourMarker: {
      position: 'absolute',
      top: 0,
      bottom: -24,
      width: 1,
    },
    hourLine: {
      flex: 1,
      width: 1,
      backgroundColor: colors.background.cardBorder,
    },
    hourLabel: {
      position: 'absolute',
      bottom: 0,
      transform: [{ translateX: -16 }],
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      width: 32,
      textAlign: 'center',
    },
    durationBar: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      borderTopWidth: 2,
      borderBottomWidth: 2,
    },
    handle: {
      position: 'absolute',
      top: '50%',
      width: 32,
      height: 32,
      borderRadius: 16,
      marginTop: -16,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    helperText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

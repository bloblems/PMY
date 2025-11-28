import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing } from '@/lib/theme';

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  holdDuration?: number; // in milliseconds
  size?: number;
  disabled?: boolean;
  label?: string;
  subtitle?: string;
}

export default function HoldToConfirmButton({
  onConfirm,
  holdDuration = 2000,
  size = 200,
  disabled = false,
  label = 'YES',
  subtitle = 'Hold to confirm consent',
}: HoldToConfirmButtonProps) {
  const { colors } = useTheme();
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Pulse animation when not holding
    if (!isHolding && !isComplete) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isHolding, isComplete, glowAnim]);

  const handlePressIn = () => {
    if (disabled || isComplete) return;

    setIsHolding(true);

    // Haptic feedback on press
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }

    // Scale down slightly
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: holdDuration,
      useNativeDriver: false,
    }).start();

    // Set timer for completion
    holdTimerRef.current = setTimeout(() => {
      setIsComplete(true);
      setIsHolding(false);

      // Success haptic
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 50, 50, 50]);
      } else {
        Vibration.vibrate(100);
      }

      // Success animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onConfirm();
      });
    }, holdDuration);
  };

  const handlePressOut = () => {
    if (isComplete) return;

    setIsHolding(false);

    // Cancel timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Reset animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const styles = createStyles(colors, size, disabled);

  return (
    <View style={styles.container}>
      {/* Subtitle above */}
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Button container */}
      <View style={styles.buttonWrapper}>
        {/* Outer glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: isHolding ? 0.8 : glowOpacity,
              transform: [{ scale: isHolding ? 1.15 : 1.1 }],
            },
          ]}
        />

        {/* Progress ring */}
        <Animated.View
          style={[
            styles.progressRing,
            {
              transform: [
                { rotate: progressInterpolate },
              ],
            },
          ]}
        >
          <View style={styles.progressArc} />
        </Animated.View>

        {/* Main button */}
        <Animated.View
          style={[
            styles.buttonOuter,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || isComplete}
            style={styles.pressable}
          >
            <LinearGradient
              colors={
                isComplete
                  ? [colors.status.success, colors.status.success + 'CC']
                  : isHolding
                  ? [colors.brand.primary, colors.brand.primary + 'CC']
                  : disabled
                  ? [colors.ui.border, colors.ui.borderDark]
                  : [colors.brand.primary + 'EE', colors.brand.primary + 'AA']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.innerCircle}>
                <Text style={styles.label}>
                  {isComplete ? '✓' : label}
                </Text>
                {!isComplete && (
                  <Text style={styles.holdText}>
                    {isHolding ? 'Keep holding...' : 'Hold to confirm'}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Instructions below */}
      <Text style={styles.instructions}>
        {isComplete
          ? 'Consent confirmed!'
          : isHolding
          ? 'Release to cancel'
          : 'Press and hold for 2 seconds'}
      </Text>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof import('@/lib/theme').getColors>,
  size: number,
  disabled: boolean
) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    subtitle: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.semibold,
      color: colors.text.inverse,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    buttonWrapper: {
      width: size + 40,
      height: size + 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glowRing: {
      position: 'absolute',
      width: size + 30,
      height: size + 30,
      borderRadius: (size + 30) / 2,
      backgroundColor: colors.brand.primary,
      opacity: 0.3,
    },
    progressRing: {
      position: 'absolute',
      width: size + 16,
      height: size + 16,
      borderRadius: (size + 16) / 2,
      borderWidth: 4,
      borderColor: 'transparent',
      borderTopColor: colors.brand.primary,
      borderRightColor: colors.brand.primary,
    },
    progressArc: {
      flex: 1,
    },
    buttonOuter: {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      shadowColor: colors.brand.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    pressable: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    innerCircle: {
      width: size - 24,
      height: size - 24,
      borderRadius: (size - 24) / 2,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    label: {
      fontSize: size / 3.5,
      fontWeight: typography.weight.bold,
      color: '#FFFFFF',
      letterSpacing: 2,
    },
    holdText: {
      fontSize: typography.size.sm,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: spacing.xs,
    },
    instructions: {
      fontSize: typography.size.sm,
      color: colors.text.tertiary,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
  });

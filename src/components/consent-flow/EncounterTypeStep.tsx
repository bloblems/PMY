import { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { intimateEncounterType, encounterTypes } from '../../lib/consentFlowConstants';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../lib/theme';

interface EncounterTypeStepProps {
  selectedEncounterType: string;
  stepNumber: number;
  onSelect: (encounterType: string) => void;
  onShowCustomDialog: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.70;
const CARD_HEIGHT = 320;
const CARD_SPACING = 16;
// Center the focused card with equal peek on both sides
const SIDE_SPACING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const ITEM_SIZE = CARD_WIDTH + CARD_SPACING;
// Parent container has padding of 16 (spacing.lg), we need to extend beyond it
const PARENT_PADDING = 16;

const REPEAT_COUNT = 50;

const typeConfig: Record<string, { icon: string; gradient: string[]; glowColor: string; description: string }> = {
  intimate_encounter: {
    icon: 'heart',
    gradient: ['#FF3B9D', '#FF6B6B', '#FF8E53'],
    glowColor: '#FF3B9D',
    description: 'Physical intimacy between consenting adults',
  },
  date: {
    icon: 'cafe',
    gradient: ['#A855F7', '#8B5CF6', '#6366F1'],
    glowColor: '#A855F7',
    description: 'Romantic outing or social engagement',
  },
  conversation: {
    icon: 'chatbubbles',
    gradient: ['#10B981', '#059669', '#047857'],
    glowColor: '#10B981',
    description: 'Discussion on sensitive topics',
  },
  medical: {
    icon: 'medical',
    gradient: ['#3B82F6', '#2563EB', '#1D4ED8'],
    glowColor: '#3B82F6',
    description: 'Medical examination or procedure',
  },
  professional: {
    icon: 'briefcase',
    gradient: ['#F59E0B', '#D97706', '#B45309'],
    glowColor: '#F59E0B',
    description: 'Work-related meeting or interaction',
  },
  other: {
    icon: 'ellipsis-horizontal',
    gradient: ['#6B7280', '#4B5563', '#374151'],
    glowColor: '#6B7280',
    description: 'Other type of consensual activity',
  },
  custom: {
    icon: 'sparkles',
    gradient: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    glowColor: '#8B5CF6',
    description: 'Define your own encounter type',
  },
};

export function EncounterTypeStep({
  selectedEncounterType,
  stepNumber,
  onSelect,
  onShowCustomDialog,
}: EncounterTypeStepProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const hasInitialized = useRef(false);

  const baseTypes = [
    intimateEncounterType,
    ...encounterTypes,
    { id: 'custom', label: 'Custom' },
  ];

  const baseLength = baseTypes.length;

  const infiniteData = Array(REPEAT_COUNT)
    .fill(baseTypes)
    .flat()
    .map((item, index) => ({
      ...item,
      uniqueKey: `${item.id}-${index}`,
      originalIndex: index % baseLength,
    }));

  const middleIndex = Math.floor(REPEAT_COUNT / 2) * baseLength;

  const getInitialIndex = useCallback(() => {
    if (!selectedEncounterType) return middleIndex;
    const typeIndex = baseTypes.findIndex((t) => t.id === selectedEncounterType);
    return typeIndex >= 0 ? middleIndex + typeIndex : middleIndex;
  }, [selectedEncounterType, baseTypes, middleIndex]);

  useEffect(() => {
    if (!hasInitialized.current && flatListRef.current) {
      const initialIndex = getInitialIndex();
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialIndex * ITEM_SIZE,
          animated: false,
        });
        hasInitialized.current = true;
      }, 50);
    }
  }, [getInitialIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / ITEM_SIZE);
      const actualIndex = index % baseLength;
      const selectedType = baseTypes[actualIndex];

      if (selectedType) {
        if (selectedType.id === 'custom') {
          onShowCustomDialog();
        } else {
          onSelect(selectedType.id);
        }
      }
    },
    [baseTypes, baseLength, onSelect, onShowCustomDialog]
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const renderCard = useCallback(
    ({ item, index }: { item: { id: string; label: string; uniqueKey: string; originalIndex: number }; index: number }) => {
      const config = typeConfig[item.id] || typeConfig.other;
      const isSelected = selectedEncounterType === item.id;

      const inputRange = [
        (index - 1) * ITEM_SIZE,
        index * ITEM_SIZE,
        (index + 1) * ITEM_SIZE,
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.85, 1, 0.85],
        extrapolate: 'clamp',
      });

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.4, 1, 0.4],
        extrapolate: 'clamp',
      });

      const rotateY = scrollX.interpolate({
        inputRange,
        outputRange: ['8deg', '0deg', '-8deg'],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [{ scale }, { perspective: 1000 }, { rotateY }],
              opacity,
            },
          ]}
        >
          {/* Glow effect behind card */}
          <View style={[styles.cardGlow, { backgroundColor: config.glowColor + '30' }]} />

          <View style={styles.card}>
            {/* Main gradient background */}
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(38,38,42,0.98)', 'rgba(28,28,32,0.99)']
                  : ['rgba(255,255,255,0.98)', 'rgba(245,245,250,0.95)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Colored gradient overlay at top */}
            <LinearGradient
              colors={[config.gradient[0] + '20', config.gradient[1] + '08', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Top edge highlight */}
            <LinearGradient
              colors={[
                isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.15 }}
              style={styles.topShine}
            />

            {/* Content */}
            <View style={styles.cardContent}>
              {/* Icon container with gradient */}
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name={config.icon as any} size={36} color="#FFFFFF" />
                </LinearGradient>
                {/* Icon shadow/glow */}
                <View style={[styles.iconShadow, { backgroundColor: config.gradient[0] }]} />
              </View>

              {/* Label */}
              <Text style={styles.cardLabel}>{item.label}</Text>

              {/* Decorative line */}
              <LinearGradient
                colors={[config.gradient[0] + '00', config.gradient[0] + '60', config.gradient[0] + '00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.decorativeLine}
              />

              {/* Description */}
              <Text style={styles.cardDescription}>{config.description}</Text>

              {/* Selection indicator */}
              <View style={styles.selectionArea}>
                {isSelected ? (
                  <LinearGradient
                    colors={config.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectedBadge}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.selectedText}>Selected</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.unselectedBadge}>
                    <View style={[styles.unselectedDot, { backgroundColor: config.gradient[0] + '40' }]} />
                    <Text style={styles.unselectedText}>Swipe to select</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom gradient fade */}
            <LinearGradient
              colors={[
                'transparent',
                isDark ? 'rgba(20,20,24,0.4)' : 'rgba(240,240,245,0.4)',
              ]}
              start={{ x: 0, y: 0.7 }}
              end={{ x: 0, y: 1 }}
              style={styles.bottomFade}
            />
          </View>
        </Animated.View>
      );
    },
    [colors, isDark, selectedEncounterType, scrollX, styles]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What type of encounter?</Text>
        <Text style={styles.subtitle}>Swipe to browse • Stop to select</Text>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={infiniteData}
          keyExtractor={(item) => item.uniqueKey}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
          onScroll={onScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          renderItem={renderCard}
          getItemLayout={(_, index) => ({
            length: ITEM_SIZE,
            offset: ITEM_SIZE * index,
            index,
          })}
          initialScrollIndex={getInitialIndex()}
          onScrollToIndexFailed={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({
                offset: getInitialIndex() * ITEM_SIZE,
                animated: false,
              });
            }, 100);
          }}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('../../lib/theme').getColors>, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.size['2xl'],
      fontWeight: typography.weight.bold,
      color: colors.text.inverse,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    carouselContainer: {
      flex: 1,
      justifyContent: 'center',
      // Extend beyond parent padding so carousel reaches screen edges
      marginHorizontal: -PARENT_PADDING,
      overflow: 'visible',
    },
    listContent: {
      // Adjust padding to account for the negative margin we added
      paddingHorizontal: SIDE_SPACING,
      alignItems: 'center',
    },
    cardWrapper: {
      width: CARD_WIDTH,
      marginRight: CARD_SPACING,
      position: 'relative',
    },
    cardGlow: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
      borderRadius: 32,
      opacity: 0.5,
      transform: [{ scale: 1.05 }],
    },
    card: {
      height: CARD_HEIGHT,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: isDark ? 0.6 : 0.15,
      shadowRadius: 40,
      elevation: 20,
    },
    topShine: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 24,
    },
    cardContent: {
      flex: 1,
      padding: spacing.xl,
      paddingTop: spacing.xxl,
      alignItems: 'center',
    },
    iconWrapper: {
      position: 'relative',
      marginBottom: spacing.lg,
    },
    iconGradient: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconShadow: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 24,
      top: 8,
      opacity: 0.3,
      zIndex: -1,
    },
    cardLabel: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text.inverse,
      marginBottom: spacing.sm,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    decorativeLine: {
      width: 60,
      height: 3,
      borderRadius: 1.5,
      marginBottom: spacing.md,
    },
    cardDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: spacing.sm,
    },
    selectionArea: {
      marginTop: 'auto',
      paddingTop: spacing.md,
    },
    selectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    selectedText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: '#FFFFFF',
    },
    unselectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    unselectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    unselectedText: {
      fontSize: typography.size.sm,
      color: colors.text.tertiary,
    },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 80,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
  });

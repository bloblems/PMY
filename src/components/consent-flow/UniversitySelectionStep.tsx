import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UniversitySelector from '../UniversitySelector';
import StateSelector from '../StateSelector';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../lib/theme';
import type { University } from '../../lib/consentFlowConstants';

interface UniversitySelectionStepProps {
  stepNumber: number;
  selectionMode: 'select-university' | 'select-state' | 'not-applicable';
  selectedUniversity: University | null;
  selectedState: { code: string; name: string } | null;
  universities: University[];
  onSelectionModeChange: (mode: 'select-university' | 'select-state' | 'not-applicable') => void;
  onUniversitySelect: (university: University | null) => void;
  onStateSelect: (state: { code: string; name: string } | null) => void;
  onNavigateToTitleIX: () => void;
  onNavigateToStateLaws: () => void;
}

const modeConfig = {
  'select-university': {
    icon: 'school',
    gradient: ['#8B5CF6', '#7C3AED', '#6D28D9'] as const,
    glowColor: '#8B5CF6',
    title: 'University',
    description: 'Select your institution for Title IX policies',
  },
  'select-state': {
    icon: 'location',
    gradient: ['#F59E0B', '#D97706', '#B45309'] as const,
    glowColor: '#F59E0B',
    title: 'State',
    description: 'Choose your state for consent laws',
  },
  'not-applicable': {
    icon: 'globe',
    gradient: ['#6B7280', '#4B5563', '#374151'] as const,
    glowColor: '#6B7280',
    title: 'General',
    description: 'Continue without specific jurisdiction',
  },
};

export function UniversitySelectionStep({
  selectionMode,
  selectedUniversity,
  selectedState,
  universities,
  onSelectionModeChange,
  onUniversitySelect,
  onStateSelect,
  onNavigateToTitleIX,
  onNavigateToStateLaws,
}: UniversitySelectionStepProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const renderOptionCard = (mode: 'select-university' | 'select-state' | 'not-applicable') => {
    const config = modeConfig[mode];
    const isSelected = selectionMode === mode;

    return (
      <TouchableOpacity
        key={mode}
        onPress={() => onSelectionModeChange(mode)}
        activeOpacity={0.85}
        style={styles.optionTouchable}
      >
        {/* Glow effect behind card when selected */}
        {isSelected && (
          <View style={[styles.optionGlow, { backgroundColor: config.glowColor + '25' }]} />
        )}

        <View style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
          {/* Background gradient */}
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

          {/* Colored accent gradient at left when selected */}
          {isSelected && (
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.leftAccent}
            />
          )}

          <View style={styles.optionContent}>
            {/* Icon with gradient background */}
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={isSelected ? config.gradient : [colors.background.secondary, colors.background.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={config.icon as any}
                  size={22}
                  color={isSelected ? '#FFFFFF' : colors.text.secondary}
                />
              </LinearGradient>
              {/* Icon shadow when selected */}
              {isSelected && (
                <View style={[styles.iconShadow, { backgroundColor: config.gradient[0] }]} />
              )}
            </View>

            {/* Text content */}
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                {config.title}
              </Text>
              <Text style={styles.optionDescription}>{config.description}</Text>
            </View>

            {/* Selection indicator */}
            <View style={styles.selectionIndicator}>
              {isSelected ? (
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectedDot}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={styles.unselectedDot} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderResourceCard = (
    type: 'university' | 'state',
    onPress: () => void
  ) => {
    const isUniversity = type === 'university';
    const config = isUniversity
      ? {
          icon: 'school',
          gradient: ['#8B5CF6', '#7C3AED', '#6D28D9'] as const,
          glowColor: '#8B5CF6',
          title: 'Title IX Resources',
          description: 'University sexual misconduct policies and reporting procedures',
        }
      : {
          icon: 'scale',
          gradient: ['#F59E0B', '#D97706', '#B45309'] as const,
          glowColor: '#F59E0B',
          title: 'State Consent Laws',
          description: 'Legal consent requirements and age of consent by state',
        };

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.resourceWrapper}
      >
        {/* Glow behind card */}
        <View style={[styles.resourceGlow, { backgroundColor: config.glowColor + '20' }]} />

        <View style={styles.resourceCard}>
          {/* Background */}
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
            colors={[config.gradient[0] + '15', config.gradient[1] + '08', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.resourceContent}>
            {/* Icon with gradient */}
            <View style={styles.resourceIconWrapper}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resourceIconGradient}
              >
                <Ionicons name={config.icon as any} size={24} color="#FFFFFF" />
              </LinearGradient>
              {/* Icon shadow */}
              <View style={[styles.resourceIconShadow, { backgroundColor: config.gradient[0] }]} />
            </View>

            {/* Text */}
            <View style={styles.resourceTextContainer}>
              <Text style={styles.resourceTitle}>{config.title}</Text>
              <Text style={styles.resourceDescription}>{config.description}</Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.arrowGradient}
              >
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </LinearGradient>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Where are you located?</Text>
        <Text style={styles.subtitle}>This helps us show relevant policies</Text>
      </View>

      {/* Option Cards */}
      <View style={styles.optionsContainer}>
        {renderOptionCard('select-university')}
        {renderOptionCard('select-state')}
        {renderOptionCard('not-applicable')}
      </View>

      {/* Selector */}
      {selectionMode === 'select-university' && (
        <View style={styles.selectorContainer}>
          <UniversitySelector
            universities={universities}
            selectedUniversity={selectedUniversity}
            onSelect={onUniversitySelect}
          />
        </View>
      )}

      {selectionMode === 'select-state' && (
        <View style={styles.selectorContainer}>
          <StateSelector
            selectedState={selectedState}
            onSelect={onStateSelect}
          />
        </View>
      )}

      {/* Resource Cards */}
      {selectionMode === 'select-university' && selectedUniversity && (
        renderResourceCard('university', onNavigateToTitleIX)
      )}

      {selectionMode === 'select-state' && selectedState && (
        renderResourceCard('state', onNavigateToStateLaws)
      )}
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

    // Options
    optionsContainer: {
      gap: spacing.sm,
    },
    optionTouchable: {
      position: 'relative',
    },
    optionGlow: {
      position: 'absolute',
      top: 4,
      left: 4,
      right: 4,
      bottom: 4,
      borderRadius: 20,
      opacity: 0.6,
    },
    optionCard: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    optionCardSelected: {
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.5 : 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    leftAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      paddingLeft: spacing.lg,
    },

    // Icon
    iconWrapper: {
      position: 'relative',
      marginRight: spacing.md,
    },
    iconGradient: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconShadow: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: 12,
      top: 4,
      opacity: 0.3,
      zIndex: -1,
    },

    // Text
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: colors.text.inverse,
      marginBottom: 2,
    },
    optionTitleSelected: {
      fontWeight: typography.weight.bold,
    },
    optionDescription: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      lineHeight: 16,
    },

    // Selection indicator
    selectionIndicator: {
      marginLeft: spacing.sm,
    },
    selectedDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unselectedDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
    },

    // Selector
    selectorContainer: {
      marginTop: spacing.lg,
    },

    // Resource Card
    resourceWrapper: {
      marginTop: spacing.xl,
      position: 'relative',
    },
    resourceGlow: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      borderRadius: 24,
      opacity: 0.5,
    },
    resourceCard: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 32,
      elevation: 16,
    },
    resourceContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
    },
    resourceIconWrapper: {
      position: 'relative',
      marginRight: spacing.md,
    },
    resourceIconGradient: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resourceIconShadow: {
      position: 'absolute',
      width: 52,
      height: 52,
      borderRadius: 16,
      top: 6,
      opacity: 0.3,
      zIndex: -1,
    },
    resourceTextContainer: {
      flex: 1,
      marginRight: spacing.sm,
    },
    resourceTitle: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      color: colors.text.inverse,
      marginBottom: spacing.xs,
    },
    resourceDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    arrowContainer: {
      alignSelf: 'center',
    },
    arrowGradient: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

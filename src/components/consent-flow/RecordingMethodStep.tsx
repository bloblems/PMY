import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { recordingMethods, type RecordingMethod } from '../../lib/consentFlowConstants';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../lib/theme';

interface RecordingMethodStepProps {
  selectedMethod: RecordingMethod | null;
  stepNumber: number;
  onSelect: (method: RecordingMethod) => void;
}

const methodConfig: Record<string, { icon: string; color: string }> = {
  signature: { icon: 'create-outline', color: '#3B82F6' },
  voice: { icon: 'mic-outline', color: '#10B981' },
  photo: { icon: 'camera-outline', color: '#F59E0B' },
  biometric: { icon: 'finger-print-outline', color: '#8B5CF6' },
};

export function RecordingMethodStep({
  selectedMethod,
  stepNumber,
  onSelect,
}: RecordingMethodStepProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How to record consent?</Text>
      <Text style={styles.subtitle}>Choose a verification method</Text>

      <View style={styles.methodsList}>
        {recordingMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const config = methodConfig[method.id] || { icon: 'help-circle', color: colors.text.tertiary };

          return (
            <TouchableOpacity
              key={method.id}
              onPress={() => onSelect(method.id)}
              activeOpacity={0.7}
              style={styles.methodItem}
            >
              <View style={[styles.methodCard, isSelected && styles.methodCardSelected]}>
                {isSelected && (
                  <LinearGradient
                    colors={[config.color + '25', config.color + '10']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <View style={[styles.iconCircle, isSelected && { backgroundColor: config.color }]}>
                  <Ionicons
                    name={config.icon as any}
                    size={22}
                    color={isSelected ? '#FFF' : config.color}
                  />
                </View>
                <View style={styles.methodText}>
                  <Text style={[styles.methodLabel, isSelected && { color: config.color }]}>
                    {method.label}
                  </Text>
                  <Text style={styles.methodDescription} numberOfLines={1}>
                    {method.description}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={config.color} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('../../lib/theme').getColors>) => StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  methodsList: {
    gap: spacing.sm,
  },
  methodItem: {
  },
  methodCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.borderDark,
    overflow: 'hidden',
  },
  methodCardSelected: {
    borderColor: 'transparent',
    borderWidth: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodText: {
    flex: 1,
  },
  methodLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
});

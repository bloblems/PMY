import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { intimateActOptions } from '../../lib/consentFlowConstants';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../lib/theme';

interface IntimateActsStepProps {
  stepNumber: number;
  intimateActs: Record<string, "yes" | "no">;
  onToggle: (act: string) => void;
  onShowAdvancedOptions: () => void;
}

export function IntimateActsStep({
  stepNumber,
  intimateActs,
  onToggle,
  onShowAdvancedOptions,
}: IntimateActsStepProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const selectedCount = Object.keys(intimateActs).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's included?</Text>
      <Text style={styles.subtitle}>
        Tap to select • Tap again to exclude • Tap once more to clear
      </Text>

      <View style={styles.grid}>
        {intimateActOptions.map((act) => {
          const actState = intimateActs[act];
          const isYes = actState === "yes";
          const isNo = actState === "no";

          return (
            <TouchableOpacity
              key={act}
              onPress={() => onToggle(act)}
              activeOpacity={0.7}
              style={styles.gridItem}
            >
              <View style={[
                styles.actCard,
                isYes && styles.actCardYes,
                isNo && styles.actCardNo,
              ]}>
                <View style={[
                  styles.iconCircle,
                  isYes && styles.iconCircleYes,
                  isNo && styles.iconCircleNo,
                ]}>
                  {isYes && <Ionicons name="checkmark" size={16} color="#fff" />}
                  {isNo && <Ionicons name="close" size={16} color="#fff" />}
                  {!isYes && !isNo && <View style={styles.emptyCircle} />}
                </View>
                <Text style={[
                  styles.actLabel,
                  isYes && styles.actLabelYes,
                  isNo && styles.actLabelNo,
                ]} numberOfLines={2}>
                  {act}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom acts button */}
      <TouchableOpacity onPress={onShowAdvancedOptions} style={styles.customButton}>
        <Ionicons name="add-circle-outline" size={20} color={colors.text.tertiary} />
        <Text style={styles.customButtonText}>Add custom activity</Text>
      </TouchableOpacity>

      {/* Selection summary */}
      {selectedCount > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {selectedCount} {selectedCount === 1 ? 'activity' : 'activities'} selected
          </Text>
        </View>
      )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  actCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.borderDark,
    minHeight: 56,
  },
  actCardYes: {
    borderColor: colors.status.success,
    backgroundColor: colors.status.success + '15',
  },
  actCardNo: {
    borderColor: colors.status.error,
    backgroundColor: colors.status.error + '15',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconCircleYes: {
    backgroundColor: colors.status.success,
  },
  iconCircleNo: {
    backgroundColor: colors.status.error,
  },
  emptyCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary + '40',
  },
  actLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
    flex: 1,
  },
  actLabelYes: {
    color: colors.status.success,
  },
  actLabelNo: {
    color: colors.status.error,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  customButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  summary: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.ui.borderDark,
  },
  summaryText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
});

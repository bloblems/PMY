import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import Button from '../Button';
import { intimateActOptions } from '../../lib/consentFlowConstants';

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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Step {stepNumber}: Intimate Acts</Text>
        <Text style={styles.subtitle}>
          Tap once for YES (green ✓), twice for NO (red ✗), three times to unselect
        </Text>
      </View>

      <View style={[styles.grid, styles.gridSpacing]}>
        {intimateActOptions.map((act, index) => {
          const actState = intimateActs[act];
          const isYes = actState === "yes";
          const isNo = actState === "no";
          
          return (
            <TouchableOpacity
              key={act}
              onPress={() => onToggle(act)}
              activeOpacity={0.7}
            >
              <Card style={[
                styles.actCard,
                isYes && styles.actCardYes,
                isNo && styles.actCardNo,
                index % 2 === 1 && styles.actCardRightSpacing
              ].filter(Boolean) as any}>
                <View style={styles.actContent}>
                  <View style={[
                    styles.checkbox,
                    isYes && styles.checkboxYes,
                    isNo && styles.checkboxNo
                  ]}>
                    {isYes && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                    {isNo && (
                      <Ionicons name="close" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={[styles.actLabel, styles.actLabelSpacing]}>{act}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Advanced Options"
        onPress={onShowAdvancedOptions}
        variant="outline"
        style={[styles.advancedButton, styles.advancedButtonSpacing]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridSpacing: {
    marginTop: 16,
  },
  actCard: {
    flex: 1,
    minWidth: '47%',
    marginBottom: 8,
  },
  actCardRightSpacing: {
    marginLeft: 8,
  },
  actCardYes: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E9',
  },
  actCardNo: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFEBEE',
  },
  actContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actLabelSpacing: {
    marginLeft: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxYes: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  checkboxNo: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B30',
  },
  actLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  advancedButton: {
    marginTop: 8,
  },
  advancedButtonSpacing: {
    marginTop: 16,
  },
});


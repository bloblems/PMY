import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import Modal from './Modal';
import Button from './Button';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface AmendmentDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amendment: {
    type: string;
    description: string;
    newValue?: any;
  }) => void;
  loading?: boolean;
  currentContract?: {
    intimateActs?: Record<string, string>;
    contractDuration?: number;
  };
}

type AmendmentType = 'add_acts' | 'remove_acts' | 'change_duration' | 'other';

const AMENDMENT_TYPES = [
  { id: 'add_acts' as AmendmentType, label: 'Add Intimate Acts', icon: 'add-circle' },
  { id: 'remove_acts' as AmendmentType, label: 'Remove Intimate Acts', icon: 'remove-circle' },
  { id: 'change_duration' as AmendmentType, label: 'Change Duration', icon: 'time' },
  { id: 'other' as AmendmentType, label: 'Other Amendment', icon: 'create' },
];

export function AmendmentDialog({ visible, onClose, onSubmit, loading, currentContract }: AmendmentDialogProps) {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<AmendmentType | null>(null);
  const [description, setDescription] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newActs, setNewActs] = useState('');

  const styles = createStyles(colors);

  const handleSubmit = () => {
    if (!selectedType || !description.trim()) return;

    let newValue: any = null;
    if (selectedType === 'change_duration' && newDuration) {
      newValue = parseInt(newDuration, 10);
    } else if ((selectedType === 'add_acts' || selectedType === 'remove_acts') && newActs) {
      newValue = newActs.split(',').map(act => act.trim());
    }

    onSubmit({
      type: selectedType,
      description: description.trim(),
      newValue,
    });
  };

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    setNewDuration('');
    setNewActs('');
    onClose();
  };

  const renderTypeContent = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case 'add_acts':
        return (
          <View style={styles.typeContent}>
            <Text style={styles.inputLabel}>Acts to Add</Text>
            <Text style={styles.inputHelper}>
              Enter the intimate acts you want to add, separated by commas
            </Text>
            <TextInput
              style={styles.input}
              value={newActs}
              onChangeText={setNewActs}
              placeholder="e.g., Kissing, Touching"
              placeholderTextColor={colors.text.tertiary}
              multiline
            />
          </View>
        );

      case 'remove_acts':
        return (
          <View style={styles.typeContent}>
            <Text style={styles.inputLabel}>Acts to Remove</Text>
            <Text style={styles.inputHelper}>
              Enter the intimate acts you want to remove, separated by commas
            </Text>
            <TextInput
              style={styles.input}
              value={newActs}
              onChangeText={setNewActs}
              placeholder="e.g., Kissing, Touching"
              placeholderTextColor={colors.text.tertiary}
              multiline
            />
          </View>
        );

      case 'change_duration':
        return (
          <View style={styles.typeContent}>
            <Text style={styles.inputLabel}>New Duration (minutes)</Text>
            {currentContract?.contractDuration && (
              <Text style={styles.inputHelper}>
                Current duration: {currentContract.contractDuration} minutes
              </Text>
            )}
            <TextInput
              style={styles.input}
              value={newDuration}
              onChangeText={setNewDuration}
              placeholder="Enter new duration in minutes"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Request Amendment"
      description="Request changes to this consent contract. All parties must approve."
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amendment Type Selection */}
        <Text style={styles.sectionTitle}>Amendment Type</Text>
        <View style={styles.typeButtons}>
          {AMENDMENT_TYPES.map((type) => (
            <Button
              key={type.id}
              title={type.label}
              onPress={() => setSelectedType(type.id)}
              variant={selectedType === type.id ? 'default' : 'outline'}
              size="small"
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonActive,
              ]}
            />
          ))}
        </View>

        {/* Type-specific content */}
        {renderTypeContent()}

        {/* Description */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
          Reason for Amendment
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Explain why you're requesting this change..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={loading ? "Submitting..." : "Submit Request"}
            onPress={handleSubmit}
            disabled={loading || !selectedType || !description.trim()}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  scrollContent: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleSpacing: {
    marginTop: spacing.lg,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    marginBottom: spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  typeContent: {
    marginTop: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  inputHelper: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.inverse,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  textArea: {
    minHeight: 100,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});

import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Modal from './Modal';
import Button from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../lib/theme';

interface CustomEncounterDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  loading?: boolean;
}

export function CustomEncounterDialog({ visible, onClose, onSubmit, loading }: CustomEncounterDialogProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [customText, setCustomText] = useState('');

  const handleSubmit = () => {
    if (customText.trim()) {
      onSubmit(customText.trim());
      setCustomText('');
    }
  };

  const handleClose = () => {
    setCustomText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Describe Your Encounter Type"
      description="Tell us about your encounter in your own words, and our AI will help categorize it appropriately."
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, styles.textAreaSpacing]}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Example: 'A romantic dinner date followed by watching a movie together'"
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.actions, styles.actionsSpacing]}>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={loading ? "Interpreting..." : "Apply"}
            onPress={handleSubmit}
            disabled={loading || !customText.trim()}
            style={[styles.submitButton, styles.submitButtonSpacing]}
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof import('../lib/theme').getColors>) => StyleSheet.create({
  content: {
  },
  inputGroup: {
  },
  label: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
  },
  textArea: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.ui.borderDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.inverse,
    minHeight: 120,
  },
  textAreaSpacing: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
  },
  actionsSpacing: {
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  submitButtonSpacing: {
    marginLeft: spacing.md,
  },
});

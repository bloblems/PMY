import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Modal from './Modal';
import Button from './Button';

interface AdvancedActsDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  loading?: boolean;
}

export function AdvancedActsDialog({ visible, onClose, onSubmit, loading }: AdvancedActsDialogProps) {
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
      title="Advanced Options"
      description="Describe intimate acts in your own words, and our AI will help identify appropriate consent terms."
    >
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, styles.textAreaSpacing]}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Example: 'We plan to hold hands and kiss goodnight'"
            placeholderTextColor="#666"
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

const styles = StyleSheet.create({
  content: {
  },
  inputGroup: {
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    minHeight: 120,
  },
  textAreaSpacing: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
  },
  actionsSpacing: {
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#34C759',
  },
  submitButtonSpacing: {
    marginLeft: 12,
  },
});


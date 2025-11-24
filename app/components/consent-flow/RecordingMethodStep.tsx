import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recordingMethods, type RecordingMethod } from '../../lib/consentFlowConstants';
import Card from '../Card';

interface RecordingMethodStepProps {
  selectedMethod: RecordingMethod | null;
  stepNumber: number;
  onSelect: (method: RecordingMethod) => void;
}

export function RecordingMethodStep({
  selectedMethod,
  stepNumber,
  onSelect,
}: RecordingMethodStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Step {stepNumber}: Recording Method</Text>
        <Text style={styles.subtitle}>How would you like to document consent?</Text>
      </View>

      <View style={[styles.methodsList, styles.methodsListSpacing]}>
        {recordingMethods.map((method, index) => {
          const isSelected = selectedMethod === method.id;
          
          return (
            <TouchableOpacity
              key={method.id}
              onPress={() => onSelect(method.id)}
              activeOpacity={0.7}
              style={index > 0 && styles.methodCardSpacing}
            >
              <Card style={[
                styles.methodCard,
                isSelected && styles.methodCardSelected
              ].filter(Boolean) as any}>
                <View style={styles.methodContent}>
                  <Ionicons 
                    name={getIconName(method.id) as any} 
                    size={24} 
                    color={isSelected ? '#34C759' : '#666'} 
                  />
                  <View style={[styles.methodText, styles.methodTextSpacing]}>
                    <Text style={styles.methodLabel}>{method.label}</Text>
                    <Text style={styles.methodDescription}>{method.description}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function getIconName(methodId: string): string {
  const iconMap: Record<string, string> = {
    signature: 'document-text',
    voice: 'mic',
    photo: 'camera',
    biometric: 'finger-print',
  };
  return iconMap[methodId] || 'help-circle';
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
  methodsList: {
  },
  methodsListSpacing: {
    marginTop: 16,
  },
  methodCard: {
    marginBottom: 0,
  },
  methodCardSpacing: {
    marginTop: 12,
  },
  methodCardSelected: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E9',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    flex: 1,
  },
  methodTextSpacing: {
    marginLeft: 16,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: '#999',
  },
});


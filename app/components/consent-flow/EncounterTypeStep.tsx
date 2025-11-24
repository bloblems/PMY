import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { intimateEncounterType, encounterTypes, otherEncounterType } from '../../lib/consentFlowConstants';
import Card from '../Card';

interface EncounterTypeStepProps {
  selectedEncounterType: string;
  stepNumber: number;
  onSelect: (encounterType: string) => void;
  onShowCustomDialog: () => void;
}

export function EncounterTypeStep({
  selectedEncounterType,
  stepNumber,
  onSelect,
  onShowCustomDialog,
}: EncounterTypeStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Step {stepNumber}: Encounter Type</Text>
        <Text style={styles.subtitle}>What kind of encounter is this consent for?</Text>
      </View>

      <TouchableOpacity
        onPress={() => onSelect(intimateEncounterType.id)}
        activeOpacity={0.7}
        style={styles.firstCardSpacing}
      >
        <Card style={[
          styles.encounterCard,
          selectedEncounterType === intimateEncounterType.id && styles.selectedCard
        ].filter(Boolean) as any}>
          <View style={styles.cardContent}>
            <Ionicons 
              name="heart" 
              size={24} 
              color={selectedEncounterType === intimateEncounterType.id ? '#FF3B9D' : '#666'} 
            />
            <Text style={[styles.cardLabel, styles.cardLabelSpacing]}>{intimateEncounterType.label}</Text>
          </View>
        </Card>
      </TouchableOpacity>

      <View style={styles.grid}>
        {encounterTypes.map((type, index) => {
          const isSelected = selectedEncounterType === type.id;
          const isRightColumn = index % 2 === 1; // Every 2nd item (right column)
          
          return (
            <TouchableOpacity
              key={type.id}
              onPress={() => onSelect(type.id)}
              activeOpacity={0.7}
              style={[
                styles.gridItem,
                isRightColumn && styles.gridItemRight
              ]}
            >
              <Card style={[
                styles.encounterCard,
                styles.gridCard,
                isSelected && styles.selectedCard
              ].filter(Boolean) as any}>
                <View style={styles.cardContent}>
                  <Ionicons 
                    name={getIconName(type.id) as any} 
                    size={24} 
                    color={isSelected ? getIconColor(type.id) : '#666'} 
                  />
                  <Text style={[styles.cardLabel, styles.cardLabelSpacing]}>{type.label}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onShowCustomDialog}
        activeOpacity={0.7}
        style={styles.lastCardSpacing}
      >
        <Card style={styles.encounterCard}>
          <View style={[styles.cardContent, styles.rowContent]}>
            <Ionicons name="people" size={24} color="#666" />
            <Text style={[styles.cardLabel, styles.rowContentTextSpacing]}>Other (Custom)</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

function getIconName(typeId: string): string {
  const iconMap: Record<string, string> = {
    date: 'cafe',
    conversation: 'chatbubbles',
    medical: 'medical',
    professional: 'briefcase',
  };
  return iconMap[typeId] || 'help-circle';
}

function getIconColor(typeId: string): string {
  const colorMap: Record<string, string> = {
    date: '#A855F7',
    conversation: '#10B981',
    medical: '#3B82F6',
    professional: '#F59E0B',
  };
  return colorMap[typeId] || '#666';
}

const styles = StyleSheet.create({
  container: {
  },
  firstCardSpacing: {
    marginTop: 16,
  },
  lastCardSpacing: {
    marginTop: 16,
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
  encounterCard: {
    marginBottom: 0,
  },
  selectedCard: {
    borderColor: '#34C759',
    borderWidth: 2,
    backgroundColor: '#1C3A1F',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginHorizontal: -6, // Negative margin to compensate for item margins
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  gridItemRight: {
    // No additional styling needed, padding handles spacing
  },
  gridCard: {
    width: '100%',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardLabelSpacing: {
    marginTop: 8,
  },
  rowContent: {
    flexDirection: 'row',
  },
  rowContentTextSpacing: {
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
});


import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import Button from '../Button';
import UniversitySelector from '../UniversitySelector';
import StateSelector from '../StateSelector';
import { colors } from '../../lib/theme';
import type { University } from '../../lib/consentFlowConstants';

interface UniversitySelectionStepProps {
  stepNumber: number;
  selectionMode: "select-university" | "select-state" | "not-applicable";
  selectedUniversity: University | null;
  selectedState: { code: string; name: string } | null;
  universities: University[];
  onSelectionModeChange: (mode: "select-university" | "select-state" | "not-applicable") => void;
  onUniversitySelect: (university: University | null) => void;
  onStateSelect: (state: { code: string; name: string } | null) => void;
  onNavigateToTitleIX: () => void;
  onNavigateToStateLaws: () => void;
}

export function UniversitySelectionStep({
  stepNumber,
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Step {stepNumber}: Select Your State or Institution</Text>
        <Text style={styles.subtitle}>Choose your state or university for compliance information</Text>
      </View>

      <View style={[styles.radioGroup, styles.radioGroupSpacing]}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => onSelectionModeChange("select-university")}
        >
          <View style={styles.radio}>
            {selectionMode === "select-university" && <View style={styles.radioSelected} />}
          </View>
          <Text style={[styles.radioLabel, styles.radioLabelSpacing]}>Select My University</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioOption, styles.radioOptionSpacing]}
          onPress={() => onSelectionModeChange("select-state")}
        >
          <View style={styles.radio}>
            {selectionMode === "select-state" && <View style={styles.radioSelected} />}
          </View>
          <Text style={[styles.radioLabel, styles.radioLabelSpacing]}>Select My State</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioOption, styles.radioOptionSpacing]}
          onPress={() => onSelectionModeChange("not-applicable")}
        >
          <View style={styles.radio}>
            {selectionMode === "not-applicable" && <View style={styles.radioSelected} />}
          </View>
          <Text style={[styles.radioLabel, styles.radioLabelSpacing]}>Not Applicable</Text>
        </TouchableOpacity>
      </View>

      {selectionMode === "select-university" && (
        <View style={styles.selectorContainer}>
          <UniversitySelector
            universities={universities}
            selectedUniversity={selectedUniversity}
            onSelect={onUniversitySelect}
          />
        </View>
      )}

      {selectionMode === "select-state" && (
        <View style={styles.selectorContainer}>
          <StateSelector
            selectedState={selectedState}
            onSelect={onStateSelect}
          />
        </View>
      )}

      {selectionMode === "select-university" && (
        <Card style={styles.toolCard}>
          <View style={styles.toolContent}>
            <View style={styles.toolIcon}>
              <Ionicons name="book" size={20} color={colors.brand.primary} />
            </View>
            <View style={[styles.toolText, styles.toolTextSpacing]}>
              <Text style={styles.toolTitle}>Need to research Title IX policies?</Text>
              <Text style={styles.toolDescription}>
                Access our comprehensive Title IX information tool
              </Text>
            </View>
          </View>
          <Button
            title="View Title IX Tool"
            onPress={onNavigateToTitleIX}
            variant="outline"
            style={styles.toolButton}
          />
        </Card>
      )}

      {selectionMode === "select-state" && (
        <Card style={styles.toolCard}>
          <View style={styles.toolContent}>
            <View style={styles.toolIcon}>
              <Ionicons name="scale" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Need to research state consent laws?</Text>
              <Text style={styles.toolDescription}>
                Access detailed consent law information for all 50 states
              </Text>
            </View>
          </View>
          <Button
            title="View State Laws Tool"
            onPress={onNavigateToStateLaws}
            variant="outline"
            style={styles.toolButton}
          />
        </Card>
      )}
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
  radioGroup: {
  },
  radioGroupSpacing: {
    marginTop: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOptionSpacing: {
    marginTop: 12,
  },
  radioLabelSpacing: {
    marginLeft: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: '#fff',
  },
  selectorContainer: {
    marginTop: 8,
  },
  toolCard: {
    marginTop: 16,
    backgroundColor: '#E3F2FD',
    borderColor: colors.brand.primary,
  },
  toolContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  toolTextSpacing: {
    marginLeft: 12,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.brand.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: '#999',
  },
  toolButton: {
    marginTop: 8,
  },
});


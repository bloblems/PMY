import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPreferences, getUserProfile, updateUserProfile, getAllUniversities } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { US_STATES } from '@/lib/constants';
import { encounterTypes } from '@/lib/consentFlowConstants';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function PreferencesScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserPreferences(user.id);
    },
    enabled: !!user,
  });

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: getAllUniversities,
  });

  const [formData, setFormData] = useState({
    default_university_id: '',
    state_of_residence: '',
    default_encounter_type: '',
    default_contract_duration: '',
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        default_university_id: preferences.default_university_id || '',
        state_of_residence: preferences.state_of_residence || '',
        default_encounter_type: preferences.default_encounter_type || '',
        default_contract_duration: preferences.default_contract_duration?.toString() || '',
      });
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateUserProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      Alert.alert('Success', 'Preferences updated successfully');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update preferences');
    },
  });

  const handleSave = () => {
    const updates: any = {};
    if (formData.default_university_id) updates.default_university_id = formData.default_university_id;
    if (formData.state_of_residence) updates.state_of_residence = formData.state_of_residence;
    if (formData.default_encounter_type) updates.default_encounter_type = formData.default_encounter_type;
    if (formData.default_contract_duration) {
      updates.default_contract_duration = parseInt(formData.default_contract_duration, 10);
    }
    updateMutation.mutate(updates);
  };

  const styles = createStyles(colors);

  if (authLoading || prefsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.dark }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={{ marginTop: spacing.lg, color: colors.text.inverse }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const selectedUniversity = (universities && Array.isArray(universities)) 
    ? universities.find((u: any) => u.id === formData.default_university_id)
    : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.headerButton}
        />
        <Text style={styles.title}>Preferences</Text>
        <Button
          title="Save"
          onPress={handleSave}
          style={styles.headerButton}
          disabled={updateMutation.isPending}
        />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Default Settings</Text>
        <Text style={styles.description}>
          These preferences will be used as defaults when creating new consent contracts.
        </Text>

        {/* Default University */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Default University</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {selectedUniversity ? selectedUniversity.name : 'None selected'}
            </Text>
            <Button
              title="Select"
              onPress={() => {
                // TODO: Open university picker modal
                Alert.alert('Info', 'University picker coming soon');
              }}
              variant="outline"
              style={styles.pickerButton}
            />
          </View>
        </View>

        {/* State of Residence */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>State of Residence</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {formData.state_of_residence || 'None selected'}
            </Text>
            <Button
              title="Select"
              onPress={() => {
                // TODO: Open state picker modal
                Alert.alert('Info', 'State picker coming soon');
              }}
              variant="outline"
              style={styles.pickerButton}
            />
          </View>
        </View>

        {/* Default Encounter Type */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Default Encounter Type</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {formData.default_encounter_type || 'None selected'}
            </Text>
            <Button
              title="Select"
              onPress={() => {
                // TODO: Open encounter type picker modal
                Alert.alert('Info', 'Encounter type picker coming soon');
              }}
              variant="outline"
              style={styles.pickerButton}
            />
          </View>
        </View>

        {/* Default Contract Duration */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Default Contract Duration (hours)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Duration</Text>
            <Text style={styles.inputValue}>
              {formData.default_contract_duration || 'Not set'}
            </Text>
            <Button
              title="Set"
              onPress={() => {
                // TODO: Open duration input modal
                Alert.alert('Info', 'Duration input coming soon');
              }}
              variant="outline"
              style={styles.inputButton}
            />
          </View>
        </View>
      </Card>

      {updateMutation.isPending && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" />
          <Text style={[styles.loadingText, styles.loadingTextSpacing]}>Saving...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerButton: {
    minWidth: 80,
  },
  title: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    color: colors.text.inverse,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  settingItem: {
    marginBottom: spacing.xl,
  },
  settingLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    color: colors.text.inverse,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  pickerText: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text.inverse,
  },
  pickerButton: {
    marginLeft: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  inputLabel: {
    fontSize: typography.size.md,
    color: colors.text.tertiary,
    marginRight: spacing.md,
  },
  inputValue: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text.inverse,
  },
  inputButton: {
    marginLeft: spacing.md,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  loadingTextSpacing: {
    marginLeft: spacing.sm,
  },
});


import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert, TouchableOpacity, Image, Modal, FlatList } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, uploadProfilePicture, getAllUniversities } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { US_STATES } from '@/lib/constants';
import { encounterTypes, intimateEncounterType } from '@/lib/consentFlowConstants';

export default function EditProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();

  const [isUploading, setIsUploading] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: getAllUniversities,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    website_url: '',
    profile_picture_url: '',
    // Contract preferences
    state_of_residence: '',
    default_university_id: '',
    default_encounter_type: '',
    default_contract_duration: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        website_url: profile.website_url || '',
        profile_picture_url: profile.profile_picture_url || '',
        state_of_residence: profile.state_of_residence || '',
        default_university_id: profile.default_university_id || '',
        default_encounter_type: profile.default_encounter_type || '',
        default_contract_duration: profile.default_contract_duration?.toString() || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateUserProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  const handleSave = () => {
    const updates: any = {
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      username: formData.username || null,
      bio: formData.bio || null,
      website_url: formData.website_url || null,
      profile_picture_url: formData.profile_picture_url || null,
      state_of_residence: formData.state_of_residence || null,
      default_university_id: formData.default_university_id || null,
      default_encounter_type: formData.default_encounter_type || null,
      default_contract_duration: formData.default_contract_duration
        ? parseInt(formData.default_contract_duration, 10)
        : null,
    };
    updateMutation.mutate(updates);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setIsUploading(true);
      try {
        const contentType = asset.mimeType || 'image/jpeg';
        const url = await uploadProfilePicture(user!.id, asset.uri, contentType);
        setFormData({ ...formData, profile_picture_url: url });
      } catch (error: any) {
        Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setIsUploading(true);
      try {
        const contentType = asset.mimeType || 'image/jpeg';
        const url = await uploadProfilePicture(user!.id, asset.uri, contentType);
        setFormData({ ...formData, profile_picture_url: url });
      } catch (error: any) {
        Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        ...(formData.profile_picture_url ? [{
          text: 'Remove Photo',
          style: 'destructive' as const,
          onPress: () => setFormData({ ...formData, profile_picture_url: '' })
        }] : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const styles = createStyles(colors, isDark);

  if (authLoading || isLoading) {
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

  const initials = (formData.first_name?.[0] || '') + (formData.last_name?.[0] || '') ||
                   formData.username?.[0]?.toUpperCase() || 'U';

  const selectedUniversity = universities?.find((u: any) => u.id === formData.default_university_id);
  const selectedState = US_STATES.find(s => s.code === formData.state_of_residence);
  const allEncounterTypes = [intimateEncounterType, ...encounterTypes];
  const selectedEncounter = allEncounterTypes.find(e => e.id === formData.default_encounter_type);

  const durationOptions = [
    { label: '30 minutes', value: '30' },
    { label: '1 hour', value: '60' },
    { label: '2 hours', value: '120' },
    { label: '4 hours', value: '240' },
    { label: '8 hours', value: '480' },
    { label: '12 hours', value: '720' },
    { label: '24 hours', value: '1440' },
  ];
  const selectedDuration = durationOptions.find(d => d.value === formData.default_contract_duration);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.headerButton}
        />
        <Text style={styles.title}>Edit Profile</Text>
        <Button
          title="Save"
          onPress={handleSave}
          style={styles.headerButton}
          disabled={updateMutation.isPending}
        />
      </View>

      {/* Profile Picture Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={showImageOptions} disabled={isUploading} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {isUploading ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="large" color={colors.brand.primary} />
                </View>
              ) : formData.profile_picture_url ? (
                <Image
                  source={{ uri: formData.profile_picture_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={[colors.brand.primary + '40', colors.brand.primary + '20']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change</Text>
      </View>

      {/* Personal Information */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Input
          label="First Name"
          value={formData.first_name}
          onChangeText={(text: string) => setFormData({ ...formData, first_name: text })}
          placeholder="Enter first name"
          style={styles.input}
        />
        <Input
          label="Last Name"
          value={formData.last_name}
          onChangeText={(text: string) => setFormData({ ...formData, last_name: text })}
          placeholder="Enter last name"
          style={styles.input}
        />
        <Input
          label="Username"
          value={formData.username}
          onChangeText={(text: string) => setFormData({ ...formData, username: text })}
          placeholder="Enter username"
          style={styles.input}
        />
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textArea}
            value={formData.bio}
            onChangeText={(text: string) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
          />
        </View>
        <Input
          label="Website"
          value={formData.website_url}
          onChangeText={(text: string) => setFormData({ ...formData, website_url: text })}
          placeholder="https://example.com"
          style={styles.input}
        />
      </Card>

      {/* Contract Preferences */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Contract Preferences</Text>
        <Text style={styles.sectionDescription}>
          Set your default values for new consent contracts
        </Text>

        {/* State of Residence */}
        <TouchableOpacity style={styles.settingRow} onPress={() => setShowStateModal(true)}>
          <View style={[styles.settingIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="location" size={20} color="#10B981" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>State of Residence</Text>
            <Text style={styles.settingValue}>
              {selectedState?.name || 'Not selected'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Default University */}
        <TouchableOpacity style={styles.settingRow} onPress={() => setShowUniversityModal(true)}>
          <View style={[styles.settingIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="school" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Default University</Text>
            <Text style={styles.settingValue} numberOfLines={1}>
              {selectedUniversity?.name || 'Not selected'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Default Encounter Type */}
        <TouchableOpacity style={styles.settingRow} onPress={() => setShowEncounterModal(true)}>
          <View style={[styles.settingIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Ionicons name="heart" size={20} color="#EC4899" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Default Encounter Type</Text>
            <Text style={styles.settingValue}>
              {selectedEncounter?.label || 'Not selected'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Default Duration */}
        <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => setShowDurationModal(true)}>
          <View style={[styles.settingIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="time" size={20} color="#3B82F6" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Default Duration</Text>
            <Text style={styles.settingValue}>
              {selectedDuration?.label || 'Not set'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </Card>

      {updateMutation.isPending && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Saving...</Text>
        </View>
      )}

      {/* State Selection Modal */}
      <Modal visible={showStateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ code: '', name: 'None' }, ...US_STATES]}
              keyExtractor={(item) => item.code || 'none'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, state_of_residence: item.code });
                    setShowStateModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.state_of_residence === item.code && styles.modalOptionSelected
                  ]}>
                    {item.name}
                  </Text>
                  {formData.state_of_residence === item.code && (
                    <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* University Selection Modal */}
      <Modal visible={showUniversityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select University</Text>
              <TouchableOpacity onPress={() => setShowUniversityModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: '', name: 'None' }, ...(universities || [])]}
              keyExtractor={(item: any) => item.id || 'none'}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, default_university_id: item.id });
                    setShowUniversityModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.default_university_id === item.id && styles.modalOptionSelected
                  ]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {formData.default_university_id === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Encounter Type Selection Modal */}
      <Modal visible={showEncounterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Encounter Type</Text>
              <TouchableOpacity onPress={() => setShowEncounterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: '', label: 'None' }, ...allEncounterTypes]}
              keyExtractor={(item) => item.id || 'none'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, default_encounter_type: item.id });
                    setShowEncounterModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.default_encounter_type === item.id && styles.modalOptionSelected
                  ]}>
                    {item.label}
                  </Text>
                  {formData.default_encounter_type === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Duration Selection Modal */}
      <Modal visible={showDurationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Default Duration</Text>
              <TouchableOpacity onPress={() => setShowDurationModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ label: 'Not set', value: '' }, ...durationOptions]}
              keyExtractor={(item) => item.value || 'none'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, default_contract_duration: item.value });
                    setShowDurationModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.default_contract_duration === item.value && styles.modalOptionSelected
                  ]}>
                    {item.label}
                  </Text>
                  {formData.default_contract_duration === item.value && (
                    <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>, isDark: boolean) => StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  avatarLoading: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.dark,
  },
  avatarHint: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    color: colors.text.inverse,
  },
  sectionDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
    color: colors.text.inverse,
  },
  input: {
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.inverse,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.dark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  },
  modalOptionText: {
    fontSize: typography.size.md,
    color: colors.text.inverse,
    flex: 1,
  },
  modalOptionSelected: {
    color: colors.brand.primary,
    fontWeight: typography.weight.semibold,
  },
});

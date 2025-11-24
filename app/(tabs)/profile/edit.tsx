import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function EditProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    website_url: '',
    state_of_residence: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        website_url: profile.website_url || '',
        state_of_residence: profile.state_of_residence || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateUserProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const styles = createStyles(colors);

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
            placeholderTextColor="#999"
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
        <Input
          label="State of Residence"
          value={formData.state_of_residence}
          onChangeText={(text: string) => setFormData({ ...formData, state_of_residence: text })}
          placeholder="e.g., CA"
          style={styles.input}
        />
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
    marginBottom: spacing.md,
    color: colors.text.inverse,
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
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  loadingTextSpacing: {
    marginLeft: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
});


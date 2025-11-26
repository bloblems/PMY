import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SignatureInput from '@/components/SignatureInput';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function SavedSignaturesScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [isEditing, setIsEditing] = useState(false);
  const [newSignature, setNewSignature] = useState<string | null>(null);
  const [newSignatureType, setNewSignatureType] = useState<string | null>(null);
  const [newSignatureText, setNewSignatureText] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newSignature) {
        throw new Error('No signature to save');
      }
      return updateUserProfile(user.id, {
        saved_signature: newSignature,
        saved_signature_type: newSignatureType,
        saved_signature_text: newSignatureText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      setIsEditing(false);
      setNewSignature(null);
      setNewSignatureType(null);
      setNewSignatureText(null);
      Alert.alert('Success', 'Your signature has been saved!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save signature');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      return updateUserProfile(user.id, {
        saved_signature: null,
        saved_signature_type: null,
        saved_signature_text: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      Alert.alert('Success', 'Your saved signature has been deleted.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete signature');
    },
  });

  const handleSignatureChange = (signature: string | null, type: string, text?: string) => {
    setNewSignature(signature);
    setNewSignatureType(type);
    setNewSignatureText(text || null);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Saved Signature',
      'Are you sure you want to delete your saved signature? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const hasSavedSignature = !!profile?.saved_signature;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Signature</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoContent}>
          <Ionicons name="information-circle" size={24} color={colors.brand.secondary} />
          <Text style={styles.infoText}>
            Save your signature once and use it to quickly sign future contracts. Your signature is stored securely and only you can access it.
          </Text>
        </View>
      </Card>

      {/* Current Saved Signature */}
      {hasSavedSignature && !isEditing && (
        <Card style={styles.signatureCard}>
          <View style={styles.signatureHeader}>
            <Text style={styles.sectionTitle}>Your Saved Signature</Text>
            <View style={styles.signatureTypeBadge}>
              <Text style={styles.signatureTypeText}>
                {profile?.saved_signature_type || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.signaturePreview}>
            {profile?.saved_signature?.startsWith('data:image/svg') ? (
              <View style={styles.svgPreviewContainer}>
                {profile?.saved_signature_type === 'type' && profile?.saved_signature_text ? (
                  <Text style={styles.typedSignaturePreview}>{profile.saved_signature_text}</Text>
                ) : (
                  <View style={styles.signaturePlaceholder}>
                    <Ionicons name="checkmark-circle" size={48} color={colors.brand.primary} />
                    <Text style={styles.signatureSavedText}>Signature Saved</Text>
                  </View>
                )}
              </View>
            ) : profile?.saved_signature ? (
              <Image
                source={{ uri: profile.saved_signature }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          <View style={styles.signatureActions}>
            <Button
              title="Update Signature"
              onPress={() => setIsEditing(true)}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              onPress={handleDelete}
              variant="outline"
              style={[styles.actionButton, styles.deleteButton]}
              disabled={deleteMutation.isPending}
            />
          </View>
        </Card>
      )}

      {/* No Saved Signature */}
      {!hasSavedSignature && !isEditing && (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Saved Signature</Text>
            <Text style={styles.emptyDescription}>
              Create a signature to speed up the contract signing process. You can draw, type, or upload your signature.
            </Text>
            <Button
              title="Create Signature"
              onPress={() => setIsEditing(true)}
              style={styles.createButton}
            />
          </View>
        </Card>
      )}

      {/* Signature Editor */}
      {isEditing && (
        <View style={styles.editorSection}>
          <Text style={styles.sectionTitle}>
            {hasSavedSignature ? 'Update Signature' : 'Create New Signature'}
          </Text>

          <SignatureInput
            onSignatureChange={handleSignatureChange}
            savedSignature={profile?.saved_signature}
            savedSignatureType={profile?.saved_signature_type}
            savedSignatureText={profile?.saved_signature_text}
            showSaveOption={false}
          />

          <View style={styles.editorActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setIsEditing(false);
                setNewSignature(null);
                setNewSignatureType(null);
                setNewSignatureText(null);
              }}
              variant="outline"
              style={styles.editorButton}
            />
            <Button
              title={saveMutation.isPending ? 'Saving...' : 'Save Signature'}
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !newSignature}
              style={styles.editorButton}
            />
          </View>
        </View>
      )}

      {/* Usage Tips */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Tips for a Good Signature</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
            <Text style={styles.tipText}>Use your legal name for formal contracts</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
            <Text style={styles.tipText}>Draw signatures are more personal and unique</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
            <Text style={styles.tipText}>Typed signatures are quick and consistent</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
            <Text style={styles.tipText}>Upload a scan of your actual signature for authenticity</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: `${colors.brand.secondary}15`,
    borderColor: `${colors.brand.secondary}30`,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  signatureCard: {
    marginBottom: spacing.lg,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  signatureTypeBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  signatureTypeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.brand.primary,
    textTransform: 'capitalize',
  },
  signaturePreview: {
    backgroundColor: colors.background.dark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  svgPreviewContainer: {
    alignItems: 'center',
  },
  typedSignaturePreview: {
    fontSize: 36,
    fontStyle: 'italic',
    color: colors.text.inverse,
    fontFamily: 'serif',
  },
  signaturePlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  signatureSavedText: {
    fontSize: typography.size.md,
    color: colors.brand.primary,
    fontWeight: typography.weight.medium,
  },
  signatureImage: {
    width: '100%',
    height: 120,
  },
  signatureActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: colors.status.error,
  },
  emptyCard: {
    marginBottom: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  createButton: {
    paddingHorizontal: spacing.xl,
  },
  editorSection: {
    marginBottom: spacing.lg,
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editorButton: {
    flex: 1,
  },
  tipsCard: {
    marginTop: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.md,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    flex: 1,
  },
});

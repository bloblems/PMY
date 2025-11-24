import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ViewStyle } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContract, deleteContract, pauseContract, resumeContract } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ContractDetailScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id, user?.id],
    queryFn: () => {
      if (!user || !id) return null;
      return getContract(id, user.id);
    },
    enabled: !!user && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteContract(id!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
      router.back();
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseContract(id!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeContract(id!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Contract',
      'Are you sure you want to delete this contract? This action cannot be undone.',
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

  if (!contract) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Contract not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
      </View>
    );
  }

  // Handle both snake_case (Supabase) and camelCase (types) field names
  const contractAny = contract as any;
  const createdAt = contractAny.created_at || contractAny.createdAt;
  const updatedAt = contractAny.updated_at || contractAny.updatedAt;
  const universityName = contractAny.university_name || contractAny.universityName;
  const stateName = contractAny.state_name || contractAny.stateName;
  const encounterType = contractAny.encounter_type || contractAny.encounterType;
  const status = contractAny.status || 'draft';
  const parties = contractAny.parties || [];
  const intimateActsRaw = contractAny.intimate_acts || contractAny.intimateActs;
  const intimateActs = intimateActsRaw ? (typeof intimateActsRaw === 'string' ? JSON.parse(intimateActsRaw) : intimateActsRaw) : {};
  const contractStartTime = contractAny.contract_start_time || contractAny.contractStartTime;
  const contractEndTime = contractAny.contract_end_time || contractAny.contractEndTime;
  const contractDuration = contractAny.contract_duration || contractAny.contractDuration;
  const method = contractAny.method;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'draft': return '#FF9500';
      case 'paused': return '#FF3B30';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Contract Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Badge */}
      <Card style={styles.statusCard}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
          {createdAt && (
            <Text style={styles.dateText}>
              Created {format(new Date(createdAt), 'MMM d, yyyy')}
            </Text>
          )}
        </View>
      </Card>

      {/* Basic Information */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        {universityName && (
          <View style={styles.infoRow}>
            <Ionicons name="school" size={20} color={colors.text.tertiary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>University</Text>
              <Text style={styles.infoValue}>{universityName}</Text>
            </View>
          </View>
        )}
        {stateName && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={colors.text.tertiary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>State</Text>
              <Text style={styles.infoValue}>{stateName}</Text>
            </View>
          </View>
        )}
        {encounterType && (
          <View style={styles.infoRow}>
            <Ionicons name="heart" size={20} color={colors.text.tertiary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Encounter Type</Text>
              <Text style={styles.infoValue}>{encounterType}</Text>
            </View>
          </View>
        )}
        {method && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={20} color={colors.text.tertiary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Recording Method</Text>
              <Text style={styles.infoValue}>{method}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Parties */}
      {parties.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Parties</Text>
          {parties.map((party: string, index: number) => (
            <View key={index} style={styles.partyItem}>
              <Ionicons name="person" size={20} color={colors.text.tertiary} />
              <Text style={[styles.partyText, styles.partyTextSpacing]}>{party}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Intimate Acts */}
      {Object.keys(intimateActs).length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Intimate Acts</Text>
          {Object.entries(intimateActs).map(([act, consent]: [string, any]) => (
            <View key={act} style={styles.actItem}>
              <Text style={styles.actName}>{act}</Text>
              <View style={styles.consentBadge}>
                <Text style={styles.consentText}>{consent === 'yes' ? '✓ Yes' : '✗ No'}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Duration */}
      {(contractStartTime || contractDuration || contractEndTime) && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Duration</Text>
          {contractStartTime && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.text.tertiary} />
              <View style={[styles.infoContent, styles.infoContentSpacing]}>
                <Text style={styles.infoLabel}>Start Time</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(contractStartTime), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            </View>
          )}
          {contractDuration && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={colors.text.tertiary} />
              <View style={[styles.infoContent, styles.infoContentSpacing]}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{contractDuration} hours</Text>
              </View>
            </View>
          )}
          {contractEndTime && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.text.tertiary} />
              <View style={[styles.infoContent, styles.infoContentSpacing]}>
                <Text style={styles.infoLabel}>End Time</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(contractEndTime), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Contract Text */}
      {(contractAny.contract_text || contractAny.contractText) && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contract Text</Text>
          <Text style={styles.contractText}>{contractAny.contract_text || contractAny.contractText}</Text>
        </Card>
      )}

      {/* Recordings */}
      {(contractAny.signature1 || contractAny.signature2 || contractAny.photo_url || contractAny.photoUrl || contractAny.credential_id || contractAny.credentialId) && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Recordings</Text>
          {contractAny.signature1 && (
            <View style={styles.recordingItem}>
              <Ionicons name="create" size={20} color={colors.text.tertiary} />
              <Text style={[styles.recordingText, styles.recordingTextSpacing]}>Signature 1: Recorded</Text>
            </View>
          )}
          {contractAny.signature2 && (
            <View style={styles.recordingItem}>
              <Ionicons name="create" size={20} color={colors.text.tertiary} />
              <Text style={[styles.recordingText, styles.recordingTextSpacing]}>Signature 2: Recorded</Text>
            </View>
          )}
          {(contractAny.photo_url || contractAny.photoUrl) && (
            <View style={styles.recordingItem}>
              <Ionicons name="camera" size={20} color={colors.text.tertiary} />
              <Text style={[styles.recordingText, styles.recordingTextSpacing]}>Photo: Recorded</Text>
            </View>
          )}
          {(contractAny.credential_id || contractAny.credentialId) && (
            <View style={styles.recordingItem}>
              <Ionicons name="finger-print" size={20} color={colors.text.tertiary} />
              <Text style={[styles.recordingText, styles.recordingTextSpacing]}>Biometric: Recorded</Text>
            </View>
          )}
        </Card>
      )}

      {/* Actions */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actions}>
          {status === 'active' && (
            <Button
              title="Pause Contract"
              onPress={() => pauseMutation.mutate()}
              variant="outline"
              style={styles.actionButton}
            />
          )}
          {status === 'paused' && (
            <Button
              title="Resume Contract"
              onPress={() => resumeMutation.mutate()}
              variant="outline"
              style={styles.actionButton}
            />
          )}
          <Button
            title="Delete Contract"
            onPress={handleDelete}
            style={[styles.actionButton, (status === 'active' || status === 'paused') && styles.actionButtonSpacing] as ViewStyle}
            variant="destructive"
          />
        </View>
      </Card>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  errorText: {
    fontSize: typography.size.lg,
    color: colors.status.error,
    marginBottom: spacing.md,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.size.xs,
    color: colors.text.inverse,
    fontWeight: typography.weight.semibold,
  },
  dateText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoContentSpacing: {
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.size.md,
    color: colors.text.inverse,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  partyText: {
    fontSize: typography.size.md,
    color: colors.text.inverse,
  },
  partyTextSpacing: {
    marginLeft: spacing.md,
  },
  actItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  actName: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  consentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#2C2C2E',
  },
  consentText: {
    fontSize: 14,
    color: '#fff',
  },
  contractText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.tertiary,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingText: {
    fontSize: 16,
    color: '#fff',
  },
  recordingTextSpacing: {
    marginLeft: 12,
  },
  actions: {
  },
  actionButtonSpacing: {
    marginTop: 12,
  },
  actionButton: {
    width: '100%',
  },
});


import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContracts, getDrafts, deleteContract, pauseContract, resumeContract, getRecordings, getPendingCollaborations, approveCollaboration, rejectCollaboration, getContractAmendments } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography, borderRadius, shadows } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';
import Button from '@/components/Button';

type TabType = 'active' | 'amendments' | 'drafts' | 'inbox';

// Apple-style: Single accent color per encounter type
const encounterColors: Record<string, string> = {
  intimate: '#FF375F',
  date: '#AF52DE',
  conversation: '#30D158',
  medical: '#0A84FF',
  professional: '#FF9F0A',
  default: '#8E8E93',
};

const getEncounterColor = (encounterType: string | undefined): string => {
  const type = encounterType?.toLowerCase() || '';
  if (type.includes('intimate')) return encounterColors.intimate;
  if (type.includes('date')) return encounterColors.date;
  if (type.includes('conversation')) return encounterColors.conversation;
  if (type.includes('medical')) return encounterColors.medical;
  if (type.includes('professional')) return encounterColors.professional;
  return encounterColors.default;
};

const getEncounterIcon = (encounterType: string | undefined): string => {
  const type = encounterType?.toLowerCase() || '';
  if (type.includes('intimate')) return 'heart';
  if (type.includes('date')) return 'cafe';
  if (type.includes('conversation')) return 'chatbubbles';
  if (type.includes('medical')) return 'medical';
  if (type.includes('professional')) return 'briefcase';
  return 'document-text';
};

export default function ContractsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getContracts(user.id);
    },
    enabled: !!user,
  });

  const { data: drafts } = useQuery({
    queryKey: ['drafts', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getDrafts(user.id);
    },
    enabled: !!user,
  });

  const { data: recordings } = useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getRecordings(user.id);
    },
    enabled: !!user,
  });

  const { data: pendingCollaborations = [], isLoading: loadingCollabs } = useQuery({
    queryKey: ['pending-collaborations', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getPendingCollaborations(user.id);
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: ({ collaboratorId }: { collaboratorId: string }) =>
      approveCollaboration(collaboratorId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-collaborations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
      Alert.alert('Success', 'Contract approved successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve contract');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ collaboratorId, reason }: { collaboratorId: string; reason?: string }) =>
      rejectCollaboration(collaboratorId, user!.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-collaborations', user?.id] });
      Alert.alert('Contract Rejected', 'The contract has been rejected.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to reject contract');
    },
  });

  const handleApprove = (collaboratorId: string) => {
    Alert.alert(
      'Approve Contract',
      'Are you sure you want to approve this consent contract?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approveMutation.mutate({ collaboratorId }),
        },
      ]
    );
  };

  const handleReject = (collaboratorId: string) => {
    Alert.alert(
      'Reject Contract',
      'Are you sure you want to reject this consent contract?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectMutation.mutate({ collaboratorId }),
        },
      ]
    );
  };

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteContract(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['drafts', user?.id] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => pauseContract(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => resumeContract(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', user?.id] });
    },
  });

  const handleDelete = (contractId: string) => {
    Alert.alert(
      'Delete Contract',
      'Are you sure you want to delete this contract? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id: contractId }),
        },
      ]
    );
  };

  const handlePause = (contractId: string) => {
    pauseMutation.mutate({ id: contractId });
  };

  const handleResume = (contractId: string) => {
    resumeMutation.mutate({ id: contractId });
  };

  const handleDeleteDraft = (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id: draftId }),
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (authLoading) {
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

  const allContracts = contracts || [];
  const activeContracts = allContracts.filter((c: any) => c.status === 'active');
  const pausedContracts = allContracts.filter((c: any) => c.status === 'paused');
  const completedContracts = allContracts.filter((c: any) => c.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.brand.primary;
      case 'paused':
        return colors.status.warning;
      case 'completed':
        return colors.text.secondary;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'paused':
        return 'pause-circle';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'document-text';
    }
  };

  const renderContractCard = (contract: any) => {
    const createdAt = contract.created_at || contract.createdAt;
    const encounterType = contract.encounter_type || contract.encounterType;
    const parties = contract.parties || [];
    const status = contract.status || 'draft';
    const method = contract.method;
    const accentColor = getEncounterColor(encounterType);
    const icon = getEncounterIcon(encounterType);

    const getMethodBadge = () => {
      if (!method) return null;
      const badges: Record<string, string> = {
        signature: 'Signature',
        photo: 'Photo',
        voice: 'Audio',
        biometric: 'Biometric',
      };
      return badges[method] || method;
    };

    return (
      <TouchableOpacity
        key={contract.id}
        style={styles.contractCard}
        onPress={() => router.push(`/(tabs)/contracts/${contract.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Icon with colored background - Apple style */}
          <View style={[styles.cardIconContainer, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name={icon as any} size={20} color={accentColor} />
          </View>
          
          <View style={styles.cardMainContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.contractTitle} numberOfLines={1}>
                  {encounterType || 'Consent Contract'}
                </Text>
                <Text style={styles.contractDate}>
                  {format(new Date(createdAt), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '18' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              {parties.length > 0 && (
                <Text style={styles.metaText}>{parties.length} {parties.length === 1 ? 'party' : 'parties'}</Text>
              )}
              {getMethodBadge() && (
                <Text style={styles.metaText}>• {getMethodBadge()}</Text>
              )}
            </View>
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={colors.text.tertiary} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (icon: string, message: string, subtitle?: string) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name={icon as any} size={48} color={colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>{message}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );

  const tabs = [
    { id: 'active' as TabType, label: 'Active', icon: 'checkmark-circle', count: activeContracts.length },
    { id: 'amendments' as TabType, label: 'Amendments', icon: 'create', count: 0 },
    { id: 'drafts' as TabType, label: 'Drafts', icon: 'document', count: drafts?.length || 0 },
    { id: 'inbox' as TabType, label: 'Inbox', icon: 'mail', count: pendingCollaborations.length },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contracts</Text>
        <Text style={styles.subtitle}>Manage your consent documents</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' && (
          <View>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brand.primary} />
              </View>
            ) : (
              <>
                {activeContracts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Active</Text>
                    {activeContracts.map(renderContractCard)}
                  </View>
                )}
                
                {pausedContracts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paused</Text>
                    {pausedContracts.map(renderContractCard)}
                  </View>
                )}
                
                {completedContracts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Completed</Text>
                    {completedContracts.map(renderContractCard)}
                  </View>
                )}
                
                {activeContracts.length === 0 && pausedContracts.length === 0 && completedContracts.length === 0 && (
                  renderEmptyState(
                    'document-text-outline',
                    'No contracts yet',
                    'Create your first consent contract to get started'
                  )
                )}

                {/* Audio Recordings Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Audio Recordings</Text>
                  {!recordings || recordings.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="mic-outline" size={32} color={colors.text.tertiary} />
                      <Text style={styles.emptyCardText}>No recordings yet</Text>
                    </View>
                  ) : (
                    recordings.map((recording: any) => (
                      <TouchableOpacity
                        key={recording.id}
                        style={styles.recordingCard}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.recordingIcon, { backgroundColor: colors.status.error + '15' }]}>
                          <Ionicons name="mic" size={20} color={colors.status.error} />
                        </View>
                        <View style={styles.recordingInfo}>
                          <Text style={styles.recordingTitle} numberOfLines={1}>
                            {recording.filename || 'Audio Recording'}
                          </Text>
                          <Text style={styles.recordingMeta}>
                            {recording.duration || '0:00'} • {format(new Date(recording.created_at || recording.createdAt), 'MMM d, yyyy')}
                          </Text>
                        </View>
                        <Ionicons name="play-circle" size={28} color={colors.brand.primary} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* Template Contract Types Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quick Start Templates</Text>
                  <Text style={styles.sectionSubtitle}>Choose a template to create a new contract</Text>

                  <TouchableOpacity
                    style={styles.templateCard}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(tabs)/create?encounter=Intimate%20Encounter')}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: '#EC489915' }]}>
                      <Ionicons name="heart" size={22} color="#EC4899" />
                    </View>
                    <View style={styles.templateContent}>
                      <Text style={styles.templateTitle}>Intimate Encounter</Text>
                      <Text style={styles.templateDescription}>
                        Comprehensive consent documentation for intimate activities
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.templateCard}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(tabs)/create?encounter=Date')}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: '#8B5CF615' }]}>
                      <Ionicons name="cafe" size={22} color="#8B5CF6" />
                    </View>
                    <View style={styles.templateContent}>
                      <Text style={styles.templateTitle}>Date</Text>
                      <Text style={styles.templateDescription}>
                        Clear consent agreement for romantic encounters and social dates
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.templateCard}
                    activeOpacity={0.7}
                    onPress={() => router.push('/(tabs)/create?encounter=Medical%20Consultation')}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: '#3B82F615' }]}>
                      <Ionicons name="medkit" size={22} color="#3B82F6" />
                    </View>
                    <View style={styles.templateContent}>
                      <Text style={styles.templateTitle}>Medical Consultation</Text>
                      <Text style={styles.templateDescription}>
                        Professional consent for medical examinations and consultations
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'amendments' && (
          renderEmptyState(
            'create-outline', 
            'No pending amendments',
            'Amendments to your contracts will appear here'
          )
        )}

        {activeTab === 'drafts' && (
          <>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brand.primary} />
              </View>
            ) : !drafts || drafts.length === 0 ? (
              renderEmptyState(
                'document-outline',
                'No drafts',
                'Start creating a contract to save drafts'
              )
            ) : (
              <View style={styles.section}>
                {drafts.map((draft: any) => {
                  const accentColor = getEncounterColor(draft.encounter_type);
                  const icon = getEncounterIcon(draft.encounter_type);
                  return (
                    <View key={draft.id} style={styles.contractCard}>
                      <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => router.push(`/(tabs)/create?resumeDraftId=${draft.id}` as `/${string}`)}
                        activeOpacity={0.7}
                      >
                        {/* Icon with colored background */}
                        <View style={[styles.cardIconContainer, { backgroundColor: accentColor + '18' }]}>
                          <Ionicons name={icon as any} size={20} color={accentColor} />
                        </View>
                        
                        <View style={styles.cardMainContent}>
                          <View style={styles.cardInfo}>
                            <Text style={styles.contractTitle} numberOfLines={1}>
                              {draft.encounter_type || 'Draft Contract'}
                            </Text>
                            <Text style={styles.contractDate}>
                              Created {format(new Date(draft.created_at || draft.createdAt), 'MMM d, yyyy')}
                            </Text>
                          </View>
                        </View>
                        
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.text.tertiary}
                        />
                      </TouchableOpacity>
                      <View style={styles.draftActions}>
                        <TouchableOpacity
                          style={styles.draftDeleteButton}
                          onPress={() => handleDeleteDraft(draft.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                          <Text style={styles.draftDeleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {activeTab === 'inbox' && (
          <>
            {loadingCollabs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brand.primary} />
              </View>
            ) : pendingCollaborations.length === 0 ? (
              renderEmptyState(
                'mail-outline',
                'No invitations',
                'Invitations to collaborate will appear here'
              )
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Review</Text>
                {pendingCollaborations.map((collab: any) => {
                  const contractData = collab.consent_contracts;
                  const encounterType = contractData?.encounter_type || contractData?.encounterType || 'Consent Contract';
                  const createdAt = collab.created_at || collab.createdAt;
                  const accentColor = getEncounterColor(encounterType);
                  const icon = getEncounterIcon(encounterType);

                  return (
                    <View key={collab.id} style={styles.inboxCard}>
                      <View style={styles.inboxCardContent}>
                        <View style={styles.inboxCardHeader}>
                          {/* Icon with colored background */}
                          <View style={[styles.inboxIconContainer, { backgroundColor: accentColor + '18' }]}>
                            <Ionicons name={icon as any} size={22} color={accentColor} />
                          </View>
                          <View style={styles.inboxCardInfo}>
                            <Text style={styles.inboxCardTitle} numberOfLines={1}>
                              {encounterType}
                            </Text>
                            <Text style={styles.inboxCardDate}>
                              Invited {format(new Date(createdAt), 'MMM d, yyyy')}
                            </Text>
                          </View>
                          <View style={styles.inboxBadge}>
                            <Text style={styles.inboxBadgeText}>Review</Text>
                          </View>
                        </View>
                        <Text style={styles.inboxCardDescription}>
                          You've been invited to review and approve this consent contract.
                        </Text>
                        <View style={styles.inboxActions}>
                          <TouchableOpacity
                            style={styles.viewContractButton}
                            onPress={() => router.push(`/(tabs)/contracts/${contractData?.id}`)}
                          >
                            <Text style={styles.viewContractText}>View Details</Text>
                          </TouchableOpacity>
                          <View style={styles.inboxButtonGroup}>
                            <Button
                              title="Reject"
                              onPress={() => handleReject(collab.id)}
                              variant="outline"
                              size="small"
                              style={styles.rejectButton}
                            />
                            <Button
                              title="Approve"
                              onPress={() => handleApprove(collab.id)}
                              size="small"
                              style={styles.approveButton}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
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
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.borderDark,
    backgroundColor: colors.background.dark,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brand.primary,
  },
  tabText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  tabTextActive: {
    color: colors.brand.primary,
    fontWeight: typography.weight.semibold,
  },
  tabBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.ui.borderDark,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabBadgeActive: {
    backgroundColor: colors.brand.primary,
  },
  tabBadgeText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.semibold,
  },
  tabBadgeTextActive: {
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xl,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.md,
  },
  contractCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMainContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.inverse,
    marginBottom: 2,
  },
  contractDate: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  chevron: {
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inboxCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  inboxCardContent: {
    padding: spacing.md,
  },
  inboxIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  inboxCardInfo: {
    flex: 1,
  },
  inboxCardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  inboxCardDate: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  inboxBadge: {
    backgroundColor: '#FF950020',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  inboxBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: '#FF9500',
  },
  inboxCardDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  inboxActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewContractButton: {
    paddingVertical: spacing.sm,
  },
  viewContractText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.brand.primary,
  },
  inboxButtonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    minWidth: 80,
  },
  approveButton: {
    minWidth: 80,
    backgroundColor: colors.status.success,
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.ui.borderDark,
    marginTop: -spacing.xs,
  },
  draftDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  draftDeleteText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.status.error,
  },
  // Audio Recordings styles
  emptyCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyCardText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  recordingIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  recordingTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  recordingMeta: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  // Template styles
  sectionSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  templateTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  templateDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

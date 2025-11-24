import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContracts, getDrafts, deleteContract, pauseContract, resumeContract, getRecordings } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { spacing, layout, typography, borderRadius, shadows } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';

type TabType = 'active' | 'amendments' | 'drafts' | 'inbox';

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

    const getEncounterIcon = () => {
      const type = encounterType?.toLowerCase() || '';
      if (type.includes('intimate')) return 'heart';
      if (type.includes('date')) return 'cafe';
      if (type.includes('medical')) return 'medical';
      if (type.includes('professional')) return 'briefcase';
      return 'document-text';
    };

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
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.contractTitle} numberOfLines={1}>
                {encounterType || 'Consent Contract'}
              </Text>
              <Text style={styles.contractDate}>
                {format(new Date(createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
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
              <Text style={styles.metaText}>{getMethodBadge()}</Text>
            )}
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={colors.text.tertiary} 
              style={styles.chevron}
            />
          </View>
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
    { id: 'inbox' as TabType, label: 'Inbox', icon: 'mail', count: 0 },
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
                {drafts.map((draft: any) => (
                  <TouchableOpacity
                    key={draft.id}
                    style={styles.contractCard}
                    onPress={() => router.push(`/(tabs)/create?resumeDraftId=${draft.id}` as `/${string}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.contractTitle} numberOfLines={1}>
                            {draft.encounter_type || 'Draft Contract'}
                          </Text>
                          <Text style={styles.contractDate}>
                            Created {format(new Date(draft.created_at || draft.createdAt), 'MMM d, yyyy')}
                          </Text>
                        </View>
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={colors.text.tertiary} 
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'inbox' && (
          renderEmptyState(
            'mail-outline', 
            'No invitations',
            'Invitations to collaborate will appear here'
          )
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
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  contractDate: {
    fontSize: typography.size.sm,
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
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
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
});

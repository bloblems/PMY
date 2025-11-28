import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert, RefreshControl, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, getContracts, getRecordings, getUnreadNotificationCount } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export default function ProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  // Refetch profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        refetchProfile();
      }
    }, [user, refetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    await refetchProfile();
    setRefreshing(false);
  }, [queryClient, user?.id, refetchProfile]);

  const { data: contracts } = useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getContracts(user.id);
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

  const { data: unreadNotificationCount = 0 } = useQuery({
    queryKey: ['unread-notification-count', user?.id],
    queryFn: () => {
      if (!user) return 0;
      return getUnreadNotificationCount(user.id);
    },
    enabled: !!user,
    staleTime: 30000,
  });

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

  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.username || user.email?.split('@')[0] || 'User';

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const totalContracts = contracts?.length || 0;
  const activeContracts = contracts?.filter((c: any) => c.status === 'active').length || 0;

  const formatDataRetention = (policy: string | null | undefined) => {
    if (!policy) return 'Forever';
    return policy.replace('days', ' days').replace('year', ' year');
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
      }
    >
      {/* Profile Header */}
        <View style={styles.profileHeader}>
        {/* Avatar */}
          <View style={styles.avatar}>
            {profile?.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalContracts}</Text>
            <Text style={styles.statLabel}>contracts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueActive]}>{activeContracts}</Text>
            <Text style={styles.statLabel}>active</Text>
              </View>
        </View>
      </View>

      {/* Username & Name */}
      <View style={styles.nameSection}>
        <View style={styles.usernameRow}>
          <Text style={styles.username}>@{profile?.username || 'username'}</Text>
          {profile?.is_verified === 'true' ? (
            <TouchableOpacity
              style={styles.verifiedBadge}
              onPress={() => router.push('/(tabs)/profile/verification')}
            >
              <Ionicons name="checkmark" size={12} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unverifiedBadge}
              onPress={() => router.push('/(tabs)/profile/verification')}
            >
              <Ionicons name="checkmark" size={12} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        {userName && (
          <Text style={styles.name}>{userName}</Text>
        )}
      </View>

      {/* Bio */}
        {profile?.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

      {/* Website Link */}
      {profile?.website_url && (
        <TouchableOpacity
          style={styles.websiteLink}
          onPress={() => {
            const url = profile.website_url!.startsWith('http')
              ? profile.website_url!
              : `https://${profile.website_url}`;
            Linking.openURL(url);
          }}
        >
          <Ionicons name="link-outline" size={14} color={colors.brand.primary} />
          <Text style={styles.websiteText}>
            {profile.website_url.replace(/^https?:\/\//, '')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Edit Profile"
          onPress={() => router.push('/(tabs)/profile/edit')}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Share Profile"
          onPress={() => router.push('/(tabs)/profile/share')}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      <View style={styles.separator} />

      {/* Profile Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFILE DETAILS</Text>

        {/* Account Information Card */}
        <Card style={styles.gradientCard}>
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientTopBar}
          />
          <View style={styles.gradientCardContent}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Member since</Text>
                <Text style={styles.detailValue}>{formatDate(profile?.created_at)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="shield-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Data retention</Text>
                <Text style={styles.detailValue}>{formatDataRetention(profile?.data_retention_policy)}</Text>
              </View>
            </View>

          </View>
        </Card>

        {/* Default Preferences */}
        {(profile?.stateOfResidence || profile?.defaultEncounterType || profile?.defaultContractDuration) && (
          <>
            <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>DEFAULT PREFERENCES</Text>

            {profile?.stateOfResidence && (
              <Card style={styles.gradientCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientTopBar}
                />
                <View style={styles.gradientCardContent}>
                  <View style={styles.detailRow}>
                    <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Ionicons name="location-outline" size={20} color="#10B981" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>State</Text>
                      <Text style={styles.detailValue}>{profile.stateOfResidence}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            )}

            {profile?.defaultEncounterType && (
              <Card style={styles.gradientCard}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientTopBar}
                />
                <View style={styles.gradientCardContent}>
                  <View style={styles.detailRow}>
                    <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                      <Ionicons name="people-outline" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Encounter type</Text>
                      <Text style={styles.detailValue}>{profile.defaultEncounterType}</Text>
                    </View>
                  </View>
              </View>
              </Card>
            )}

            {profile?.defaultContractDuration && (
              <Card style={styles.gradientCard}>
                <LinearGradient
                  colors={['#6366F1', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientTopBar}
                />
                <View style={styles.gradientCardContent}>
                  <View style={styles.detailRow}>
                    <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                      <Ionicons name="time-outline" size={20} color="#6366F1" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Default duration</Text>
                      <Text style={styles.detailValue}>{profile.defaultContractDuration} minutes</Text>
                    </View>
                  </View>
              </View>
              </Card>
            )}
          </>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>QUICK ACTIONS</Text>

        {/* Verification Card - Show prominently if not verified */}
        {profile?.is_verified !== 'true' && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/verification')}
            style={styles.actionCard}
          >
            <Card style={styles.gradientCard}>
              <LinearGradient
                colors={['#1DA1F2', '#0A84FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientTopBar}
              />
              <View style={styles.gradientCardContent}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(29, 161, 242, 0.2)' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#1DA1F2" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.actionCardTitle}>Get Verified</Text>
                    <Text style={styles.actionCardSubtitle}>Verify your identity for $4.99</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/notifications')}
          style={styles.actionCard}
        >
          <Card style={styles.gradientCard}>
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTopBar}
            />
            <View style={styles.gradientCardContent}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                </View>
                <View style={styles.detailTextContainer}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={styles.actionCardTitle}>Notifications</Text>
                    {unreadNotificationCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionCardSubtitle}>View alerts and updates</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </View>
          </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/contacts')}
          style={styles.actionCard}
        >
          <Card style={styles.gradientCard}>
            <LinearGradient
              colors={['#06B6D4', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTopBar}
            />
            <View style={styles.gradientCardContent}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                  <Ionicons name="people-outline" size={20} color="#06B6D4" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.actionCardTitle}>My Contacts</Text>
                  <Text style={styles.actionCardSubtitle}>Save frequently used contacts</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </View>
          </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/signatures')}
          style={styles.actionCard}
        >
          <Card style={styles.gradientCard}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTopBar}
            />
            <View style={styles.gradientCardContent}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Ionicons name="pencil-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.actionCardTitle}>Saved Signature</Text>
                  <Text style={styles.actionCardSubtitle}>Manage your signature for contracts</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </View>
          </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/contracts')}
          style={styles.actionCard}
        >
          <Card style={styles.gradientCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTopBar}
            />
            <View style={styles.gradientCardContent}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="shield-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.actionCardTitle}>Manage Contracts</Text>
                  <Text style={styles.actionCardSubtitle}>Browse contracts & recordings</Text>
                </View>
              </View>
          </View>
          </Card>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xl, // Account for bottom nav + extra spacing
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.background.card,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
    marginBottom: 4,
  },
  statValueActive: {
    color: colors.status.success,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'lowercase',
  },
  nameSection: {
    marginBottom: spacing.sm,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
    marginRight: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  unverifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.text.tertiary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  name: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  bio: {
    fontSize: 14,
    color: colors.text.inverse,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  websiteText: {
    fontSize: 14,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.background.card,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  sectionTitleSpacing: {
    marginTop: spacing.lg,
  },
  gradientCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  gradientTopBar: {
    height: 4,
    width: '100%',
  },
  gradientCardContent: {
    padding: spacing.md,
    backgroundColor: colors.background.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  actionCard: {
    marginBottom: spacing.md,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  retentionCard: {
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  retentionCardContent: {
    padding: spacing.md,
    backgroundColor: colors.background.card,
  },
  retentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retentionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  retentionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  retentionTextContainer: {
    marginTop: spacing.sm,
  },
  retentionText: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  retentionBold: {
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

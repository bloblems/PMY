import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUserProfile, updateUserProfile } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { spacing, layout, typography } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  // Show UI immediately, load data in background (like settings page)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getNotifications(user.id);
    },
    enabled: !!user,
    staleTime: 30000,
    placeholderData: [], // Show empty array immediately
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
    staleTime: 60000,
    select: (data) => data ? { emailNotificationsEnabled: data.emailNotificationsEnabled } : null,
    placeholderData: null, // Show null immediately
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => markNotificationAsRead(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const updateEmailNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => updateUserProfile(user!.id, { emailNotificationsEnabled: enabled ? 'true' : 'false' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
  });

  const handleToggleEmailNotifications = (value: boolean) => {
    updateEmailNotificationsMutation.mutate(value);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate({ id });
  };

  const styles = createStyles(colors);

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
      <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const unreadCount = notifications?.filter((n: any) => n.is_read === 'false' || n.is_read === false).length || 0;
  const emailNotificationsEnabled = profile?.emailNotificationsEnabled === 'true' || false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button
          title="Back"
          onPress={() => router.back()}
          variant="outline"
          style={styles.headerButton}
        />
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <Button
            title="Mark All Read"
            onPress={handleMarkAllRead}
            variant="outline"
            style={styles.headerButton}
          />
        )}
      </View>

      {/* Settings */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="mail-outline" size={20} color={colors.brand.primary} />
            <View style={[styles.settingText, styles.settingTextSpacing]}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive email notifications for important updates
              </Text>
            </View>
          </View>
          <Switch
            value={emailNotificationsEnabled}
            onValueChange={handleToggleEmailNotifications}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {/* Notifications List */}
      <Card style={styles.card}>
        <View style={styles.notificationsHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="small" color={colors.brand.primary} />
            <Text style={styles.emptyText}>Loading notifications...</Text>
          </View>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification: any) => {
            const isRead = notification.is_read === 'true' || notification.is_read === true;
            const createdAt = notification.created_at || notification.createdAt;
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationItem, !isRead && styles.notificationItemUnread]}
                onPress={() => {
                  if (!isRead) handleMarkRead(notification.id);
                  // Navigate to related contract if available
                  const relatedContractId = notification.related_contract_id || notification.relatedContractId;
                  if (relatedContractId) {
                    router.push(`/(tabs)/contracts/${relatedContractId}`);
                  }
                }}
              >
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, !isRead && styles.notificationTitleUnread]}>
                    {notification.title || 'Notification'}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message || notification.body || ''}
                  </Text>
                  {createdAt && (
                    <Text style={styles.notificationTime}>
                      {format(new Date(createdAt), 'MMM d, yyyy h:mm a')}
                    </Text>
                  )}
                </View>
                <View style={styles.notificationRight}>
                  {!isRead && (
                    <View style={styles.unreadDot} />
                  )}
                  {(notification.related_contract_id || notification.relatedContractId) && (
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You're all caught up!
            </Text>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButton: {
    minWidth: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTextSpacing: {
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  notificationItemUnread: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#999',
  },
  notificationTitleUnread: {
    color: '#fff',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  empty: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});


import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getNotifications(user.id);
    },
    enabled: !!user,
    staleTime: 30000,
    placeholderData: [],
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => markNotificationAsRead(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', user?.id] });
    },
  });

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Button
            title="Mark All Read"
            onPress={handleMarkAllRead}
            variant="outline"
            style={styles.headerButton}
          />
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <Card style={styles.card}>
        <View style={styles.notificationsHeader}>
          <Text style={styles.sectionTitle}>
            {unreadCount > 0 ? `${unreadCount} Unread` : 'All Notifications'}
          </Text>
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
                  const relatedContractId = notification.related_contract_id || notification.relatedContractId;
                  if (relatedContractId) {
                    router.push(`/(tabs)/contracts/${relatedContractId}`);
                  }
                }}
              >
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={20}
                    color={!isRead ? colors.brand.primary : colors.text.tertiary}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, !isRead && styles.notificationTitleUnread]}>
                    {notification.title || 'Notification'}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
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
            <Ionicons name="notifications-outline" size={48} color={colors.text.tertiary} />
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

function getNotificationIcon(type?: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'contract_approved':
    case 'contract_signed':
      return 'checkmark-circle-outline';
    case 'contract_rejected':
    case 'contract_revoked':
      return 'close-circle-outline';
    case 'contract_received':
      return 'document-text-outline';
    case 'contract_expired':
      return 'time-outline';
    default:
      return 'notifications-outline';
  }
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
  backButton: {
    padding: spacing.xs,
  },
  headerButton: {
    minWidth: 80,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.borderDark,
  },
  notificationItemUnread: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 0,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
    color: colors.text.secondary,
  },
  notificationTitleUnread: {
    color: colors.text.inverse,
  },
  notificationMessage: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.text.inverse,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

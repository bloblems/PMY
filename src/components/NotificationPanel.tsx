import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';
import Button from './Button';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedContractId?: string | null;
  relatedAmendmentId?: string | null;
}

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  onMarkAllRead?: () => Promise<void>;
  isLoading?: boolean;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onNotificationPress,
  onMarkAsRead,
  onMarkAllRead,
  isLoading = false,
}: NotificationPanelProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
    onNotificationPress?.(notification);
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount > 0 && onMarkAllRead) {
      await onMarkAllRead();
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setIsOpen(true)}
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Panel Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllButton}
                  onPress={handleMarkAllRead}
                  disabled={isLoading}
                >
                  <Ionicons name="checkmark-done" size={18} color={colors.brand.primary} />
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.text.tertiary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyDescription}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  style={({ pressed }) => [
                    styles.notificationItem,
                    !notification.isRead && styles.notificationUnread,
                    pressed && styles.notificationPressed,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  disabled={isLoading}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.isRead && styles.notificationTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text
                      style={styles.notificationMessage}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatRelativeTime(notification.createdAt)}
                    </Text>
                  </View>

                  {!notification.isRead && (
                    <TouchableOpacity
                      style={styles.markReadButton}
                      onPress={async (e) => {
                        e.stopPropagation();
                        if (onMarkAsRead) {
                          await onMarkAsRead(notification.id);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <Ionicons name="checkmark" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    triggerButton: {
      position: 'relative',
      padding: spacing.sm,
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.status.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.background.cardBorder,
    },
    title: {
      fontSize: typography.size.xl,
      fontWeight: '600',
      color: colors.text.primary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    markAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: spacing.xs,
    },
    markAllText: {
      fontSize: typography.size.sm,
      color: colors.brand.primary,
      fontWeight: '500',
    },
    closeButton: {
      padding: spacing.xs,
    },
    scrollView: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    emptyDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.background.cardBorder,
    },
    notificationUnread: {
      backgroundColor: colors.brand.primary + '10',
    },
    notificationPressed: {
      opacity: 0.7,
    },
    notificationContent: {
      flex: 1,
      marginRight: spacing.sm,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.text.primary,
      flex: 1,
    },
    notificationTitleUnread: {
      fontWeight: '600',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.brand.primary,
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
    markReadButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

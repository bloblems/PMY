import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { borderRadius, typography } from '@/lib/theme';

interface NotificationBadgeProps {
  onPress?: () => void;
}

export default function NotificationBadge({ onPress }: NotificationBadgeProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(colors);

  // Fetch unread notification count only when user is authenticated
  const { data } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread/count'],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user,
  });

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const unreadCount = data?.count || 0;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityLabel={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.status.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: typography.size.xs,
      fontWeight: '600',
    },
  });

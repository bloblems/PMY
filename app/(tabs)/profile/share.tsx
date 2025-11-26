import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShareProfileScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  const styles = createStyles(colors);

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

  const username = profile?.username || user.email?.split('@')[0] || 'user';
  const profileUrl = `pmy://profile/${username}`;
  const webUrl = `https://pmy.app/@${username}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with me on PMY (Press Means Yes)!\n\nUsername: @${username}\n\n${webUrl}`,
        title: `Connect with @${username} on PMY`,
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share profile');
      }
    }
  };

  const handleCopyUsername = async () => {
    // Use Share API as a workaround since expo-clipboard isn't installed
    try {
      await Share.share({
        message: `@${username}`,
      });
    } catch (error) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: webUrl,
        title: 'Profile Link',
      });
    } catch (error) {
      Alert.alert('Profile Link', webUrl);
    }
  };

  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : username;

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Share Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <LinearGradient
          colors={[colors.brand.primary, '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBg}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.displayName}>{userName}</Text>
            <Text style={styles.username}>@{username}</Text>
            {profile?.is_verified === 'true' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Card>

      {/* QR Code Placeholder */}
      <Card style={styles.qrCard}>
        <Text style={styles.sectionTitle}>QR Code</Text>
        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color={colors.text.tertiary} />
          </View>
          <Text style={styles.qrHelperText}>
            Others can scan this code to view your profile
          </Text>
        </View>
      </Card>

      {/* Share Options */}
      <Card style={styles.shareCard}>
        <Text style={styles.sectionTitle}>Share Options</Text>

        <TouchableOpacity style={styles.shareOption} onPress={handleCopyUsername}>
          <View style={styles.shareOptionLeft}>
            <View style={[styles.shareIconContainer, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="at" size={20} color="#3B82F6" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={styles.shareOptionTitle}>Username</Text>
              <Text style={styles.shareOptionValue}>@{username}</Text>
            </View>
          </View>
          <View style={styles.copyButton}>
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={20}
              color={copied ? "#34C759" : colors.text.secondary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
          <View style={styles.shareOptionLeft}>
            <View style={[styles.shareIconContainer, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="link" size={20} color="#10B981" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={styles.shareOptionTitle}>Profile Link</Text>
              <Text style={styles.shareOptionValue} numberOfLines={1}>{webUrl}</Text>
            </View>
          </View>
          <View style={styles.copyButton}>
            <Ionicons name="copy-outline" size={20} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>
      </Card>

      {/* Share Button */}
      <Button
        title="Share Profile"
        onPress={handleShare}
        style={styles.shareButton}
      />

      <Text style={styles.footerText}>
        When someone searches for your username, they can send you contract invitations.
      </Text>
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
    paddingBottom: layout.bottomNavHeight + spacing.xl,
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
  profileCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: 0,
  },
  gradientBg: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  profileContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  displayName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.size.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  verifiedText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: '#fff',
  },
  qrCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.md,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  qrHelperText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  shareCard: {
    marginBottom: spacing.lg,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.borderDark,
  },
  shareOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shareIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  shareOptionText: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  shareOptionValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
  },
  copyButton: {
    padding: spacing.sm,
  },
  shareButton: {
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

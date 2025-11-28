import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  path: string;
}

const quickActions: ToolItem[] = [
  {
    id: 'create',
    title: 'New Contract',
    description: 'Create a consent contract',
    icon: 'add-circle',
    color: '#10B981',
    bgColor: '#10B98115',
    path: '/(tabs)/create',
  },
  {
    id: 'contracts',
    title: 'My Contracts',
    description: 'View all contracts',
    icon: 'folder-open',
    color: '#3B82F6',
    bgColor: '#3B82F615',
    path: '/(tabs)/contracts',
  },
];

const resources: ToolItem[] = [
  {
    id: 'title-ix',
    title: 'Title IX Resources',
    description: 'University sexual misconduct policies and reporting procedures',
    icon: 'school',
    color: '#8B5CF6',
    bgColor: '#8B5CF615',
    path: '/(tabs)/tools/titleix',
  },
  {
    id: 'state-law',
    title: 'State Consent Laws',
    description: 'Legal consent requirements and age of consent by state',
    icon: 'scale',
    color: '#F59E0B',
    bgColor: '#F59E0B15',
    path: '/(tabs)/tools/state-laws',
  },
];

const comingSoon: ToolItem[] = [
  {
    id: 'partner-verify',
    title: 'Partner Verify',
    description: 'Verify identity and age of partners',
    icon: 'shield-checkmark',
    color: '#EC4899',
    bgColor: '#EC489915',
    path: '',
  },
  {
    id: 'emergency',
    title: 'Emergency Resources',
    description: 'Crisis hotlines and support services',
    icon: 'call',
    color: '#EF4444',
    bgColor: '#EF444415',
    path: '',
  },
];

export default function ToolsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const styles = createStyles(colors);

  if (authLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const handleToolPress = (tool: ToolItem) => {
    if (!tool.path) return;
    router.push(tool.path as `/${string}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/create')}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Create Consent Contract</Text>
              <Text style={styles.heroDescription}>
                Document mutual consent with legally-backed digital signatures
              </Text>
            </View>
            <View style={styles.heroArrow}>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => handleToolPress(tool)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: tool.bgColor }]}>
                <Ionicons name={tool.icon} size={24} color={tool.color} />
              </View>
              <Text style={styles.quickActionTitle}>{tool.title}</Text>
              <Text style={styles.quickActionDescription}>{tool.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal Resources</Text>
        <View style={styles.resourcesList}>
          {resources.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.resourceCard}
              activeOpacity={0.7}
              onPress={() => handleToolPress(tool)}
            >
              <View style={[styles.resourceIcon, { backgroundColor: tool.bgColor }]}>
                <Ionicons name={tool.icon} size={22} color={tool.color} />
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>{tool.title}</Text>
                <Text style={styles.resourceDescription}>{tool.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming Soon</Text>
        <View style={styles.resourcesList}>
          {comingSoon.map((tool) => (
            <View key={tool.id} style={[styles.resourceCard, styles.disabledCard]}>
              <View style={[styles.resourceIcon, { backgroundColor: tool.bgColor }]}>
                <Ionicons name={tool.icon} size={22} color={tool.color} />
              </View>
              <View style={styles.resourceContent}>
                <View style={styles.comingSoonHeader}>
                  <Text style={[styles.resourceTitle, styles.disabledText]}>{tool.title}</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                </View>
                <Text style={[styles.resourceDescription, styles.disabledText]}>{tool.description}</Text>
              </View>
            </View>
          ))}
        </View>
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
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xxxl,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    marginLeft: spacing.lg,
    marginRight: spacing.md,
  },
  heroTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  heroDescription: {
    fontSize: typography.size.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickActionTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  quickActionDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  resourcesList: {
    gap: spacing.md,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  disabledCard: {
    opacity: 0.6,
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  resourceTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  resourceDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  comingSoonBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
    color: colors.brand.primary,
  },
});

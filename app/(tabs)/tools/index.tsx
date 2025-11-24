import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography, borderRadius, shadows } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  gradientColors: string[];
  path: string;
}

const tools: ToolItem[] = [
  {
    id: 'partner-verify',
    title: 'Partner Verify',
    description: 'Verify identity and age',
    icon: 'shield-checkmark',
    iconColor: '#EC4899',
    gradientColors: ['#EC4899', '#F43F5E'],
    path: '/settings/integrations',
  },
  {
    id: 'contract-verify',
    title: 'Contracts',
    description: 'View and manage contracts',
    icon: 'document-text',
    iconColor: '#10B981',
    gradientColors: ['#10B981', '#059669'],
    path: '/(tabs)/contracts',
  },
  {
    id: 'title-ix',
    title: 'Title IX',
    description: 'University policies',
    icon: 'school',
    iconColor: '#3B82F6',
    gradientColors: ['#3B82F6', '#2563EB'],
    path: '/(tabs)/tools/titleix',
  },
  {
    id: 'state-law',
    title: 'State Laws',
    description: 'Consent laws by state',
    icon: 'scale',
    iconColor: '#F59E0B',
    gradientColors: ['#F59E0B', '#F97316'],
    path: '/(tabs)/tools/state-laws',
  },
];

export default function ToolsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

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

  const handleToolPress = (tool: ToolItem) => {
    if (tool.path === '/settings/integrations') {
      // TODO: Implement integrations page
      return;
    }
    router.push(tool.path as `/${string}`);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tools</Text>
        <Text style={styles.subtitle}>
          Quick access to essential features
        </Text>
      </View>

      <View style={styles.grid}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.8}
            style={styles.toolCard}
          >
            <LinearGradient
              colors={tool.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.toolContent}>
                <View style={styles.iconWrapper}>
                  <Ionicons 
                    name={tool.icon as any} 
                    size={32} 
                    color={colors.text.inverse} 
                  />
                </View>
                <View style={styles.toolTextContainer}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colors.text.inverse + '80'} 
                  style={styles.chevron}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
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
    marginBottom: spacing.xl,
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
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  toolCard: {
    width: '50%',
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  gradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 140,
    ...shadows.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toolContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toolTextContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  toolTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  toolDescription: {
    fontSize: typography.size.sm,
    color: colors.text.inverse + 'CC',
    lineHeight: 18,
  },
  chevron: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
});

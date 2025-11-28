import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import Card from './Card';
import Button from './Button';

interface TitleIXInfoProps {
  universityId?: string;
  universityName?: string;
  titleIXInfo?: string;
  titleIXUrl?: string | null;
  lastUpdated?: string;
  verifiedAt?: string | null;
}

// Static content sections that are always visible
const UNDERSTANDING_CONSENT = {
  title: 'Understanding Consent',
  icon: 'book',
  content: `Consent must be clear, knowing, and voluntary. It is active, not passive, and can be withdrawn at any time. Silence or lack of resistance does not constitute consent.

Both parties must be capable of giving consent. Incapacitation due to alcohol, drugs, or other factors negates the ability to consent.

Documentation of consent, while helpful, does not replace the ongoing requirement for clear communication throughout any encounter.`,
};

const KEY_REQUIREMENTS = {
  title: 'Key Requirements',
  icon: 'shield-checkmark',
  items: [
    'Consent must be affirmative and ongoing',
    'Both parties must be of legal age and mentally capable',
    'Consent cannot be given under coercion or threat',
    'Prior relationship does not imply consent for future encounters',
    'Consent to one activity does not imply consent to others',
  ],
};

export default function TitleIXInfo({
  universityId,
  universityName,
  titleIXInfo,
  titleIXUrl,
  lastUpdated,
  verifiedAt,
}: TitleIXInfoProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const styles = createStyles(colors);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  // Generate campus-specific resources based on university
  const getCampusResources = () => {
    // Extract resources from titleIXInfo if available
    const resources: { name: string; description: string; icon: string; url?: string }[] = [];
    
    // Common resource patterns to look for
    if (titleIXInfo && universityName) {
      if (titleIXInfo.toLowerCase().includes('ophd') || titleIXInfo.toLowerCase().includes('prevention of harassment')) {
        resources.push({
          name: 'Office for Prevention of Harassment & Discrimination (OPHD)',
          description: 'Primary office for Title IX complaints and support',
          icon: 'business',
          url: titleIXUrl || undefined,
        });
      }
      if (titleIXInfo.toLowerCase().includes('path to care') || titleIXInfo.toLowerCase().includes('care center')) {
        resources.push({
          name: 'PATH to Care Center',
          description: '24/7 confidential support and advocacy',
          icon: 'heart',
          url: titleIXUrl || undefined,
        });
      }
      if (titleIXInfo.toLowerCase().includes('sapac') || titleIXInfo.toLowerCase().includes('sexual assault prevention')) {
        resources.push({
          name: 'Sexual Assault Prevention & Awareness Center (SAPAC)',
          description: '24/7 crisis intervention and support services',
          icon: 'shield',
          url: titleIXUrl || undefined,
        });
      }
      if (titleIXInfo.toLowerCase().includes('counseling') || titleIXInfo.toLowerCase().includes('mental health')) {
        resources.push({
          name: 'Counseling & Mental Health Services',
          description: 'Confidential counseling and psychological support',
          icon: 'medical',
        });
      }
      if (titleIXInfo.toLowerCase().includes('victim') || titleIXInfo.toLowerCase().includes('survivor')) {
        resources.push({
          name: 'Victim Advocacy Services',
          description: 'Support and resources for survivors',
          icon: 'people',
          url: titleIXUrl || undefined,
        });
      }
      if (titleIXInfo.toLowerCase().includes('women\'s') || titleIXInfo.toLowerCase().includes('gender')) {
        resources.push({
          name: 'Gender Equity Center',
          description: 'Education, advocacy, and support services',
          icon: 'people-circle',
        });
      }
    }
    
    // Always include these general resources
    resources.push(
      {
        name: 'National Sexual Assault Hotline',
        description: '1-800-656-4673 (RAINN) - 24/7 confidential support',
        icon: 'call',
        url: 'https://www.rainn.org/',
      },
      {
        name: 'Crisis Text Line',
        description: 'Text HOME to 741741 for free crisis support',
        icon: 'chatbubble',
        url: 'https://www.crisistextline.org/',
      }
    );

    // Add university-specific contact if we have a URL
    if (universityName && titleIXUrl) {
      resources.unshift({
        name: `${universityName} Title IX Office`,
        description: 'Official university Title IX coordinator and resources',
        icon: 'school',
        url: titleIXUrl,
      });
    } else if (universityName) {
      resources.unshift({
        name: `${universityName} Title IX Office`,
        description: 'Contact your university\'s Title IX coordinator for support',
        icon: 'school',
      });
    }
    
    return resources;
  };

  const campusResources = getCampusResources();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* University Info Card - Only show if university is selected */}
      {universityName && (
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="school" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.universityName}>Title IX at {universityName}</Text>
              <View style={styles.metaRow}>
                {lastUpdated && (
                  <Text style={styles.metaText}>
                    Last updated: <Text style={styles.metaHighlight}>{lastUpdated}</Text>
                  </Text>
                )}
                {verifiedAt && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.status.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            {titleIXUrl && (
              <Button
                title="View Official Policy"
                variant="outline"
                size="small"
                onPress={() => openUrl(titleIXUrl)}
                style={styles.actionButton}
                icon={<Ionicons name="open-outline" size={14} color={colors.brand.primary} />}
              />
            )}
            <Button
              title="Report Issue"
              variant="outline"
              size="small"
              onPress={() => {}}
              style={styles.actionButton}
              icon={<Ionicons name="flag-outline" size={14} color={colors.brand.primary} />}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity style={styles.verifyButton}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.status.success} />
            <Text style={styles.verifyText}>Verify This Policy</Text>
          </TouchableOpacity>
          <Text style={styles.verifySubtext}>✨ Create better contracts and add a verification badge.</Text>
        </Card>
      )}

      {/* Policy Summary Card - Only show if university is selected */}
      {universityName && titleIXInfo && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Policy Summary</Text>
            {!titleIXInfo.includes('will be populated soon') && (
              <Text style={styles.aiLabel}>AI-generated</Text>
            )}
          </View>
          <Text style={styles.summaryText} numberOfLines={isExpanded ? undefined : 3}>
            {titleIXInfo}
          </Text>
          <View style={styles.actionsRow}>
            {!titleIXInfo.includes('will be populated soon') && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.brand.primary}
                />
                <Text style={styles.expandText}>{isExpanded ? 'Less' : 'More'}</Text>
              </TouchableOpacity>
            )}
            {titleIXUrl && (
              <Button
                title="Full Policy"
                variant="outline"
                size="small"
                onPress={() => openUrl(titleIXUrl)}
                icon={<Ionicons name="open-outline" size={14} color={colors.brand.primary} />}
                style={styles.policyButton}
              />
            )}
          </View>
        </Card>
      )}

      {/* Understanding Consent - Always Visible */}
      <Card style={styles.staticCard}>
        <View style={styles.staticHeader}>
          <Ionicons name={UNDERSTANDING_CONSENT.icon as any} size={18} color={colors.brand.primary} />
          <Text style={styles.staticTitle}>{UNDERSTANDING_CONSENT.title}</Text>
        </View>
        <Text style={styles.staticContent}>{UNDERSTANDING_CONSENT.content}</Text>
      </Card>

      {/* Key Requirements - Always Visible */}
      <Card style={styles.staticCard}>
        <View style={styles.staticHeader}>
          <Ionicons name={KEY_REQUIREMENTS.icon as any} size={18} color={colors.brand.primary} />
          <Text style={styles.staticTitle}>{KEY_REQUIREMENTS.title}</Text>
        </View>
        <View style={styles.requirementsList}>
          {KEY_REQUIREMENTS.items.map((item, index) => (
            <View key={index} style={styles.requirementItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.requirementText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Campus Resources - Collapsible, shows university-specific resources */}
      <Card style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setResourcesExpanded(!resourcesExpanded)}
        >
          <View style={styles.accordionTitleRow}>
            <Ionicons name="alert-circle" size={16} color={colors.brand.primary} />
            <Text style={styles.accordionTitle}>Campus Resources</Text>
          </View>
          <Ionicons
            name={resourcesExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
          {resourcesExpanded && campusResources && (
          <View style={styles.accordionContent}>
            {campusResources.map((resource, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.resourceItem}
                onPress={() => resource.url && openUrl(resource.url)}
                disabled={!resource.url}
              >
                <View style={styles.resourceIconContainer}>
                  <Ionicons name={resource.icon as any} size={16} color={colors.brand.primary} />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Text style={styles.resourceDescription}>{resource.description}</Text>
                </View>
                {resource.url && (
                  <Ionicons name="open-outline" size={16} color={colors.brand.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerCard: {
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    universityName: {
      fontSize: typography.size.lg,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metaText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    metaHighlight: {
      fontWeight: '500',
      color: colors.text.primary,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    verifiedText: {
      fontSize: typography.size.xs,
      color: colors.status.success,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    actionButton: {
      flex: 0,
    },
    verifyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.ui.border,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xs,
    },
    verifyText: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.status.success,
    },
    verifySubtext: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    summaryCard: {
      marginBottom: spacing.md,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    summaryTitle: {
      fontSize: typography.size.sm,
      fontWeight: '600',
      color: colors.text.primary,
    },
    aiLabel: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    summaryText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    expandText: {
      fontSize: typography.size.xs,
      color: colors.brand.primary,
      fontWeight: '500',
    },
    policyButton: {
      paddingHorizontal: spacing.sm,
    },
    // Static cards (always visible)
    staticCard: {
      marginBottom: spacing.md,
    },
    staticHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    staticTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.primary,
    },
    staticContent: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      lineHeight: 22,
    },
    requirementsList: {
      gap: spacing.sm,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.brand.primary,
      marginTop: 6,
    },
    requirementText: {
      flex: 1,
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    // Accordion (collapsible)
    accordionCard: {
      marginBottom: spacing.sm,
      padding: 0,
      overflow: 'hidden',
    },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
    },
    accordionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    accordionTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.primary,
    },
    accordionContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.background.cardBorder,
      paddingTop: spacing.md,
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    resourceIconContainer: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.brand.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resourceInfo: {
      flex: 1,
    },
    resourceName: {
      fontSize: typography.size.sm,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    resourceDescription: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.ui.border,
    },
    viewAllText: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.brand.primary,
    },
  });

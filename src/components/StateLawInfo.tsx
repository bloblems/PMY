import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import Card from './Card';
import Button from './Button';

interface StateLawInfoProps {
  stateCode?: string;
  stateName?: string;
  ageOfConsent?: number;
  affirmativeConsentRequired?: string | null;
  romeoJulietLaw?: string | null;
  consentLawInfo?: string;
  reportingRequirements?: string | null;
  sourceUrl?: string | null;
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

const KEY_REQUIREMENTS_BASE = {
  title: 'Key Requirements',
  icon: 'shield-checkmark',
};

export default function StateLawInfo({
  stateCode,
  stateName,
  ageOfConsent,
  affirmativeConsentRequired,
  romeoJulietLaw,
  consentLawInfo,
  reportingRequirements,
  sourceUrl,
  lastUpdated,
  verifiedAt,
}: StateLawInfoProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportingExpanded, setReportingExpanded] = useState(false);
  const styles = createStyles(colors);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  // Generate state-specific key requirements
  const getKeyRequirements = () => {
    const requirements = [
      'Consent must be affirmative and ongoing',
      'Both parties must be of legal age and mentally capable',
      'Consent cannot be given under coercion or threat',
      'Prior relationship does not imply consent for future encounters',
      'Consent to one activity does not imply consent to others',
    ];

    // Add state-specific requirements if available
    if (stateName && ageOfConsent) {
      requirements.unshift(`Age of Consent in ${stateName}: ${ageOfConsent} years old`);
    }
    if (affirmativeConsentRequired && affirmativeConsentRequired !== 'No') {
      requirements.push(`${stateName} requires affirmative consent${affirmativeConsentRequired.includes('higher ed') ? ' for higher education institutions' : ''}`);
    }
    if (romeoJulietLaw && romeoJulietLaw.toLowerCase().includes('yes')) {
      requirements.push(`Close-in-age exemption: ${romeoJulietLaw}`);
    }

    return requirements;
  };

  const keyRequirements = getKeyRequirements();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* State Info Card - Only show if state is selected */}
      {stateName && (
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="scale" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.stateName}>Consent Laws in {stateName}</Text>
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
            {sourceUrl && (
              <Button
                title="View Official Policy"
                variant="outline"
                size="small"
                onPress={() => openUrl(sourceUrl)}
                style={styles.actionButton}
                icon={<Ionicons name="open-outline" size={14} color={colors.text.secondary} />}
              />
            )}
            <Button
              title="Report Issue"
              variant="outline"
              size="small"
              onPress={() => {}}
              style={styles.actionButton}
              icon={<Ionicons name="flag-outline" size={14} color={colors.text.secondary} />}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity style={styles.verifyButton}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.status.success} />
            <Text style={styles.verifyText}>Verify This Information</Text>
          </TouchableOpacity>
          <Text style={styles.verifySubtext}>✨ Create better contracts and add a verification badge.</Text>
        </Card>
      )}

      {/* Law Summary Card - Only show if state is selected */}
      {stateName && consentLawInfo && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Law Summary</Text>
            <Text style={styles.aiLabel}>AI-generated</Text>
          </View>
          <Text style={styles.summaryText} numberOfLines={isExpanded ? undefined : 3}>
            {consentLawInfo}
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.text.secondary}
              />
              <Text style={styles.expandText}>{isExpanded ? 'Less' : 'More'}</Text>
            </TouchableOpacity>
            {sourceUrl && (
              <Button
                title="Full Policy"
                variant="outline"
                size="small"
                onPress={() => openUrl(sourceUrl)}
                icon={<Ionicons name="open-outline" size={14} color={colors.text.secondary} />}
                style={styles.policyButton}
              />
            )}
          </View>
        </Card>
      )}

      {/* Quick Facts Card - Only show if state is selected */}
      {stateName && ageOfConsent && (
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Facts</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ageOfConsent}</Text>
              <Text style={styles.statLabel}>Age of Consent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{affirmativeConsentRequired === 'Yes' || affirmativeConsentRequired?.includes('Yes') ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Affirmative Consent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{romeoJulietLaw?.toLowerCase().includes('yes') ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Close-in-Age Exemption</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Understanding Consent - Always Visible */}
      <Card style={styles.staticCard}>
        <View style={styles.staticHeader}>
          <Ionicons name={UNDERSTANDING_CONSENT.icon as any} size={18} color={colors.text.secondary} />
          <Text style={styles.staticTitle}>{UNDERSTANDING_CONSENT.title}</Text>
        </View>
        <Text style={styles.staticContent}>{UNDERSTANDING_CONSENT.content}</Text>
      </Card>

      {/* Key Requirements - Always Visible (with state-specific info if available) */}
      <Card style={styles.staticCard}>
        <View style={styles.staticHeader}>
          <Ionicons name={KEY_REQUIREMENTS_BASE.icon as any} size={18} color={colors.text.secondary} />
          <Text style={styles.staticTitle}>{KEY_REQUIREMENTS_BASE.title}</Text>
        </View>
        <View style={styles.requirementsList}>
          {keyRequirements.map((item, index) => (
            <View key={index} style={styles.requirementItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.requirementText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Reporting Requirements - Collapsible, shows state-specific requirements */}
      {stateName && (
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setReportingExpanded(!reportingExpanded)}
          >
            <View style={styles.accordionTitleRow}>
              <Ionicons name="alert-circle" size={16} color={colors.text.secondary} />
              <Text style={styles.accordionTitle}>Reporting Requirements</Text>
            </View>
            <Ionicons
              name={reportingExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
          {reportingExpanded && (
            <View style={styles.accordionContent}>
              <Text style={styles.accordionText}>
                {reportingRequirements || `${stateName} has mandatory reporting requirements for certain professionals. Contact local authorities or legal counsel for specific guidance on reporting obligations.`}
              </Text>
              
              <View style={styles.resourceSection}>
                <Text style={styles.resourceSectionTitle}>Key Contacts</Text>

                <View style={styles.resourceItem}>
                  <View style={styles.resourceIconContainer}>
                    <Ionicons name="call" size={16} color={colors.text.secondary} />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>National Sexual Assault Hotline</Text>
                    <Text style={styles.resourceDescription}>1-800-656-4673 (RAINN)</Text>
                  </View>
                </View>

                <View style={styles.resourceItem}>
                  <View style={styles.resourceIconContainer}>
                    <Ionicons name="shield" size={16} color={colors.text.secondary} />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>Local Law Enforcement</Text>
                    <Text style={styles.resourceDescription}>Call 911 for emergencies</Text>
                  </View>
                </View>

                <View style={styles.resourceItem}>
                  <View style={styles.resourceIconContainer}>
                    <Ionicons name="document-text" size={16} color={colors.text.secondary} />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>{stateName} Attorney General</Text>
                    <Text style={styles.resourceDescription}>Legal guidance and victim resources</Text>
                  </View>
                </View>
              </View>

              {sourceUrl && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => openUrl(sourceUrl)}
                >
                  <Text style={styles.viewAllText}>View Full Legal Code</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      )}
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
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    stateName: {
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
      color: colors.text.secondary,
      fontWeight: '500',
    },
    policyButton: {
      paddingHorizontal: spacing.sm,
    },
    statsCard: {
      marginBottom: spacing.md,
    },
    statsTitle: {
      fontSize: typography.size.sm,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: typography.size.xl,
      fontWeight: '700',
      color: colors.text.inverse,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      textAlign: 'center',
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
      backgroundColor: colors.text.tertiary,
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
    accordionText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    resourceSection: {
      marginTop: spacing.sm,
    },
    resourceSectionTitle: {
      fontSize: typography.size.sm,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.md,
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
      backgroundColor: colors.background.secondary,
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
      color: colors.text.secondary,
    },
  });

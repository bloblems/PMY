import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import Card from './Card';
import Button from './Button';

interface UniversityPolicyPreviewProps {
  universityId: string;
  universityName: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
  onGenerateSummary?: (titleIXInfo: string) => Promise<string>;
}

export default function UniversityPolicyPreview({
  universityId,
  universityName,
  titleIXInfo,
  titleIXUrl,
  lastUpdated,
  verifiedAt,
  onGenerateSummary,
}: UniversityPolicyPreviewProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [summary, setSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const generateSummary = async () => {
      if (!titleIXInfo || titleIXInfo.includes('will be populated soon')) {
        setSummary(titleIXInfo);
        return;
      }

      if (onGenerateSummary) {
        setIsLoadingSummary(true);
        try {
          const generatedSummary = await onGenerateSummary(titleIXInfo);
          setSummary(generatedSummary);
        } catch (error) {
          console.error('Failed to generate summary:', error);
          setSummary(titleIXInfo);
        } finally {
          setIsLoadingSummary(false);
        }
      } else {
        setSummary(titleIXInfo);
      }
    };

    generateSummary();
  }, [titleIXInfo, onGenerateSummary]);

  const openUrl = () => {
    if (titleIXUrl) {
      Linking.openURL(titleIXUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* University Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="school" size={16} color={colors.text.secondary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.universityName}>{universityName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Updated:{' '}
                <Text style={styles.metaHighlight}>
                  {formatDate(lastUpdated)}
                </Text>
              </Text>
              {verifiedAt && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={colors.status.success}
                  />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Policy Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Policy Summary</Text>
          {!titleIXInfo.includes('will be populated soon') && (
            <Text style={styles.aiLabel}>AI-generated</Text>
          )}
        </View>

        {isLoadingSummary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.text.secondary} />
            <Text style={styles.loadingText}>Generating...</Text>
          </View>
        ) : (
          <View>
            <Text
              style={styles.summaryText}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {isExpanded ? titleIXInfo : summary}
            </Text>

            <View style={styles.actionsRow}>
              {summary &&
                summary !== titleIXInfo &&
                !titleIXInfo.includes('will be populated soon') && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setIsExpanded(!isExpanded)}
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.expandText}>
                      {isExpanded ? 'Less' : 'More'}
                    </Text>
                  </TouchableOpacity>
                )}

              {titleIXUrl && (
                <Button
                  title="Full Policy"
                  variant="outline"
                  size="small"
                  onPress={openUrl}
                  icon={
                    <Ionicons
                      name="open-outline"
                      size={14}
                      color={colors.text.secondary}
                    />
                  }
                  style={styles.policyButton}
                />
              )}
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    infoCard: {
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    universityName: {
      fontSize: typography.size.sm,
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
      fontSize: typography.size.xs,
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
    summaryCard: {
      padding: spacing.md,
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
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    loadingText: {
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
      paddingVertical: spacing.xs,
    },
    expandText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      fontWeight: '500',
    },
    policyButton: {
      paddingHorizontal: spacing.sm,
    },
  });

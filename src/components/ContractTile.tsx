import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import Card from './Card';
import Button from './Button';

interface ContractTileProps {
  id: string;
  encounterType?: string;
  parties?: string[];
  createdAt: string;
  updatedAt?: string;
  status?: string;
  method?: string;
  contractText?: string;
  isCollaborative?: boolean;
  variant: 'active' | 'draft';
  onDownload?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onResume?: () => void;
  onPause?: () => void;
  onResumeActive?: () => void;
  onRequestAmendment?: () => void;
  onPress?: () => void;
  isPending?: boolean;
}

const getEncounterStyle = (encounterType?: string, colors?: any) => {
  const type = encounterType?.toLowerCase() || '';

  if (type.includes('intimate')) {
    return {
      gradient: colors?.brand.primary + '20',
      icon: 'heart' as const,
      iconColor: '#EC4899',
      label: 'Intimate Encounter',
    };
  }

  if (type.includes('date')) {
    return {
      gradient: '#8B5CF6' + '20',
      icon: 'cafe' as const,
      iconColor: '#8B5CF6',
      label: 'Date',
    };
  }

  if (type.includes('medical')) {
    return {
      gradient: '#3B82F6' + '20',
      icon: 'briefcase' as const,
      iconColor: '#3B82F6',
      label: 'Medical Consultation',
    };
  }

  return {
    gradient: colors?.background.secondary,
    icon: 'document-text' as const,
    iconColor: colors?.text.secondary,
    label: 'Consent Contract',
  };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ContractTile({
  id,
  encounterType,
  parties,
  createdAt,
  updatedAt,
  status,
  method,
  contractText,
  isCollaborative,
  variant,
  onDownload,
  onDelete,
  onApprove,
  onReject,
  onResume,
  onPause,
  onResumeActive,
  onRequestAmendment,
  onPress,
  isPending,
}: ContractTileProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const encounterStyle = getEncounterStyle(encounterType, colors);

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: encounterStyle.gradient }]}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: encounterStyle.gradient }]}>
              <Ionicons name={encounterStyle.icon} size={20} color={encounterStyle.iconColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{encounterStyle.label}</Text>
              <Text style={styles.date}>
                Created {formatDate(createdAt)}
                {updatedAt && variant === 'draft' && ` • Updated ${formatDate(updatedAt)}`}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          {variant === 'draft' && (
            <View style={[styles.badge, status === 'pending_approval' ? styles.badgePending : styles.badgeOutline]}>
              <Text style={[styles.badgeText, status === 'pending_approval' ? styles.badgeTextPending : styles.badgeTextOutline]}>
                {status === 'pending_approval' ? 'Awaiting Approval' : 'Draft'}
              </Text>
            </View>
          )}
        </View>

        {/* Parties */}
        {parties && parties.length > 0 && (
          <View style={styles.partiesContainer}>
            {parties.map((party, idx) => {
              const isPMYUser = party.startsWith('@');
              return (
                <View key={idx} style={[styles.partyBadge, isPMYUser && styles.partyBadgeUser]}>
                  <Ionicons
                    name={isPMYUser ? 'checkmark-circle' : 'person'}
                    size={12}
                    color={isPMYUser ? colors.brand.primary : colors.text.secondary}
                  />
                  <Text style={[styles.partyText, isPMYUser && styles.partyTextUser]}>{party}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Contract text preview for drafts */}
        {variant === 'draft' && contractText && (
          <Text style={styles.previewText} numberOfLines={2}>
            {contractText.substring(0, 150)}...
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {/* Active contract actions */}
          {variant === 'active' && status === 'active' && (
            <>
              {onRequestAmendment && (
                <Button
                  title="Request Amendment"
                  variant="secondary"
                  size="small"
                  onPress={onRequestAmendment}
                  disabled={isPending}
                  style={styles.actionButton}
                />
              )}
              {onPause && (
                <Button
                  title="Pause"
                  variant="outline"
                  size="small"
                  onPress={onPause}
                  disabled={isPending}
                  style={styles.actionButton}
                />
              )}
              {onDownload && (
                <Button
                  title="Download"
                  variant="outline"
                  size="small"
                  onPress={onDownload}
                  style={styles.actionButton}
                />
              )}
            </>
          )}

          {/* Paused contract actions */}
          {variant === 'active' && status === 'paused' && (
            <>
              {onResumeActive && (
                <Button
                  title="Resume"
                  size="small"
                  onPress={onResumeActive}
                  disabled={isPending}
                  style={styles.actionButton}
                />
              )}
              {onDownload && (
                <Button
                  title="Download"
                  variant="outline"
                  size="small"
                  onPress={onDownload}
                  style={styles.actionButton}
                />
              )}
            </>
          )}

          {/* Draft with pending approval */}
          {variant === 'draft' && status === 'pending_approval' && isCollaborative && (
            <>
              {onApprove && (
                <Button
                  title="Approve"
                  size="small"
                  onPress={onApprove}
                  disabled={isPending}
                  style={styles.actionButton}
                />
              )}
              {onReject && (
                <Button
                  title="Reject"
                  variant="outline"
                  size="small"
                  onPress={onReject}
                  disabled={isPending}
                  style={styles.actionButton}
                />
              )}
            </>
          )}

          {/* Draft that can be edited */}
          {variant === 'draft' && !isCollaborative && onResume && (
            <Button
              title="Resume Editing"
              size="small"
              onPress={onResume}
              style={styles.actionButton}
            />
          )}

          {/* Delete button for applicable states */}
          {onDelete && (variant === 'draft' || (variant === 'active' && status !== 'completed')) && (
            <Button
              title="Delete"
              variant="ghost"
              size="small"
              onPress={onDelete}
              style={[styles.actionButton, styles.deleteButton]}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    card: {
      padding: 0,
      overflow: 'hidden',
    },
    header: {
      padding: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    date: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    badgePending: {
      backgroundColor: colors.background.secondary,
    },
    badgeOutline: {
      borderWidth: 1,
      borderColor: colors.background.cardBorder,
    },
    badgeText: {
      fontSize: typography.size.xs,
      fontWeight: '500',
    },
    badgeTextPending: {
      color: colors.text.primary,
    },
    badgeTextOutline: {
      color: colors.text.secondary,
    },
    partiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    partyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.background.secondary,
    },
    partyBadgeUser: {
      backgroundColor: colors.brand.primary + '20',
    },
    partyText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    partyTextUser: {
      color: colors.brand.primary,
    },
    previewText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      lineHeight: 18,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.background.cardBorder,
    },
    actionButton: {
      flex: 0,
    },
    deleteButton: {
      // Could add specific styling for delete button
    },
  });

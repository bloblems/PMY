import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import Card from './Card';
import Button from './Button';

interface Amendment {
  id: string;
  contractId: string;
  requestedBy: string;
  amendmentType: string;
  status: string;
  changes: string;
  reason: string;
  approvers: string[] | null;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
}

interface AmendmentApprovalCardProps {
  amendment: Amendment;
  currentUserId: string;
  currentActs: {
    touching: boolean;
    kissing: boolean;
    oral: boolean;
    anal: boolean;
    vaginal: boolean;
  };
  currentEndTime?: string;
  onApprove: (amendmentId: string) => Promise<void>;
  onReject: (amendmentId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

const actLabels: Record<string, string> = {
  touching: 'Touching',
  kissing: 'Kissing',
  oral: 'Oral',
  anal: 'Anal',
  vaginal: 'Vaginal',
};

export function AmendmentApprovalCard({
  amendment,
  currentUserId,
  currentActs,
  currentEndTime,
  onApprove,
  onReject,
  isLoading,
}: AmendmentApprovalCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse changes JSON with error handling
  let changes: { addedActs?: string[]; removedActs?: string[]; newEndTime?: string } = {};
  let parseError = false;
  try {
    changes = JSON.parse(amendment.changes);
  } catch (error) {
    console.error('Failed to parse amendment changes:', error);
    parseError = true;
  }

  const isRequester = amendment.requestedBy === currentUserId;
  const hasApproved = amendment.approvers?.includes(currentUserId) || false;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(amendment.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(amendment.id, rejectReason || undefined);
      setShowRejectDialog(false);
      setRejectReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAmendmentTypeLabel = () => {
    switch (amendment.amendmentType) {
      case 'add_acts':
        return 'Add Intimate Acts';
      case 'remove_acts':
        return 'Remove Intimate Acts';
      case 'extend_duration':
        return 'Extend Duration';
      case 'shorten_duration':
        return 'Shorten Duration';
      default:
        return amendment.amendmentType;
    }
  };

  const getStatusBadge = () => {
    if (amendment.status === 'approved') {
      return (
        <View style={[styles.statusBadge, styles.statusApproved]}>
          <Ionicons name="checkmark-circle" size={12} color={colors.status.success} />
          <Text style={[styles.statusText, { color: colors.status.success }]}>
            Approved
          </Text>
        </View>
      );
    }
    if (amendment.status === 'rejected') {
      return (
        <View style={[styles.statusBadge, styles.statusRejected]}>
          <Ionicons name="close-circle" size={12} color={colors.status.error} />
          <Text style={[styles.statusText, { color: colors.status.error }]}>
            Rejected
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusPending]}>
        <Ionicons name="time" size={12} color={colors.text.secondary} />
        <Text style={[styles.statusText, { color: colors.text.secondary }]}>
          Pending Approval
        </Text>
      </View>
    );
  };

  // Show error state if changes couldn't be parsed
  if (parseError) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{getAmendmentTypeLabel()}</Text>
          <View style={[styles.statusBadge, styles.statusError]}>
            <Text style={[styles.statusText, { color: colors.status.error }]}>
              Error
            </Text>
          </View>
        </View>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Unable to display amendment</Text>
          <Text style={styles.errorMessage}>
            The amendment data is malformed and cannot be displayed. Please
            contact support.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{getAmendmentTypeLabel()}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.dateText}>
              Requested {formatDate(amendment.createdAt)}
            </Text>
          </View>
        </View>
        {getStatusBadge()}
      </View>

      {/* Requester info */}
      <View style={styles.requesterRow}>
        <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.requesterText}>
          {isRequester ? 'You requested' : 'Requested by partner'}
        </Text>
      </View>

      {/* Reason */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.sectionTitle}>Reason</Text>
        </View>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>{amendment.reason}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Changes comparison */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proposed Changes</Text>

        {(amendment.amendmentType === 'add_acts' ||
          amendment.amendmentType === 'remove_acts') && (
          <View style={styles.changesGrid}>
            <View style={styles.changesColumn}>
              <Text style={styles.changesLabel}>Current Acts</Text>
              {Object.entries(currentActs)
                .filter(([_, allowed]) => allowed)
                .map(([act]) => (
                  <View key={act} style={styles.actRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={14}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.actText}>
                      {actLabels[act] || act}
                    </Text>
                  </View>
                ))}
              {Object.values(currentActs).every((v) => !v) && (
                <Text style={styles.noneText}>None selected</Text>
              )}
            </View>

            <View style={styles.changesColumn}>
              <Text style={styles.changesLabel}>
                {amendment.amendmentType === 'add_acts'
                  ? 'Acts to Add'
                  : 'Acts to Remove'}
              </Text>
              {amendment.amendmentType === 'add_acts' &&
                changes.addedActs?.map((act: string) => (
                  <View key={act} style={styles.actRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.status.success}
                    />
                    <Text style={[styles.actText, { color: colors.status.success }]}>
                      {actLabels[act] || act}
                    </Text>
                  </View>
                ))}
              {amendment.amendmentType === 'remove_acts' &&
                changes.removedActs?.map((act: string) => (
                  <View key={act} style={styles.actRow}>
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={colors.status.error}
                    />
                    <Text style={[styles.actText, { color: colors.status.error }]}>
                      {actLabels[act] || act}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {(amendment.amendmentType === 'extend_duration' ||
          amendment.amendmentType === 'shorten_duration') && (
          <View style={styles.changesGrid}>
            <View style={styles.changesColumn}>
              <Text style={styles.changesLabel}>Current End Time</Text>
              <Text style={styles.timeText}>
                {currentEndTime ? formatDate(currentEndTime) : 'No end time'}
              </Text>
            </View>
            <View style={styles.changesColumn}>
              <Text style={styles.changesLabel}>New End Time</Text>
              <Text style={[styles.timeText, styles.timeTextBold]}>
                {changes.newEndTime
                  ? formatDate(changes.newEndTime)
                  : 'Not specified'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Approval status */}
      {amendment.status === 'pending' &&
        amendment.approvers &&
        amendment.approvers.length > 0 && (
          <View style={styles.approvalStatus}>
            <Text style={styles.approvalLabel}>Approval Status</Text>
            <Text style={styles.approvalText}>
              {amendment.approvers.length} of 2 parties have approved
            </Text>
          </View>
        )}

      {/* Rejection info */}
      {amendment.status === 'rejected' && amendment.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Rejection Reason</Text>
          <Text style={styles.rejectionText}>{amendment.rejectionReason}</Text>
        </View>
      )}

      {/* Action buttons */}
      {amendment.status === 'pending' && !showRejectDialog && (
        <View style={styles.actions}>
          <Button
            title="Reject"
            variant="outline"
            onPress={() => setShowRejectDialog(true)}
            disabled={isSubmitting || isLoading}
            style={styles.actionButton}
          />
          {!isRequester && !hasApproved && (
            <Button
              title={isSubmitting || isLoading ? 'Approving...' : 'Approve'}
              onPress={handleApprove}
              disabled={isSubmitting || isLoading}
              style={styles.actionButton}
            />
          )}
          {hasApproved && (
            <View style={styles.approvedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.approvedText}>You approved this</Text>
            </View>
          )}
          {isRequester && (
            <View style={styles.waitingBadge}>
              <Text style={styles.waitingText}>Waiting for partner approval</Text>
            </View>
          )}
        </View>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <View style={styles.rejectDialog}>
          <Text style={styles.rejectDialogLabel}>
            Rejection Reason (Optional)
          </Text>
          <TextInput
            style={styles.rejectInput}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Explain why you're rejecting this amendment..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={3}
          />
          <View style={styles.rejectActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
              disabled={isSubmitting || isLoading}
              style={styles.actionButton}
            />
            <Button
              title={isSubmitting || isLoading ? 'Rejecting...' : 'Confirm Rejection'}
              variant="danger"
              onPress={handleReject}
              disabled={isSubmitting || isLoading}
              style={styles.actionButton}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    card: {
      padding: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: typography.size.lg,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
    },
    statusApproved: {
      backgroundColor: colors.status.success + '20',
    },
    statusRejected: {
      backgroundColor: colors.status.error + '20',
    },
    statusPending: {
      backgroundColor: colors.background.secondary,
    },
    statusError: {
      backgroundColor: colors.status.error + '20',
    },
    statusText: {
      fontSize: typography.size.xs,
      fontWeight: '500',
    },
    requesterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    requesterText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    section: {
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.text.primary,
    },
    reasonBox: {
      backgroundColor: colors.background.secondary,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
    },
    reasonText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.background.cardBorder,
      marginVertical: spacing.md,
    },
    changesGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    changesColumn: {
      flex: 1,
    },
    changesLabel: {
      fontSize: typography.size.xs,
      fontWeight: '500',
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    actRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    actText: {
      fontSize: typography.size.sm,
      color: colors.text.primary,
    },
    noneText: {
      fontSize: typography.size.sm,
      color: colors.text.tertiary,
      fontStyle: 'italic',
    },
    timeText: {
      fontSize: typography.size.sm,
      color: colors.text.primary,
    },
    timeTextBold: {
      fontWeight: '500',
    },
    approvalStatus: {
      backgroundColor: colors.background.secondary,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    approvalLabel: {
      fontSize: typography.size.xs,
      fontWeight: '500',
      color: colors.text.secondary,
      marginBottom: 2,
    },
    approvalText: {
      fontSize: typography.size.sm,
      color: colors.text.primary,
    },
    rejectionBox: {
      backgroundColor: colors.status.error + '10',
      borderWidth: 1,
      borderColor: colors.status.error + '30',
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    rejectionLabel: {
      fontSize: typography.size.xs,
      fontWeight: '500',
      color: colors.status.error,
      marginBottom: 2,
    },
    rejectionText: {
      fontSize: typography.size.sm,
      color: colors.status.error,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    actionButton: {
      flex: 1,
    },
    approvedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
    },
    approvedText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    waitingBadge: {
      marginLeft: 'auto',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
    },
    waitingText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    rejectDialog: {
      borderTopWidth: 1,
      borderTopColor: colors.background.cardBorder,
      paddingTop: spacing.md,
    },
    rejectDialogLabel: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    rejectInput: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      fontSize: typography.size.sm,
      color: colors.text.primary,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: spacing.md,
    },
    rejectActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    errorContent: {
      backgroundColor: colors.status.error + '10',
      borderWidth: 1,
      borderColor: colors.status.error + '30',
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    errorTitle: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.status.error,
      marginBottom: 4,
    },
    errorMessage: {
      fontSize: typography.size.sm,
      color: colors.status.error,
    },
  });

export default AmendmentApprovalCard;

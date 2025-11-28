import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from './Modal';
import Button from './Button';
import { UserSearch } from './UserSearch';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../lib/theme';

interface ShareDialogProps {
  visible: boolean;
  onClose: () => void;
  onShare: (recipient: string, mode: 'pmy-user' | 'email') => void;
  loading?: boolean;
}

export function ShareDialog({ visible, onClose, onShare, loading }: ShareDialogProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [shareMode, setShareMode] = useState<'pmy-user' | 'email'>('pmy-user');
  const [shareEmail, setShareEmail] = useState('');
  const [selectedPmyUser, setSelectedPmyUser] = useState<{
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  } | null>(null);

  const handleShare = () => {
    if (shareMode === 'pmy-user' && selectedPmyUser) {
      onShare(selectedPmyUser.id, 'pmy-user');
    } else if (shareMode === 'email' && shareEmail) {
      onShare(shareEmail, 'email');
    }
  };

  const handleClose = () => {
    setShareEmail('');
    setSelectedPmyUser(null);
    setShareMode('pmy-user');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Share Contract for Approval"
      description="Invite another person to review and approve this consent contract."
    >
      <View style={styles.content}>
        {/* Mode Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, shareMode === 'pmy-user' && styles.tabActive]}
            onPress={() => setShareMode('pmy-user')}
          >
            <Ionicons name="at" size={16} color={shareMode === 'pmy-user' ? colors.brand.primary : colors.text.tertiary} />
            <Text style={[styles.tabText, shareMode === 'pmy-user' && styles.tabTextActive, styles.tabTextSpacing]}>
              PMY User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, shareMode === 'email' && styles.tabActive]}
            onPress={() => setShareMode('email')}
          >
            <Ionicons name="mail" size={16} color={shareMode === 'email' ? colors.brand.primary : colors.text.tertiary} />
            <Text style={[styles.tabText, shareMode === 'email' && styles.tabTextActive, styles.tabTextSpacing]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* PMY User Tab Content */}
        {shareMode === 'pmy-user' && (
          <View style={[styles.tabContent, styles.tabContentSpacing]}>
            <Text style={styles.label}>Find a PMY user to collaborate with</Text>
            <View style={styles.userSearchSpacing}>
              <UserSearch
                onSelectUser={(user) => setSelectedPmyUser(user)}
                selectedUserId={selectedPmyUser?.id}
                placeholder="Search by username (e.g., @username)"
              />
            </View>
            {selectedPmyUser && (
              <Text style={[styles.selectedUser, styles.selectedUserSpacing]}>
                Selected: <Text style={styles.selectedUserBold}>@{selectedPmyUser.username}</Text>
                {selectedPmyUser.firstName && selectedPmyUser.lastName && (
                  <Text> ({selectedPmyUser.firstName} {selectedPmyUser.lastName})</Text>
                )}
              </Text>
            )}
          </View>
        )}

        {/* Email Tab Content */}
        {shareMode === 'email' && (
          <View style={[styles.tabContent, styles.tabContentSpacing]}>
            <Text style={styles.label}>Recipient Email</Text>
            <Text style={[styles.description, styles.descriptionSpacing]}>
              Send an invitation to someone who doesn't have PMY yet.
            </Text>
            <TextInput
              style={styles.emailInput}
              value={shareEmail}
              onChangeText={setShareEmail}
              placeholder="partner@example.com"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Actions */}
        <View style={[styles.actions, styles.actionsSpacing]}>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={loading ? "Sharing..." : "Send Invitation"}
            onPress={handleShare}
            disabled={
              loading ||
              (shareMode === 'pmy-user' && !selectedPmyUser) ||
              (shareMode === 'email' && !shareEmail)
            }
            style={[styles.shareButton, styles.shareButtonSpacing]}
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof import('../lib/theme').getColors>) => StyleSheet.create({
  content: {
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.background.primary,
  },
  tabText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
  },
  tabTextSpacing: {
    marginLeft: spacing.xs,
  },
  tabTextActive: {
    color: colors.brand.primary,
    fontWeight: typography.weight.semibold,
  },
  tabContent: {
  },
  tabContentSpacing: {
    marginTop: spacing.xl,
  },
  userSearchSpacing: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
  },
  descriptionSpacing: {
    marginTop: spacing.md,
  },
  emailInput: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.ui.borderDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.inverse,
    marginTop: spacing.md,
  },
  selectedUser: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  selectedUserSpacing: {
    marginTop: spacing.md,
  },
  selectedUserBold: {
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  actionsSpacing: {
    marginTop: spacing.xl,
  },
  shareButtonSpacing: {
    marginLeft: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
  },
});

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from './Modal';
import Button from './Button';
import { UserSearch } from './UserSearch';

interface ShareDialogProps {
  visible: boolean;
  onClose: () => void;
  onShare: (recipient: string, mode: 'pmy-user' | 'email') => void;
  loading?: boolean;
}

export function ShareDialog({ visible, onClose, onShare, loading }: ShareDialogProps) {
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
            <Ionicons name="at" size={16} color={shareMode === 'pmy-user' ? '#34C759' : '#999'} />
            <Text style={[styles.tabText, shareMode === 'pmy-user' && styles.tabTextActive, styles.tabTextSpacing]}>
              PMY User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, shareMode === 'email' && styles.tabActive]}
            onPress={() => setShareMode('email')}
          >
            <Ionicons name="mail" size={16} color={shareMode === 'email' ? '#34C759' : '#999'} />
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
              placeholderTextColor="#666"
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

const styles = StyleSheet.create({
  content: {
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  tabTextSpacing: {
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#34C759',
    fontWeight: '600',
  },
  tabContent: {
  },
  tabContentSpacing: {
    marginTop: 20,
  },
  userSearchSpacing: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#999',
  },
  descriptionSpacing: {
    marginTop: 12,
  },
  emailInput: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
  },
  selectedUser: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  selectedUserSpacing: {
    marginTop: 12,
  },
  selectedUserBold: {
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionsSpacing: {
    marginTop: 20,
  },
  shareButtonSpacing: {
    marginLeft: 12,
  },
  cancelButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#34C759',
  },
});


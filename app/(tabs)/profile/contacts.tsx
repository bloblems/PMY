import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserContacts, addUserContact, deleteUserContact } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ContactsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [newContactNickname, setNewContactNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['user-contacts', user?.id],
    queryFn: () => {
      if (!user) return [];
      return getUserContacts(user.id);
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const addContactMutation = useMutation({
    mutationFn: (contact: { contact_username: string; nickname?: string }) =>
      addUserContact(user!.id, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-contacts', user?.id] });
      setIsAddModalVisible(false);
      setNewContactUsername('');
      setNewContactNickname('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add contact');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => deleteUserContact(contactId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-contacts', user?.id] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete contact');
    },
  });

  const handleAddContact = async () => {
    if (!newContactUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    // Normalize username (remove @ if present)
    const username = newContactUsername.trim().replace(/^@/, '');

    setIsSubmitting(true);
    try {
      await addContactMutation.mutateAsync({
        contact_username: username,
        nickname: newContactNickname.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = (contactId: string, contactName: string) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${contactName} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContactMutation.mutate(contactId),
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.title}>My Contacts</Text>
          <TouchableOpacity
            onPress={() => setIsAddModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Save contacts for quick selection when creating contracts
        </Text>

        {/* Contacts List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptySubtitle}>
              Add contacts to quickly select them when creating consent contracts
            </Text>
            <Button
              title="Add Your First Contact"
              onPress={() => setIsAddModalVisible(true)}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact: any) => (
              <Card key={contact.id} style={styles.contactCard}>
                <View style={styles.contactContent}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {(contact.contact_username || contact.contactUsername || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactUsername}>
                      @{contact.contact_username || contact.contactUsername}
                    </Text>
                    {contact.nickname && (
                      <Text style={styles.contactNickname}>{contact.nickname}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteContact(
                      contact.id,
                      contact.nickname || `@${contact.contact_username || contact.contactUsername}`
                    )}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.status.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
          setNewContactUsername('');
          setNewContactNickname('');
        }}
        title="Add Contact"
      >
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username (e.g. johndoe)"
            placeholderTextColor={colors.text.tertiary}
            value={newContactUsername}
            onChangeText={setNewContactUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Nickname (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Give them a nickname"
            placeholderTextColor={colors.text.tertiary}
            value={newContactNickname}
            onChangeText={setNewContactNickname}
          />

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              onPress={() => {
                setIsAddModalVisible(false);
                setNewContactUsername('');
                setNewContactNickname('');
              }}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={isSubmitting ? "Adding..." : "Add Contact"}
              onPress={handleAddContact}
              disabled={isSubmitting || !newContactUsername.trim()}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  addButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  contactsList: {
    gap: spacing.md,
  },
  contactCard: {
    marginBottom: spacing.sm,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactAvatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.brand.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactUsername: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  contactNickname: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  modalContent: {
    paddingTop: spacing.md,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.inverse,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

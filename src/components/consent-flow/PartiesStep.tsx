import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../lib/theme';
import type { UserContact } from '../../lib/consentFlowConstants';
import type { ValidationErrors } from '../../hooks/useConsentFlowValidation';

interface PartiesStepProps {
  stepNumber: number;
  parties: string[];
  partyErrors: ValidationErrors;
  contacts: UserContact[];
  onUpdateParty: (index: number, value: string) => void;
  onRemoveParty: (index: number) => void;
  onAddParty: () => void;
  onAddContactAsParty: (contact: UserContact) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

export function PartiesStep({
  stepNumber,
  parties,
  partyErrors,
  contacts,
  onUpdateParty,
  onRemoveParty,
  onAddParty,
  onAddContactAsParty,
}: PartiesStepProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const connectAnim = useRef(new Animated.Value(0)).current;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const hasPartner = parties.length > 1 && parties[1].trim().length > 0;
  const additionalParties = parties.slice(2).filter(p => p.trim().length > 0);

  // Animate connection when partner is added
  useEffect(() => {
    if (hasPartner) {
      Animated.spring(connectAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      connectAnim.setValue(0);
    }
  }, [hasPartner, connectAnim]);

  // Subtle pulse animation for connection
  useEffect(() => {
    if (hasPartner) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [hasPartner, pulseAnim]);

  // Filter out contacts already added
  const availableContacts = contacts.filter((contact) => {
    const canonicalUsername = `@${contact.contactUsername}`;
    return !parties.some(
      (party) => party.toLowerCase() === canonicalUsername.toLowerCase()
    );
  });

  const openEditModal = (index: number) => {
    setEditValue(parties[index] || '');
    setEditingIndex(index);
  };

  const closeEditModal = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      onUpdateParty(editingIndex, editValue.trim());
      closeEditModal();
    }
  };

  const handleAddMore = () => {
    onAddParty();
    setTimeout(() => {
      setEditValue('');
      setEditingIndex(parties.length);
    }, 50);
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    if (name.startsWith('@')) name = name.slice(1);
    const parts = name.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const connectionScale = connectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const connectionOpacity = connectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Who's involved?</Text>
        <Text style={styles.subtitle}>Tap to add your partner</Text>
      </View>

      {/* Main Connection View - Two cards side by side */}
      <View style={styles.connectionView}>
        {/* You Card */}
        <View style={styles.personCard}>
          <View style={styles.cardInner}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={isDark ? ['#2C2C2E', '#1C1C1E'] : ['#F5F5F7', '#E8E8ED']}
                style={styles.avatar}
              >
                <Ionicons name="person" size={28} color={colors.text.secondary} />
              </LinearGradient>
            </View>
            <Text style={styles.personName} numberOfLines={1}>
              {parties[0] || '@you'}
            </Text>
            <Text style={styles.personRole}>You</Text>
          </View>
        </View>

        {/* Connection Indicator */}
        <View style={styles.connectionIndicator}>
          <Animated.View
            style={[
              styles.connectionLine,
              {
                opacity: connectionOpacity,
                transform: [{ scaleX: connectionScale }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.brand.primary + '00', colors.brand.primary, colors.brand.primary + '00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.connectionGradient}
            />
          </Animated.View>
          {hasPartner && (
            <Animated.View style={[styles.connectionPulse, { opacity: pulseOpacity }]}>
              <View style={[styles.connectionDot, { backgroundColor: colors.brand.primary }]} />
            </Animated.View>
          )}
          {!hasPartner && (
            <View style={styles.connectionDotEmpty}>
              <Ionicons name="link" size={14} color={colors.text.tertiary} />
            </View>
          )}
        </View>

        {/* Partner Card */}
        <TouchableOpacity
          style={styles.personCard}
          onPress={() => openEditModal(1)}
          activeOpacity={0.7}
        >
          <View style={[styles.cardInner, !hasPartner && styles.cardInnerEmpty]}>
            {hasPartner ? (
              <>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[colors.brand.primary + '30', colors.brand.primary + '15']}
                    style={[styles.avatar, styles.avatarConnected]}
                  >
                    <Text style={styles.avatarInitials}>{getInitials(parties[1])}</Text>
                  </LinearGradient>
                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {parties[1]}
                </Text>
                <Text style={styles.personRolePartner}>Partner</Text>
              </>
            ) : (
              <>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarEmpty}>
                    <Ionicons name="add" size={28} color={colors.text.tertiary} />
                  </View>
                </View>
                <Text style={styles.addPartnerText}>Add partner</Text>
                <Text style={styles.tapToAdd}>Tap to add</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Contacts - Only show when no partner */}
      {!hasPartner && availableContacts.length > 0 && (
        <View style={styles.quickContacts}>
          <Text style={styles.quickContactsLabel}>Quick add from contacts</Text>
          <View style={styles.contactChips}>
            {availableContacts.slice(0, 3).map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactChip}
                onPress={() => onAddContactAsParty(contact)}
              >
                <View style={styles.contactChipAvatar}>
                  <Text style={styles.contactChipInitial}>
                    {contact.contactUsername?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.contactChipName} numberOfLines={1}>
                  @{contact.contactUsername}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Additional Parties - Clean mini-cards */}
      {additionalParties.length > 0 && (
        <View style={styles.additionalSection}>
          <Text style={styles.additionalLabel}>Also involved</Text>
          <View style={styles.additionalList}>
            {additionalParties.map((party, idx) => {
              const actualIndex = idx + 2;
              return (
                <View key={actualIndex} style={styles.additionalCard}>
                  <TouchableOpacity
                    style={styles.additionalCardMain}
                    onPress={() => openEditModal(actualIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.additionalAvatar}>
                      <Text style={styles.additionalAvatarText}>
                        {getInitials(party)}
                      </Text>
                    </View>
                    <View style={styles.additionalInfo}>
                      <Text style={styles.additionalName} numberOfLines={1}>
                        {party}
                      </Text>
                      <Text style={styles.additionalHint}>Tap to edit</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.additionalRemove}
                    onPress={() => onRemoveParty(actualIndex)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Add More - Subtle link */}
      {hasPartner && additionalParties.length < 4 && (
        <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMore}>
          <Ionicons name="add-circle-outline" size={18} color={colors.text.tertiary} />
          <Text style={styles.addMoreText}>Add another person</Text>
        </TouchableOpacity>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editingIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeEditModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              {editingIndex === 1 ? 'Add Partner' : 'Add Person'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter their username or name
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="at" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="username or name"
                placeholderTextColor={colors.text.tertiary}
                value={editValue}
                onChangeText={setEditValue}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={saveEdit}
                returnKeyType="done"
              />
            </View>

            {partyErrors[editingIndex || 0] && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={colors.status.error} />
                <Text style={styles.errorText}>{partyErrors[editingIndex || 0]}</Text>
              </View>
            )}

            {/* Quick contacts in modal */}
            {availableContacts.length > 0 && (
              <View style={styles.modalContacts}>
                <Text style={styles.modalContactsLabel}>Contacts</Text>
                <View style={styles.modalContactsList}>
                  {availableContacts.slice(0, 4).map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.modalContactItem}
                      onPress={() => {
                        setEditValue(`@${contact.contactUsername}`);
                      }}
                    >
                      <View style={styles.modalContactAvatar}>
                        <Text style={styles.modalContactInitial}>
                          {contact.contactUsername?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <Text style={styles.modalContactName} numberOfLines={1}>
                        @{contact.contactUsername}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                style={[
                  styles.modalSaveButton,
                  !editValue.trim() && styles.modalSaveButtonDisabled,
                ]}
                disabled={!editValue.trim()}
              >
                <Text
                  style={[
                    styles.modalSaveText,
                    !editValue.trim() && styles.modalSaveTextDisabled,
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof import('../../lib/theme').getColors>,
  isDark: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: typography.size['2xl'],
      fontWeight: typography.weight.bold,
      color: colors.text.inverse,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },

    // Connection View
    connectionView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
    },
    personCard: {
      width: CARD_WIDTH,
      maxWidth: 160,
    },
    cardInner: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    cardInnerEmpty: {
      borderStyle: 'dashed',
      borderColor: colors.ui.border,
      backgroundColor: 'transparent',
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarConnected: {
      borderWidth: 2,
      borderColor: colors.brand.primary,
    },
    avatarEmpty: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.ui.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    },
    avatarInitials: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.brand.primary,
    },
    connectedBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1C1C1E' : '#F5F5F7',
    },
    personName: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: colors.text.inverse,
      marginBottom: 2,
      maxWidth: '100%',
    },
    personRole: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
    },
    personRolePartner: {
      fontSize: typography.size.xs,
      color: colors.brand.primary,
    },
    addPartnerText: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
      color: colors.text.secondary,
      marginBottom: 2,
    },
    tapToAdd: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
    },

    // Connection Indicator
    connectionIndicator: {
      width: 50,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectionLine: {
      position: 'absolute',
      width: '100%',
      height: 2,
    },
    connectionGradient: {
      flex: 1,
      borderRadius: 1,
    },
    connectionPulse: {
      position: 'absolute',
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    connectionDotEmpty: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Quick Contacts
    quickContacts: {
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    quickContactsLabel: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contactChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    contactChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: borderRadius.full,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingRight: spacing.md,
      gap: spacing.xs,
    },
    contactChipAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactChipInitial: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.semibold,
      color: colors.text.secondary,
    },
    contactChipName: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      maxWidth: 80,
    },

    // Additional Section
    additionalSection: {
      marginTop: spacing.xl,
    },
    additionalLabel: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    additionalList: {
      gap: spacing.sm,
    },
    additionalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      paddingRight: spacing.sm,
    },
    additionalCardMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      gap: spacing.md,
    },
    additionalAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    additionalAvatarText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.semibold,
      color: colors.text.secondary,
    },
    additionalInfo: {
      flex: 1,
    },
    additionalName: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
      color: colors.text.inverse,
      marginBottom: 1,
    },
    additionalHint: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
    },
    additionalRemove: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },

    // Add More
    addMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.lg,
      paddingVertical: spacing.sm,
    },
    addMoreText: {
      fontSize: typography.size.sm,
      color: colors.text.tertiary,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.background.card,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      padding: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl + 20,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.ui.border,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.text.inverse,
      marginBottom: spacing.xs,
    },
    modalSubtitle: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      marginBottom: spacing.lg,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.ui.border,
      paddingHorizontal: spacing.md,
    },
    inputIcon: {
      marginRight: spacing.xs,
    },
    modalInput: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: typography.size.lg,
      color: colors.text.inverse,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    errorText: {
      fontSize: typography.size.sm,
      color: colors.status.error,
    },
    modalContacts: {
      marginTop: spacing.lg,
    },
    modalContactsLabel: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modalContactsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    modalContactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: borderRadius.full,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingRight: spacing.md,
      gap: spacing.xs,
    },
    modalContactAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContactInitial: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.semibold,
      color: colors.text.secondary,
    },
    modalContactName: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      maxWidth: 100,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
      color: colors.text.secondary,
    },
    modalSaveButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
    },
    modalSaveButtonDisabled: {
      backgroundColor: colors.ui.border,
    },
    modalSaveText: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: '#FFFFFF',
    },
    modalSaveTextDisabled: {
      color: colors.text.tertiary,
    },
  });

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import { colors } from '../../lib/theme';
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Step {stepNumber}: Parties Involved</Text>
        <Text style={styles.subtitle}>
          Add participants by legal name or search PMY users with @username
        </Text>
      </View>

      <Card style={[styles.helpCard, styles.helpCardSpacing] as any}>
        <View style={styles.helpContent}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <View style={[styles.helpText, styles.helpTextSpacing]}>
            <Text style={styles.helpTextBold}>Legal name</Text>
            <Text style={styles.helpTextNormal}>: For partners without PMY accounts (e.g., "Jane Smith")</Text>
            <Text style={styles.helpTextBold}>@username</Text>
            <Text style={styles.helpTextNormal}>: Search our network of PMY users (e.g., "@jane_smith")</Text>
          </View>
        </View>
      </Card>

      {contacts.length > 0 && (
        <View style={[styles.contactsSection, styles.contactsSectionSpacing]}>
          <View style={styles.contactsHeader}>
            <Ionicons name="person-add" size={16} color="#666" />
            <Text style={[styles.contactsTitle, styles.contactsTitleSpacing]}>Quick Add from Contacts</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsList}>
            {contacts.map((contact) => {
              const canonicalUsername = `@${contact.contactUsername}`;
              const isAlreadyAdded = parties.some(party => 
                party.toLowerCase() === canonicalUsername.toLowerCase()
              );
              
              return (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() => !isAlreadyAdded && onAddContactAsParty(contact)}
                  disabled={isAlreadyAdded}
                  style={[
                    styles.contactBadge,
                    isAlreadyAdded && styles.contactBadgeDisabled
                  ]}
                >
                  <Ionicons name="person-add" size={12} color={isAlreadyAdded ? "#999" : colors.brand.primary} />
                  <Text style={[
                    styles.contactBadgeText,
                    isAlreadyAdded && styles.contactBadgeTextDisabled,
                    styles.contactBadgeTextSpacing
                  ]}>
                    {contact.nickname || contact.contactUsername}
                    {isAlreadyAdded && " ✓"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.partiesList, styles.partiesListSpacing]}>
        {parties.map((party, index) => (
          <View key={index} style={[styles.partyRow, index > 0 && styles.partyRowSpacing]}>
            <View style={styles.partyInputContainer}>
              <Input
                placeholder={index === 0 ? "@username (You)" : "Legal name or @username"}
                value={party}
                onChangeText={(value) => onUpdateParty(index, value)}
                error={partyErrors[index]}
                editable={index !== 0}
                style={partyErrors[index] ? styles.inputError : undefined}
              />
            </View>
            {parties.length > 1 && (
              <TouchableOpacity
                onPress={() => onRemoveParty(index)}
                style={[styles.removeButton, styles.removeButtonSpacing]}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <Button
          title="+ Add Another Participant"
          onPress={onAddParty}
          variant="outline"
          style={styles.addButton}
        />
      </View>

      {parties.some(party => party.trim() && !party.startsWith('@')) && (
        <Card style={[styles.incentiveCard, styles.incentiveCardSpacing]}>
          <View style={styles.incentiveContent}>
            <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
            <View style={[styles.incentiveText, styles.incentiveTextSpacing]}>
              <Text style={styles.incentiveTitle}>Enhanced Digital Verification Available</Text>
              <Text style={[styles.incentiveDescription, styles.incentiveDescriptionSpacing]}>
                Invite your partner to create a PMY account for digital signatures, biometric verification, and collaborative contract features.
              </Text>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  helpCard: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  helpCardSpacing: {
    marginTop: 16,
  },
  helpContent: {
    flexDirection: 'row',
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  helpTextSpacing: {
    marginLeft: 8,
  },
  helpTextBold: {
    fontWeight: '600',
    color: '#000',
  },
  helpTextNormal: {
    color: '#666',
  },
  contactsSection: {
  },
  contactsSectionSpacing: {
    marginTop: 16,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  contactsTitleSpacing: {
    marginLeft: 8,
  },
  contactsList: {
    flexDirection: 'row',
  },
  contactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: colors.brand.primary,
    marginRight: 8,
  },
  contactBadgeDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5EA',
    opacity: 0.5,
  },
  contactBadgeText: {
    fontSize: 12,
    color: colors.brand.primary,
  },
  contactBadgeTextSpacing: {
    marginLeft: 6,
  },
  contactBadgeTextDisabled: {
    color: '#999',
  },
  partiesList: {
  },
  partiesListSpacing: {
    marginTop: 16,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  partyRowSpacing: {
    marginTop: 12,
  },
  partyInputContainer: {
    flex: 1,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  removeButton: {
    paddingTop: 12,
  },
  removeButtonSpacing: {
    marginLeft: 8,
  },
  addButton: {
    marginTop: 4,
  },
  incentiveCard: {
    backgroundColor: '#E3F2FD',
    borderColor: colors.brand.primary,
  },
  incentiveCardSpacing: {
    marginTop: 16,
  },
  incentiveContent: {
    flexDirection: 'row',
  },
  incentiveText: {
    flex: 1,
  },
  incentiveTextSpacing: {
    marginLeft: 12,
  },
  incentiveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  incentiveDescription: {
    fontSize: 12,
    color: '#666',
  },
  incentiveDescriptionSpacing: {
    marginTop: 4,
  },
});


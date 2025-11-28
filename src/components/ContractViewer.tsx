import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import Card from './Card';
import Button from './Button';
import SignatureInput from './SignatureInput';

const CONTRACT_TEXT = `MUTUAL CONSENT AGREEMENT

This agreement is entered into on ${new Date().toLocaleDateString()} between the undersigned parties.

MUTUAL ACKNOWLEDGMENT OF CONSENT

Both parties hereby acknowledge and affirm that:

1. VOLUNTARY PARTICIPATION: Each party enters into this encounter freely and voluntarily, without coercion, duress, or undue influence of any kind.

2. CAPACITY: Each party confirms they are of legal age, possess the mental capacity to consent, and are not under the influence of any substance that would impair judgment or decision-making ability.

3. AFFIRMATIVE CONSENT: Each party provides clear, knowing, and voluntary consent to engage in the activities contemplated by this agreement. This consent is active and ongoing.

4. RIGHT TO WITHDRAW: Each party understands and acknowledges that consent may be withdrawn at any time, and such withdrawal will be immediately respected by the other party.

5. COMMUNICATION: Both parties agree to communicate openly and honestly throughout any encounter, ensuring mutual understanding and respect for boundaries.

6. UNDERSTANDING: Each party has read, understood, and agrees to the terms of this consent agreement.

By signing below, each party affirms their consent and understanding of the above terms.`;

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  savedSignature?: string;
  savedSignatureType?: 'draw' | 'type' | 'upload';
  savedSignatureText?: string;
}

interface ContractViewerProps {
  onContractSave?: (data: {
    contractText: string;
    signature1: string;
    signature2: string;
    signatureType?: 'draw' | 'type' | 'upload';
    signatureText?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function ContractViewer({
  onContractSave,
  isLoading = false,
}: ContractViewerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [showSignature, setShowSignature] = useState(false);
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature1Type, setSignature1Type] = useState<'draw' | 'type' | 'upload' | null>(null);
  const [signature1Text, setSignature1Text] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);
  const [signature2Type, setSignature2Type] = useState<'draw' | 'type' | 'upload' | null>(null);
  const [signature2Text, setSignature2Text] = useState<string | null>(null);
  const [shouldSaveSignature, setShouldSaveSignature] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const resetForm = () => {
    setShowSignature(false);
    setShowPreview(false);
    setSignature1(null);
    setSignature1Type(null);
    setSignature1Text(null);
    setSignature2(null);
    setSignature2Type(null);
    setSignature2Text(null);
    setShouldSaveSignature(false);
  };

  const handleSignature1Complete = (
    sig: string | null,
    type: 'draw' | 'type' | 'upload',
    text?: string
  ) => {
    setSignature1(sig);
    setSignature1Type(type);
    setSignature1Text(text || null);
  };

  const handleSignature2Complete = (
    sig: string | null,
    type: 'draw' | 'type' | 'upload',
    text?: string
  ) => {
    setSignature2(sig);
    setSignature2Type(type);
    setSignature2Text(text || null);
  };

  const handlePreview = () => {
    if (!signature1 || !signature2) {
      return;
    }
    setShowPreview(true);
  };

  const handleFinalSave = async () => {
    if (signature1 && signature2 && onContractSave) {
      await onContractSave({
        contractText: CONTRACT_TEXT,
        signature1,
        signature2,
        signatureType: signature1Type || 'draw',
        signatureText: signature1Text || undefined,
      });
      resetForm();
    }
  };

  if (!showSignature) {
    return (
      <View style={styles.container}>
        <Card style={styles.contractCard}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
          </ScrollView>
        </Card>

        <Button
          title="Proceed to Sign"
          onPress={() => setShowSignature(true)}
          style={styles.proceedButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Your Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Your Signature</Text>
            {signature1 && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.status.success}
                style={styles.checkIcon}
              />
            )}
          </View>
          <SignatureInput
            onSignatureChange={handleSignature1Complete}
            autoPopulate={true}
            showSaveOption={true}
            onSavePreferenceChange={setShouldSaveSignature}
          />
        </View>

        {/* Partner's Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Partner's Signature</Text>
            {signature2 && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.status.success}
                style={styles.checkIcon}
              />
            )}
          </View>
          <SignatureInput
            onSignatureChange={handleSignature2Complete}
            showSaveOption={false}
          />
        </View>

        {/* Timestamp Card */}
        <Card style={styles.timestampCard}>
          <Text style={styles.timestampText}>
            Signed on {new Date().toLocaleDateString()} at{' '}
            {new Date().toLocaleTimeString()}
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            onPress={resetForm}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Preview & Save"
            onPress={handlePreview}
            disabled={!signature1 || !signature2}
            style={styles.previewButton}
          />
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contract Preview</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPreview(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Review the signed contract before finalizing
            </Text>

            {/* Contract Text Preview */}
            <Card style={styles.previewCard}>
              <ScrollView
                style={styles.contractPreviewScroll}
                nestedScrollEnabled
              >
                <Text style={styles.contractPreviewText}>{CONTRACT_TEXT}</Text>
              </ScrollView>
            </Card>

            {/* Signatures Preview */}
            <View style={styles.signaturesPreview}>
              <View style={styles.signaturePreviewItem}>
                <Text style={styles.signaturePreviewLabel}>Your Signature</Text>
                <View style={styles.signaturePreviewBox}>
                  {signature1 && (
                    signature1.startsWith('data:image/svg') ? (
                      <Text style={styles.signaturePlaceholder}>
                        Signature Captured
                      </Text>
                    ) : (
                      <Image
                        source={{ uri: signature1 }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    )
                  )}
                </View>
                {signature1Text && (
                  <Text style={styles.signatureTypedText}>
                    Typed: {signature1Text}
                  </Text>
                )}
              </View>

              <View style={styles.signaturePreviewItem}>
                <Text style={styles.signaturePreviewLabel}>
                  Partner's Signature
                </Text>
                <View style={styles.signaturePreviewBox}>
                  {signature2 && (
                    signature2.startsWith('data:image/svg') ? (
                      <Text style={styles.signaturePlaceholder}>
                        Signature Captured
                      </Text>
                    ) : (
                      <Image
                        source={{ uri: signature2 }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    )
                  )}
                </View>
                {signature2Text && (
                  <Text style={styles.signatureTypedText}>
                    Typed: {signature2Text}
                  </Text>
                )}
              </View>
            </View>

            {/* Timestamp */}
            <View style={styles.timestampSection}>
              <Text style={styles.timestampLabel}>
                Timestamp: {new Date().toLocaleString()}
              </Text>
              {shouldSaveSignature && (
                <View style={styles.saveNote}>
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.text.secondary}
                  />
                  <Text style={styles.saveNoteText}>
                    Your signature will be saved for future use
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Back to Edit"
              onPress={() => setShowPreview(false)}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title={isLoading ? 'Saving...' : 'Complete & Save'}
              onPress={handleFinalSave}
              disabled={isLoading}
              icon={<Ionicons name="download-outline" size={18} color="#FFFFFF" />}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CANVAS_WIDTH = 300;

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contractCard: {
      maxHeight: 350,
      overflow: 'hidden',
    },
    scrollView: {
      maxHeight: 350,
    },
    contractText: {
      fontFamily: 'serif',
      fontSize: typography.size.sm,
      color: colors.text.primary,
      lineHeight: 22,
    },
    proceedButton: {
      marginTop: spacing.lg,
    },
    signatureSection: {
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    stepNumber: {
      fontSize: typography.size.sm,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    sectionTitle: {
      fontSize: typography.size.lg,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },
    checkIcon: {
      marginLeft: 'auto',
    },
    timestampCard: {
      backgroundColor: colors.background.secondary,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    timestampText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelButton: {
      flex: 1,
    },
    previewButton: {
      flex: 1,
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.background.cardBorder,
    },
    modalTitle: {
      fontSize: typography.size.xl,
      fontWeight: '600',
      color: colors.text.primary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    modalContent: {
      flex: 1,
      padding: spacing.lg,
    },
    modalDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      marginBottom: spacing.lg,
    },
    previewCard: {
      maxHeight: 200,
      marginBottom: spacing.lg,
    },
    contractPreviewScroll: {
      maxHeight: 200,
    },
    contractPreviewText: {
      fontFamily: 'serif',
      fontSize: typography.size.xs,
      color: colors.text.primary,
      lineHeight: 18,
    },
    signaturesPreview: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    signaturePreviewItem: {
      flex: 1,
    },
    signaturePreviewLabel: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    signaturePreviewBox: {
      borderWidth: 1,
      borderColor: colors.background.cardBorder,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      backgroundColor: colors.background.card,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    signatureImage: {
      width: '100%',
      height: '100%',
    },
    signaturePlaceholder: {
      fontSize: typography.size.sm,
      color: colors.brand.primary,
      fontWeight: '500',
    },
    signatureTypedText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    timestampSection: {
      borderTopWidth: 1,
      borderTopColor: colors.background.cardBorder,
      paddingTop: spacing.md,
    },
    timestampLabel: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    saveNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: spacing.xs,
    },
    saveNoteText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.background.cardBorder,
    },
    backButton: {
      flex: 1,
    },
    saveButton: {
      flex: 1,
    },
  });

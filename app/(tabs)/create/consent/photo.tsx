import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useConsentFlow } from '@/contexts/ConsentFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createContract, uploadPhoto } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ConsentPhotoPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      Alert.alert("Missing Information", "Please complete the consent flow from the beginning.");
      router.replace('/(tabs)/create' as `/${string}`);
    }
  }, [isHydrated, hasRequiredData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Please grant camera roll access to select a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Please grant camera access to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!photoUri) {
        throw new Error("No photo selected");
      }

      // Upload photo (React Native - pass URI directly)
      const photoUrl = await uploadPhoto(user!.id, photoUri, {
        filename: 'consent-photo.jpg',
      });

      const contractData = {
        user_id: user!.id,
        universityId: state.universityId || null,
        encounterType: state.encounterType,
        parties: state.parties.filter(p => p.trim()),
        intimateActs: JSON.stringify(state.intimateActs),
        contractStartTime: state.contractStartTime || null,
        contractDuration: state.contractDuration || null,
        contractEndTime: state.contractEndTime || null,
        method: 'photo' as const,
        contractText: `Photo consent documentation`,
        photoUrl,
        status: 'active' as const,
        isCollaborative: 'false' as const,
      };

      return createContract(contractData);
    },
    onSuccess: () => {
      Alert.alert("Success", "Consent contract created successfully");
      router.replace('/(tabs)/contracts');
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to create contract");
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.title}>Dual Selfie</Text>
          <View style={{ width: spacing.xl }} />
        </View>

        <Card style={[styles.instructionsCard, styles.instructionsCardSpacing]}>
          <Text style={styles.instructionsTitle}>Take a Photo Together</Text>
          <Text style={[styles.instructionsText, styles.instructionsTextSpacing]}>
            Take a photo of both parties together to document mutual consent. This photo serves as evidence that both parties were present and consenting at the time.
          </Text>
        </Card>

        {photoUri ? (
          <Card style={[styles.photoCard, styles.photoCardSpacing]}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={[styles.photoActions, styles.photoActionsSpacing]}>
              <Button
                title="Retake"
                onPress={() => setPhotoUri(null)}
                variant="outline"
                style={styles.retakeButton}
              />
              <Button
                title={saveMutation.isPending ? "Saving..." : "Use This Photo"}
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                style={[styles.useButton, styles.useButtonSpacing]}
              />
            </View>
          </Card>
        ) : (
          <Card style={[styles.cameraCard, styles.cameraCardSpacing]}>
            <View style={styles.cameraOptions}>
              <TouchableOpacity
                style={styles.cameraOption}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={48} color={colors.text.inverse} />
                <Text style={[styles.cameraOptionText, styles.cameraOptionTextSpacing]}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cameraOption, styles.cameraOptionSpacing]}
                onPress={pickImage}
              >
                <Ionicons name="images" size={48} color={colors.text.inverse} />
                <Text style={[styles.cameraOptionText, styles.cameraOptionTextSpacing]}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('../lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  instructionsCardSpacing: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  instructionsCard: {
  },
  instructionsTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  instructionsText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  instructionsTextSpacing: {
    marginTop: spacing.md,
  },
  cameraCard: {
    paddingVertical: spacing.xxxl,
  },
  cameraCardSpacing: {
    marginTop: spacing.lg,
  },
  cameraOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cameraOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
  },
  cameraOptionSpacing: {
    marginLeft: spacing.lg,
  },
  cameraOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.inverse,
  },
  cameraOptionTextSpacing: {
    marginTop: spacing.md,
  },
  photoCard: {
  },
  photoCardSpacing: {
    marginTop: spacing.lg,
  },
  photo: {
    width: '100%',
    height: 400,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
  },
  photoActions: {
    flexDirection: 'row',
  },
  photoActionsSpacing: {
    marginTop: spacing.md,
  },
  useButtonSpacing: {
    marginLeft: spacing.md,
  },
  retakeButton: {
    flex: 1,
  },
  useButton: {
    flex: 1,
    backgroundColor: colors.brand.primary,
  },
});


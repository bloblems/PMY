import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useConsentFlow } from '@/contexts/ConsentFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createContract, uploadAudioRecording } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ConsentVoicePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      Alert.alert("Missing Information", "Please complete the consent flow from the beginning.");
      router.replace('/(tabs)/create' as `/${string}`);
    }
  }, [isHydrated, hasRequiredData]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording, sound]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (err) {
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (err) {
      Alert.alert("Error", "Failed to play recording");
    }
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!audioUri) {
        throw new Error("No recording available");
      }

      // Upload audio file (React Native - pass URI directly)
      const audioUrl = await uploadAudioRecording(user!.id, audioUri, {
        filename: 'consent-recording.webm',
        duration: duration.toString(),
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
        method: 'voice' as const,
        contractText: `Voice consent recording - ${duration} seconds`,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.title}>Voice Recording</Text>
          <View style={{ width: spacing.xl }} />
        </View>

        <Card style={[styles.instructionsCard, styles.instructionsCardSpacing]}>
          <Text style={styles.instructionsTitle}>Record Your Consent</Text>
          <Text style={[styles.instructionsText, styles.instructionsTextSpacing]}>
            Speak clearly and state your consent agreement. Make sure to include:
            {"\n\n"}• Your name and the other party's name
            {"\n"}• The encounter type
            {"\n"}• Your explicit consent
            {"\n"}• The date and time
          </Text>
        </Card>

        <Card style={[styles.recordingCard, styles.recordingCardSpacing]}>
          <View style={styles.recordingControls}>
            {!isRecording && !audioUri && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
              >
                <Ionicons name="mic" size={48} color={colors.text.inverse} />
              </TouchableOpacity>
            )}

            {isRecording && (
              <View style={styles.recordingActive}>
                <View style={styles.recordingIndicator} />
                <Text style={[styles.recordingTime, styles.recordingTimeSpacing]}>{formatTime(duration)}</Text>
                <TouchableOpacity
                  style={[styles.stopButton, styles.stopButtonSpacing]}
                  onPress={stopRecording}
                >
                  <Ionicons name="stop" size={32} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
            )}

            {audioUri && !isRecording && (
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={isPlaying ? pausePlayback : playRecording}
                >
                  <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={colors.text.inverse} />
                </TouchableOpacity>
                <Text style={[styles.durationText, styles.durationTextSpacing]}>{formatTime(duration)}</Text>
                <TouchableOpacity
                  style={[styles.rerecordButton, styles.rerecordButtonSpacing]}
                  onPress={() => {
                    setAudioUri(null);
                    setDuration(0);
                  }}
                >
                  <Ionicons name="refresh" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>

        {audioUri && (
          <Button
            title={saveMutation.isPending ? "Saving..." : "Complete Contract"}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={[styles.completeButton, styles.completeButtonSpacing]}
          />
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
  recordingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  recordingCardSpacing: {
    marginTop: spacing.lg,
  },
  recordingControls: {
    alignItems: 'center',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingActive: {
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.error,
  },
  recordingTime: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  recordingTimeSpacing: {
    marginTop: spacing.md,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonSpacing: {
    marginTop: spacing.md,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  durationTextSpacing: {
    marginLeft: spacing.lg,
  },
  rerecordButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerecordButtonSpacing: {
    marginLeft: spacing.lg,
  },
  completeButton: {
    backgroundColor: colors.brand.primary,
    marginTop: spacing.sm,
  },
  completeButtonSpacing: {
    marginTop: spacing.lg,
  },
});


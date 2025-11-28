import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import Button from './Button';
import Card from './Card';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface AudioRecorderProps {
  onSave?: (uri: string, filename: string, duration: string) => void;
  onDelete?: () => void;
}

export default function AudioRecorder({ onSave, onDelete }: AudioRecorderProps) {
  const { colors } = useTheme();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const styles = createStyles(colors);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecordingState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (recordingRef.current && recordingState === 'recording') {
      await recordingRef.current.pauseAsync();
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = async () => {
    if (recordingRef.current && recordingState === 'paused') {
      await recordingRef.current.startAsync();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      setAudioUri(uri);
      setRecordingState('stopped');

      const date = new Date().toLocaleDateString().replace(/\//g, '-');
      setFilename(`consent-${date}.m4a`);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    }
  };

  const deleteRecording = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setAudioUri(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setFilename('');
    setIsPlaying(false);
    onDelete?.();
  };

  const saveRecording = () => {
    if (audioUri && filename) {
      const duration = formatTime(recordingTime);
      onSave?.(audioUri, filename, duration);
      deleteRecording();
    }
  };

  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.waveformBar,
              {
                height: Math.random() * 30 + 10,
                backgroundColor: colors.brand.primary,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.recorderCard}>
        <View style={styles.centerContent}>
          <Text style={styles.statusText}>
            {recordingState === 'idle' && 'Tap to start recording'}
            {recordingState === 'recording' && 'Recording in progress...'}
            {recordingState === 'paused' && 'Recording paused'}
            {recordingState === 'stopped' && 'Recording complete'}
          </Text>
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>

          {recordingState === 'recording' && renderWaveform()}

          <View style={styles.buttonRow}>
            {recordingState === 'idle' && (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Ionicons name="mic" size={32} color={colors.text.inverse} />
              </TouchableOpacity>
            )}

            {recordingState === 'recording' && (
              <>
                <TouchableOpacity style={styles.secondaryButton} onPress={pauseRecording}>
                  <Ionicons name="pause" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                  <Ionicons name="stop" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <TouchableOpacity style={styles.recordButton} onPress={resumeRecording}>
                  <Ionicons name="mic" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                  <Ionicons name="stop" size={24} color={colors.text.inverse} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Card>

      {recordingState === 'stopped' && audioUri && (
        <Card style={styles.playbackCard}>
          <Text style={styles.label}>Filename</Text>
          <TextInput
            style={styles.input}
            value={filename}
            onChangeText={setFilename}
            placeholder="consent-recording.m4a"
            placeholderTextColor={colors.text.muted}
          />

          <View style={styles.actionRow}>
            <Button
              title={isPlaying ? 'Pause' : 'Play'}
              variant="outline"
              onPress={playRecording}
              style={styles.actionButton}
            />
          </View>

          <View style={styles.actionRow}>
            <Button
              title="Save to Files"
              onPress={saveRecording}
              style={styles.actionButton}
            />
            <Button
              title="Discard"
              variant="outline"
              onPress={deleteRecording}
              style={styles.actionButton}
            />
          </View>
        </Card>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      gap: spacing.lg,
    },
    recorderCard: {
      padding: spacing.xl,
    },
    centerContent: {
      alignItems: 'center',
      gap: spacing.lg,
    },
    statusText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    timerText: {
      fontSize: 48,
      fontWeight: '600',
      color: colors.text.primary,
      fontVariant: ['tabular-nums'],
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      width: '100%',
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      gap: 4,
    },
    waveformBar: {
      width: 4,
      borderRadius: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    recordButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.status.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playbackCard: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    label: {
      fontSize: typography.size.sm,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.size.md,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.background.cardBorder,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  });

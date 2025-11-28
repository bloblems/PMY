import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/lib/theme';
import Card from './Card';

interface FileItem {
  id: string;
  name: string;
  type: 'audio' | 'contract';
  date: string;
  duration?: string;
}

interface FileListProps {
  files: FileItem[];
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FileList({ files, onDownload, onDelete }: FileListProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (files.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIcon}>
            <Ionicons name="musical-notes" size={24} color={colors.text.secondary} />
          </View>
          <Text style={styles.emptyTitle}>No saved files</Text>
          <Text style={styles.emptyDescription}>
            Your records and contracts will appear here
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {files.map((file) => (
        <Card key={file.id} style={styles.fileCard}>
          <View style={styles.fileRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={file.type === 'audio' ? 'musical-notes' : 'document-text'}
                size={20}
                color={colors.brand.primary}
              />
            </View>

            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <View style={styles.fileMeta}>
                <Ionicons name="time" size={12} color={colors.text.secondary} />
                <Text style={styles.fileMetaText}>{file.date}</Text>
                {file.duration && (
                  <>
                    <Text style={styles.fileMetaText}>•</Text>
                    <Text style={styles.fileMetaText}>{file.duration}</Text>
                  </>
                )}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {file.type === 'audio' ? 'Audio Recording' : 'Signed Contract'}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDownload(file.id)}
              >
                <Ionicons name="download-outline" size={20} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDelete(file.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.status.error} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    emptyCard: {
      padding: spacing.xxl,
    },
    emptyContent: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.primary,
    },
    emptyDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    fileCard: {
      padding: spacing.md,
    },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    fileName: {
      fontSize: typography.size.md,
      fontWeight: '500',
      color: colors.text.primary,
    },
    fileMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    fileMetaText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
    },
    badgeText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    actions: {
      gap: spacing.sm,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

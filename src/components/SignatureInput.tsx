import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Button from './Button';

type SignatureType = 'draw' | 'type' | 'upload' | 'saved';

interface Point {
  x: number;
  y: number;
}

interface SignatureInputProps {
  onSignatureChange: (signature: string | null, type: SignatureType, text?: string) => void;
  savedSignature?: string | null;
  savedSignatureType?: string | null;
  savedSignatureText?: string | null;
  initialSignature?: string | null;
  autoPopulate?: boolean;
  showSaveOption?: boolean;
  onSavePreferenceChange?: (save: boolean) => void;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
}

const CANVAS_HEIGHT = 200;
const CANVAS_WIDTH = Dimensions.get('window').width - 80;

export default function SignatureInput({
  onSignatureChange,
  savedSignature,
  savedSignatureType,
  savedSignatureText,
  initialSignature,
  autoPopulate = false,
  showSaveOption = true,
  onSavePreferenceChange,
  onDrawingStart,
  onDrawingEnd,
}: SignatureInputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [activeTab, setActiveTab] = useState<SignatureType>('draw');
  const [typedName, setTypedName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [saveForLater, setSaveForLater] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Drawing state - track actual paths
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const currentPathRef = useRef<Point[]>([]);
  const canvasRef = useRef<View>(null);

  // Auto-populate with saved signature if available
  useEffect(() => {
    if (autoPopulate && savedSignature && !currentSignature) {
      setCurrentSignature(savedSignature);
      onSignatureChange(savedSignature, (savedSignatureType as SignatureType) || 'draw', savedSignatureText || undefined);
      setActiveTab('saved');
    }
  }, [autoPopulate, savedSignature]);

  const tabs: { id: SignatureType; label: string; icon: string }[] = [
    { id: 'draw', label: 'Draw', icon: 'brush' },
    { id: 'type', label: 'Type', icon: 'text' },
    { id: 'upload', label: 'Upload', icon: 'cloud-upload' },
    ...(savedSignature ? [{ id: 'saved' as SignatureType, label: 'Saved', icon: 'bookmark' }] : []),
  ];

  // Get touch position relative to canvas
  const getTouchPosition = (event: GestureResponderEvent): Point | null => {
    const { locationX, locationY } = event.nativeEvent;
    // Ensure point is within canvas bounds
    if (locationX >= 0 && locationX <= CANVAS_WIDTH && locationY >= 0 && locationY <= CANVAS_HEIGHT) {
      return { x: locationX, y: locationY };
    }
    return null;
  };

  // Refs for callbacks (to avoid stale closure issues)
  const onDrawingStartRef = useRef(onDrawingStart);
  const onDrawingEndRef = useRef(onDrawingEnd);
  useEffect(() => {
    onDrawingStartRef.current = onDrawingStart;
    onDrawingEndRef.current = onDrawingEnd;
  }, [onDrawingStart, onDrawingEnd]);

  // Pan responder for drawing - capture to prevent ScrollView interference
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event) => {
        const point = getTouchPosition(event);
        if (point) {
          currentPathRef.current = [point];
          setCurrentPath([point]);
          setIsDrawing(true);
          onDrawingStartRef.current?.();
        }
      },
      onPanResponderMove: (event) => {
        const point = getTouchPosition(event);
        if (point) {
          currentPathRef.current = [...currentPathRef.current, point];
          setCurrentPath([...currentPathRef.current]);
        }
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current.length > 0) {
          setPaths(prev => [...prev, currentPathRef.current]);
          currentPathRef.current = [];
          setCurrentPath([]);
        }
        setIsDrawing(false);
        onDrawingEndRef.current?.();
      },
      onPanResponderTerminate: () => {
        // Handle interrupted gesture
        if (currentPathRef.current.length > 0) {
          setPaths(prev => [...prev, currentPathRef.current]);
          currentPathRef.current = [];
          setCurrentPath([]);
        }
        setIsDrawing(false);
        onDrawingEndRef.current?.();
      },
    })
  ).current;

  // Convert points to SVG path string
  const pointsToPath = (points: Point[]): string => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      // Use quadratic bezier for smoother curves
      if (i < points.length - 1) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
      } else {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    return path;
  };

  const hasDrawn = paths.length > 0 || currentPath.length > 0;
  const canUndo = paths.length > 0;

  const clearDrawing = () => {
    setPaths([]);
    setCurrentPath([]);
    setCurrentSignature(null);
    onSignatureChange(null, 'draw');
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      const newPaths = [...paths];
      newPaths.pop();
      setPaths(newPaths);
      setCurrentSignature(null);
      onSignatureChange(null, 'draw');
    }
  };

  const saveDrawing = async () => {
    if (paths.length === 0) {
      Alert.alert('No Signature', 'Please draw your signature first.');
      return;
    }

    // Generate SVG from the drawn paths
    const allPaths = paths.map(p => pointsToPath(p)).filter(p => p.length > 0);
    const pathElements = allPaths.map(d =>
      `<path d="${d}" stroke="#000000" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}"><rect width="100%" height="100%" fill="white"/>${pathElements}</svg>`;

    // Encode to base64 (handle unicode properly)
    const base64 = btoa(unescape(encodeURIComponent(svgContent)));
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    setCurrentSignature(dataUrl);
    onSignatureChange(dataUrl, 'draw');
  };

  const generateTypedSignature = () => {
    if (!typedName.trim()) {
      Alert.alert('No Name', 'Please enter your name.');
      return;
    }
    // Create a cursive-style text SVG
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}"><rect width="100%" height="100%" fill="white"/><text x="${CANVAS_WIDTH/2}" y="${CANVAS_HEIGHT/2 + 10}" font-family="cursive, serif" font-size="48" font-style="italic" text-anchor="middle" fill="black">${escapeXml(typedName)}</text></svg>`;
    const base64 = btoa(svgContent);
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    setCurrentSignature(dataUrl);
    onSignatureChange(dataUrl, 'type', typedName);
  };

  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 2],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const dataUrl = `data:image/png;base64,${result.assets[0].base64}`;
      setUploadedImage(dataUrl);
      setCurrentSignature(dataUrl);
      onSignatureChange(dataUrl, 'upload');
    }
  };

  const useSavedSignature = () => {
    if (savedSignature) {
      setCurrentSignature(savedSignature);
      onSignatureChange(savedSignature, (savedSignatureType as SignatureType) || 'draw', savedSignatureText || undefined);
    }
  };

  const handleSavePreferenceChange = (save: boolean) => {
    setSaveForLater(save);
    onSavePreferenceChange?.(save);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'draw':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.instructions}>Draw your signature below</Text>

            {/* Canvas */}
            <View
              ref={canvasRef}
              style={[styles.canvas, hasDrawn && styles.canvasActive]}
              {...panResponder.panHandlers}
            >
              <Svg
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={styles.svgCanvas}
              >
                {/* Render completed paths */}
                {paths.map((pathPoints, index) => {
                  const d = pointsToPath(pathPoints);
                  return d ? (
                    <Path
                      key={`path-${index}`}
                      d={d}
                      stroke={colors.text.inverse}
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null;
                })}
                {/* Render current path being drawn */}
                {currentPath.length > 1 && (
                  <Path
                    d={pointsToPath(currentPath)}
                    stroke={colors.text.inverse}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </Svg>
              {/* Show placeholder hint only when canvas is empty */}
              {!hasDrawn && (
                <View style={styles.canvasPlaceholderOverlay}>
                  <Ionicons name="pencil-outline" size={32} color={colors.text.tertiary} />
                  <Text style={styles.canvasHint}>Sign here</Text>
                </View>
              )}
            </View>

            {/* Action buttons - Undo and Clear */}
            <View style={styles.canvasActionsRow}>
              <View style={styles.undoRedoContainer}>
                <TouchableOpacity
                  style={[styles.iconButton, !canUndo && styles.iconButtonDisabled]}
                  onPress={handleUndo}
                  disabled={!canUndo}
                >
                  <Ionicons name="arrow-undo" size={20} color={canUndo ? colors.text.inverse : colors.text.tertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, !hasDrawn && styles.iconButtonDisabled]}
                  onPress={clearDrawing}
                  disabled={!hasDrawn}
                >
                  <Ionicons name="trash-outline" size={20} color={hasDrawn ? colors.status.error : colors.text.tertiary} />
                </TouchableOpacity>
              </View>
              <Button
                title="Use This Signature"
                onPress={saveDrawing}
                size="small"
                disabled={paths.length === 0}
                style={styles.useSignatureButton}
              />
            </View>
          </View>
        );

      case 'type':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.instructions}>Type your name to generate a signature</Text>
            <TextInput
              style={styles.nameInput}
              value={typedName}
              onChangeText={setTypedName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
            />
            {typedName.trim() && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View style={styles.typedPreview}>
                  <Text style={styles.typedSignature}>{typedName}</Text>
                </View>
              </View>
            )}
            <Button
              title="Use This Signature"
              onPress={generateTypedSignature}
              disabled={!typedName.trim()}
              style={styles.useButton}
            />
          </View>
        );

      case 'upload':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.instructions}>Upload an image of your signature</Text>
            {uploadedImage ? (
              <View style={styles.uploadedContainer}>
                <Image
                  source={{ uri: uploadedImage }}
                  style={styles.uploadedImage}
                  resizeMode="contain"
                />
                <Button
                  title="Choose Different Image"
                  onPress={pickImage}
                  variant="outline"
                  style={styles.useButton}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                <Ionicons name="cloud-upload-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.uploadText}>Tap to upload signature image</Text>
                <Text style={styles.uploadHint}>PNG, JPG (max 5MB)</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'saved':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.instructions}>Use your saved signature</Text>
            {savedSignature ? (
              <View style={styles.savedContainer}>
                <View style={styles.savedPreview}>
                  {savedSignatureType === 'type' && savedSignatureText ? (
                    <Text style={styles.typedSignature}>{savedSignatureText}</Text>
                  ) : savedSignature.startsWith('data:image/svg') ? (
                    <View style={styles.signedIndicator}>
                      <Ionicons name="checkmark-circle" size={48} color={colors.brand.primary} />
                      <Text style={styles.signedText}>Saved Signature</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: savedSignature }}
                      style={styles.savedImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text style={styles.savedTypeLabel}>
                  Type: {savedSignatureType || 'Unknown'}
                </Text>
                <Button
                  title="Use Saved Signature"
                  onPress={useSavedSignature}
                  style={styles.useButton}
                />
              </View>
            ) : (
              <View style={styles.noSavedContainer}>
                <Ionicons name="bookmark-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.noSavedText}>No saved signature</Text>
                <Text style={styles.noSavedHint}>
                  Create a signature and save it for future use
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? colors.brand.primary : colors.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Current Signature Preview */}
      {currentSignature && (
        <View style={styles.currentSignature}>
          <Text style={styles.currentLabel}>Current Signature:</Text>
          {currentSignature.startsWith('data:image/svg') ? (
            <View style={styles.signaturePreviewBox}>
              <Text style={styles.signatureCheckmark}>Signature Captured</Text>
            </View>
          ) : (
            <Image
              source={{ uri: currentSignature }}
              style={styles.signaturePreview}
              resizeMode="contain"
            />
          )}
        </View>
      )}

      {/* Save for Later Option */}
      {showSaveOption && currentSignature && (
        <TouchableOpacity
          style={styles.saveOption}
          onPress={() => handleSavePreferenceChange(!saveForLater)}
        >
          <Ionicons
            name={saveForLater ? 'checkbox' : 'square-outline'}
            size={24}
            color={saveForLater ? colors.brand.primary : colors.text.secondary}
          />
          <Text style={styles.saveOptionText}>
            Save this signature for future contracts
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
      padding: 4,
      marginBottom: spacing.md,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      gap: 4,
    },
    tabActive: {
      backgroundColor: colors.background.card,
    },
    tabText: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      fontWeight: typography.weight.medium,
    },
    tabTextActive: {
      color: colors.brand.primary,
      fontWeight: typography.weight.semibold,
    },
    tabContent: {
      minHeight: 280,
    },
    instructions: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    canvas: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.ui.border,
      borderStyle: 'dashed',
      overflow: 'hidden',
      position: 'relative',
    },
    canvasActive: {
      borderColor: colors.brand.primary,
      borderStyle: 'solid',
    },
    svgCanvas: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    canvasPlaceholderOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    canvasHint: {
      fontSize: typography.size.sm,
      color: colors.text.tertiary,
    },
    canvasActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    undoRedoContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.dark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonDisabled: {
      opacity: 0.4,
    },
    useSignatureButton: {
      minWidth: 150,
    },
    signedIndicator: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    signedText: {
      fontSize: typography.size.md,
      color: colors.brand.primary,
      fontWeight: typography.weight.medium,
    },
    nameInput: {
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.size.lg,
      color: colors.text.inverse,
      borderWidth: 1,
      borderColor: colors.ui.border,
      marginBottom: spacing.md,
    },
    previewContainer: {
      marginBottom: spacing.md,
    },
    previewLabel: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    typedPreview: {
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
    },
    typedSignature: {
      fontSize: 32,
      fontStyle: 'italic',
      color: colors.text.inverse,
      fontFamily: 'serif',
    },
    useButton: {
      marginTop: spacing.md,
    },
    uploadArea: {
      borderWidth: 2,
      borderColor: colors.ui.border,
      borderStyle: 'dashed',
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 180,
    },
    uploadText: {
      fontSize: typography.size.md,
      color: colors.text.secondary,
      marginTop: spacing.md,
    },
    uploadHint: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      marginTop: spacing.xs,
    },
    uploadedContainer: {
      alignItems: 'center',
    },
    uploadedImage: {
      width: '100%',
      height: CANVAS_HEIGHT,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
    },
    savedContainer: {
      alignItems: 'center',
    },
    savedPreview: {
      width: '100%',
      height: CANVAS_HEIGHT,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.ui.border,
    },
    savedImage: {
      width: '100%',
      height: '100%',
    },
    savedTypeLabel: {
      fontSize: typography.size.xs,
      color: colors.text.tertiary,
      marginTop: spacing.sm,
      textTransform: 'capitalize',
    },
    noSavedContainer: {
      alignItems: 'center',
      padding: spacing.xl,
    },
    noSavedText: {
      fontSize: typography.size.md,
      color: colors.text.secondary,
      marginTop: spacing.md,
    },
    noSavedHint: {
      fontSize: typography.size.sm,
      color: colors.text.tertiary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    currentSignature: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.ui.border,
    },
    currentLabel: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      marginBottom: spacing.sm,
    },
    signaturePreviewBox: {
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
    },
    signatureCheckmark: {
      fontSize: typography.size.md,
      color: colors.brand.primary,
      fontWeight: typography.weight.medium,
    },
    signaturePreview: {
      width: '100%',
      height: 100,
      backgroundColor: colors.background.dark,
      borderRadius: borderRadius.md,
    },
    saveOption: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.ui.border,
      gap: spacing.sm,
    },
    saveOptionText: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      flex: 1,
    },
  });

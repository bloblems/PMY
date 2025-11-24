import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addMinutes, format } from 'date-fns';
import Card from '../Card';
import Button from '../Button';
import { colors } from '../../lib/theme';

interface ContractDurationStepProps {
  contractStartTime?: string;
  contractDuration?: number;
  contractEndTime?: string;
  onUpdate: (updates: {
    contractStartTime?: string;
    contractDuration?: number;
    contractEndTime?: string;
  }) => void;
}

type PanelType = 'presets' | 'manual' | null;

export default function ContractDurationStep({
  contractStartTime,
  contractDuration,
  contractEndTime,
  onUpdate,
}: ContractDurationStepProps) {
  const [isDurationEnabled, setIsDurationEnabled] = useState(() => {
    return !!(contractStartTime || contractDuration || contractEndTime);
  });

  const [expandedPanel, setExpandedPanel] = useState<PanelType>(null);

  const [startDateTime, setStartDateTime] = useState<Date>(() => {
    if (contractStartTime) {
      return new Date(contractStartTime);
    }
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });

  const [duration, setDuration] = useState<number>(() => {
    return contractDuration || 120; // Default 2 hours
  });

  const startDateTimeKey = useMemo(() => startDateTime.toISOString(), [startDateTime]);
  const lastSentRef = useRef<{
    contractStartTime?: string;
    contractDuration?: number;
    contractEndTime?: string;
  }>({});

  useEffect(() => {
    if (!isDurationEnabled) {
      if (lastSentRef.current.contractDuration !== undefined) {
        onUpdate({
          contractStartTime: undefined,
          contractDuration: undefined,
          contractEndTime: undefined,
        });
        lastSentRef.current = {};
      }
      return;
    }

    if (duration <= 0) {
      return;
    }

    const calculatedEndDateTime = addMinutes(startDateTime, duration);

    const updates = {
      contractStartTime: startDateTime.toISOString(),
      contractDuration: duration,
      contractEndTime: calculatedEndDateTime.toISOString(),
    };

    const hasChanged = 
      lastSentRef.current.contractStartTime !== updates.contractStartTime ||
      lastSentRef.current.contractDuration !== updates.contractDuration ||
      lastSentRef.current.contractEndTime !== updates.contractEndTime;

    if (hasChanged) {
      lastSentRef.current = updates;
      onUpdate(updates);
    }
  }, [isDurationEnabled, startDateTimeKey, duration, onUpdate]);

  const enableDuration = () => {
    setIsDurationEnabled(true);
  };

  const disableDuration = () => {
    setIsDurationEnabled(false);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setStartDateTime(now);
    setDuration(120);
  };

  const durationPresets = [
    { label: "1 Hour", minutes: 60 },
    { label: "3 Hours", minutes: 180 },
    { label: "Overnight", minutes: 720 },
    { label: "Weekend", minutes: 2880 },
  ];

  const formatDuration = (minutes: number) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    
    return parts.length > 0 ? parts.join(" ") : "0m";
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseDateTimeLocal = (value: string) => {
    return new Date(value);
  };

  const handleStartTimeInputChange = (value: string) => {
    const newDate = parseDateTimeLocal(value);
    if (!isNaN(newDate.getTime())) {
      setStartDateTime(newDate);
    }
  };

  const now = Date.now();
  const isStartTimeInPast = startDateTime.getTime() < now;
  const endDateTime = addMinutes(startDateTime, duration);
  const isEndTimeInPast = endDateTime.getTime() < now;
  const isStartTimeTooOld = startDateTime.getTime() < (now - 24 * 60 * 60 * 1000);

  const handleDurationInputChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes) && minutes > 0) {
      setDuration(minutes);
    }
  };

  const handlePresetClick = (minutes: number) => {
    setDuration(minutes);
  };

  const togglePanel = (panel: PanelType) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  return (
    <View style={styles.container}>
      {!isDurationEnabled ? (
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Contract Duration</Text>
            <Text style={styles.cardDescription}>
              Define when this consent starts and how long it's valid (optional)
            </Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.infoText}>
              By default, consent remains valid until revoked by either party. 
              You can optionally set a specific duration for this contract.
            </Text>
            <Button
              title="Set Contract Duration"
              onPress={enableDuration}
              style={[styles.enableButton, styles.enableButtonSpacing] as any}
            />
          </View>
        </Card>
      ) : (
        <View style={[styles.enabledContainer, styles.enabledContainerSpacing]}>
          {/* Quick Presets */}
          <View style={[styles.panelSection, styles.panelSectionSpacing]}>
            {expandedPanel !== 'presets' ? (
              <Button
                title="⚡ Quick Presets"
                onPress={() => togglePanel('presets')}
                variant="outline"
                style={styles.panelToggle}
              />
            ) : (
              <Card>
                <View style={styles.panelHeader}>
                  <View style={styles.panelHeaderLeft}>
                    <Ionicons name="flash" size={20} color="#fff" />
                    <Text style={[styles.panelTitle, styles.panelTitleSpacing]}>Quick Presets</Text>
                  </View>
                  <TouchableOpacity onPress={() => togglePanel('presets')}>
                    <Text style={styles.collapseText}>Collapse</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.panelDescription}>Select a common duration</Text>
                <View style={styles.presetsGrid}>
                  {durationPresets.map((preset, index) => {
                    const isSelected = duration === preset.minutes;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        onPress={() => handlePresetClick(preset.minutes)}
                        activeOpacity={0.7}
                      >
                        <Card style={[
                          styles.presetCard,
                          isSelected && styles.presetCardSelected,
                          index % 2 === 1 && styles.presetCardRightSpacing,
                          index >= 2 && styles.presetCardBottomSpacing
                        ].filter(Boolean) as any}>
                          <Text style={styles.presetLabel}>{preset.label}</Text>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}
          </View>

          {/* Manual Entry */}
          <View style={[styles.panelSection, styles.panelSectionSpacing]}>
            {expandedPanel !== 'manual' ? (
              <Button
                title="✏️ Manual Entry"
                onPress={() => togglePanel('manual')}
                variant="outline"
                style={styles.panelToggle}
              />
            ) : (
              <Card>
                <View style={styles.panelHeader}>
                  <View style={styles.panelHeaderLeft}>
                    <Ionicons name="create" size={20} color="#fff" />
                    <Text style={styles.panelTitle}>Manual Entry</Text>
                  </View>
                  <TouchableOpacity onPress={() => togglePanel('manual')}>
                    <Text style={styles.collapseText}>Collapse</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.panelDescription}>Set custom start time and duration</Text>
                <View style={styles.manualInputs}>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Ionicons name="calendar" size={16} color="#999" />
                      <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>Start Date & Time</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        isEndTimeInPast && styles.inputError
                      ]}
                      value={formatDateTimeLocal(startDateTime)}
                      onChangeText={handleStartTimeInputChange}
                      placeholder="YYYY-MM-DDTHH:mm"
                    />
                    {isEndTimeInPast && (
                      <Text style={styles.errorText}>
                        Error: Contract end time is in the past. Please choose a future end time.
                      </Text>
                    )}
                    {!isEndTimeInPast && isStartTimeTooOld && (
                      <Text style={styles.warningText}>
                        Warning: Start time is more than 24 hours in the past.
                      </Text>
                    )}
                  </View>
                  
                  <View style={[styles.inputGroup, styles.inputGroupSpacing]}>
                    <View style={styles.inputLabelRow}>
                      <Ionicons name="time" size={16} color="#999" />
                      <Text style={[styles.inputLabel, styles.inputLabelSpacing]}>Duration (minutes)</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={duration.toString()}
                      onChangeText={handleDurationInputChange}
                      keyboardType="numeric"
                    />
                    <Text style={styles.durationInfo}>
                      {formatDuration(duration)} • Ends: {format(endDateTime, "MMM d, yyyy 'at' h:mm a")}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </View>

          <Button
            title="Remove Duration"
            onPress={disableDuration}
            variant="outline"
            style={[styles.removeButton, styles.removeButtonSpacing]}
          />
        </View>
      )}

      {/* Info Card */}
      <Card style={[styles.infoCard, styles.infoCardSpacing]}>
        <Text style={styles.infoCardText}>
          <Text style={styles.infoCardBold}>Optional:</Text> Setting a duration helps establish clear boundaries and expectations. 
          If no duration is set, the consent remains valid until revoked by either party.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
  },
  cardContent: {
  },
  infoText: {
    fontSize: 14,
    color: '#999',
  },
  enableButton: {
    marginTop: 8,
  },
  enableButtonSpacing: {
    marginTop: 12,
  },
  enabledContainer: {
  },
  enabledContainerSpacing: {
    marginTop: 16,
  },
  panelSection: {
  },
  panelSectionSpacing: {
    marginTop: 12,
  },
  panelToggle: {
    width: '100%',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  panelTitleSpacing: {
    marginLeft: 8,
  },
  collapseText: {
    fontSize: 14,
    color: colors.brand.primary,
  },
  panelDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    alignItems: 'center',
  },
  presetCardRightSpacing: {
    marginLeft: 8,
  },
  presetCardBottomSpacing: {
    marginTop: 8,
  },
  presetCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: '#1C3A1F',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  manualInputs: {
  },
  inputGroup: {
  },
  inputGroupSpacing: {
    marginTop: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  inputLabelSpacing: {
    marginLeft: 6,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
  },
  durationInfo: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    marginTop: 8,
  },
  removeButtonSpacing: {
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: '#1C3A1F',
    borderColor: '#34C759',
  },
  infoCardSpacing: {
    marginTop: 16,
  },
  infoCardText: {
    fontSize: 14,
    color: '#999',
  },
  infoCardBold: {
    fontWeight: '600',
    color: '#fff',
  },
});


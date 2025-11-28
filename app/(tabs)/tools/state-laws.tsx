import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAllStateLaws, getStateLaw } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, borderRadius, layout } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import { US_STATES } from '@/lib/constants';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StateLawInfo from '@/components/StateLawInfo';

// State flag URLs from Flagpedia (high quality, free to use)
const getStateFlagUrl = (stateCode: string) => {
  return `https://flagcdn.com/w80/us-${stateCode.toLowerCase()}.png`;
};

export default function StateLawsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stateLaws, isLoading } = useQuery({
    queryKey: ['state-laws'],
    queryFn: getAllStateLaws,
  });

  const { data: selectedStateLaw, isLoading: stateLawLoading } = useQuery({
    queryKey: ['state-law', selectedStateCode],
    queryFn: () => selectedStateCode ? getStateLaw(selectedStateCode) : null,
    enabled: !!selectedStateCode,
  });

  const filteredStates = useMemo(() => {
    if (!searchQuery) return US_STATES;
    return US_STATES.filter((state: { code: string; name: string }) =>
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const selectedStateName = US_STATES.find(s => s.code === selectedStateCode)?.name;

  const styles = createStyles(colors);

  // If a state is selected and we have data, show the full state law info page
  if (selectedStateCode && selectedStateLaw) {
    return (
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* State Selector */}
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.selectorText} numberOfLines={1}>
              {selectedStateLaw.stateName}
            </Text>
            <Ionicons 
              name={showDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>

          {showDropdown && (
            <Card style={styles.dropdownCard}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {filteredStates.map((state: { code: string; name: string }) => {
                  const hasData = stateLaws?.some(sl => sl.stateCode === state.code);
                  return (
                    <TouchableOpacity
                      key={state.code}
                      style={[
                        styles.dropdownItem,
                        state.code === selectedStateCode && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedStateCode(state.code);
                        setShowDropdown(false);
                      }}
                    >
                      <View style={styles.dropdownItemRow}>
                        <Image
                          source={{ uri: getStateFlagUrl(state.code) }}
                          style={styles.stateFlag}
                          resizeMode="cover"
                        />
                        <View style={styles.dropdownItemContent}>
                          <Text style={[
                            styles.dropdownItemText,
                            state.code === selectedStateCode && styles.dropdownItemTextSelected
                          ]}>
                            {state.name}
                          </Text>
                          <Text style={styles.dropdownItemSubtext}>{state.code}</Text>
                        </View>
                      </View>
                      <View style={styles.dropdownItemRight}>
                        {hasData && (
                          <View style={styles.availableBadge}>
                            <Text style={styles.availableText}>Available</Text>
                          </View>
                        )}
                        {state.code === selectedStateCode && (
                          <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Card>
          )}

          {/* Continue to Home Button */}
          <Button
            title="Continue to Home"
            onPress={() => router.push('/(tabs)')}
            style={styles.continueButton}
            icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            iconPosition="right"
          />

          {/* State Law Info Component */}
          <StateLawInfo
            stateCode={selectedStateLaw.stateCode}
            stateName={selectedStateLaw.stateName}
            ageOfConsent={selectedStateLaw.ageOfConsent}
            affirmativeConsentRequired={selectedStateLaw.affirmativeConsentRequired}
            romeoJulietLaw={selectedStateLaw.romeoJulietLaw}
            consentLawInfo={selectedStateLaw.consentLawInfo}
            reportingRequirements={selectedStateLaw.reportingRequirements}
            sourceUrl={selectedStateLaw.sourceUrl}
            lastUpdated={formatDate(selectedStateLaw.lastUpdated)}
            verifiedAt={selectedStateLaw.verifiedAt}
          />
        </ScrollView>
      </View>
    );
  }

  // State list view
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>State Consent Laws</Text>
        <Text style={styles.subtitle}>Select a state to view consent laws and legal requirements</Text>

        {/* State Selector */}
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={[styles.selectorText, styles.selectorPlaceholder]}>
            Select a state...
          </Text>
          <Ionicons 
            name={showDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.text.secondary} 
          />
        </TouchableOpacity>

        {showDropdown && (
          <Card style={styles.dropdownCard}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.brand.primary} />
                  <Text style={styles.loadingText}>Loading state laws...</Text>
                </View>
              ) : filteredStates.length > 0 ? (
                filteredStates.map((state: { code: string; name: string }) => {
                  const hasData = stateLaws?.some(sl => sl.stateCode === state.code);
                  return (
                    <TouchableOpacity
                      key={state.code}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedStateCode(state.code);
                        setShowDropdown(false);
                      }}
                    >
                      <View style={styles.dropdownItemRow}>
                        <Image
                          source={{ uri: getStateFlagUrl(state.code) }}
                          style={styles.stateFlag}
                          resizeMode="cover"
                        />
                        <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownItemText}>{state.name}</Text>
                          <Text style={styles.dropdownItemSubtext}>{state.code}</Text>
                        </View>
                      </View>
                      <View style={styles.dropdownItemRight}>
                        {hasData && (
                          <View style={styles.availableBadge}>
                            <Text style={styles.availableText}>Available</Text>
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No states found</Text>
              )}
            </ScrollView>
          </Card>
        )}

        {/* Show StateLawInfo with static sections even when no state selected */}
        {!showDropdown && (
          <>
            <Card style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="scale" size={32} color={colors.brand.primary} />
              </View>
              <Text style={styles.infoTitle}>State Consent Laws</Text>
              <Text style={styles.infoText}>
                Consent laws vary by state. Select your state above to view the 
                age of consent, affirmative consent requirements, close-in-age 
                exemptions, and mandatory reporting requirements.
              </Text>
            </Card>
            
            {/* Static sections always visible */}
            <StateLawInfo />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xxxl,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  selectorText: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flex: 1,
  },
  selectorPlaceholder: {
    color: colors.text.tertiary,
  },
  dropdownCard: {
    marginBottom: spacing.md,
    padding: 0,
    maxHeight: 300,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.brand.primary + '10',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: colors.brand.primary,
  },
  dropdownItemSubtext: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dropdownItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateFlag: {
    width: 36,
    height: 24,
    borderRadius: borderRadius.xs,
    marginRight: spacing.md,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  availableBadge: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  availableText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },
  continueButton: {
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  infoCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

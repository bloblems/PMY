import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAllUniversities, getUniversity } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, borderRadius, layout } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import TitleIXInfo from '@/components/TitleIXInfo';

// Helper to get university initials for fallback
const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(word => !['of', 'the', 'at', 'and', '&'].includes(word.toLowerCase()))
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

// Get university logo URL - tries custom logoUrl, then Clearbit, then returns null for initials fallback
const getUniversityLogoUrl = (uni: any) => {
  if (uni.logoUrl || uni.logo_url) {
    return uni.logoUrl || uni.logo_url;
  }
  if (uni.domain) {
    return `https://logo.clearbit.com/${uni.domain}`;
  }
  return null;
};

export default function TitleIXScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: getAllUniversities,
  });

  const { data: selectedUniversity, isLoading: universityLoading } = useQuery({
    queryKey: ['university', selectedUniversityId],
    queryFn: () => selectedUniversityId ? getUniversity(selectedUniversityId) : null,
    enabled: !!selectedUniversityId,
  });

  const filteredUniversities = useMemo(() => {
    if (!universities) return [];
    if (!searchQuery) return universities;
    return universities.filter(uni =>
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.state?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [universities, searchQuery]);

  const styles = createStyles(colors);

  // If a university is selected, show the full Title IX info page
  if (selectedUniversityId && selectedUniversity) {
    return (
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* University Selector */}
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.selectorText} numberOfLines={1}>
              {selectedUniversity.name}
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
                {filteredUniversities.map((uni: any) => (
                  <TouchableOpacity
                    key={uni.id}
                    style={[
                      styles.dropdownItem,
                      uni.id === selectedUniversityId && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setSelectedUniversityId(uni.id);
                      setShowDropdown(false);
                    }}
                  >
                    <View style={styles.dropdownItemRow}>
                      {getUniversityLogoUrl(uni) ? (
                        <Image
                          source={{ uri: getUniversityLogoUrl(uni)! }}
                          style={styles.universityLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[
                          styles.universityInitials,
                          uni.id === selectedUniversityId && styles.universityInitialsSelected
                        ]}>
                          <Text style={[
                            styles.initialsText,
                            uni.id === selectedUniversityId && styles.initialsTextSelected
                          ]}>{getInitials(uni.name)}</Text>
                        </View>
                      )}
                      <Text style={[
                        styles.dropdownItemText,
                        uni.id === selectedUniversityId && styles.dropdownItemTextSelected
                      ]}>
                        {uni.name}
                      </Text>
                    </View>
                    {uni.id === selectedUniversityId && (
                      <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                    )}
                  </TouchableOpacity>
                ))}
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

          {/* Title IX Info Component */}
          <TitleIXInfo
            universityId={selectedUniversity.id}
            universityName={selectedUniversity.name}
            titleIXInfo={selectedUniversity.titleIXInfo}
            titleIXUrl={selectedUniversity.titleIXUrl}
            lastUpdated={formatDate(selectedUniversity.lastUpdated)}
            verifiedAt={selectedUniversity.verifiedAt}
          />
        </ScrollView>
      </View>
    );
  }

  // University list view
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Title IX Resources</Text>
        <Text style={styles.subtitle}>Select a university to view their Title IX policies and resources</Text>

        {/* University Selector */}
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={[styles.selectorText, styles.selectorPlaceholder]}>
            Select a university...
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
                  <Text style={styles.loadingText}>Loading universities...</Text>
                </View>
              ) : filteredUniversities.length > 0 ? (
                filteredUniversities.map((uni: any) => (
                  <TouchableOpacity
                    key={uni.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedUniversityId(uni.id);
                      setShowDropdown(false);
                    }}
                  >
                    <View style={styles.dropdownItemRow}>
                      {getUniversityLogoUrl(uni) ? (
                        <Image
                          source={{ uri: getUniversityLogoUrl(uni)! }}
                          style={styles.universityLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.universityInitials}>
                          <Text style={styles.initialsText}>{getInitials(uni.name)}</Text>
                        </View>
                      )}
                      <View style={styles.dropdownItemContent}>
                        <Text style={styles.dropdownItemText}>{uni.name}</Text>
                        <Text style={styles.dropdownItemSubtext}>{uni.state}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No universities found</Text>
              )}
            </ScrollView>
          </Card>
        )}

        {/* Show TitleIXInfo with static sections even when no university selected */}
        {!showDropdown && (
          <>
            <Card style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="school" size={32} color={colors.brand.primary} />
              </View>
              <Text style={styles.infoTitle}>University Title IX Policies</Text>
              <Text style={styles.infoText}>
                Title IX protects students from sex discrimination in education. 
                Select your university above to view their specific policies, 
                reporting procedures, and support resources.
              </Text>
            </Card>
            
            {/* Static sections always visible */}
            <TitleIXInfo />
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
  universityLogo: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.background.primary,
  },
  universityInitials: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brand.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  universityInitialsSelected: {
    backgroundColor: colors.brand.primary + '25',
  },
  initialsText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.brand.primary,
  },
  initialsTextSelected: {
    color: colors.brand.primary,
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

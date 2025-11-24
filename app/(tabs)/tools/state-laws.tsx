import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAllStateLaws, getStateLaw } from '@/services/api';
import Card from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { US_STATES } from '@/lib/constants';
import { colors } from '@/lib/theme';

export default function StateLawsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);

  const { data: stateLaws, isLoading } = useQuery({
    queryKey: ['state-laws'],
    queryFn: getAllStateLaws,
  });

  const { data: stateLaw, isLoading: stateLawLoading } = useQuery({
    queryKey: ['state-law', selectedStateCode],
    queryFn: () => selectedStateCode ? getStateLaw(selectedStateCode) : null,
    enabled: !!selectedStateCode,
  });

  const filteredStates = US_STATES.filter((state: { code: string; name: string }) =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    state.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedStateCode && stateLaw) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedStateCode(null)}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{stateLaw.stateName}</Text>
        <Text style={styles.subtitle}>Consent Law Information</Text>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Consent Law Overview</Text>
          <Text style={styles.infoText}>{stateLaw.consentLawInfo || 'No information available.'}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Key Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age of Consent:</Text>
            <Text style={styles.infoValue}>{stateLaw.ageOfConsent} years</Text>
          </View>
          {stateLaw.affirmativeConsentRequired && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Affirmative Consent:</Text>
              <Text style={styles.infoValue}>{stateLaw.affirmativeConsentRequired}</Text>
            </View>
          )}
          {stateLaw.romeoJulietLaw && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Romeo & Juliet Law:</Text>
              <Text style={styles.infoValue}>{stateLaw.romeoJulietLaw}</Text>
            </View>
          )}
        </Card>

        {stateLaw.reportingRequirements && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Reporting Requirements</Text>
            <Text style={styles.infoText}>{stateLaw.reportingRequirements}</Text>
          </Card>
        )}

        {stateLaw.sourceUrl && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Resources</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                // Open URL in browser
                // Linking.openURL(stateLaw.sourceUrl!);
              }}
            >
              <Ionicons name="link-outline" size={20} color={colors.brand.primary} />
              <Text style={styles.linkText}>View Source</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>State Consent Laws</Text>
      <Text style={styles.subtitle}>Research consent laws by state</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search states..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : filteredStates.length > 0 ? (
        filteredStates.map((state: { code: string; name: string }) => {
          const stateLawData = stateLaws?.find(sl => sl.stateCode === state.code);
          return (
            <Card
              key={state.code}
              style={styles.stateCard}
            >
              <TouchableOpacity
                onPress={() => setSelectedStateCode(state.code)}
                style={styles.stateItem}
              >
                <View style={styles.stateInfo}>
                  <Text style={styles.stateName}>{state.name}</Text>
                  <Text style={styles.stateCode}>{state.code}</Text>
                </View>
                {stateLawData && (
                  <View style={styles.stateBadge}>
                    <Text style={styles.badgeText}>Available</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </Card>
          );
        })
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No states found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'No states available'}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: colors.brand.primary,
    marginLeft: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000',
  },
  center: {
    padding: 40,
    alignItems: 'center',
  },
  stateCard: {
    marginBottom: 12,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateInfo: {
    flex: 1,
  },
  stateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  stateCode: {
    fontSize: 14,
    color: '#999',
  },
  stateBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff',
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#999',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  infoLabel: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'right',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: colors.brand.primary,
    marginLeft: 12,
  },
});


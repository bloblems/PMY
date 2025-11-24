import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAllUniversities, getUniversity } from '@/services/api';
import Card from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

export default function TitleIXScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  const { data: universities, isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: getAllUniversities,
  });

  const { data: university, isLoading: universityLoading } = useQuery({
    queryKey: ['university', selectedUniversity],
    queryFn: () => selectedUniversity ? getUniversity(selectedUniversity) : null,
    enabled: !!selectedUniversity,
  });

  const filteredUniversities = universities?.filter(uni =>
    uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    uni.state?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (selectedUniversity && university) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedUniversity(null)}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{university.name}</Text>
        {university.state && (
          <Text style={styles.subtitle}>{university.state}</Text>
        )}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Title IX Information</Text>
          <Text style={styles.infoText}>{university.titleIXInfo || 'No Title IX information available.'}</Text>
        </Card>

        {university.titleIXUrl && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Resources</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                // Open URL in browser
                // Linking.openURL(university.titleIXUrl!);
              }}
            >
              <Ionicons name="link-outline" size={20} color={colors.brand.primary} />
              <Text style={styles.linkText}>View Title IX Office Website</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Title IX Information</Text>
      <Text style={styles.subtitle}>Research university Title IX policies</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search universities..."
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
      ) : filteredUniversities.length > 0 ? (
        filteredUniversities.map((uni) => (
          <Card
            key={uni.id}
            style={styles.universityCard}
          >
            <TouchableOpacity
              onPress={() => setSelectedUniversity(uni.id)}
              style={styles.universityItem}
            >
              <View style={styles.universityInfo}>
                <Text style={styles.universityName}>{uni.name}</Text>
                {uni.state && (
                  <Text style={styles.universityState}>{uni.state}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No universities found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'No universities available'}
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
  universityCard: {
    marginBottom: 12,
  },
  universityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  universityInfo: {
    flex: 1,
  },
  universityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  universityState: {
    fontSize: 14,
    color: '#999',
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


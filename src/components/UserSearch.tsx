import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../lib/theme';

interface SearchUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
  isVerified?: string;
  verificationProvider?: string | null;
}

interface UserSearchProps {
  onSelectUser: (user: SearchUser) => void;
  selectedUserId?: string;
  placeholder?: string;
}

export function UserSearch({ onSelectUser, selectedUserId, placeholder = "Search by username (e.g., @username)" }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // User search API call
  const { data: searchResults, isLoading } = useQuery<{ users: SearchUser[] }>({
    queryKey: debouncedQuery.length >= 2 
      ? ['users-search', debouncedQuery] 
      : ['users-search-disabled'],
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
    queryFn: async () => {
      // TODO: Implement actual user search API endpoint
      // For now, return empty results
      return { users: [] };
    },
  });

  const users = searchResults?.users || [];

  const getInitials = (user: SearchUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: SearchUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      {searchQuery.length >= 2 && (
        <View style={[styles.resultsContainer, styles.resultsContainerSpacing]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={[styles.loadingText, styles.loadingTextSpacing]}>Searching...</Text>
            </View>
          ) : users.length > 0 ? (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelectUser(item)}
                  style={styles.userItem}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{getDisplayName(item)}</Text>
                      {item.isVerified === 'true' && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.userUsername}>@{item.username}</Text>
                    {item.bio && (
                      <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.resultsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  resultsContainerSpacing: {
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  resultsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  loadingTextSpacing: {
    marginLeft: 8,
  },
  resultsList: {
    flexGrow: 0,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userBio: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});


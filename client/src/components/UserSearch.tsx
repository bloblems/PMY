import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SearchUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
}

interface UserSearchProps {
  onSelectUser: (user: SearchUser) => void;
  selectedUserId?: string;
  placeholder?: string;
}

export function UserSearch({ onSelectUser, selectedUserId, placeholder = "Search by username (e.g., @username)" }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery<{ users: SearchUser[] }>({
    queryKey: debouncedQuery.length >= 2 ? ["/api/users/search", { q: debouncedQuery }] : ["users-search-disabled"],
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
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
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-user-search"
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchQuery.length >= 2 && (
        <div className="space-y-2">
          {isLoading && (
            <div className="text-sm text-muted-foreground text-center py-4" data-testid="text-searching">
              Searching for PMY users...
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-results">
              No PMY users found matching "{searchQuery}"
            </div>
          )}

          {!isLoading && users.length > 0 && (
            <div className="space-y-2" data-testid="container-search-results">
              {users.map((user) => (
                <Card
                  key={user.id}
                  data-testid={`card-user-${user.id}`}
                  className={`cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    selectedUserId === user.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onSelectUser(user)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar data-testid={`avatar-user-${user.id}`}>
                      <AvatarImage src={user.profilePictureUrl || undefined} alt={getDisplayName(user)} />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate" data-testid={`text-name-${user.id}`}>
                          {getDisplayName(user)}
                        </p>
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-pmy-${user.id}`}>
                          <User className="h-3 w-3 mr-1" />
                          PMY User
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-username-${user.id}`}>
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate mt-1" data-testid={`text-bio-${user.id}`}>
                          {user.bio}
                        </p>
                      )}
                    </div>

                    {selectedUserId === user.id && (
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center" data-testid={`icon-selected-${user.id}`}>
                          <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <div className="text-xs text-muted-foreground" data-testid="text-min-chars">
          Type at least 2 characters to search
        </div>
      )}
    </div>
  );
}

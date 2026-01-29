'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from '@/components/follow-button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface UserProfile {
  uid: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  followerCount?: number;
  followingCount?: number;
  isProfilePublic: boolean;
}

export default function DiscoverPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch users you follow
  const fetchFollowing = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get list of users you're following
      const followsQuery = query(
        collection(firestore, 'user_follows'),
        where('followerId', '==', currentUser.uid),
        limit(50)
      );

      const followsSnapshot = await getDocs(followsQuery);
      const followingIds = followsSnapshot.docs.map(doc => doc.data().followingId);

      if (followingIds.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Fetch user profiles for people you follow
      // Firestore 'in' queries are limited to 10 items, so we need to batch
      const batchSize = 10;
      const userBatches: UserProfile[] = [];
      
      for (let i = 0; i < followingIds.length; i += batchSize) {
        const batch = followingIds.slice(i, i + batchSize);
        const usersQuery = query(
          collection(firestore, 'users'),
          where('__name__', 'in', batch)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const batchUsers = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserProfile[];
        
        userBatches.push(...batchUsers);
      }

      setUsers(userBatches);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setIsLoading(false);
    }
  }, [firestore, currentUser]);

  // Fetch users you follow on mount
  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        // Reset to following list when search is cleared
        return;
      }

      try {
        setIsSearching(true);
        const searchLower = searchQuery.toLowerCase();

        // Search by username with limit to prevent DB overload
        const usernameQuery = query(
          collection(firestore, 'users'),
          where('username', '>=', searchLower),
          where('username', '<=', searchLower + '\uf8ff'),
          where('isProfilePublic', '!=', false),
          limit(10)
        );

        const usernameSnapshot = await getDocs(usernameQuery);
        const results = usernameSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserProfile[];

        // Filter out current user
        const filtered = results.filter(p => p.uid !== currentUser?.uid);
        setUsers(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      } else {
        // Reload following list when search is cleared
        fetchFollowing();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, firestore, currentUser, fetchFollowing]);

  const handleFollowChange = useCallback(() => {
    // Refetch the list after follow/unfollow with a slight delay
    // to allow Firestore to propagate changes
    setTimeout(() => {
      if (!searchQuery.trim()) {
        // If viewing following list, refresh it
        fetchFollowing();
      } else {
        // If searching, also refresh to update button states
        const searchLower = searchQuery.toLowerCase();
        const searchUsers = async () => {
          try {
            const usernameQuery = query(
              collection(firestore, 'users'),
              where('username', '>=', searchLower),
              where('username', '<=', searchLower + '\uf8ff'),
              where('isProfilePublic', '!=', false),
              limit(10)
            );

            const usernameSnapshot = await getDocs(usernameQuery);
            const results = usernameSnapshot.docs.map(doc => ({
              uid: doc.id,
              ...doc.data(),
            })) as UserProfile[];

            const filtered = results.filter(p => p.uid !== currentUser?.uid);
            setUsers(filtered);
          } catch (error) {
            console.error('Error searching users:', error);
          }
        };
        searchUsers();
      }
    }, 300);
  }, [searchQuery, fetchFollowing, firestore, currentUser]);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Discover Collectors
          </h1>
          <p className="text-muted-foreground">
            {searchQuery ? 'Search for collectors to follow' : 'People you follow'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by username to find new collectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {searchQuery ? `Searching for "${searchQuery}"...` : 'Start typing to search for users'}
          </p>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground mb-2">
              {searchQuery ? 'No users found' : "You're not following anyone yet"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground">
                Use the search bar above to find collectors to follow
              </p>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((profile) => (
              <Card key={profile.uid} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Link href={`/profile/${profile.username}`}>
                      <Avatar className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={profile.photoURL || undefined} alt={profile.displayName || profile.username} />
                        <AvatarFallback className="text-xl">
                          {getInitials(profile.displayName, profile.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/profile/${profile.username}`}
                        className="hover:underline"
                      >
                        <h3 className="font-semibold text-lg truncate">
                          {profile.displayName || profile.username}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          <strong className="text-foreground">{profile.followerCount || 0}</strong> followers
                        </span>
                        <span>
                          <strong className="text-foreground">{profile.followingCount || 0}</strong> following
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {currentUser && profile.uid !== currentUser.uid && (
                        <FollowButton 
                          targetUserId={profile.uid} 
                          targetUserName={profile.username}
                          onFollowChange={handleFollowChange}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

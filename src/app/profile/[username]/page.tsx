'use client';

import { use, useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { GradedCard, Collection, CollectionCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from '@/components/follow-button';
import { AlertTriangle, Home, Loader2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { DigitalSlab } from '@/components/digital-slab';
import { CollectionCardDisplay } from '@/components/collection-card-display';

interface UserProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

interface UserProfile {
  uid: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  followerCount?: number;
  followingCount?: number;
  isProfilePublic?: boolean;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = use(params);
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<GradedCard[]>([]);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [totalCardCount, setTotalCardCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Find user by username
        const usersQuery = query(
          collection(firestore, 'users'),
          where('username', '==', username.toLowerCase()),
          limit(1)
        );

        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
          setError('User not found');
          return;
        }

        const userData = usersSnapshot.docs[0].data();
        const userId = usersSnapshot.docs[0].id;

        // Check if profile is public (or if viewing own profile)
        const isOwnProfile = currentUser?.uid === userId;
        const isPublic = userData.isProfilePublic !== false;

        if (!isPublic && !isOwnProfile) {
          setError('This profile is private');
          return;
        }

        // Set up real-time listener for profile updates
        unsubscribeProfile = onSnapshot(
          doc(firestore, 'users', userId),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              setProfile({
                uid: userId,
                username: data.username,
                displayName: data.displayName,
                photoURL: data.photoURL,
                email: data.email,
                followerCount: data.followerCount || 0,
                followingCount: data.followingCount || 0,
                isProfilePublic: isPublic,
              });
            }
          },
          (error) => {
            console.error('Error listening to profile updates:', error);
          }
        );

        // Fetch user's public cards (one-time fetch is fine here)
        const cardsQuery = query(
          collection(firestore, 'public_graded_cards'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const cardsSnapshot = await getDocs(cardsQuery);
        const userCards = cardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        })) as GradedCard[];

        setCards(userCards);

        // Fetch collections (public only for others, all for own profile)
        const collectionsQuery = isOwnProfile
          ? query(
              collection(firestore, 'users', userId, 'collections'),
              orderBy('createdAt', 'desc')
            )
          : query(
              collection(firestore, 'users', userId, 'collections'),
              where('isPublic', '==', true),
              orderBy('createdAt', 'desc')
            );

        const collectionsSnapshot = await getDocs(collectionsQuery);
        const userCollections = collectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        })) as Collection[];

        setCollections(userCollections);

        // Fetch collection cards (public only for others, all for own profile)
        const collectionCardsQuery = isOwnProfile
          ? query(
              collection(firestore, 'users', userId, 'collection_cards'),
              orderBy('createdAt', 'desc'),
              limit(20)
            )
          : query(
              collection(firestore, 'users', userId, 'collection_cards'),
              where('isPublic', '==', true),
              orderBy('createdAt', 'desc'),
              limit(20)
            );

        const collectionCardsSnapshot = await getDocs(collectionCardsQuery);
        const userCollectionCards = collectionCardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        })) as CollectionCard[];

        setCollectionCards(userCollectionCards);

        // If viewing own profile, get total card count including private cards
        if (isOwnProfile) {
          const totalCardsQuery = query(
            collection(firestore, 'users', userId, 'graded_cards')
          );
          const totalCardsSnapshot = await getDocs(totalCardsQuery);
          const totalCollectionCardsQuery = query(
            collection(firestore, 'users', userId, 'collection_cards')
          );
          const totalCollectionCardsSnapshot = await getDocs(totalCollectionCardsQuery);
          setTotalCardCount(totalCardsSnapshot.size + totalCollectionCardsSnapshot.size);
        } else {
          // For other users, total count is just public cards
          setTotalCardCount(userCards.length + userCollectionCards.length);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    
    // Cleanup listener on unmount
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [username, firestore, currentUser]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
        <Card className="max-w-md p-8 border-dashed">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">{error || 'Profile Not Found'}</CardTitle>
            <CardDescription>
              {error === 'This profile is private'
                ? 'This user has set their profile to private.'
                : 'The user profile you are looking for does not exist.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === profile.uid;
  const totalGradedCards = cards.length;
  const totalCollectionCards = collectionCards.length;

  return (
    <div className="container py-6 md:py-8 max-w-7xl">
      {/* Profile Header - Compact */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
        <Avatar className="h-20 w-20 ring-2 ring-primary/20">
          <AvatarImage src={profile.photoURL || undefined} alt={profile.displayName || profile.username} />
          <AvatarFallback className="text-xl bg-primary/10">
            {getInitials(profile.displayName, profile.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-2xl font-bold font-headline">
              {profile.displayName || profile.username}
            </h1>
            <span className="text-muted-foreground">@{profile.username}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
            <span><strong>{profile.followerCount || 0}</strong> followers</span>
            <span><strong>{profile.followingCount || 0}</strong> following</span>
            <span><strong>{totalCardCount}</strong> cards</span>
          </div>
        </div>

        <div className="flex gap-2">
          {!isOwnProfile && currentUser && (
            <FollowButton targetUserId={profile.uid} targetUserName={profile.username} />
          )}
          {isOwnProfile && (
            <Button asChild variant="outline" size="sm">
              <Link href="/account">Edit Profile</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
          <div className="text-2xl font-bold text-primary">{collections.length}</div>
          <div className="text-xs text-muted-foreground">Collections</div>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
          <div className="text-2xl font-bold text-accent">{totalGradedCards}</div>
          <div className="text-xs text-muted-foreground">Graded</div>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
          <div className="text-2xl font-bold text-secondary-foreground">{totalCollectionCards}</div>
          <div className="text-xs text-muted-foreground">Ungraded</div>
        </div>
      </div>

      {/* Collections - Horizontal Scroll */}
      {collections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            Collections
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
            {collections.map((collection) => (
              <Link 
                key={collection.id} 
                href={isOwnProfile ? `/collection-detail/${collection.id}` : (collection.isPublic ? `/collection/${collection.id}?userId=${targetUser?.id}` : '#')}
                className={`flex-shrink-0 w-48 p-4 rounded-xl bg-card/50 border border-border ${(isOwnProfile || collection.isPublic) ? 'hover:border-primary/50 transition-colors' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  {!collection.isPublic && isOwnProfile && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Private</Badge>
                  )}
                </div>
                <div className="font-medium text-sm truncate">{collection.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {collection.createdAt
                    ? new Date(collection.createdAt).toLocaleDateString()
                    : ''}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cards Grid - Combined View */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Cards</h2>
        
        {cards.length === 0 && collectionCards.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-border">
            <Icons.logo className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">No cards to display</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Graded Cards */}
            {cards.map((card) => {
              return (
                <Link
                  key={card.id}
                  href={`/card/${card.publicShareId}`}
                  className="group transition-transform hover:scale-[1.02]"
                >
                  <DigitalSlab 
                    card={card} 
                    isPublicPage={true}
                  />
                </Link>
              );
            })}
            
            {/* Collection Cards */}
            {collectionCards.map((card) => {
              if (isOwnProfile) {
                return (
                  <Link
                    key={card.id}
                    href={`/card-detail/${card.id}`}
                    className="group transition-transform hover:scale-[1.02]"
                  >
                    <CollectionCardDisplay card={card} />
                  </Link>
                );
              } else if (card.isPublic) {
                return (
                  <Link
                    key={card.id}
                    href={`/collection-card/${card.id}?userId=${targetUser?.id}`}
                    className="group transition-transform hover:scale-[1.02]"
                  >
                    <CollectionCardDisplay card={card} />
                  </Link>
                );
              } else {
                return (
                  <div key={card.id} className="group transition-transform hover:scale-[1.02]">
                    <CollectionCardDisplay card={card} />
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}

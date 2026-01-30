'use client';

import { use, useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { GradedCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from '@/components/follow-button';
import { AlertTriangle, Home, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { DigitalSlab } from '@/components/digital-slab';

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

        // If viewing own profile, get total card count including private cards
        if (isOwnProfile) {
          const totalCardsQuery = query(
            collection(firestore, 'users', userId, 'graded_cards')
          );
          const totalCardsSnapshot = await getDocs(totalCardsQuery);
          setTotalCardCount(totalCardsSnapshot.size);
        } else {
          // For other users, total count is just public cards
          setTotalCardCount(userCards.length);
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

  return (
    <div className="container py-8 md:py-12">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.photoURL || undefined} alt={profile.displayName || profile.username} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.displayName, profile.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold font-headline mb-2">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-muted-foreground mb-4">@{profile.username}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{profile.followerCount || 0}</strong> followers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <strong>{profile.followingCount || 0}</strong> following
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <strong>{totalCardCount}</strong> cards graded
                  </span>
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <FollowButton targetUserId={profile.uid} targetUserName={profile.username} />
              )}

              {isOwnProfile && (
                <Button asChild variant="outline">
                  <Link href="/account">Edit Profile</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-2xl font-bold font-headline mb-4">Graded Cards</h2>
        {cards.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icons.logo className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No graded cards yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

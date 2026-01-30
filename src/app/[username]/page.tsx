'use client';

import { use, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import type { GradedCard } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, Loader2, Award, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserProfile = {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  isProfilePublic?: boolean;
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remove @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  // Fetch user by username
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const q = query(
          usersRef,
          where('username', '==', cleanUsername.toLowerCase()),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        // Check if profile is private
        if (userData.isProfilePublic === false) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        setUserProfile({
          id: userDoc.id,
          username: userData.username,
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
          isProfilePublic: userData.isProfilePublic,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchUser();
  }, [firestore, cleanUsername]);

  // Fetch user's public cards
  const cardsQuery = useMemoFirebase(() => {
    if (!userProfile) return null;
    return query(
      collection(firestore, 'public_graded_cards'),
      where('userId', '==', userProfile.id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userProfile]);

  const { data: cards } = useCollection<GradedCard>(cardsQuery);

  // Calculate stats
  const stats = useMemo(() => {
    if (!cards || cards.length === 0) {
      return {
        totalCards: 0,
        averageGrade: 0,
        gemMintCount: 0,
        topGrade: 0,
      };
    }

    const totalGrade = cards.reduce((sum, card) => sum + card.grade, 0);
    const averageGrade = totalGrade / cards.length;
    const gemMintCount = cards.filter((card) => card.grade === 10).length;
    const topGrade = Math.max(...cards.map((card) => card.grade));

    return {
      totalCards: cards.length,
      averageGrade,
      gemMintCount,
      topGrade,
    };
  }, [cards]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl">
              <Icons.logo className="w-8 h-8" />
              GSA
            </Link>
          </div>
        </header>
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-4">
          <Card className="max-w-md p-8 border-dashed">
            <CardHeader>
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="mt-4">Profile Not Available</CardTitle>
              <CardDescription>
                The profile @{cleanUsername} does not exist or is set to private.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            GSA
          </Link>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || userProfile.username} />
              <AvatarFallback className="text-3xl font-bold">
                {userProfile.displayName 
                  ? userProfile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : userProfile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold font-headline">
                {userProfile.displayName || `@${userProfile.username}`}
              </h1>
              <p className="text-muted-foreground">@{userProfile.username}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageGrade.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gem Mint Cards</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gemMintCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Grade</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.topGrade}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Collection Grid */}
        {cards && cards.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold font-headline mb-6">Public Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {cards.map((card) => (
                <Link href={`/card/${card.publicShareId}`} key={card.id}>
                  <DigitalSlab card={card} />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Card className="text-center py-16 border-dashed">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">No Public Cards</CardTitle>
              <CardDescription>
                This user hasn't made any cards public yet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container">
          <p className="text-xs text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Global Slab Authority. Public collection showcase.
          </p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { use, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import type { GradedCard, CollectionCard, Collection } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { CollectionCardDisplay } from '@/components/collection-card-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, Loader2, FolderOpen, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TradeProposalDialog } from '@/components/trade-proposal-dialog';
import { FollowButton } from '@/components/follow-button';

type UserProfile = {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  isProfilePublic?: boolean;
  followerCount?: number;
  followingCount?: number;
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [preselectedCardForTrade, setPreselectedCardForTrade] = useState<{ id: string; type: 'graded' | 'collection' } | null>(null);

  const openTradeForCard = (cardId: string, cardType: 'graded' | 'collection') => {
    setPreselectedCardForTrade({ id: cardId, type: cardType });
    setShowTradeDialog(true);
  };

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
          followerCount: userData.followerCount || 0,
          followingCount: userData.followingCount || 0,
        });

        // Check if viewing own profile
        const isOwn = user?.uid === userDoc.id;
        setIsOwnProfile(isOwn);

        // Fetch collections and collection cards
        // - Own profile: fetch all collections/cards
        // - Other profiles: fetch only public collections/cards (works for authenticated and unauthenticated users)
        try {
          // Fetch collections (all for own profile, public only for others)
          const collectionsQuery = isOwn
            ? query(
                collection(firestore, 'users', userDoc.id, 'collections'),
                orderBy('createdAt', 'desc')
              )
            : query(
                collection(firestore, 'users', userDoc.id, 'collections'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc')
              );
          const collectionsSnap = await getDocs(collectionsQuery);
          const userCollections = collectionsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          })) as Collection[];
          setCollections(userCollections);

          // Fetch collection cards (all for own profile, public only for others)
          const collectionCardsQuery = isOwn
            ? query(
                collection(firestore, 'users', userDoc.id, 'collection_cards'),
                orderBy('createdAt', 'desc'),
                limit(20)
              )
            : query(
                collection(firestore, 'users', userDoc.id, 'collection_cards'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc'),
                limit(20)
              );
          const collectionCardsSnap = await getDocs(collectionCardsQuery);
          const userCollectionCards = collectionCardsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          })) as CollectionCard[];
          setCollectionCards(userCollectionCards);
        } catch (err) {
          console.error('Error fetching collections/cards:', err);
          // Leave collections and collectionCards as empty arrays
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchUser();
  }, [firestore, cleanUsername, user]);

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

      <main className="container py-6 md:py-8 max-w-7xl">
        {/* Profile Header - Compact */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || userProfile.username} />
            <AvatarFallback className="text-xl bg-primary/10">
              {userProfile.displayName 
                ? userProfile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : userProfile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <h1 className="text-2xl font-bold font-headline">
                {userProfile.displayName || userProfile.username}
              </h1>
              <span className="text-muted-foreground">@{userProfile.username}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
              <span><strong>{userProfile.followerCount || 0}</strong> followers</span>
              <span><strong>{userProfile.followingCount || 0}</strong> following</span>
              <span><strong>{stats.totalCards + collectionCards.length}</strong> cards</span>
            </div>
          </div>

          {/* Action Buttons - only show for other users when logged in */}
          {user && !isOwnProfile && (
            <div className="flex gap-2 mt-4 sm:mt-0">
              <FollowButton targetUserId={userProfile.id} />
              <Button onClick={() => setShowTradeDialog(true)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Propose Trade
              </Button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
            <div className="text-2xl font-bold text-primary">{collections.length}</div>
            <div className="text-xs text-muted-foreground">Collections</div>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
            <div className="text-2xl font-bold text-accent">{stats.totalCards}</div>
            <div className="text-xs text-muted-foreground">Graded</div>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
            <div className="text-2xl font-bold text-secondary-foreground">{collectionCards.length}</div>
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
              {collections.map((coll) => (
                <Link
                  key={coll.id}
                  href={`/collection/${coll.id}?userId=${userProfile?.id}`}
                  className="flex-shrink-0 w-48 p-4 rounded-xl bg-card/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    {!coll.isPublic && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Private</Badge>
                    )}
                  </div>
                  <div className="font-medium text-sm truncate">{coll.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {coll.createdAt
                      ? new Date(coll.createdAt).toLocaleDateString()
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
          
          {cards && cards.length === 0 && collectionCards.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-border">
              <Icons.logo className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No public cards to display</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Graded Cards */}
              {cards && cards.map((card) => (
                <div key={card.id} className="relative group">
                  <Link
                    href={`/card/${card.publicShareId}`}
                    className="block transition-transform hover:scale-[1.02]"
                  >
                    <DigitalSlab card={card} isPublicPage={true} />
                  </Link>
                  {user && !isOwnProfile && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openTradeForCard(card.id, 'graded');
                      }}
                    >
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      Trade
                    </Button>
                  )}
                </div>
              ))}
              
              {/* Collection Cards */}
              {collectionCards.map((card) => (
                <div key={card.id} className="relative group">
                  <Link
                    href={`/collection-card/${card.id}?userId=${userProfile?.id}`}
                    className="block transition-transform hover:scale-[1.02]"
                  >
                    <CollectionCardDisplay card={card} />
                  </Link>
                  {user && !isOwnProfile && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openTradeForCard(card.id, 'collection');
                      }}
                    >
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      Trade
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container">
          <p className="text-xs text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Global Slab Authority. Public collection showcase.
          </p>
        </div>
      </footer>

      {/* Trade Proposal Dialog */}
      {user && !isOwnProfile && (
        <TradeProposalDialog
          open={showTradeDialog}
          onOpenChange={(open) => {
            setShowTradeDialog(open);
            if (!open) setPreselectedCardForTrade(null);
          }}
          preselectedUser={userProfile.username}
          preselectedCardId={preselectedCardForTrade?.id}
          preselectedCardType={preselectedCardForTrade?.type}
          onTradeCreated={() => {
            setShowTradeDialog(false);
            setPreselectedCardForTrade(null);
          }}
        />
      )}
    </div>
  );
}

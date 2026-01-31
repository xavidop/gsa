'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { GradedCard, CollectionCard, UserProfile } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { CollectionCardDisplay } from '@/components/collection-card-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Loader2, Rss, UserPlus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type FeedCard = (GradedCard | CollectionCard) & {
  userProfile?: UserProfile;
  cardType: 'graded' | 'collection';
};

export default function FeedPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchFeed = async () => {
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
          limit(100)
        );

        const followsSnapshot = await getDocs(followsQuery);
        const followingIds = followsSnapshot.docs.map(doc => doc.data().followingId);
        
        setFollowingCount(followingIds.length);

        if (followingIds.length === 0) {
          setCards([]);
          setIsLoading(false);
          return;
        }

        // Fetch cards from followed users (batch by 10 due to Firestore 'in' limit)
        const batchSize = 10;
        const allCards: FeedCard[] = [];

        for (let i = 0; i < followingIds.length; i += batchSize) {
          const batch = followingIds.slice(i, i + batchSize);
          
          // Fetch graded cards from public_graded_cards collection
          const gradedCardsQuery = query(
            collection(firestore, 'public_graded_cards'),
            where('userId', 'in', batch),
            orderBy('createdAt', 'desc'),
            limit(50)
          );

          const gradedCardsSnapshot = await getDocs(gradedCardsQuery);
          const batchGradedCards = gradedCardsSnapshot.docs.map(doc => ({
            id: doc.id,
            publicShareId: doc.id,
            ...doc.data(),
            cardType: 'graded' as const,
          })) as FeedCard[];

          allCards.push(...batchGradedCards);

          // Fetch collection cards from each user's subcollection
          for (const userId of batch) {
            const collectionCardsQuery = query(
              collection(firestore, 'users', userId, 'collection_cards'),
              where('isPublic', '==', true),
              orderBy('createdAt', 'desc'),
              limit(25)
            );

            const collectionCardsSnapshot = await getDocs(collectionCardsQuery);
            const userCollectionCards = collectionCardsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              cardType: 'collection' as const,
            })) as FeedCard[];

            allCards.push(...userCollectionCards);
          }
        }

        // Sort all cards by creation date
        allCards.sort((a, b) => {
          const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
          const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

        // Take top 50 most recent
        const recentCards = allCards.slice(0, 50);

        // Fetch user profiles for card owners
        const userIds = [...new Set(recentCards.map(card => card.userId))];
        const userProfiles: { [key: string]: UserProfile } = {};

        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize);
          const usersQuery = query(
            collection(firestore, 'users'),
            where('__name__', 'in', batch)
          );

          const usersSnapshot = await getDocs(usersQuery);
          usersSnapshot.docs.forEach(doc => {
            userProfiles[doc.id] = {
              userId: doc.id,
              ...doc.data(),
            } as UserProfile;
          });
        }

        // Attach user profiles to cards
        const cardsWithUsers = recentCards.map(card => ({
          ...card,
          userProfile: userProfiles[card.userId],
        }));

        setCards(cardsWithUsers);
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, [firestore, currentUser]);

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

  const formatDate = (date: Timestamp | Date) => {
    const jsDate = date instanceof Timestamp ? date.toDate() : new Date(date);
    return formatDistanceToNow(jsDate, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (followingCount === 0) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-headline mb-2 flex items-center gap-2">
            <Rss className="h-8 w-8" />
            Feed
          </h1>
          <p className="text-muted-foreground mb-8">
            See the latest cards from collectors you follow
          </p>

          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Start following collectors</h3>
                  <p className="text-muted-foreground mb-4">
                    Follow other collectors to see their latest cards in your feed
                  </p>
                  <Link href="/discover">
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Discover Collectors
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-headline mb-2 flex items-center gap-2">
            <Rss className="h-8 w-8" />
            Feed
          </h1>
          <p className="text-muted-foreground mb-8">
            See the latest cards from collectors you follow
          </p>

          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <Rss className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No cards yet</h3>
                  <p className="text-muted-foreground">
                    The collectors you follow haven&apos;t shared any public cards yet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2 flex items-center gap-2">
            <Rss className="h-8 w-8" />
            Feed
          </h1>
          <p className="text-muted-foreground">
            Latest cards from {followingCount} collector{followingCount !== 1 ? 's' : ''} you follow
          </p>
        </div>

        <div className="space-y-6">
          {cards.map((card) => (
            <Card key={card.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Link 
                    href={card.userProfile?.username ? `/${card.userProfile.username}` : '#'}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={card.userProfile?.photoURL} />
                      <AvatarFallback>
                        {getInitials(card.userProfile?.displayName, card.userProfile?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {card.userProfile?.displayName || card.userProfile?.username || 'Unknown User'}
                      </p>
                      {card.userProfile?.username && (
                        <p className="text-sm text-muted-foreground">@{card.userProfile.username}</p>
                      )}
                    </div>
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(card.createdAt)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-full md:w-auto flex justify-center">
                    {card.cardType === 'graded' ? (
                      <Link href={`/card/${(card as GradedCard).publicShareId}`}>
                        <div className="cursor-pointer hover:scale-105 transition-transform">
                          <DigitalSlab card={card as GradedCard} />
                        </div>
                      </Link>
                    ) : (
                      <Link href={`/collection-card/${card.id}?userId=${card.userId}`}>
                        <div className="cursor-pointer hover:scale-105 transition-transform">
                          <CollectionCardDisplay card={card as CollectionCard} />
                        </div>
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{card.cardName}</h3>
                        {card.set && (
                          <p className="text-sm text-muted-foreground mb-2">{card.set}</p>
                        )}
                        <div className="flex gap-2 items-center">
                          {card.year && (
                            <Badge variant="secondary">{card.year}</Badge>
                          )}
                          <Badge variant={card.cardType === 'graded' ? 'default' : 'outline'}>
                            {card.cardType === 'graded' ? 'Graded' : 'Collection'}
                          </Badge>
                        </div>
                      </div>

                      {card.notes && (
                        <div className="text-sm text-muted-foreground border-l-2 border-muted pl-4">
                          {card.notes}
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2">
                        {card.cardType === 'graded' ? (
                          <Link href={`/card/${(card as GradedCard).publicShareId}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ArrowUpRight className="h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/collection-card/${card.id}?userId=${card.userId}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ArrowUpRight className="h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                        )}
                        
                        {card.cardType === 'graded' && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {(card as GradedCard).likeCount !== undefined && (card as GradedCard).likeCount! > 0 && (
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{(card as GradedCard).likeCount}</span>
                              </div>
                            )}
                            {(card as GradedCard).commentCount !== undefined && (card as GradedCard).commentCount! > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{(card as GradedCard).commentCount}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

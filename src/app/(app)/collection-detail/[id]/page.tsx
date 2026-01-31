'use client';

import { use, useState, useEffect } from 'react';
import { collection as firestoreCollection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { GradedCard, Collection, CollectionCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DigitalSlab } from '@/components/digital-slab';
import { CollectionCardDisplay } from '@/components/collection-card-display';
import { Loader2, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type DisplayCard = (GradedCard & { cardType: 'graded' }) | (CollectionCard & { cardType: 'collection' });

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<DisplayCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchCards outside useEffect so it doesn't change reference
  const fetchCards = async (userId: string, collectionId: string) => {
    try {
      // Fetch graded cards in this collection
      let gradedCards: (GradedCard & { cardType: 'graded' })[] = [];
      try {
        const gradedCardsQuery = query(
          firestoreCollection(firestore, 'users', userId, 'graded_cards'),
          where('collectionId', '==', collectionId),
          orderBy('createdAt', 'desc')
        );
        const gradedCardsSnap = await getDocs(gradedCardsQuery);
        gradedCards = gradedCardsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          cardType: 'graded' as const,
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
        })) as (GradedCard & { cardType: 'graded' })[];
      } catch (gradedErr: any) {
        console.error('Error fetching graded cards:', gradedErr);
        if (gradedErr.code === 'failed-precondition') {
          const gradedCardsQuerySimple = query(
            firestoreCollection(firestore, 'users', userId, 'graded_cards'),
            where('collectionId', '==', collectionId)
          );
          const gradedCardsSnap = await getDocs(gradedCardsQuerySimple);
          gradedCards = gradedCardsSnap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            cardType: 'graded' as const,
            createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
          })) as (GradedCard & { cardType: 'graded' })[];
        }
      }

      // Fetch collection cards in this collection
      let collectionCards: (CollectionCard & { cardType: 'collection' })[] = [];
      try {
        const collectionCardsQuery = query(
          firestoreCollection(firestore, 'users', userId, 'collection_cards'),
          where('collectionId', '==', collectionId),
          orderBy('createdAt', 'desc')
        );
        const collectionCardsSnap = await getDocs(collectionCardsQuery);
        collectionCards = collectionCardsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          cardType: 'collection' as const,
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
        })) as (CollectionCard & { cardType: 'collection' })[];
      } catch (collectionErr: any) {
        console.error('Error fetching collection cards:', collectionErr);
        if (collectionErr.code === 'failed-precondition') {
          const collectionCardsQuerySimple = query(
            firestoreCollection(firestore, 'users', userId, 'collection_cards'),
            where('collectionId', '==', collectionId)
          );
          const collectionCardsSnap = await getDocs(collectionCardsQuerySimple);
          collectionCards = collectionCardsSnap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            cardType: 'collection' as const,
            createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
          })) as (CollectionCard & { cardType: 'collection' })[];
        }
      }

      setCards([...gradedCards, ...collectionCards]);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
  };

  useEffect(() => {
    const fetchCollection = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const collectionRef = doc(firestore, 'users', user.uid, 'collections', id);
        const collectionSnap = await getDoc(collectionRef);

        if (!collectionSnap.exists()) {
          setError('Collection not found');
          setIsLoading(false);
          return;
        }

        const collectionData = {
          id: collectionSnap.id,
          ...collectionSnap.data(),
          createdAt: collectionSnap.data().createdAt?.toDate?.() || collectionSnap.data().createdAt,
          updatedAt: collectionSnap.data().updatedAt?.toDate?.() || collectionSnap.data().updatedAt,
        } as Collection;

        setCollection(collectionData);
        await fetchCards(user.uid, id);
      } catch (err: any) {
        console.error('Error fetching collection:', err);
        setError(err.message || 'Failed to load collection');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [id, firestore, user?.uid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="container py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || 'Collection not found'}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 px-4 max-w-7xl">
      {/* Collection Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-3xl font-headline">{collection.name}</CardTitle>
                {!collection.isPublic && (
                  <Badge variant="secondary">Private</Badge>
                )}
              </div>
              {collection.description && (
                <CardDescription className="text-base">{collection.description}</CardDescription>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Icons.logo className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No cards in this collection yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.id}>
              {card.cardType === 'graded' ? (
                <Link href={`/card/${(card as GradedCard).publicShareId}`}>
                  <DigitalSlab card={card as GradedCard} />
                </Link>
              ) : (
                <Link href={`/card-detail/${card.id}`}>
                  <CollectionCardDisplay card={card as CollectionCard} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { use, useState, useEffect } from 'react';
import { collection as firestoreCollection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import type { GradedCard, Collection, CollectionCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DigitalSlab } from '@/components/digital-slab';
import { CollectionCardDisplay } from '@/components/collection-card-display';
import { AddCardDialog } from '@/components/add-card-dialog';
import { Loader2, PlusCircle, ArrowLeft, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type DisplayCard = (GradedCard & { cardType: 'graded' }) | (CollectionCard & { cardType: 'collection' });

export default function PublicCollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');
  const firestore = useFirestore();
  const { user } = useUser();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<DisplayCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');

  // Define fetchCards outside useEffect so it doesn't change reference
  // isOwnerParam: if true, fetch all cards; if false, only fetch public cards
  const fetchCards = async (userId: string, collectionId: string, isOwnerParam: boolean) => {
    try {
      console.log('Fetching cards for:', { userId, collectionId, isOwner: isOwnerParam });
      
      // Fetch graded cards in this collection
      // Owner sees all cards, non-owner only sees public cards
      let gradedCards: (GradedCard & { cardType: 'graded' })[] = [];
      try {
        const gradedCardsQuery = isOwnerParam
          ? query(
              firestoreCollection(firestore, 'users', userId, 'graded_cards'),
              where('collectionId', '==', collectionId)
            )
          : query(
              firestoreCollection(firestore, 'users', userId, 'graded_cards'),
              where('collectionId', '==', collectionId),
              where('isPublic', '==', true)
            );
        const gradedCardsSnap = await getDocs(gradedCardsQuery);
        console.log('Graded cards found:', gradedCardsSnap.docs.length);
        gradedCards = gradedCardsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          cardType: 'graded' as const,
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
        })) as (GradedCard & { cardType: 'graded' })[];
      } catch (gradedErr: any) {
        console.error('Error fetching graded cards:', gradedErr);
        console.error('Error code:', gradedErr.code, 'Message:', gradedErr.message);
      }

      // Fetch collection cards in this collection
      // Owner sees all cards, non-owner only sees public cards
      let collectionCards: (CollectionCard & { cardType: 'collection' })[] = [];
      try {
        const collectionCardsQuery = isOwnerParam
          ? query(
              firestoreCollection(firestore, 'users', userId, 'collection_cards'),
              where('collectionId', '==', collectionId)
            )
          : query(
              firestoreCollection(firestore, 'users', userId, 'collection_cards'),
              where('collectionId', '==', collectionId),
              where('isPublic', '==', true)
            );
        const collectionCardsSnap = await getDocs(collectionCardsQuery);
        console.log('Collection cards found:', collectionCardsSnap.docs.length);
        collectionCards = collectionCardsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          cardType: 'collection' as const,
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
        })) as (CollectionCard & { cardType: 'collection' })[];
      } catch (collectionErr: any) {
        console.error('Error fetching collection cards:', collectionErr);
        console.error('Error code:', collectionErr.code, 'Message:', collectionErr.message);
      }

      console.log('Total cards fetched:', { gradedCards: gradedCards.length, collectionCards: collectionCards.length });

      // Merge both types of cards
      setCards([...gradedCards, ...collectionCards]);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
  };

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find the collection - first check current user if logged in
        if (user) {
          const collectionRef = doc(firestore, 'users', user.uid, 'collections', id);
          const collectionSnap = await getDoc(collectionRef);

          if (collectionSnap.exists()) {
            const collectionData = {
              id: collectionSnap.id,
              ...collectionSnap.data(),
              createdAt: collectionSnap.data().createdAt?.toDate?.() || collectionSnap.data().createdAt,
              updatedAt: collectionSnap.data().updatedAt?.toDate?.() || collectionSnap.data().updatedAt,
            } as Collection;

            setCollection(collectionData);
            setIsOwner(true);
            setOwnerId(user.uid);

            // Fetch user's username
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUsername(userDocSnap.data().username || '');
            }

            // Fetch all cards (owner can see all)
            await fetchCards(user.uid, id, true);
            setIsLoading(false);
            return;
          }
        }

        // If userId provided in query, try that user's collection
        if (userIdFromQuery) {
          const collectionRef = doc(firestore, 'users', userIdFromQuery, 'collections', id);
          const collectionSnap = await getDoc(collectionRef);
          
          if (collectionSnap.exists()) {
            const collectionData = {
              id: collectionSnap.id,
              ...collectionSnap.data(),
              createdAt: collectionSnap.data().createdAt?.toDate?.() || collectionSnap.data().createdAt,
              updatedAt: collectionSnap.data().updatedAt?.toDate?.() || collectionSnap.data().updatedAt,
            } as Collection;

            // Only show if public or user is owner
            if (collectionData.isPublic || (user && user.uid === userIdFromQuery)) {
              setCollection(collectionData);
              setIsOwner(user?.uid === userIdFromQuery);
              setOwnerId(userIdFromQuery);
              
              // Fetch owner's username
              const userDocRef = doc(firestore, 'users', userIdFromQuery);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                setUsername(userDocSnap.data().username || '');
              }

              // Fetch public cards only for non-owners
              await fetchCards(userIdFromQuery, id, user?.uid === userIdFromQuery);
              setIsLoading(false);
              return;
            }
          }
        }

        // Last resort - search all users for public collections
        const usersRef = firestoreCollection(firestore, 'users');
        const usersSnap = await getDocs(usersRef);
        
        for (const userDoc of usersSnap.docs) {
          const collectionRef = doc(firestore, 'users', userDoc.id, 'collections', id);
          const collectionSnap = await getDoc(collectionRef);
          
          if (collectionSnap.exists()) {
            const collectionData = {
              id: collectionSnap.id,
              ...collectionSnap.data(),
              createdAt: collectionSnap.data().createdAt?.toDate?.() || collectionSnap.data().createdAt,
              updatedAt: collectionSnap.data().updatedAt?.toDate?.() || collectionSnap.data().updatedAt,
            } as Collection;

            // Only show if public or user is owner
            if (collectionData.isPublic || (user && user.uid === userDoc.id)) {
              setCollection(collectionData);
              setIsOwner(user?.uid === userDoc.id);
              setOwnerId(userDoc.id);
              setUsername(userDoc.data().username || '');

              // Fetch public cards only for non-owners
              await fetchCards(userDoc.id, id, user?.uid === userDoc.id);
              setIsLoading(false);
              return;
            }
          }
        }

        setError('Collection not found or is private');
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching collection:', err);
        setError(err.message || 'Failed to load collection');
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [id, firestore, user?.uid, userIdFromQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || 'Collection not found'}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href={user && isOwner ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            GSA
          </Link>
        </div>
      </header>

      <div className="container py-6 sm:py-8 px-4 max-w-7xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={user && isOwner ? "/dashboard" : (username ? `/${username}` : '/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {user && isOwner ? 'Dashboard' : (username ? `@${username}'s Profile` : 'Home')}
          </Link>
        </Button>

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
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setShowAddCardDialog(true)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icons.logo className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground mb-4">
              {isOwner ? 'No cards in this collection yet' : 'No public cards in this collection'}
            </p>
            {isOwner && (
              <Button onClick={() => setShowAddCardDialog(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Card
              </Button>
            )}
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
                  <Link href={`/collection-card/${card.id}?userId=${ownerId}`}>
                    <CollectionCardDisplay card={card as CollectionCard} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Card Dialog - Only for owner */}
        {isOwner && collection && (
          <AddCardDialog
            open={showAddCardDialog}
            onOpenChange={setShowAddCardDialog}
            collections={[collection]}
            defaultCollectionId={collection.id}
          />
        )}
      </div>
    </div>
  );
}

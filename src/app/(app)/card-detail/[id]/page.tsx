'use client';

import { use, useState, useEffect } from 'react';
import { doc, getDoc, collection } from 'firebase/firestore';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import type { CollectionCard, Collection } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Edit, Eye, EyeOff, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AddCardDialog } from '@/components/add-card-dialog';
import { TradeProposalDialog } from '@/components/trade-proposal-dialog';
import { useCollection as useCollectionHook } from '@/firebase/firestore/use-collection';

export default function CollectionCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');
  const firestore = useFirestore();
  const { user } = useUser();
  const [card, setCard] = useState<CollectionCard | null>(null);
  const [cardOwnerId, setCardOwnerId] = useState<string | null>(null);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);

  const isOwner = user && cardOwnerId && user.uid === cardOwnerId;
  const canProposeTrade = user && cardOwnerId && user.uid !== cardOwnerId;

  // Fetch user's collections for the edit dialog (only if owner)
  const collectionsQuery = useMemoFirebase(() => {
    if (user && cardOwnerId && user.uid === cardOwnerId) {
      return collection(firestore, 'users', user.uid, 'collections');
    }
    return null;
  }, [firestore, user, cardOwnerId]);
  const { data: collections } = useCollectionHook<Collection>(collectionsQuery);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        // Try to find the card in current user's collection first
        if (user) {
          const cardRef = doc(firestore, 'users', user.uid, 'collection_cards', id);
          const cardSnap = await getDoc(cardRef);

          if (cardSnap.exists()) {
            const cardData = { id: cardSnap.id, ...cardSnap.data() } as CollectionCard;
            setCard(cardData);
            setCardOwnerId(user.uid);
            
            // Fetch owner username
            const userRef = doc(firestore, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setOwnerUsername(userSnap.data().username);
            }
            
            setIsLoading(false);
            return;
          }
        }

        // If userId provided in query, try that user's card
        if (userIdFromQuery) {
          const cardRef = doc(firestore, 'users', userIdFromQuery, 'collection_cards', id);
          const cardSnap = await getDoc(cardRef);
          
          if (cardSnap.exists()) {
            const cardData = { id: cardSnap.id, ...cardSnap.data() } as CollectionCard;
            
            // Only show if card is public or user is owner
            if (cardData.isPublic || (user && user.uid === userIdFromQuery)) {
              setCard(cardData);
              setCardOwnerId(userIdFromQuery);
              
              // Fetch owner username
              const userRef = doc(firestore, 'users', userIdFromQuery);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                setOwnerUsername(userSnap.data().username);
              }
              
              setIsLoading(false);
              return;
            }
          }
        }

        setError('Card not found or you do not have permission to view it');
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching card:', err);
        setError('Failed to load card');
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [firestore, user, id, userIdFromQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !card) {
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
            <p className="text-muted-foreground">{error || 'Card not found'}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
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
      {/* Back Link for non-owner */}
      {!isOwner && ownerUsername && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${ownerUsername}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to @{ownerUsername}&apos;s Profile
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Display */}
        <div className="flex justify-center lg:sticky lg:top-24 h-fit">
          <div className="relative w-full max-w-[400px] mx-auto h-[600px] rounded-3xl bg-card/60 backdrop-blur-sm border border-border overflow-hidden shadow-2xl">
            <div className="w-full h-full p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent opacity-50 pointer-events-none" />
              <div className="relative w-full h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 bg-black/20 rounded-xl border-b border-border shrink-0">
                  <div className="flex flex-col">
                    {card.condition ? (
                      <Badge variant="secondary" className="text-sm w-fit">
                        {card.condition}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Ungraded</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(card.quantity ?? 1) > 1 && (
                      <Badge variant="default" className="text-sm">
                        ×{card.quantity}
                      </Badge>
                    )}
                    {card.purchasePrice !== null && card.purchasePrice !== undefined && (
                      <span className="font-headline text-2xl text-accent font-bold leading-none">
                        ${card.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div className="flex-1 flex items-center justify-center py-6">
                  <div className="relative w-[280px] h-[380px] rounded-lg overflow-hidden shadow-lg shadow-black/50 border-2 border-accent/50">
                    {card.imageUrl && !imageError ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.cardName}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-muted-foreground">
                        <div className="text-center p-4">
                          <div className="text-6xl mb-2">🎴</div>
                          <div className="text-base font-medium">{card.cardName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-black/20 rounded-xl border-t border-border shrink-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline text-xl font-bold leading-tight truncate">{card.cardName}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {card.set || 'Unknown Set'}
                      {card.year && ` • ${card.year}`}
                    </p>
                    {(card.cardNumber || card.variant) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {card.cardNumber && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            #{card.cardNumber}
                          </Badge>
                        )}
                        {card.variant && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {card.variant}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {/* Propose Trade - Only for other users' cards */}
            {canProposeTrade && (
              <Button variant="default" onClick={() => setShowTradeDialog(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Propose Trade
              </Button>
            )}
            {/* Edit Button - Only show for owner */}
            {isOwner && (
              <Button onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Card
              </Button>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Card Details</CardTitle>
                <div className="flex items-center gap-2">
                  {card.isPublic ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {card.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Card Name</p>
                  <p className="font-medium">{card.cardName}</p>
                </div>
                {card.set && (
                  <div>
                    <p className="text-sm text-muted-foreground">Set</p>
                    <p className="font-medium">{card.set}</p>
                  </div>
                )}
                {card.year && (
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{card.year}</p>
                  </div>
                )}
                {card.cardNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Card Number</p>
                    <p className="font-medium">#{card.cardNumber}</p>
                  </div>
                )}
                {card.variant && (
                  <div>
                    <p className="text-sm text-muted-foreground">Variant</p>
                    <p className="font-medium">{card.variant}</p>
                  </div>
                )}
                {card.condition && (
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium">{card.condition}</p>
                  </div>
                )}
                {(card.quantity ?? 1) > 1 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">×{card.quantity}</p>
                  </div>
                )}
                {card.purchasePrice !== null && card.purchasePrice !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-medium text-accent">
                      ${card.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>

              {card.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">{card.notes}</p>
                </div>
              )}

              {card.createdAt && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Added on {card.createdAt instanceof Date ? card.createdAt.toLocaleDateString() : new Date(card.createdAt.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog - Only for owner */}
      {isOwner && collections && (
        <AddCardDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          collections={collections}
          editCard={card}
          onCardUpdated={() => {
            // Refresh the card data
            const fetchCard = async () => {
              if (!user || !cardOwnerId) return;
              const cardRef = doc(firestore, 'users', cardOwnerId, 'collection_cards', id);
              const cardSnap = await getDoc(cardRef);
              if (cardSnap.exists()) {
                setCard({ id: cardSnap.id, ...cardSnap.data() } as CollectionCard);
              }
            };
            fetchCard();
          }}
        />
      )}

      {/* Trade Proposal Dialog - Only for other users' cards */}
      {canProposeTrade && ownerUsername && (
        <TradeProposalDialog
          open={showTradeDialog}
          onOpenChange={setShowTradeDialog}
          preselectedUser={ownerUsername}
          preselectedCardId={card.id}
          preselectedCardType="collection"
          onTradeCreated={() => setShowTradeDialog(false)}
        />
      )}
    </div>
  );
}

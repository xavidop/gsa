'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, getDoc, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, XCircle, Scale, DollarSign, Layers, AlertTriangle, Loader2 } from 'lucide-react';
import type { TradeOffer, GradedCard, CollectionCard, TradeCard } from '@/lib/types';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Combined type for display
interface DisplayCard {
  id: string;
  type: 'graded' | 'collection';
  name: string;
  imageUrl?: string;
  grade?: number;
  quantity?: number;
}

interface TradeOfferCardProps {
  trade: TradeOffer;
  type: 'sent' | 'received';
  onRespond?: (offerId: string, response: 'accepted' | 'rejected') => Promise<void>;
}

export function TradeOfferCard({ trade, type, onRespond }: TradeOfferCardProps) {
  const firestore = useFirestore();
  const [offeredCards, setOfferedCards] = useState<DisplayCard[]>([]);
  const [requestedCards, setRequestedCards] = useState<DisplayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (!onRespond) return;
    setIsProcessing(true);
    try {
      await onRespond(trade.id, 'accepted');
      setShowAcceptDialog(false);
    } catch (error) {
      console.error('Error accepting trade:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onRespond) return;
    setIsProcessing(true);
    try {
      await onRespond(trade.id, 'rejected');
      setShowRejectDialog(false);
    } catch (error) {
      console.error('Error rejecting trade:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [trade]);

  const loadCards = async () => {
    if (!firestore || !trade.senderId || !trade.receiverId) return;
    
    setLoading(true);
    try {
      // Load offered cards
      const offered = await Promise.all(
        (trade.offeredCards || []).map(async (tradeCard: TradeCard) => {
          if (!tradeCard?.id || !tradeCard?.type) return null;
          
          if (tradeCard.type === 'graded') {
            const cardDoc = await getDoc(doc(firestore, `users/${trade.senderId}/graded_cards`, tradeCard.id));
            if (cardDoc.exists()) {
              const data = cardDoc.data() as GradedCard;
              return {
                id: cardDoc.id,
                type: 'graded' as const,
                name: data.cardName || 'Unnamed Card',
                imageUrl: data.frontImageUrl,
                grade: data.grade
              };
            }
          } else {
            const cardDoc = await getDoc(doc(firestore, `users/${trade.senderId}/collection_cards`, tradeCard.id));
            if (cardDoc.exists()) {
              const data = cardDoc.data() as CollectionCard;
              return {
                id: cardDoc.id,
                type: 'collection' as const,
                name: data.cardName || 'Unnamed Card',
                imageUrl: data.imageUrl,
                quantity: data.quantity
              };
            }
          }
          return null;
        })
      );
      
      // Load requested cards
      const requested = await Promise.all(
        (trade.requestedCards || []).map(async (tradeCard: TradeCard) => {
          if (!tradeCard?.id || !tradeCard?.type) return null;
          
          if (tradeCard.type === 'graded') {
            const cardDoc = await getDoc(doc(firestore, `users/${trade.receiverId}/graded_cards`, tradeCard.id));
            if (cardDoc.exists()) {
              const data = cardDoc.data() as GradedCard;
              return {
                id: cardDoc.id,
                type: 'graded' as const,
                name: data.cardName || 'Unnamed Card',
                imageUrl: data.frontImageUrl,
                grade: data.grade
              };
            }
          } else {
            const cardDoc = await getDoc(doc(firestore, `users/${trade.receiverId}/collection_cards`, tradeCard.id));
            if (cardDoc.exists()) {
              const data = cardDoc.data() as CollectionCard;
              return {
                id: cardDoc.id,
                type: 'collection' as const,
                name: data.cardName || 'Unnamed Card',
                imageUrl: data.imageUrl,
                quantity: data.quantity
              };
            }
          }
          return null;
        })
      );
      
      setOfferedCards(offered.filter(Boolean) as DisplayCard[]);
      setRequestedCards(requested.filter(Boolean) as DisplayCard[]);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFairnessColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFairnessLabel = (score: number) => {
    if (score >= 90) return 'Fair Trade';
    if (score >= 75) return 'Slightly Unbalanced';
    return 'Unbalanced';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">Loading trade details...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {type === 'received' ? `From ${trade.senderUsername}` : `To ${trade.receiverUsername}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(trade.createdAt instanceof Date ? trade.createdAt : trade.createdAt.toDate()).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {trade.tradeType === 'cards-only' ? 'Cards Only' : 
                 trade.tradeType === 'cash-only' ? 'Cash Only' : 'Cards + Cash'}
              </Badge>
              <Badge variant={trade.status === 'pending' ? 'default' : 'secondary'}>
                {trade.status}
              </Badge>
            </div>
          </div>

          {/* Trade Details */}
          <div className="grid md:grid-cols-3 gap-4 items-center">
            {/* Offered Side */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {type === 'received' ? 'They Offer' : 'You Offer'}
              </div>
              
              {/* Offered Cards */}
              {offeredCards.length > 0 && (
                <div className="space-y-2">
                  {offeredCards.map(card => (
                    <div key={card.id} className="flex items-center gap-2 p-2 border rounded">
                      {card.imageUrl && (
                        <Image 
                          src={card.imageUrl} 
                          alt={card.name}
                          width={40}
                          height={56}
                          className="rounded object-cover"
                          style={{ width: 40, height: 'auto' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{card.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {card.type === 'graded' ? (
                            <>Grade: {card.grade}/10</>
                          ) : (
                            <><Layers className="h-3 w-3" /> Qty: {card.quantity || 1}</>
                          )}
                        </div>
                      </div>
                      <Badge variant={card.type === 'graded' ? 'default' : 'secondary'} className="text-xs">
                        {card.type === 'graded' ? 'Graded' : 'Collection'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Offered Cash */}
              {(trade.tradeType === 'cash-only' || trade.tradeType === 'cards-and-cash') && (trade.senderCash ?? 0) > 0 && (
                <div className="flex items-center gap-2 p-2 border rounded bg-green-50 dark:bg-green-950">
                  <div className="w-10 h-10 rounded bg-green-500 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Cash Offered</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">${(trade.senderCash ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div className="text-sm font-semibold">
                Total Value: ${trade.senderValue.toLocaleString()}
              </div>
            </div>

            {/* Arrow / Fairness */}
            <div className="flex flex-col items-center justify-center gap-2">
              <ArrowRight className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <div className={`flex items-center gap-1 text-sm font-semibold ${getFairnessColor(trade.fairnessScore)}`}>
                  <Scale className="h-4 w-4" />
                  {trade.fairnessScore}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {getFairnessLabel(trade.fairnessScore)}
                </div>
              </div>
            </div>

            {/* Requested Side */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {type === 'received' ? 'They Want' : 'You Want'}
              </div>
              
              {/* Requested Cards */}
              {requestedCards.length > 0 && (
                <div className="space-y-2">
                  {requestedCards.map(card => (
                    <div key={card.id} className="flex items-center gap-2 p-2 border rounded">
                      {card.imageUrl && (
                        <Image 
                          src={card.imageUrl} 
                          alt={card.name}
                          width={40}
                          height={56}
                          className="rounded object-cover"
                          style={{ width: 40, height: 'auto' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{card.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {card.type === 'graded' ? (
                            <>Grade: {card.grade}/10</>
                          ) : (
                            <><Layers className="h-3 w-3" /> Qty: {card.quantity || 1}</>
                          )}
                        </div>
                      </div>
                      <Badge variant={card.type === 'graded' ? 'default' : 'secondary'} className="text-xs">
                        {card.type === 'graded' ? 'Graded' : 'Collection'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Requested Cash */}
              {(trade.tradeType === 'cash-only' || trade.tradeType === 'cards-and-cash') && (trade.receiverCash ?? 0) > 0 && (
                <div className="flex items-center gap-2 p-2 border rounded bg-blue-50 dark:bg-blue-950">
                  <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Cash Requested</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">${(trade.receiverCash ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div className="text-sm font-semibold">
                Total Value: ${trade.receiverValue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          {type === 'received' && trade.status === 'pending' && onRespond && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={() => setShowAcceptDialog(true)}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Trade
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirm Trade Acceptance
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-4">
                <span className="block">
                  Are you sure you want to accept this trade with <strong>{trade.senderUsername}</strong>?
                </span>
                
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You will receive:</span>
                    <span className="font-medium">{offeredCards.length} card(s) worth ${trade.senderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You will give:</span>
                    <span className="font-medium">{requestedCards.length} card(s) worth ${trade.receiverValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-muted-foreground">Trade fairness:</span>
                    <span className={`font-medium ${getFairnessColor(trade.fairnessScore)}`}>
                      {trade.fairnessScore}% - {getFairnessLabel(trade.fairnessScore)}
                    </span>
                  </div>
                </div>

                {trade.fairnessScore < 75 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-yellow-600 dark:text-yellow-400 block">Unbalanced Trade Warning</span>
                      <span className="text-muted-foreground">
                        This trade appears to be unbalanced. Make sure you're comfortable with the exchange.
                      </span>
                    </div>
                  </div>
                )}

                <span className="block text-sm text-muted-foreground">
                  <strong>This action cannot be undone.</strong> The cards will be transferred immediately after acceptance.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Trade
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Decline Trade Offer
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <span className="block">
                  Are you sure you want to decline this trade offer from <strong>{trade.senderUsername}</strong>?
                </span>
                <span className="block mt-2 text-sm">
                  They will be notified that you declined the offer. You can always propose a counter-offer later if you change your mind.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline Offer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

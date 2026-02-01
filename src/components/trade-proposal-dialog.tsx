'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Scale, AlertTriangle, DollarSign, CreditCard, ArrowRightLeft } from 'lucide-react';
import { createTradeOffer, calculateTradeValue, calculateFairnessScore } from '@/lib/trading';
import type { GradedCard, UserProfile, CollectionCard, TradeCard } from '@/lib/types';
import Image from 'next/image';

interface TradeProposalDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTradeCreated?: () => void;
  preselectedUser?: string;
  preselectedCardId?: string;
  preselectedCardType?: 'graded' | 'collection';
}

export function TradeProposalDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  onTradeCreated,
  preselectedUser,
  preselectedCardId,
  preselectedCardType = 'graded'
}: TradeProposalDialogProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;
  const [step, setStep] = useState<'search' | 'trade-type' | 'select-offer' | 'select-request' | 'cash' | 'review'>(  'search');
  const [searchUsername, setSearchUsername] = useState(preselectedUser || '');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [myGradedCards, setMyGradedCards] = useState<GradedCard[]>([]);
  const [myCollectionCards, setMyCollectionCards] = useState<CollectionCard[]>([]);
  const [theirGradedCards, setTheirGradedCards] = useState<GradedCard[]>([]);
  const [theirCollectionCards, setTheirCollectionCards] = useState<CollectionCard[]>([]);
  const [offeredCards, setOfferedCards] = useState<Set<TradeCard>>(new Set());
  const [requestedCards, setRequestedCards] = useState<Set<TradeCard>>(
    preselectedCardId ? new Set([{ id: preselectedCardId, type: preselectedCardType }]) : new Set()
  );
  const [tradeType, setTradeType] = useState<'cards-only' | 'cards-and-cash' | 'cash-only'>('cards-only');
  const [senderCash, setSenderCash] = useState<number>(0);
  const [receiverCash, setReceiverCash] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const myGradedCardsQuery = useMemoFirebase(() => {
    if (!user || !firestore || isUserLoading) return null;
    return query(
      collection(firestore, 'users', user.uid, 'graded_cards')
    );
  }, [user, firestore, isUserLoading]);

  const myCollectionCardsQuery = useMemoFirebase(() => {
    if (!user || !firestore || isUserLoading) return null;
    return query(
      collection(firestore, 'users', user.uid, 'collection_cards')
    );
  }, [user, firestore, isUserLoading]);

  const { data: myGradedCardsData } = useCollection<GradedCard>(myGradedCardsQuery);
  const { data: myCollectionCardsData } = useCollection<CollectionCard>(myCollectionCardsQuery);

  // Auto-search when dialog opens with preselected user
  useEffect(() => {
    if (isOpen && preselectedUser && !selectedUser) {
      handleSearchUser();
    }
  }, [isOpen, preselectedUser]);

  // Update requested cards when preselectedCardId changes
  useEffect(() => {
    if (preselectedCardId) {
      setRequestedCards(new Set([{ id: preselectedCardId, type: preselectedCardType }]));
    }
  }, [preselectedCardId, preselectedCardType]);

  const handleSearchUser = async () => {
    if (!firestore || !searchUsername) return;

    try {
      const userQuery = query(
        collection(firestore, 'users'),
        where('username', '==', searchUsername),
        where('isProfilePublic', '!=', false)
      );
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        const userData = { userId: userSnap.docs[0].id, ...userSnap.docs[0].data() } as UserProfile;
        
        // Check if user has trading enabled
        if (userData.tradingEnabled === false) {
          setErrorMessage('This user has trading disabled in their profile settings.');
          return;
        }
        
        setErrorMessage('');
        setSelectedUser(userData);

        // Load their PUBLIC graded cards
        const gradedCardsQuery = query(
          collection(firestore, 'users', userData.userId, 'graded_cards'),
          where('isPublic', '==', true)
        );
        const gradedCardsSnap = await getDocs(gradedCardsQuery);
        const gradedCards = gradedCardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GradedCard));
        setTheirGradedCards(gradedCards);

        // Load their PUBLIC collection cards
        const collectionCardsQuery = query(
          collection(firestore, 'users', userData.userId, 'collection_cards'),
          where('isPublic', '==', true)
        );
        const collectionCardsSnap = await getDocs(collectionCardsQuery);
        const collectionCards = collectionCardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollectionCard));
        setTheirCollectionCards(collectionCards);

        // Load my cards
        setMyGradedCards(myGradedCardsData || []);
        setMyCollectionCards(myCollectionCardsData || []);

        setStep('trade-type');
      } else {
        setErrorMessage('User not found. Please check the username and try again.');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setErrorMessage('Error searching for user. Please try again.');
    }
  };

  const handleCreateTrade = async () => {
    // Validate based on trade type
    if (!user || !selectedUser) return;
    
    // For cards-only: need cards on both sides
    // For cards-and-cash: need cards on both sides + optional cash
    // For cash-only: need either cards to buy (requestedCards + senderCash) OR cards to sell (offeredCards + receiverCash)
    const hasOfferedCards = offeredCards.size > 0;
    const hasRequestedCards = requestedCards.size > 0;
    const hasSenderCash = senderCash > 0;
    const hasReceiverCash = receiverCash > 0;
    
    if (tradeType === 'cash-only') {
      // Must have cards on at least one side and cash on the other
      const isBuying = hasRequestedCards && hasSenderCash; // Buying their cards with your cash
      const isSelling = hasOfferedCards && hasReceiverCash; // Selling your cards for their cash
      if (!isBuying && !isSelling) {
        setErrorMessage('For cash-only trades, select cards to buy/sell and set the cash amount.');
        return;
      }
    } else {
      // cards-only or cards-and-cash: need cards on both sides
      if (!hasOfferedCards || !hasRequestedCards) return;
    }

    try {
      await createTradeOffer({
        senderId: user.uid,
        senderUsername: user.displayName || user.email || 'Unknown',
        receiverId: selectedUser.userId,
        receiverUsername: selectedUser.username || selectedUser.displayName || 'Unknown',
        offeredCards: Array.from(offeredCards),
        requestedCards: Array.from(requestedCards),
        senderCash: senderCash > 0 ? senderCash : undefined,
        receiverCash: receiverCash > 0 ? receiverCash : undefined,
        tradeType
      });

      setIsOpen(false);
      resetDialog();
      onTradeCreated?.();
    } catch (error: any) {
      console.error('Error creating trade:', error);
      setErrorMessage(error.message || 'Failed to create trade offer. Please try again.');
    }
  };

  const resetDialog = () => {
    setStep('search');
    setSearchUsername('');
    setSelectedUser(null);
    setMyGradedCards([]);
    setMyCollectionCards([]);
    setTheirGradedCards([]);
    setTheirCollectionCards([]);
    setOfferedCards(new Set());
    setRequestedCards(new Set());
    setTradeType('cards-only');
    setSenderCash(0);
    setReceiverCash(0);
    setErrorMessage('');
  };

  const toggleOfferedCard = (cardId: string, cardType: 'graded' | 'collection') => {
    const newSet = new Set(offeredCards);
    // Check if card exists
    const existing = Array.from(newSet).find(c => c.id === cardId && c.type === cardType);
    if (existing) {
      newSet.delete(existing);
    } else {
      newSet.add({ id: cardId, type: cardType });
    }
    setOfferedCards(newSet);
  };

  const toggleRequestedCard = (cardId: string, cardType: 'graded' | 'collection') => {
    const newSet = new Set(requestedCards);
    // Check if card exists
    const existing = Array.from(newSet).find(c => c.id === cardId && c.type === cardType);
    if (existing) {
      newSet.delete(existing);
    } else {
      newSet.add({ id: cardId, type: cardType });
    }
    setRequestedCards(newSet);
  };

  // Helper to check if a card is selected
  const isCardOffered = (cardId: string, cardType: 'graded' | 'collection'): boolean => {
    return Array.from(offeredCards).some(c => c.id === cardId && c.type === cardType);
  };

  const isCardRequested = (cardId: string, cardType: 'graded' | 'collection'): boolean => {
    return Array.from(requestedCards).some(c => c.id === cardId && c.type === cardType);
  };

  // Combine all cards for rendering
  const allMyCards = [...myGradedCards, ...myCollectionCards];
  const allTheirCards = [...theirGradedCards, ...theirCollectionCards];

  // Helper to get selected cards for value calculation
  const getOfferedCardsData = (): (GradedCard | CollectionCard)[] => {
    const cards: (GradedCard | CollectionCard)[] = [];
    offeredCards.forEach(tradeCard => {
      if (tradeCard.type === 'graded') {
        const card = myGradedCards.find(c => c.id === tradeCard.id);
        if (card) cards.push(card);
      } else {
        const card = myCollectionCards.find(c => c.id === tradeCard.id);
        if (card) cards.push(card);
      }
    });
    return cards;
  };

  const getRequestedCardsData = (): (GradedCard | CollectionCard)[] => {
    const cards: (GradedCard | CollectionCard)[] = [];
    requestedCards.forEach(tradeCard => {
      if (tradeCard.type === 'graded') {
        const card = theirGradedCards.find(c => c.id === tradeCard.id);
        if (card) cards.push(card);
      } else {
        const card = theirCollectionCards.find(c => c.id === tradeCard.id);
        if (card) cards.push(card);
      }
    });
    return cards;
  };

  const offeredValue = calculateTradeValue(getOfferedCardsData()) + senderCash;
  const requestedValue = calculateTradeValue(getRequestedCardsData()) + receiverCash;
  const fairnessScore = calculateFairnessScore(offeredValue, requestedValue);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Propose Trade
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propose Trade</DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Find User to Trade With</Label>
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter username"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <Button onClick={handleSearchUser}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'select-offer' && (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold mb-2">Select cards you want to offer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trading with: {selectedUser?.username || selectedUser?.displayName}
              </p>
            </div>
            {allMyCards.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground mb-2">You don't have any cards to offer</p>
                <p className="text-sm text-muted-foreground">
                  {tradeType === 'cash-only' 
                    ? "No cards to sell? Skip this step to buy cards with cash instead."
                    : "Grade some cards or add collection cards first to start trading"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
                {allMyCards.map(card => {
                  const cardType: 'graded' | 'collection' = 'grade' in card ? 'graded' : 'collection';
                  const isSelected = isCardOffered(card.id, cardType);
                  const imageUrl = 'frontImageUrl' in card ? card.frontImageUrl : card.imageUrl;
                  return (
                    <Card
                      key={`${cardType}-${card.id}`}
                      className={`p-3 cursor-pointer transition-all relative ${
                        isSelected 
                          ? 'border-2 border-green-500 bg-green-500/10' 
                          : 'border-2 border-transparent hover:border-muted'
                      }`}
                      onClick={() => toggleOfferedCard(card.id, cardType)}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 text-sm font-bold">
                          ✓
                        </div>
                      )}
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={card.cardName || 'Card'}
                          width={150}
                          height={210}
                          className="rounded object-cover w-full mb-2"
                        />
                      )}
                      <div className="text-sm font-medium">{card.cardName || 'Unnamed'}</div>
                      {'grade' in card ? (
                        <>
                          <div className="text-xs text-muted-foreground">Grade: {card.grade}/10</div>
                          {card.currentMarketPrice && (
                            <div className="text-xs font-semibold">${card.currentMarketPrice}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground">Collection Card</div>
                          {card.purchasePrice && (
                            <div className="text-xs font-semibold">${card.purchasePrice}</div>
                          )}
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('trade-type')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('select-request')}
                disabled={tradeType !== 'cash-only' && offeredCards.size === 0}
              >
                {tradeType === 'cash-only' && offeredCards.size === 0 
                  ? 'Skip to Select Cards to Buy'
                  : 'Next: Select Cards to Request'
                }
              </Button>
            </div>
          </div>
        )}

        {step === 'select-request' && (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold">Select cards you want to request</h3>
            {allTheirCards.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground mb-2">This user has no public cards available</p>
                <p className="text-sm text-muted-foreground">
                  {tradeType === 'cash-only' && offeredCards.size > 0
                    ? "You can still sell your cards for cash - skip this step."
                    : "They need to grade cards and make them public first"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
                {allTheirCards.map(card => {
                  const cardType: 'graded' | 'collection' = 'grade' in card ? 'graded' : 'collection';
                  const isSelected = isCardRequested(card.id, cardType);
                  const imageUrl = 'frontImageUrl' in card ? card.frontImageUrl : card.imageUrl;
                  return (
                    <Card
                      key={`${cardType}-${card.id}`}
                      className={`p-3 cursor-pointer transition-all relative ${
                        isSelected 
                          ? 'border-2 border-green-500 bg-green-500/10' 
                          : 'border-2 border-transparent hover:border-muted'
                      }`}
                      onClick={() => toggleRequestedCard(card.id, cardType)}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 text-sm font-bold">
                          ✓
                        </div>
                      )}
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={card.cardName || 'Card'}
                          width={150}
                          height={210}
                          className="rounded object-cover w-full mb-2"
                        />
                      )}
                      <div className="text-sm font-medium">{card.cardName || 'Unnamed'}</div>
                      {'grade' in card ? (
                        <>
                          <div className="text-xs text-muted-foreground">Grade: {card.grade}/10</div>
                          {card.currentMarketPrice && (
                            <div className="text-xs font-semibold">${card.currentMarketPrice}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground">Collection Card</div>
                          {card.purchasePrice && (
                            <div className="text-xs font-semibold">${card.purchasePrice}</div>
                          )}
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-offer')}>
                Back
              </Button>
              <Button
                onClick={() => {
                  if (tradeType === 'cards-and-cash' || tradeType === 'cash-only') {
                    setStep('cash');
                  } else {
                    setStep('review');
                  }
                }}
                disabled={tradeType !== 'cash-only' && requestedCards.size === 0}
              >
                {tradeType === 'cash-only' 
                  ? (requestedCards.size === 0 ? 'Skip to Set Cash Amount' : 'Set Cash Amount')
                  : tradeType === 'cards-and-cash' 
                    ? 'Add Cash' 
                    : 'Review Trade'
                }
              </Button>
            </div>
          </div>
        )}

        {step === 'trade-type' && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold mb-2">Select Trade Type</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trading with: {selectedUser?.username || selectedUser?.displayName}
              </p>
              <RadioGroup value={tradeType} onValueChange={(value: any) => setTradeType(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="cards-only" id="cards-only" />
                  <Label htmlFor="cards-only" className="flex items-center gap-2 cursor-pointer flex-1">
                    <ArrowRightLeft className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Cards Only</div>
                      <div className="text-sm text-muted-foreground">Trade cards for cards</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="cards-and-cash" id="cards-and-cash" />
                  <Label htmlFor="cards-and-cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Cards + Cash</div>
                      <div className="text-sm text-muted-foreground">Add cash to balance the trade</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="cash-only" id="cash-only" />
                  <Label htmlFor="cash-only" className="flex items-center gap-2 cursor-pointer flex-1">
                    <DollarSign className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Cash Only</div>
                      <div className="text-sm text-muted-foreground">Buy/sell cards for cash</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button onClick={() => {
                // All trade types go through card selection
                // For cash-only, you pick cards to buy OR sell
                setStep('select-offer');
              }}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'cash' && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold mb-2">Add Cash</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {tradeType === 'cash-only' 
                  ? 'Set the cash amount for this transaction'
                  : 'Add cash to balance the trade value'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sender-cash">Cash You {tradeType === 'cash-only' ? 'Pay' : 'Add'} ($)</Label>
                <Input
                  id="sender-cash"
                  type="number"
                  min="0"
                  step="0.01"
                  value={senderCash || ''}
                  onChange={(e) => setSenderCash(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiver-cash">Cash They {tradeType === 'cash-only' ? 'Receive' : 'Add'} ($)</Label>
                <Input
                  id="receiver-cash"
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiverCash || ''}
                  onChange={(e) => setReceiverCash(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-request')}>
                Back
              </Button>
              <Button onClick={() => setStep('review')}>
                Review Trade
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold">Review Trade Offer</h3>
            
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">You Offer ({offeredCards.size} cards{senderCash > 0 ? ' + cash' : ''})</div>
                <div className="text-lg font-bold mb-2">${offeredValue.toLocaleString()}</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getOfferedCardsData().map(card => {
                    const cardType = 'grade' in card ? 'graded' : 'collection';
                    return (
                      <div key={`${cardType}-${card.id}`} className="text-sm p-2 border rounded">
                        {card.cardName} {' - '}
                        {'grade' in card ? `Grade ${card.grade}` : 'Collection Card'}
                      </div>
                    );
                  })}
                  {senderCash > 0 && (
                    <div className="text-sm p-2 border rounded bg-green-50 dark:bg-green-950 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">${senderCash.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">You Request ({requestedCards.size} cards{receiverCash > 0 ? ' + cash' : ''})</div>
                <div className="text-lg font-bold mb-2">${requestedValue.toLocaleString()}</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getRequestedCardsData().map(card => {
                    const cardType = 'grade' in card ? 'graded' : 'collection';
                    return (
                      <div key={`${cardType}-${card.id}`} className="text-sm p-2 border rounded">
                        {card.cardName} {' - '}
                        {'grade' in card ? `Grade ${card.grade}` : 'Collection Card'}
                      </div>
                    );
                  })}
                  {receiverCash > 0 && (
                    <div className="text-sm p-2 border rounded bg-green-50 dark:bg-green-950 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">${receiverCash.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 p-4 border rounded">
              <Scale className="h-5 w-5" />
              <div>
                <div className="font-semibold">Fairness Score: {fairnessScore}%</div>
                <div className="text-sm text-muted-foreground">
                  {fairnessScore >= 90 ? 'Fair Trade' : fairnessScore >= 75 ? 'Slightly Unbalanced' : 'Unbalanced'}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                if (tradeType === 'cash-only' || tradeType === 'cards-and-cash') {
                  setStep('cash');
                } else {
                  setStep('select-request');
                }
              }}>
                Back
              </Button>
              <Button onClick={handleCreateTrade}>
                Send Trade Offer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

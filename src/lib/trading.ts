import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { TradeOffer, GradedCard, CollectionCard, TradeCard } from './types';
import { notifyTradeReceived, notifyTradeAccepted, notifyTradeRejected } from './notifications';
import { checkAchievementsInBackground } from './gamification';

/**
 * Calculate fair trade value based on card grades/prices and market prices
 */
export function calculateTradeValue(cards: (GradedCard | CollectionCard)[]): number {
  return cards.reduce((total, card) => {
    // Check if it's a graded card
    if ('grade' in card) {
      // Use market price if available, otherwise estimate based on grade
      if (card.currentMarketPrice) {
        return total + card.currentMarketPrice;
      }
      
      // Fallback estimation: base price * grade multiplier
      const basePrice = 50;
      const gradeMultiplier = Math.pow(1.5, card.grade - 5);
      return total + (basePrice * gradeMultiplier);
    } else {
      // Collection card - use purchase price * quantity
      const price = card.purchasePrice || 0;
      const qty = card.quantity || 1;
      return total + (price * qty);
    }
  }, 0);
}

/**
 * Calculate fairness score (0-100) for a trade
 * 100 = perfectly balanced, lower = more unbalanced
 */
export function calculateFairnessScore(senderValue: number, receiverValue: number): number {
  if (senderValue === 0 || receiverValue === 0) return 0;
  
  const ratio = Math.min(senderValue, receiverValue) / Math.max(senderValue, receiverValue);
  return Math.round(ratio * 100);
}

/**
 * Create a new trade offer
 */
export async function createTradeOffer(params: {
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  offeredCards: TradeCard[];
  requestedCards: TradeCard[];
  senderCash?: number;
  receiverCash?: number;
  tradeType: 'cards-only' | 'cards-and-cash' | 'cash-only';
}): Promise<string> {
  const { firestore } = initializeFirebase();
  
  // Check if both users have trading enabled
  const [senderDoc, receiverDoc] = await Promise.all([
    getDoc(doc(firestore, 'users', params.senderId)),
    getDoc(doc(firestore, 'users', params.receiverId))
  ]);
  
  if (!senderDoc.exists() || !receiverDoc.exists()) {
    throw new Error('User not found');
  }
  
  const senderData = senderDoc.data();
  const receiverData = receiverDoc.data();
  
  if (senderData.tradingEnabled === false) {
    throw new Error('You have trading disabled in your profile settings');
  }
  
  if (receiverData.tradingEnabled === false) {
    throw new Error('This user has trading disabled');
  }

  // Validate card IDs
  for (const card of params.offeredCards) {
    if (!card.id || typeof card.id !== 'string') {
      throw new Error('Invalid offered card ID');
    }
  }
  for (const card of params.requestedCards) {
    if (!card.id || typeof card.id !== 'string') {
      throw new Error('Invalid requested card ID');
    }
  }
  
  // Fetch all cards to calculate values
  const offeredCardsData: (GradedCard | CollectionCard)[] = [];
  const requestedCardsData: (GradedCard | CollectionCard)[] = [];
  
  for (const tradeCard of params.offeredCards) {
    const collectionName = tradeCard.type === 'graded' ? 'graded_cards' : 'collection_cards';
    const cardDoc = await getDoc(doc(firestore, 'users', params.senderId, collectionName, tradeCard.id));
    if (cardDoc.exists()) {
      offeredCardsData.push({ id: cardDoc.id, ...cardDoc.data() } as GradedCard | CollectionCard);
    } else {
      throw new Error(`Offered card not found: ${tradeCard.id}`);
    }
  }
  
  for (const tradeCard of params.requestedCards) {
    const collectionName = tradeCard.type === 'graded' ? 'graded_cards' : 'collection_cards';
    // Try fetching from public_graded_cards first if it's a graded card
    let cardData: GradedCard | CollectionCard | null = null;
    
    if (tradeCard.type === 'graded') {
      // For graded cards, try public collection first (where publicShareId = card.id might work)
      // Otherwise try the user's collection
      try {
        const cardDoc = await getDoc(doc(firestore, 'users', params.receiverId, collectionName, tradeCard.id));
        if (cardDoc.exists()) {
          cardData = { id: cardDoc.id, ...cardDoc.data() } as GradedCard;
        }
      } catch (error) {
        console.error('Error fetching graded card, trying public collection');
      }
    } else {
      const cardDoc = await getDoc(doc(firestore, 'users', params.receiverId, collectionName, tradeCard.id));
      if (cardDoc.exists()) {
        cardData = { id: cardDoc.id, ...cardDoc.data() } as CollectionCard;
      }
    }
    
    if (cardData) {
      requestedCardsData.push(cardData);
    } else {
      throw new Error(`Requested card not found or not accessible: ${tradeCard.id}`);
    }
  }
  
  const senderCardsValue = calculateTradeValue(offeredCardsData);
  const receiverCardsValue = calculateTradeValue(requestedCardsData);
  
  // Create card snapshots with details for trade history
  // Note: Firebase doesn't allow undefined values, so we only include fields that have values
  const offeredCardsWithDetails: TradeCard[] = params.offeredCards.map((card, index) => {
    const cardData = offeredCardsData[index] as Record<string, unknown>;
    const snapshot: TradeCard = {
      id: card.id,
      type: card.type,
      name: (cardData.cardName as string) || (cardData.playerName as string) || 'Unknown Card',
    };
    const imageUrl = (cardData.frontImageUrl as string) || (cardData.imageUrl as string);
    if (imageUrl) snapshot.imageUrl = imageUrl;
    if (cardData.grade !== undefined) snapshot.grade = cardData.grade as number;
    if (cardData.quantity !== undefined) snapshot.quantity = cardData.quantity as number;
    return snapshot;
  });
  
  const requestedCardsWithDetails: TradeCard[] = params.requestedCards.map((card, index) => {
    const cardData = requestedCardsData[index] as Record<string, unknown>;
    const snapshot: TradeCard = {
      id: card.id,
      type: card.type,
      name: (cardData.cardName as string) || (cardData.playerName as string) || 'Unknown Card',
    };
    const imageUrl = (cardData.frontImageUrl as string) || (cardData.imageUrl as string);
    if (imageUrl) snapshot.imageUrl = imageUrl;
    if (cardData.grade !== undefined) snapshot.grade = cardData.grade as number;
    if (cardData.quantity !== undefined) snapshot.quantity = cardData.quantity as number;
    return snapshot;
  });
  
  // Calculate total value including cash
  const senderValue = senderCardsValue + (params.senderCash || 0);
  const receiverValue = receiverCardsValue + (params.receiverCash || 0);
  const fairnessScore = calculateFairnessScore(senderValue, receiverValue);
  
  // Create trade offer with 7-day expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const tradeOffer: Omit<TradeOffer, 'id'> = {
    senderId: params.senderId,
    senderUsername: params.senderUsername,
    receiverId: params.receiverId,
    receiverUsername: params.receiverUsername,
    offeredCards: offeredCardsWithDetails,
    requestedCards: requestedCardsWithDetails,
    senderCash: params.senderCash ?? 0,
    receiverCash: params.receiverCash ?? 0,
    tradeType: params.tradeType,
    senderValue,
    receiverValue,
    fairnessScore,
    status: 'pending',
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(expiresAt)
  };
  
  const docRef = await addDoc(collection(firestore, 'tradeOffers'), tradeOffer);
  
  // Send notification to receiver
  const createdOffer = { id: docRef.id, ...tradeOffer } as TradeOffer;
  await notifyTradeReceived(firestore, params.receiverId, createdOffer);
  
  return docRef.id;
}

/**
 * Get trade offers for a user (both sent and received)
 */
export async function getUserTradeOffers(userId: string): Promise<{
  sent: TradeOffer[];
  received: TradeOffer[];
}> {
  const { firestore } = initializeFirebase();
  
  const sentQuery = query(
    collection(firestore, 'tradeOffers'),
    where('senderId', '==', userId),
    where('status', 'in', ['pending', 'countered'])
  );
  
  const receivedQuery = query(
    collection(firestore, 'tradeOffers'),
    where('receiverId', '==', userId),
    where('status', 'in', ['pending', 'countered'])
  );
  
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery)
  ]);
  
  const sent = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer));
  const received = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer));
  
  return { sent, received };
}

/**
 * Get trade history for a user (completed, rejected, expired trades)
 */
export async function getTradeHistory(userId: string, limit: number = 50): Promise<TradeOffer[]> {
  const { firestore } = initializeFirebase();
  
  // Get trades where user was sender
  const sentQuery = query(
    collection(firestore, 'tradeOffers'),
    where('senderId', '==', userId),
    where('status', 'in', ['accepted', 'rejected', 'expired'])
  );
  
  // Get trades where user was receiver
  const receivedQuery = query(
    collection(firestore, 'tradeOffers'),
    where('receiverId', '==', userId),
    where('status', 'in', ['accepted', 'rejected', 'expired'])
  );
  
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery)
  ]);
  
  const allTrades = [
    ...sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer)),
    ...receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer))
  ];
  
  // Sort by respondedAt or createdAt (most recent first)
  allTrades.sort((a, b) => {
    const dateA = a.respondedAt || a.createdAt;
    const dateB = b.respondedAt || b.createdAt;
    const timeA = dateA instanceof Date ? dateA.getTime() : dateA.toMillis();
    const timeB = dateB instanceof Date ? dateB.getTime() : dateB.toMillis();
    return timeB - timeA;
  });
  
  return allTrades.slice(0, limit);
}

/**
 * Respond to a trade offer
 */
export async function respondToTradeOffer(
  offerId: string,
  response: 'accepted' | 'rejected',
  message?: string
): Promise<void> {
  const { firestore } = initializeFirebase();
  
  // Get the trade offer first to send notification
  const offerDoc = await getDoc(doc(firestore, 'tradeOffers', offerId));
  if (!offerDoc.exists()) {
    throw new Error('Trade offer not found');
  }
  
  const offer = { id: offerDoc.id, ...offerDoc.data() } as TradeOffer;
  
  // If accepting, transfer card ownership
  if (response === 'accepted') {
    await executeTradeTransfer(firestore, offer);
  }
  
  await updateDoc(doc(firestore, 'tradeOffers', offerId), {
    status: response,
    respondedAt: Timestamp.now(),
    completedAt: response === 'accepted' ? Timestamp.now() : null,
    ...(message && { message })
  });
  
  // Send notification to the sender about the response
  if (response === 'accepted') {
    await notifyTradeAccepted(firestore, offer.senderId, offer);
    
    // Check for achievements for both parties
    checkAchievementsInBackground(offer.senderId);
    checkAchievementsInBackground(offer.receiverId);
  } else {
    await notifyTradeRejected(firestore, offer.senderId, offer);
  }
}

/**
 * Execute the card ownership transfer for an accepted trade
 */
async function executeTradeTransfer(firestore: any, trade: TradeOffer): Promise<void> {
  const { writeBatch, doc, getDoc, setDoc, deleteDoc } = await import('firebase/firestore');
  const batch = writeBatch(firestore);
  
  // Transfer offered cards: Sender -> Receiver
  for (const tradeCard of trade.offeredCards || []) {
    if (!tradeCard?.id || !tradeCard?.type) continue;
    
    const collectionName = tradeCard.type === 'graded' ? 'graded_cards' : 'collection_cards';
    const sourceRef = doc(firestore, 'users', trade.senderId, collectionName, tradeCard.id);
    const destRef = doc(firestore, 'users', trade.receiverId, collectionName, tradeCard.id);
    
    const cardDoc = await getDoc(sourceRef);
    if (cardDoc.exists()) {
      const cardData = cardDoc.data();
      
      batch.set(destRef, {
        ...cardData,
        userId: trade.receiverId,
        previousOwnerId: trade.senderId,
        acquiredVia: 'trade',
        acquiredAt: Timestamp.now(),
        tradeId: trade.id,
        collectionId: null,
      });
      
      batch.delete(sourceRef);
      
      if (tradeCard.type === 'graded' && cardData.publicShareId) {
        const publicCardRef = doc(firestore, 'public_graded_cards', cardData.publicShareId);
        batch.update(publicCardRef, {
          ownerId: trade.receiverId,
        });
      }
    }
  }
  
  // Transfer requested cards: Receiver -> Sender
  for (const tradeCard of trade.requestedCards || []) {
    if (!tradeCard?.id || !tradeCard?.type) continue;
    
    const collectionName = tradeCard.type === 'graded' ? 'graded_cards' : 'collection_cards';
    const sourceRef = doc(firestore, 'users', trade.receiverId, collectionName, tradeCard.id);
    const destRef = doc(firestore, 'users', trade.senderId, collectionName, tradeCard.id);
    
    const cardDoc = await getDoc(sourceRef);
    if (cardDoc.exists()) {
      const cardData = cardDoc.data();
      
      batch.set(destRef, {
        ...cardData,
        userId: trade.senderId,
        previousOwnerId: trade.receiverId,
        acquiredVia: 'trade',
        acquiredAt: Timestamp.now(),
        tradeId: trade.id,
        collectionId: null,
      });
      
      batch.delete(sourceRef);
      
      if (tradeCard.type === 'graded' && cardData.publicShareId) {
        const publicCardRef = doc(firestore, 'public_graded_cards', cardData.publicShareId);
        batch.update(publicCardRef, {
          ownerId: trade.senderId,
        });
      }
    }
  }
  
  await batch.commit();
}

/**
 * Counter a trade offer
 */
export async function counterTradeOffer(
  offerId: string,
  newOfferedCardIds: string[],
  newRequestedCardIds: string[],
  message?: string
): Promise<void> {
  const { firestore } = initializeFirebase();
  const originalOffer = await getDoc(doc(firestore, 'tradeOffers', offerId));
  
  if (!originalOffer.exists()) {
    throw new Error('Trade offer not found');
  }
  
  const offer = originalOffer.data() as TradeOffer;
  
  // Fetch cards to calculate new values
  const offeredCards: GradedCard[] = [];
  const requestedCards: GradedCard[] = [];
  
  for (const cardId of newOfferedCardIds) {
    const cardDoc = await getDoc(doc(firestore, 'users', offer.receiverId, 'graded_cards', cardId));
    if (cardDoc.exists()) {
      offeredCards.push({ id: cardDoc.id, ...cardDoc.data() } as GradedCard);
    }
  }
  
  for (const cardId of newRequestedCardIds) {
    const cardDoc = await getDoc(doc(firestore, 'users', offer.senderId, 'graded_cards', cardId));
    if (cardDoc.exists()) {
      requestedCards.push({ id: cardDoc.id, ...cardDoc.data() } as GradedCard);
    }
  }
  
  const senderValue = calculateTradeValue(requestedCards);
  const receiverValue = calculateTradeValue(offeredCards);
  const fairnessScore = calculateFairnessScore(senderValue, receiverValue);
  
  await updateDoc(doc(firestore, 'tradeOffers', offerId), {
    offeredCards: newRequestedCardIds, // Swap perspective
    requestedCards: newOfferedCardIds,
    senderValue: receiverValue,
    receiverValue: senderValue,
    fairnessScore,
    status: 'countered',
    respondedAt: Timestamp.now(),
    ...(message && { message })
  });
}

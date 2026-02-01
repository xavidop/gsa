import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { GradedCard, CollectionCard, PricePoint, PriceAlert } from './types';

/**
 * Market Price Integration Service
 * Integrates with various market data sources to fetch card prices
 */

export interface MarketPriceSource {
  name: string;
  fetchPrice: (card: GradedCard) => Promise<number | null>;
}

/**
 * Mock market price fetcher - Replace with actual API integrations
 * Potential integrations: eBay API, COMC API, TCGPlayer, etc.
 */
const mockPriceFetcher: MarketPriceSource = {
  name: 'Mock Market Data',
  async fetchPrice(card: GradedCard): Promise<number | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate realistic price based on grade
    const basePrice = 50;
    const gradeMultiplier = Math.pow(1.5, card.grade - 5); // Exponential growth with grade
    const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    
    return Math.round(basePrice * gradeMultiplier * randomVariation * 100) / 100;
  }
};

/**
 * eBay sold listings scraper (conceptual - requires proper API integration)
 */
const ebayPriceFetcher: MarketPriceSource = {
  name: 'eBay Sold Listings',
  async fetchPrice(card: GradedCard): Promise<number | null> {
    // TODO: Integrate with eBay Finding API
    // Search for similar cards with same grade
    // Calculate average of recent sold listings
    return null;
  }
};

const priceSources: MarketPriceSource[] = [
  mockPriceFetcher,
  // ebayPriceFetcher, // Enable when API keys are configured
];

/**
 * Fetch current market price for a card
 */
export async function fetchMarketPrice(card: GradedCard): Promise<number | null> {
  for (const source of priceSources) {
    try {
      const price = await source.fetchPrice(card);
      if (price !== null) {
        return price;
      }
    } catch (error) {
      console.error(`Error fetching price from ${source.name}:`, error);
    }
  }
  return null;
}

/**
 * Update market price for a specific card
 */
export async function updateCardMarketPrice(userId: string, cardId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const cardRef = doc(firestore, 'users', userId, 'graded_cards', cardId);
  const cardSnap = await getDoc(cardRef);
  
  if (!cardSnap.exists()) {
    throw new Error('Card not found');
  }
  
  const card = { id: cardSnap.id, ...cardSnap.data() } as GradedCard;
  const newPrice = await fetchMarketPrice(card);
  
  if (newPrice !== null) {
    const pricePoint: PricePoint = {
      price: newPrice,
      date: Timestamp.now(),
      source: 'market_data'
    };
    
    const priceHistory = card.priceHistory || [];
    priceHistory.push(pricePoint);
    
    // Keep only last 90 days of price history
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const filteredHistory = priceHistory.filter(p => {
      const pointDate = p.date instanceof Timestamp ? p.date.toMillis() : new Date(p.date).getTime();
      return pointDate > ninetyDaysAgo;
    });
    
    await updateDoc(cardRef, {
      currentMarketPrice: newPrice,
      lastPriceUpdate: Timestamp.now(),
      priceHistory: filteredHistory
    });
  }
}

/**
 * Calculate portfolio value for a user
 */
export async function calculatePortfolioValue(userId: string): Promise<{
  totalValue: number;
  totalInvestment: number;
  roi: number;
  cardCount: number;
}> {
  const { firestore } = initializeFirebase();
  
  // Get graded cards
  const gradedCardsQuery = query(
    collection(firestore, 'users', userId, 'graded_cards')
  );
  const gradedCardsSnap = await getDocs(gradedCardsQuery);
  
  // Get collection cards
  const collectionCardsQuery = query(
    collection(firestore, 'users', userId, 'collection_cards')
  );
  const collectionCardsSnap = await getDocs(collectionCardsQuery);
  
  let totalValue = 0;
  let totalInvestment = 0;
  let cardCount = gradedCardsSnap.size + collectionCardsSnap.size;
  
  // Process graded cards
  for (const cardDoc of gradedCardsSnap.docs) {
    const card = cardDoc.data() as GradedCard;
    
    // Use current market price or estimate
    if (card.currentMarketPrice) {
      totalValue += card.currentMarketPrice;
    } else {
      // Fetch and cache price
      const price = await fetchMarketPrice({ ...card, id: cardDoc.id } as GradedCard);
      if (price) {
        totalValue += price;
      }
    }
    
    // Add purchase price to investment
    if (card.purchasePrice) {
      totalInvestment += card.purchasePrice;
    }
  }
  
  // Process collection cards
  for (const cardDoc of collectionCardsSnap.docs) {
    const card = cardDoc.data() as CollectionCard;
    const price = card.purchasePrice || 0;
    const qty = card.quantity || 1;
    
    // Collection cards: use purchase price as both value and investment
    totalValue += price * qty;
    totalInvestment += price * qty;
  }
  
  const roi = totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0;
  
  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    cardCount
  };
}

/**
 * Get price trend data for a card
 */
export function getPriceTrend(card: GradedCard): {
  direction: 'up' | 'down' | 'stable';
  percentChange: number;
} {
  if (!card.priceHistory || card.priceHistory.length < 2) {
    return { direction: 'stable', percentChange: 0 };
  }
  
  const sortedHistory = [...card.priceHistory].sort((a, b) => {
    const aTime = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date).getTime();
    const bTime = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date).getTime();
    return aTime - bTime;
  });
  
  const oldestPrice = sortedHistory[0].price;
  const latestPrice = sortedHistory[sortedHistory.length - 1].price;
  const percentChange = ((latestPrice - oldestPrice) / oldestPrice) * 100;
  
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (percentChange > 5) direction = 'up';
  else if (percentChange < -5) direction = 'down';
  
  return {
    direction,
    percentChange: Math.round(percentChange * 100) / 100
  };
}

/**
 * Check price alerts for a user
 */
export async function checkPriceAlerts(userId: string): Promise<string[]> {
  const { firestore } = initializeFirebase();
  const alertsQuery = query(
    collection(firestore, 'priceAlerts'),
    where('userId', '==', userId),
    where('isActive', '==', true)
  );
  
  const alertsSnap = await getDocs(alertsQuery);
  const triggeredAlerts: string[] = [];
  
  for (const alertDoc of alertsSnap.docs) {
    const alert = { id: alertDoc.id, ...alertDoc.data() } as PriceAlert;
    
    if (alert.cardId) {
      const cardRef = doc(firestore, 'gradedCards', alert.cardId);
      const cardSnap = await getDoc(cardRef);
      
      if (cardSnap.exists()) {
        const card = cardSnap.data() as GradedCard;
        const currentPrice = card.currentMarketPrice || 0;
        
        const shouldTrigger = 
          (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
          (alert.condition === 'below' && currentPrice <= alert.targetPrice);
        
        if (shouldTrigger) {
          triggeredAlerts.push(alertDoc.id);
          await updateDoc(doc(firestore, 'priceAlerts', alertDoc.id), {
            isActive: false,
            triggeredAt: Timestamp.now()
          });
        }
      }
    }
  }
  
  return triggeredAlerts;
}

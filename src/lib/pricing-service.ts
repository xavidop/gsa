/**
 * Card Pricing Service
 * 
 * This service provides market price data for trading cards from multiple sources.
 * 
 * Supported APIs:
 * 1. TCGplayer - Best for Pokemon, Magic: The Gathering, Yu-Gi-Oh
 * 2. eBay Browse API - For sports cards and general market data
 * 3. PriceCharting - For retro/vintage cards
 * 
 * Architecture:
 * - API calls are made server-side via Next.js API routes (to protect keys)
 * - Prices are cached in Firestore to reduce API calls
 * - Background jobs update prices periodically
 */

import type { GradedCard } from './types';

// Card categories for routing to the right API
export type CardCategory = 
  | 'pokemon'
  | 'magic'
  | 'yugioh'
  | 'sports-baseball'
  | 'sports-basketball'
  | 'sports-football'
  | 'sports-hockey'
  | 'sports-soccer'
  | 'other';

export interface PriceResult {
  price: number | null;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: Date;
  currency: string;
  priceBreakdown?: {
    low: number;
    mid: number;
    high: number;
    market: number;
  };
}

export interface PriceSearchParams {
  cardName: string;
  set?: string;
  year?: string;
  cardNumber?: string;
  grade?: number;
  variant?: string;
  category?: CardCategory;
}

/**
 * Detect card category from card data
 */
export function detectCardCategory(card: GradedCard | PriceSearchParams): CardCategory {
  const name = card.cardName?.toLowerCase() || '';
  const set = card.set?.toLowerCase() || '';
  
  // Pokemon detection
  if (
    set.includes('pokemon') ||
    set.includes('base set') ||
    set.includes('jungle') ||
    set.includes('fossil') ||
    set.includes('team rocket') ||
    set.includes('gym') ||
    set.includes('neo') ||
    set.includes('expedition') ||
    set.includes('skyridge') ||
    set.includes('ex ') ||
    set.includes('diamond & pearl') ||
    set.includes('platinum') ||
    set.includes('heartgold') ||
    set.includes('soulsilver') ||
    set.includes('black & white') ||
    set.includes('xy') ||
    set.includes('sun & moon') ||
    set.includes('sword & shield') ||
    set.includes('scarlet & violet') ||
    name.includes('pikachu') ||
    name.includes('charizard') ||
    name.includes('mewtwo')
  ) {
    return 'pokemon';
  }
  
  // Magic: The Gathering detection
  if (
    set.includes('magic') ||
    set.includes('mtg') ||
    set.includes('alpha') ||
    set.includes('beta') ||
    set.includes('unlimited') ||
    set.includes('revised') ||
    set.includes('arabian nights') ||
    set.includes('antiquities') ||
    set.includes('legends') ||
    set.includes('the dark') ||
    name.includes('black lotus') ||
    name.includes('mox')
  ) {
    return 'magic';
  }
  
  // Yu-Gi-Oh detection
  if (
    set.includes('yu-gi-oh') ||
    set.includes('yugioh') ||
    set.includes('legend of blue eyes') ||
    set.includes('metal raiders') ||
    set.includes('lob') ||
    set.includes('mrd') ||
    name.includes('blue-eyes') ||
    name.includes('dark magician') ||
    name.includes('exodia')
  ) {
    return 'yugioh';
  }
  
  // Sports cards detection
  const year = card.year || '';
  const yearNum = parseInt(year);
  
  if (
    set.includes('topps') ||
    set.includes('panini') ||
    set.includes('upper deck') ||
    set.includes('bowman') ||
    set.includes('donruss') ||
    set.includes('fleer') ||
    set.includes('prizm') ||
    set.includes('select') ||
    set.includes('mosaic') ||
    set.includes('optic') ||
    (yearNum >= 1900 && yearNum <= 2030)
  ) {
    // Try to detect sport type
    if (set.includes('baseball') || name.includes('mlb')) return 'sports-baseball';
    if (set.includes('basketball') || name.includes('nba')) return 'sports-basketball';
    if (set.includes('football') || name.includes('nfl')) return 'sports-football';
    if (set.includes('hockey') || name.includes('nhl')) return 'sports-hockey';
    if (set.includes('soccer') || set.includes('premier league')) return 'sports-soccer';
    
    // Default to baseball for generic sports sets
    return 'sports-baseball';
  }
  
  return 'other';
}

/**
 * Build search query for price lookup
 */
export function buildSearchQuery(card: GradedCard): string {
  const parts: string[] = [];
  
  if (card.cardName) parts.push(card.cardName);
  if (card.set) parts.push(card.set);
  if (card.year) parts.push(card.year);
  if (card.grade) parts.push(`PSA ${card.grade}`);
  
  return parts.join(' ');
}

/**
 * Fetch price from API route (client-side usage)
 */
export async function fetchCardPrice(card: GradedCard): Promise<PriceResult | null> {
  try {
    const response = await fetch('/api/prices/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardName: card.cardName,
        set: card.set,
        year: card.year,
        cardNumber: card.id,
        grade: card.grade,
        category: detectCardCategory(card),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch price');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching card price:', error);
    return null;
  }
}

/**
 * Batch fetch prices for multiple cards
 */
export async function fetchCardPrices(cards: GradedCard[]): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  
  try {
    const response = await fetch('/api/prices/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: cards.map(card => ({
          id: card.id,
          cardName: card.cardName,
          set: card.set,
          year: card.year,
          grade: card.grade,
          category: detectCardCategory(card),
        })),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }
    
    const data = await response.json();
    
    for (const [id, result] of Object.entries(data.prices)) {
      results.set(id, result as PriceResult);
    }
  } catch (error) {
    console.error('Error fetching card prices:', error);
  }
  
  return results;
}

/**
 * Estimate price based on grade (fallback when no API data)
 */
export function estimatePriceFromGrade(
  basePrice: number,
  grade: number
): { low: number; mid: number; high: number } {
  // PSA grade multipliers based on market data analysis
  const gradeMultipliers: Record<number, { low: number; mid: number; high: number }> = {
    10: { low: 3.0, mid: 5.0, high: 10.0 },
    9.5: { low: 2.0, mid: 3.0, high: 5.0 },
    9: { low: 1.5, mid: 2.0, high: 3.0 },
    8.5: { low: 1.2, mid: 1.5, high: 2.0 },
    8: { low: 1.0, mid: 1.2, high: 1.5 },
    7.5: { low: 0.8, mid: 1.0, high: 1.2 },
    7: { low: 0.6, mid: 0.8, high: 1.0 },
    6.5: { low: 0.5, mid: 0.6, high: 0.8 },
    6: { low: 0.4, mid: 0.5, high: 0.6 },
    5: { low: 0.3, mid: 0.4, high: 0.5 },
    4: { low: 0.2, mid: 0.3, high: 0.4 },
    3: { low: 0.15, mid: 0.2, high: 0.3 },
    2: { low: 0.1, mid: 0.15, high: 0.2 },
    1: { low: 0.05, mid: 0.1, high: 0.15 },
  };
  
  const multiplier = gradeMultipliers[grade] || gradeMultipliers[7];
  
  return {
    low: Math.round(basePrice * multiplier.low * 100) / 100,
    mid: Math.round(basePrice * multiplier.mid * 100) / 100,
    high: Math.round(basePrice * multiplier.high * 100) / 100,
  };
}

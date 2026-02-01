/**
 * Batch Price Lookup API Route
 * 
 * Fetch prices for multiple cards in a single request.
 * Optimized for portfolio updates.
 */

import { NextRequest, NextResponse } from 'next/server';

interface CardRequest {
  id: string;
  cardName: string;
  set?: string;
  year?: string;
  grade?: number;
  category?: string;
}

interface BatchPriceRequest {
  cards: CardRequest[];
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchPriceRequest = await request.json();
    
    if (!body.cards || !Array.isArray(body.cards)) {
      return NextResponse.json(
        { error: 'Cards array is required' },
        { status: 400 }
      );
    }
    
    // Limit batch size to prevent abuse
    const maxBatchSize = 50;
    const cards = body.cards.slice(0, maxBatchSize);
    
    const prices: Record<string, any> = {};
    
    // Fetch prices in parallel with rate limiting
    const batchSize = 5; // Process 5 at a time
    
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (card) => {
          try {
            // Call the single lookup endpoint internally
            const response = await fetch(new URL('/api/prices/lookup', request.url).toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cardName: card.cardName,
                set: card.set,
                year: card.year,
                grade: card.grade,
                category: card.category,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              return { id: card.id, result: data };
            }
            
            return { id: card.id, result: null };
          } catch (error) {
            console.error(`Error fetching price for ${card.id}:`, error);
            return { id: card.id, result: null };
          }
        })
      );
      
      for (const { id, result } of results) {
        if (result) {
          prices[id] = result;
        }
      }
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < cards.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return NextResponse.json({
      prices,
      processed: Object.keys(prices).length,
      total: cards.length,
    });
  } catch (error) {
    console.error('Batch price lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}

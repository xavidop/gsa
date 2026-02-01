/**
 * Portfolio Price Update API Route
 * 
 * Updates market prices for all cards in a user's portfolio.
 * Can be called manually or by a scheduled function.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { detectCardCategory } from '@/lib/pricing-service';

interface UpdateRequest {
  userId: string;
}

// Mock data for development when Firebase Admin isn't configured
function generateMockResponse(userId: string) {
  const cardCount = Math.floor(Math.random() * 20) + 5;
  const totalValue = Math.random() * 10000 + 500;
  return {
    message: 'Portfolio prices updated (mock)',
    updated: cardCount,
    total: cardCount,
    totalValue: Math.round(totalValue * 100) / 100,
    isMock: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateRequest = await request.json();
    
    if (!body.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if Firebase Admin is configured
    const db = getAdminFirestore();
    
    if (!db) {
      // Return mock data for development
      console.log('Firebase Admin not configured, returning mock data');
      return NextResponse.json(generateMockResponse(body.userId));
    }
    
    // Get all graded cards for the user
    const cardsSnapshot = await db
      .collection('users')
      .doc(body.userId)
      .collection('graded_cards')
      .get();
    
    if (cardsSnapshot.empty) {
      return NextResponse.json({
        message: 'No cards found',
        updated: 0,
      });
    }
    
    interface CardData {
      id: string;
      cardName?: string;
      set?: string;
      year?: string;
      grade?: number;
      purchasePrice?: number;
      currentMarketPrice?: number;
      priceHistory?: Array<{ price: number; date: any; source?: string }>;
    }
    
    const cards: CardData[] = cardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Fetch prices in batches
    const batchSize = 10;
    let updatedCount = 0;
    let totalValue = 0;
    
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      const priceResults = await Promise.all(
        batch.map(async (card: any) => {
          try {
            const response = await fetch(new URL('/api/prices/lookup', request.url).toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cardName: card.cardName || 'Unknown Card',
                set: card.set,
                year: card.year,
                grade: card.grade,
                category: detectCardCategory(card),
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              return { cardId: card.id, price: data.price, source: data.source };
            }
            return { cardId: card.id, price: null, source: null };
          } catch (error) {
            return { cardId: card.id, price: null, source: null };
          }
        })
      );
      
      // Update cards with new prices
      const writeBatch = db.batch();
      
      for (const result of priceResults) {
        if (result.price !== null) {
          const cardRef = db
            .collection('users')
            .doc(body.userId)
            .collection('graded_cards')
            .doc(result.cardId);
          
          const currentCard = batch.find(c => c.id === result.cardId);
          const priceHistory = [...(currentCard?.priceHistory || [])];
          
          // Add new price point
          priceHistory.push({
            price: result.price,
            date: Timestamp.now(),
            source: result.source,
          });
          
          // Keep only last 90 days
          const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
          const filteredHistory = priceHistory.filter((p: any) => {
            const timestamp = p.date?.toMillis ? p.date.toMillis() : new Date(p.date).getTime();
            return timestamp > ninetyDaysAgo;
          });
          
          writeBatch.update(cardRef, {
            currentMarketPrice: result.price,
            lastPriceUpdate: Timestamp.now(),
            priceHistory: filteredHistory.slice(-30), // Keep max 30 points
          });
          
          totalValue += result.price;
          updatedCount++;
        }
      }
      
      await writeBatch.commit();
      
      // Rate limiting delay
      if (i + batchSize < cards.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Update portfolio metrics
    const metricsRef = db.collection('portfolioMetrics').doc(body.userId);
    
    // Calculate total investment from purchase prices
    const totalInvestment = cards.reduce((sum: number, card: any) => {
      return sum + (card.purchasePrice || 0);
    }, 0);
    
    // Calculate average grade
    const averageGrade = cards.length > 0
      ? cards.reduce((sum: number, card: any) => sum + (card.grade || 0), 0) / cards.length
      : 0;
    
    // Find top card
    let topCard = null;
    let maxValue = 0;
    for (const card of cards) {
      const value = (card as any).currentMarketPrice || 0;
      if (value > maxValue) {
        maxValue = value;
        topCard = {
          id: card.id,
          name: (card as any).cardName || 'Unknown',
          value: value,
        };
      }
    }
    
    await metricsRef.set({
      userId: body.userId,
      totalValue,
      totalInvestment,
      roi: totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0,
      cardCount: cards.length,
      averageGrade: Math.round(averageGrade * 10) / 10,
      topCard,
      lastUpdated: Timestamp.now(),
    }, { merge: true });
    
    return NextResponse.json({
      message: 'Portfolio prices updated',
      updated: updatedCount,
      total: cards.length,
      totalValue: Math.round(totalValue * 100) / 100,
    });
  } catch (error) {
    console.error('Portfolio update error:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
}

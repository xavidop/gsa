'use client';

import { useState, useEffect } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getPriceTrend } from '@/lib/market-prices';
import type { GradedCard } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export function ValueTrendsChart() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const cardsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'graded_cards')
    );
  }, [user, firestore]);

  const { data: cards, isLoading } = useCollection<GradedCard>(cardsQuery);

  if (isLoading) {
    return <div>Loading trends...</div>;
  }

  // Group cards by trend direction
  const trending = (cards || []).reduce((acc, card) => {
    if (!card.currentMarketPrice) return acc;
    
    const trend = getPriceTrend(card);
    acc[trend.direction].push({ card, trend });
    return acc;
  }, { up: [], down: [], stable: [] } as Record<string, Array<{ card: GradedCard; trend: ReturnType<typeof getPriceTrend> }>>);

  // If no cards have market prices, show empty state
  if (cards && cards.length > 0 && trending.up.length === 0 && trending.down.length === 0 && trending.stable.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">No Market Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Market prices will be updated automatically for your cards.
          </p>
          <p className="text-sm text-muted-foreground">
            You have {cards.length} graded card{cards.length !== 1 ? 's' : ''} in your collection.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">No Graded Cards</h3>
          <p className="text-muted-foreground">
            Grade some cards to start tracking their value trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {trending.up.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <TrendingUp className="h-5 w-5" />
              Trending Up ({trending.up.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trending.up.slice(0, 5).map(({ card, trend }) => (
                <Link 
                  key={card.id} 
                  href={`/card-detail/${card.id}`}
                  className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {card.frontImageUrl && (
                      <Image 
                        src={card.frontImageUrl} 
                        alt={card.cardName || 'Card'}
                        width={48}
                        height={67}
                        className="rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{card.cardName || 'Unnamed Card'}</div>
                      <div className="text-sm text-muted-foreground">
                        Grade: {card.grade}/10
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${card.currentMarketPrice?.toLocaleString()}</div>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      +{trend.percentChange}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {trending.down.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <TrendingDown className="h-5 w-5" />
              Trending Down ({trending.down.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trending.down.slice(0, 5).map(({ card, trend }) => (
                <Link 
                  key={card.id} 
                  href={`/card-detail/${card.id}`}
                  className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {card.frontImageUrl && (
                      <Image 
                        src={card.frontImageUrl} 
                        alt={card.cardName || 'Card'}
                        width={48}
                        height={67}
                        className="rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{card.cardName || 'Unnamed Card'}</div>
                      <div className="text-sm text-muted-foreground">
                        Grade: {card.grade}/10
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${card.currentMarketPrice?.toLocaleString()}</div>
                    <Badge variant="outline" className="text-red-500 border-red-500">
                      {trend.percentChange}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

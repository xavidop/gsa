'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import type { TradeOffer, TradeCard } from '@/lib/types';
import Image from 'next/image';

interface DisplayCard {
  id: string;
  type: 'graded' | 'collection';
  name: string;
  imageUrl?: string;
  grade?: number;
  quantity?: number;
}

interface TradeHistoryCardProps {
  trade: TradeOffer;
  currentUserId: string;
}

export function TradeHistoryCard({ trade, currentUserId }: TradeHistoryCardProps) {
  const isSender = trade.senderId === currentUserId;
  const partnerUsername = isSender ? trade.receiverUsername : trade.senderUsername;

  // Convert TradeCard to DisplayCard using stored snapshot data
  const toDisplayCard = (card: TradeCard): DisplayCard => ({
    id: card.id,
    type: card.type,
    name: card.name || 'Unknown Card',
    imageUrl: card.imageUrl,
    grade: card.grade,
    quantity: card.quantity,
  });

  const offeredCards = trade.offeredCards.map(toDisplayCard);
  const requestedCards = trade.requestedCards.map(toDisplayCard);

  const formatDate = (date: Date | { toDate: () => Date }) => {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    switch (trade.status) {
      case 'accepted':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">{trade.status}</Badge>;
    }
  };

  const renderCardList = (cards: DisplayCard[], label: string) => (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No cards</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {cards.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              className="flex items-center gap-2 bg-muted/50 rounded-md p-1.5 pr-3"
            >
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  width={32}
                  height={32}
                  className="rounded object-cover"
                  style={{ width: 32, height: 'auto' }}
                />
              ) : (
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">
                  ?
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate max-w-[100px]">{card.name}</p>
                {card.grade && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    Grade {card.grade}
                  </Badge>
                )}
                {card.quantity && card.quantity > 1 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    x{card.quantity}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Display from perspective of current user
  const yourCards = isSender ? offeredCards : requestedCards;
  const theirCards = isSender ? requestedCards : offeredCards;
  const yourCash = isSender ? (trade.senderCash || 0) : (trade.receiverCash || 0);
  const theirCash = isSender ? (trade.receiverCash || 0) : (trade.senderCash || 0);

  return (
    <Card className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Trade with <span className="font-medium text-foreground">@{partnerUsername}</span>
            </span>
            {getStatusBadge()}
          </div>
          <span className="text-xs text-muted-foreground">
            {trade.respondedAt ? formatDate(trade.respondedAt) : formatDate(trade.createdAt)}
          </span>
        </div>

        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
          {/* Your cards */}
          <div>
            {renderCardList(yourCards, isSender ? 'You offered' : 'You gave')}
            {yourCash > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                <DollarSign className="h-4 w-4" />
                ${yourCash.toLocaleString()}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Their cards */}
          <div>
            {renderCardList(theirCards, trade.status === 'accepted' ? 'You received' : 'They offered')}
            {theirCash > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                <DollarSign className="h-4 w-4" />
                ${theirCash.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {trade.message && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Message: <span className="italic">"{trade.message}"</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { getUserTradeOffers, respondToTradeOffer, getTradeHistory } from '@/lib/trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeProposalDialog } from '@/components/trade-proposal-dialog';
import { TradeOfferCard } from '@/components/trade-offer-card';
import { TradeHistoryCard } from '@/components/trade-history-card';
import { ArrowLeftRight, Send, Inbox, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TradeOffer } from '@/lib/types';

export default function TradesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [sentTrades, setSentTrades] = useState<TradeOffer[]>([]);
  const [receivedTrades, setReceivedTrades] = useState<TradeOffer[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTrades();
      loadHistory();
    }
  }, [user]);

  const loadTrades = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { sent, received } = await getUserTradeOffers(user.uid);
      setSentTrades(sent);
      setReceivedTrades(received);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    
    setHistoryLoading(true);
    try {
      const history = await getTradeHistory(user.uid);
      setTradeHistory(history);
    } catch (error) {
      console.error('Error loading trade history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTradeResponse = async (offerId: string, response: 'accepted' | 'rejected') => {
    try {
      await respondToTradeOffer(offerId, response);
      
      // Show success toast
      if (response === 'accepted') {
        toast({
          title: '🎉 Trade Completed!',
          description: 'The cards have been transferred. Check your collection!',
        });
      } else {
        toast({
          title: 'Trade Declined',
          description: 'The trade offer has been declined.',
        });
      }
      
      await loadTrades();
      await loadHistory();
    } catch (error) {
      console.error('Error responding to trade:', error);
      toast({
        title: 'Error',
        description: 'Failed to process trade. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw so the dialog knows it failed
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trade Center</h1>
          <p className="text-muted-foreground">
            Propose trades and manage offers with other collectors
          </p>
        </div>
        <TradeProposalDialog onTradeCreated={loadTrades} />
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received" className="gap-2">
            <Inbox className="h-4 w-4" />
            Received ({receivedTrades.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent ({sentTrades.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History ({tradeHistory.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="received" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                Loading trade offers...
              </CardContent>
            </Card>
          ) : receivedTrades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No trade offers received</p>
              </CardContent>
            </Card>
          ) : (
            receivedTrades.map(trade => (
              <TradeOfferCard
                key={trade.id}
                trade={trade}
                type="received"
                onRespond={handleTradeResponse}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="sent" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                Loading trade offers...
              </CardContent>
            </Card>
          ) : sentTrades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No trade offers sent</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit another user's profile to propose a trade
                </p>
              </CardContent>
            </Card>
          ) : (
            sentTrades.map(trade => (
              <TradeOfferCard
                key={trade.id}
                trade={trade}
                type="sent"
                onRespond={handleTradeResponse}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                Loading trade history...
              </CardContent>
            </Card>
          ) : tradeHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No trade history yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Completed and rejected trades will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            tradeHistory.map(trade => (
              <TradeHistoryCard
                key={trade.id}
                trade={trade}
                currentUserId={user?.uid || ''}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

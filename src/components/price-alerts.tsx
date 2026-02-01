'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import type { PriceAlert, GradedCard } from '@/lib/types';

export function PriceAlertsManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const alertsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'priceAlerts'),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    );
  }, [user, firestore]);

  const cardsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'graded_cards')
    );
  }, [user, firestore]);

  const { data: alerts } = useCollection<PriceAlert>(alertsQuery);
  const { data: cards } = useCollection<GradedCard>(cardsQuery);

  const handleCreateAlert = async () => {
    if (!user || !firestore || !selectedCard || !targetPrice) return;

    try {
      await addDoc(collection(firestore, 'priceAlerts'), {
        userId: user.uid,
        cardId: selectedCard,
        targetPrice: parseFloat(targetPrice),
        condition,
        isActive: true,
        createdAt: Timestamp.now()
      });

      setIsDialogOpen(false);
      setSelectedCard('');
      setTargetPrice('');
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!firestore) return;
    
    try {
      await updateDoc(doc(firestore, 'priceAlerts', alertId), {
        isActive: false
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getCardDetails = (cardId: string) => {
    return cards?.find(c => c.id === cardId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Card</Label>
                  <Select value={selectedCard} onValueChange={setSelectedCard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a card" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards?.map(card => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.cardName || 'Unnamed Card'} (Grade: {card.grade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v as 'above' | 'below')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price goes above</SelectItem>
                      <SelectItem value="below">Price goes below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <Button onClick={handleCreateAlert} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active price alerts</p>
            <p className="text-sm">Create an alert to get notified when a card reaches your target price</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const card = getCardDetails(alert.cardId || '');
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {alert.condition === 'above' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {card?.cardName || 'Unnamed Card'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Alert when price goes {alert.condition} ${alert.targetPrice}
                      </div>
                      {card?.currentMarketPrice && (
                        <div className="text-xs text-muted-foreground">
                          Current: ${card.currentMarketPrice}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

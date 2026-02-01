'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { calculatePortfolioValue } from '@/lib/market-prices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, Package, DollarSign } from 'lucide-react';

export function PortfolioSummary() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalValue: 0,
    totalInvestment: 0,
    roi: 0,
    cardCount: 0
  });

  useEffect(() => {
    if (user) {
      loadPortfolioMetrics();
    }
  }, [user]);

  const loadPortfolioMetrics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await calculatePortfolioValue(user.uid);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading portfolio metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const profit = metrics.totalValue - metrics.totalInvestment;
  const isProfit = profit >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Current market value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalInvestment.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total purchase cost
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ROI</CardTitle>
          {isProfit ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.roi > 0 ? '+' : ''}{metrics.roi}%
          </div>
          <p className="text-xs text-muted-foreground">
            {isProfit ? '+' : ''}{profit >= 0 ? '$' + profit.toLocaleString() : '-$' + Math.abs(profit).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.cardCount}</div>
          <p className="text-xs text-muted-foreground">
            Graded cards
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { PortfolioSummary } from '@/components/portfolio-summary';
import { ValueTrendsChart } from '@/components/value-trends';
import { PriceAlertsManager } from '@/components/price-alerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Info, Wallet, TrendingUp, Bell, LineChart, Clock, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export default function PortfolioPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [configuredSources, setConfiguredSources] = useState<{
    tcgplayer: boolean;
    ebay: boolean;
    pricecharting: boolean;
  }>({ tcgplayer: false, ebay: false, pricecharting: false });

  // Check if pricing APIs are configured
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/prices/status');
        if (response.ok) {
          const data = await response.json();
          setIsConfigured(data.configured);
          setConfiguredSources(data.sources);
        }
      } catch (error) {
        setIsConfigured(false);
      }
    };
    checkStatus();
  }, []);

  const handleRefreshPrices = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/prices/update-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update prices');
      }
      
      const data = await response.json();
      
      toast({
        title: '✅ Prices Updated',
        description: `Updated ${data.updated} of ${data.total} cards. Total value: $${data.totalValue?.toLocaleString() || 0}`,
      });
      
      setLastRefresh(new Date());
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing prices:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh prices. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (isConfigured === null) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Coming Soon state when not configured
  if (!isConfigured) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
              <Badge variant="secondary" className="text-sm">Coming Soon</Badge>
            </div>
            <p className="text-muted-foreground">
              Track your collection value, ROI, and market trends
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-6">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Portfolio Analytics Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              We're working on integrating real-time market data from TCGplayer, eBay, and other sources 
              to help you track your collection's value accurately.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expected launch: Q1 2026</span>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-4">What to Expect</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-base">Real-Time Valuations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get accurate market prices for your graded cards using data from TCGplayer, eBay sold listings, and more.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-500/10 p-2">
                    <LineChart className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-base">Value Trends</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track how your portfolio value changes over time with historical charts and ROI calculations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-yellow-500/10 p-2">
                    <Bell className="h-4 w-4 text-yellow-500" />
                  </div>
                  <CardTitle className="text-base">Price Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Set alerts to get notified when your cards hit target prices - perfect for knowing when to buy or sell.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Full Portfolio view when configured
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio Analytics</h1>
          <p className="text-muted-foreground">
            Track your collection value, ROI, and market trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Updating...' : 'Refresh Prices'}
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Market Prices</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {configuredSources.tcgplayer && <Badge variant="outline">TCGplayer</Badge>}
            {configuredSources.ebay && <Badge variant="outline">eBay</Badge>}
            {configuredSources.pricecharting && <Badge variant="outline">PriceCharting</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Prices are fetched from multiple sources and updated when you click "Refresh Prices".
            {lastRefresh && (
              <span className="ml-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </AlertDescription>
      </Alert>

      <PortfolioSummary key={`summary-${refreshKey}`} />

      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Value Trends</TabsTrigger>
          <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <ValueTrendsChart key={`trends-${refreshKey}`} />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <PriceAlertsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

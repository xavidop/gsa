'use client';

import { useState, useEffect } from 'react';
import { generateLeaderboard } from '@/lib/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Star, ArrowUp } from 'lucide-react';
import type { Leaderboard } from '@/lib/types';

export default function LeaderboardPage() {
  const [valueLeaderboard, setValueLeaderboard] = useState<Leaderboard | null>(null);
  const [countLeaderboard, setCountLeaderboard] = useState<Leaderboard | null>(null);
  const [gradeLeaderboard, setGradeLeaderboard] = useState<Leaderboard | null>(null);
  const [tradeLeaderboard, setTradeLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      const [value, count, grade, trade] = await Promise.all([
        generateLeaderboard('collection-value', 'all-time', 50),
        generateLeaderboard('card-count', 'all-time', 50),
        generateLeaderboard('average-grade', 'all-time', 50),
        generateLeaderboard('trading-volume', 'all-time', 50)
      ]);
      
      setValueLeaderboard(value);
      setCountLeaderboard(count);
      setGradeLeaderboard(grade);
      setTradeLeaderboard(trade);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Trophy className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const renderLeaderboard = (leaderboard: Leaderboard | null, scoreFormatter: (score: number) => string) => {
    if (!leaderboard) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (leaderboard.entries.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No entries yet. Be the first!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {leaderboard.entries.map((entry) => (
          <Card key={entry.userId} className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar>
                  <AvatarImage src={entry.photoURL} />
                  <AvatarFallback>
                    {entry.displayName?.[0] || entry.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{entry.displayName || entry.username}</div>
                  <div className="text-sm text-muted-foreground">@{entry.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{scoreFormatter(entry.score)}</div>
                {entry.change !== undefined && (
                  <Badge variant={entry.change > 0 ? 'default' : 'secondary'} className="text-xs">
                    {entry.change > 0 && '+'}{entry.change}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboards</h1>
        <p className="text-muted-foreground">
          See who's leading the GSA community
        </p>
      </div>

      <Tabs defaultValue="value" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="value">
            <Trophy className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Collection Value</span>
            <span className="sm:hidden">Value</span>
          </TabsTrigger>
          <TabsTrigger value="count">
            <Star className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Card Count</span>
            <span className="sm:hidden">Count</span>
          </TabsTrigger>
          <TabsTrigger value="grade">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Avg Grade</span>
            <span className="sm:hidden">Grade</span>
          </TabsTrigger>
          <TabsTrigger value="trades">
            <ArrowUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Trading</span>
            <span className="sm:hidden">Trade</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="value" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Collections by Value</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(valueLeaderboard, (score) => `$${score.toLocaleString()}`)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="count" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Cards Graded</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(countLeaderboard, (score) => `${score.toLocaleString()} cards`)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grade" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Highest Average Grade</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(gradeLeaderboard, (score) => {
                // Format grade nicely - show no decimals if whole number, else 2 decimals
                const formatted = score % 1 === 0 ? score.toString() : score.toFixed(2);
                return formatted;
              })}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trades" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Traders</CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(tradeLeaderboard, (score) => `${score} trades`)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

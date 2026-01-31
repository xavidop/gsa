'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { GradedCard, CollectionCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Award, BarChart3, PieChart, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch graded cards
  const gradedCardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'graded_cards'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  // Fetch collection cards (ungraded)
  const collectionCardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'collection_cards'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: gradedCards, isLoading: gradedLoading } = useCollection<GradedCard>(gradedCardsQuery);
  const { data: collectionCards, isLoading: collectionLoading } = useCollection<CollectionCard>(collectionCardsQuery);

  const loading = gradedLoading || collectionLoading;

  const analytics = useMemo(() => {
    const graded = gradedCards || [];
    const ungraded = collectionCards || [];
    const totalGradedCards = graded.length;
    const totalUngradedCards = ungraded.length;
    const totalCards = totalGradedCards + totalUngradedCards;

    if (totalCards === 0) {
      return {
        totalCards: 0,
        totalGradedCards: 0,
        totalUngradedCards: 0,
        averageGrade: 0,
        gradeDistribution: [],
        setDistribution: [],
        subgradeAverages: {
          centering: 0,
          corners: 0,
          edges: 0,
          surface: 0,
        },
        topCards: [],
        gradeBreakdown: {
          gem: 0,
          mint: 0,
          nearMint: 0,
          other: 0,
        },
        ungradedValue: 0,
        conditionDistribution: [],
      };
    }

    // Graded cards analytics
    const totalGrade = graded.reduce((sum, card) => sum + card.grade, 0);
    const averageGrade = totalGradedCards > 0 ? totalGrade / totalGradedCards : 0;

    // Grade distribution for chart
    const gradeCounts: { [key: number]: number } = {};
    graded.forEach(card => {
      gradeCounts[card.grade] = (gradeCounts[card.grade] || 0) + 1;
    });
    
    const gradeDistribution = Object.entries(gradeCounts)
      .map(([grade, count]) => ({
        grade: `Grade ${grade}`,
        count,
      }))
      .sort((a, b) => parseInt(b.grade.split(' ')[1]) - parseInt(a.grade.split(' ')[1]));

    // Set distribution (combined graded and ungraded)
    const setCounts: { [key: string]: number } = {};
    graded.forEach(card => {
      const set = card.set || 'Unknown';
      setCounts[set] = (setCounts[set] || 0) + 1;
    });
    ungraded.forEach(card => {
      const set = card.set || 'Unknown';
      setCounts[set] = (setCounts[set] || 0) + 1;
    });
    
    const setDistribution = Object.entries(setCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Subgrade averages (graded cards only)
    const subgradeTotals = {
      centering: 0,
      corners: 0,
      edges: 0,
      surface: 0,
    };
    
    graded.forEach(card => {
      subgradeTotals.centering += card.subgrades.centering;
      subgradeTotals.corners += card.subgrades.corners;
      subgradeTotals.edges += card.subgrades.edges;
      subgradeTotals.surface += card.subgrades.surface;
    });

    const subgradeAverages = totalGradedCards > 0 ? {
      centering: subgradeTotals.centering / totalGradedCards,
      corners: subgradeTotals.corners / totalGradedCards,
      edges: subgradeTotals.edges / totalGradedCards,
      surface: subgradeTotals.surface / totalGradedCards,
    } : { centering: 0, corners: 0, edges: 0, surface: 0 };

    // Top graded cards
    const topCards = [...graded]
      .sort((a, b) => b.grade - a.grade)
      .slice(0, 5);

    // Grade breakdown
    const gradeBreakdown = {
      gem: graded.filter(c => c.grade === 10).length,
      mint: graded.filter(c => c.grade === 9).length,
      nearMint: graded.filter(c => c.grade >= 7 && c.grade < 9).length,
      other: graded.filter(c => c.grade < 7).length,
    };

    // Ungraded cards value calculation
    const ungradedValue = ungraded.reduce((sum, card) => {
      const price = card.purchasePrice || 0;
      const qty = card.quantity || 1;
      return sum + (price * qty);
    }, 0);

    // Condition distribution for ungraded cards
    const conditionCounts: { [key: string]: number } = {};
    ungraded.forEach(card => {
      const condition = card.condition || 'Unspecified';
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });
    
    const conditionDistribution = Object.entries(conditionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalCards,
      totalGradedCards,
      totalUngradedCards,
      averageGrade,
      gradeDistribution,
      setDistribution,
      subgradeAverages,
      topCards,
      gradeBreakdown,
      ungradedValue,
      conditionDistribution,
    };
  }, [gradedCards, collectionCards]);

  const COLORS = ['#FFD700', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analytics.totalCards === 0) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Collection Analytics</h1>
          <p className="text-muted-foreground">Insights and statistics about your collection</p>
        </div>
        <Card className="text-center py-16 border-dashed">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">No Data Yet</CardTitle>
            <CardDescription>
              Start adding cards to see your collection analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/grade">Grade a Card</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Add to Collection</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 sm:py-8 space-y-6 sm:space-y-8 px-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Collection Analytics</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Insights and statistics about your collection</p>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCards}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalGradedCards} graded, {analytics.totalUngradedCards} ungraded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalGradedCards > 0 ? analytics.averageGrade.toFixed(2) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across graded cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem Mint Cards</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.gradeBreakdown.gem}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalGradedCards > 0
                ? `Grade 10 (${((analytics.gradeBreakdown.gem / analytics.totalGradedCards) * 100).toFixed(1)}%)`
                : 'Grade 10 cards'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ungraded Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.ungradedValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on purchase prices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card Type Breakdown */}
      {analytics.totalCards > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Card Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0ea5e9]" />
                <span className="text-sm">Graded: <strong>{analytics.totalGradedCards}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="text-sm">Ungraded: <strong>{analytics.totalUngradedCards}</strong></span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              {analytics.totalGradedCards > 0 && (
                <div 
                  className="h-full bg-[#0ea5e9]" 
                  style={{ width: `${(analytics.totalGradedCards / analytics.totalCards) * 100}%` }}
                />
              )}
              {analytics.totalUngradedCards > 0 && (
                <div 
                  className="h-full bg-[#10b981]" 
                  style={{ width: `${(analytics.totalUngradedCards / analytics.totalCards) * 100}%` }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Grade Distribution - only show if graded cards exist */}
        {analytics.totalGradedCards > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Number of graded cards by grade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Grade Breakdown Pie - only show if graded cards exist */}
        {analytics.totalGradedCards > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Grade Categories</CardTitle>
              <CardDescription>Distribution by quality tier</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Gem Mint (10)', value: analytics.gradeBreakdown.gem },
                      { name: 'Mint (9)', value: analytics.gradeBreakdown.mint },
                      { name: 'Near Mint (7-8)', value: analytics.gradeBreakdown.nearMint },
                      { name: 'Other (<7)', value: analytics.gradeBreakdown.other },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Gem Mint (10)', value: analytics.gradeBreakdown.gem },
                      { name: 'Mint (9)', value: analytics.gradeBreakdown.mint },
                      { name: 'Near Mint (7-8)', value: analytics.gradeBreakdown.nearMint },
                      { name: 'Other (<7)', value: analytics.gradeBreakdown.other },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Condition Distribution - only show if ungraded cards exist with conditions */}
        {analytics.totalUngradedCards > 0 && analytics.conditionDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ungraded Card Conditions</CardTitle>
              <CardDescription>Distribution by condition</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={analytics.conditionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.conditionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Sets */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sets</CardTitle>
            <CardDescription>Most collected sets (graded + ungraded)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.setDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subgrade Averages */}
      {analytics.totalGradedCards > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Average Subgrades</CardTitle>
            <CardDescription>Average scores for grading criteria (graded cards)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: 'Centering', value: analytics.subgradeAverages.centering },
                  { name: 'Corners', value: analytics.subgradeAverages.corners },
                  { name: 'Edges', value: analytics.subgradeAverages.edges },
                  { name: 'Surface', value: analytics.subgradeAverages.surface },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Cards - only show if graded cards exist */}
      {analytics.topCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Highest Graded Cards</CardTitle>
            <CardDescription>Your best graded cards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCards.map((card, index) => (
                <Link key={card.id} href={`/card/${card.publicShareId}`}>
                  <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-lg font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{card.cardName || 'Unknown Card'}</h4>
                      <p className="text-sm text-muted-foreground truncate">{card.set || 'Unknown Set'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Grade</div>
                        <div className="text-2xl font-bold text-accent">{card.grade}</div>
                      </div>
                    </div>
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

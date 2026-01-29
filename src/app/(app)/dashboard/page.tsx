'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { GradedCard } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<GradedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const q = query(
          collection(db, 'cards'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const userCards = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as GradedCard)
        );
        setCards(userCards);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [user]);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Collection</h1>
          <p className="text-muted-foreground">View your GSA graded cards.</p>
        </div>
        <Button asChild>
          <Link href="/grade">
            <PlusCircle className="mr-2 h-4 w-4" />
            Grade a New Card
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {cards.map((card) => (
             <Link href={`/card/${card.publicId}`} key={card.id}>
              <DigitalSlab card={card} />
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 border-dashed">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                    <Icons.logo className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="mt-4 text-2xl font-headline">Your collection is empty</CardTitle>
                <CardDescription>Start your collection by grading your first card.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/grade">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Grade Your First Card
                    </Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

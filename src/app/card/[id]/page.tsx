'use client';

import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { GradedCard } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Image from 'next/image';

export default function PublicCardPage({
  params,
}: {
  params: { id: string };
}) {
  const firestore = useFirestore();
  const publicId = params.id;

  const cardQuery = useMemoFirebase(() => {
    if (!publicId) return null;
    return query(
      collection(firestore, 'public_graded_cards'),
      where('publicShareId', '==', publicId),
      limit(1)
    );
  }, [firestore, publicId]);

  const { data: cards, isLoading } = useCollection<GradedCard>(cardQuery);
  const card = cards && cards.length > 0 ? cards[0] : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
        <Card className="max-w-md p-8 border-dashed">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4">Card Not Found</CardTitle>
                <CardDescription>
                    The card you are looking for does not exist or the link is incorrect.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Return to Home
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  const displayCard = {
    ...card,
    createdAt: (card.createdAt as any)?.toDate ? (card.createdAt as any).toDate() : card.createdAt,
  } as GradedCard;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <header className="absolute top-0 left-0 p-4">
        <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl">
          <Icons.logo className="w-8 h-8" />
          GSA
        </Link>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
        <div className="lg:col-span-1 flex justify-center">
            <DigitalSlab card={displayCard} isPublicPage={true} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Front Image</CardTitle>
                </CardHeader>
                <CardContent>
                    <Image src={card.frontImageUrl} alt={`Front of ${card.cardName}`} width={400} height={600} className="rounded-lg w-full h-auto" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Back Image</CardTitle>
                </CardHeader>
                <CardContent>
                    <Image src={card.backImageUrl} alt={`Back of ${card.cardName}`} width={400} height={600} className="rounded-lg w-full h-auto" />
                </CardContent>
            </Card>
        </div>
      </div>

       <footer className="absolute bottom-0 p-4 text-xs text-muted-foreground">
        &copy; 2024 Global Slab Authority. This is a public, read-only grading verification page.
      </footer>
    </div>
  );
}

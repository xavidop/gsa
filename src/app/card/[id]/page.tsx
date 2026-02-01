'use client';

import { use, useRef, useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import type { GradedCard } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardNotes } from '@/components/card-notes';
import { CardSocial } from '@/components/card-social';
import { SocialShare } from '@/components/social-share';
import { TradeProposalDialog } from '@/components/trade-proposal-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Home, Loader2, Download, Printer, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { downloadCertificate } from '@/lib/certificate';
import { generateCardLabel } from '@/lib/label';
import QRCode from 'qrcode';
import Head from 'next/head';

export default function PublicCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const firestore = useFirestore();
  const { user } = useFirebase();
  const publicId = id;
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cardOwner, setCardOwner] = useState<{ username?: string; displayName?: string; photoURL?: string } | null>(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);

  const cardQuery = useMemoFirebase(() => {
    if (!publicId) return null;
    return query(
      collection(firestore, 'public_graded_cards'),
      where('publicShareId', '==', publicId),
      limit(1)
    );
  }, [firestore, publicId]);

  const { data: cards, isLoading: publicCardsLoading } = useCollection<GradedCard>(cardQuery);
  const [privateCard, setPrivateCard] = useState<GradedCard | null>(null);
  const [isLoadingPrivate, setIsLoadingPrivate] = useState(false);
  
  const card = cards && cards.length > 0 ? cards[0] : privateCard;
  const isLoading = publicCardsLoading || isLoadingPrivate;

  // If card not found in public collection and user is logged in, check their private collection
  useEffect(() => {
    const checkPrivateCard = async () => {
      if (cards && cards.length > 0) return; // Found in public collection
      if (!user) return; // Not logged in
      if (publicCardsLoading) return; // Still loading public cards
      if (privateCard) return; // Already found private card

      setIsLoadingPrivate(true);
      try {
        // Query user's private collection for this publicShareId
        const privateQuery = query(
          collection(firestore, 'users', user.uid, 'graded_cards'),
          where('publicShareId', '==', publicId),
          limit(1)
        );
        const snapshot = await getDocs(privateQuery);
        if (!snapshot.empty) {
          const cardData = snapshot.docs[0].data() as GradedCard;
          setPrivateCard({ ...cardData, id: snapshot.docs[0].id });
        }
      } catch (error) {
        console.error('Error fetching private card:', error);
      } finally {
        setIsLoadingPrivate(false);
      }
    };

    checkPrivateCard();
  }, [cards, user, publicCardsLoading, publicId, firestore, privateCard]);

  // Fetch card owner details
  useEffect(() => {
    const fetchOwner = async () => {
      if (!card?.userId) return;
      try {
        const userDoc = await getDoc(doc(firestore, 'users', card.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCardOwner({
            username: userData.username,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
          });
        }
      } catch (error) {
        console.error('Error fetching card owner:', error);
      }
    };
    fetchOwner();
  }, [card, firestore]);

  // Generate QR code on canvas
  useEffect(() => {
    if (card && qrCanvasRef.current && typeof window !== 'undefined') {
      const url = `${window.location.origin}/card/${publicId}`;
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [card, publicId]);

  const handleDownloadCertificate = useCallback(() => {
    if (!card) return;

    // Get QR code data URL if available
    let qrCodeDataUrl: string | undefined;
    if (qrCanvasRef.current) {
      qrCodeDataUrl = qrCanvasRef.current.toDataURL('image/png');
    }

    downloadCertificate(card, qrCodeDataUrl);
  }, [card]);

  const handlePrintLabel = useCallback(async () => {
    if (!card) return;
    try {
      await generateCardLabel(card);
    } catch (error) {
      console.error('Failed to generate label:', error);
    }
  }, [card]);

  // Check if current user is the card owner
  const isOwner = user && card && user.uid === card.userId;

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

  const cardUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${publicId}` : '';
  const cardTitle = `${card?.cardName || 'Card'} - Grade ${card?.grade || 'N/A'}`;
  const cardDescription = card ? `${card.set}${card.year ? ` (${card.year})` : ''} - Graded ${card.grade}` : '';

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{cardTitle} | GSA</title>
        <meta name="description" content={cardDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={cardUrl} />
        <meta property="og:title" content={cardTitle} />
        <meta property="og:description" content={cardDescription} />
        {card?.frontImageUrl && <meta property="og:image" content={card.frontImageUrl} />}
        <meta property="og:site_name" content="Global Slab Authority" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={cardUrl} />
        <meta name="twitter:title" content={cardTitle} />
        <meta name="twitter:description" content={cardDescription} />
        {card?.frontImageUrl && <meta name="twitter:image" content={card.frontImageUrl} />}
      </Head>
      
      <main className="container py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 lg:gap-12 max-w-7xl mx-auto">
          <div className="flex justify-center lg:justify-start">
            <DigitalSlab card={displayCard} isPublicPage={true} />
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-2">{card.cardName}</h1>
                <p className="text-muted-foreground text-base sm:text-lg mb-3">{card.set}</p>
                
                {/* Card Owner Info */}
                {cardOwner?.username && (
                  <Link 
                    href={`/profile/${cardOwner.username}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={cardOwner.photoURL || undefined} />
                      <AvatarFallback className="text-xs">
                        {cardOwner.displayName?.[0] || cardOwner.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>Graded by @{cardOwner.username}</span>
                  </Link>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <SocialShare 
                  url={cardUrl}
                  title={cardTitle}
                  description={cardDescription}
                />
                {!isOwner && user && card?.userId && (
                  <Button onClick={() => setShowTradeDialog(true)} size="lg" variant="default" className="w-full sm:w-auto">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Propose Trade
                  </Button>
                )}
                {isOwner && (
                  <Button onClick={handlePrintLabel} size="lg" variant="outline" className="w-full sm:w-auto">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Label
                  </Button>
                )}
                <Button onClick={handleDownloadCertificate} size="lg" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Certificate
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Front Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border">
                    <Image 
                      src={card.frontImageUrl} 
                      alt={`Front of ${card.cardName}`} 
                      fill
                      className="object-contain" 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Back Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border">
                    <Image 
                      src={card.backImageUrl} 
                      alt={`Back of ${card.cardName}`} 
                      fill
                      className="object-contain" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Notes & Social */}
            <div className="space-y-6 mt-6">
              <CardNotes card={card} />
              
              <CardSocial card={card} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container">
          <p className="text-xs text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Global Slab Authority. This is a public, read-only grading verification page.
          </p>
        </div>
      </footer>

      {/* Hidden QR Code canvas for PDF generation */}
      <div className="hidden">
        <canvas 
          ref={qrCanvasRef} 
          id="qr-canvas"
        />
      </div>

      {/* Trade Proposal Dialog */}
      {user && card?.userId && card.userId !== user.uid && (
        <TradeProposalDialog
          open={showTradeDialog}
          onOpenChange={setShowTradeDialog}
          preselectedUser={cardOwner?.username}
          preselectedCardId={card.id}
          preselectedCardType="graded"
        />
      )}
    </div>
  );
}

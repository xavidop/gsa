'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, Timestamp, getDoc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Edit, Save, X, DollarSign, Calendar, FileText } from 'lucide-react';
import type { GradedCard } from '@/lib/types';

interface CardNotesProps {
  card: GradedCard;
  onUpdate?: () => void;
}

export function CardNotes({ card, onUpdate }: CardNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(card.notes || '');
  const [purchasePrice, setPurchasePrice] = useState(card.purchasePrice?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(
    card.purchaseDate 
      ? new Date((card.purchaseDate as any).toDate ? (card.purchaseDate as any).toDate() : card.purchaseDate).toISOString().split('T')[0]
      : ''
  );
  const [acquisitionInfo, setAcquisitionInfo] = useState(card.acquisitionInfo || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const isOwner = user?.uid === card.userId;

  const handleSave = async () => {
    if (!isOwner) return;
    
    setIsSaving(true);
    try {
      // First, find the private card using publicShareId
      const privateCardsQuery = query(
        collection(firestore, 'users', card.userId, 'graded_cards'),
        where('publicShareId', '==', card.publicShareId),
        limit(1)
      );
      
      const privateCardsSnapshot = await getDocs(privateCardsQuery);
      let privateCardId: string;
      
      if (privateCardsSnapshot.empty) {
        // Card doesn't exist in private collection, create it
        const { id, ...cleanCardData } = card;
        const newCardRef = doc(collection(firestore, 'users', card.userId, 'graded_cards'));
        await setDoc(newCardRef, {
          ...cleanCardData,
          userId: card.userId,
          publicShareId: card.publicShareId,
          createdAt: card.createdAt || Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        privateCardId = newCardRef.id;
      } else {
        privateCardId = privateCardsSnapshot.docs[0].id;
      }
      
      const cardRef = doc(firestore, 'users', card.userId, 'graded_cards', privateCardId);

      const updateData = {
        notes,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate ? Timestamp.fromDate(new Date(purchaseDate)) : null,
        acquisitionInfo: acquisitionInfo || null,
      };

      await updateDoc(cardRef, updateData);

      // Also update the public card if it exists
      if (card.publicShareId) {
        try {
          const publicCardRef = doc(firestore, 'public_graded_cards', card.publicShareId);
          const publicCardSnap = await getDoc(publicCardRef);
          
          if (publicCardSnap.exists()) {
            await updateDoc(publicCardRef, updateData);
          }
        } catch (err) {
          // Ignore errors updating public card
        }
      }

      toast({
        title: 'Notes saved',
        description: 'Card notes and details have been updated.',
      });
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(card.notes || '');
    setPurchasePrice(card.purchasePrice?.toString() || '');
    setPurchaseDate(
      card.purchaseDate 
        ? new Date((card.purchaseDate as any).toDate ? (card.purchaseDate as any).toDate() : card.purchaseDate).toISOString().split('T')[0]
        : ''
    );
    setAcquisitionInfo(card.acquisitionInfo || '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes & Details
            </CardTitle>
            <CardDescription>Track purchase info and personal notes</CardDescription>
          </div>
          {isOwner && (!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Purchase Price
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Purchase Date
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="acquisitionInfo">Acquisition Info</Label>
              <Input
                id="acquisitionInfo"
                placeholder="e.g., eBay, Local card shop, Trade"
                value={acquisitionInfo}
                onChange={(e) => setAcquisitionInfo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this card..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {(purchasePrice || purchaseDate) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {purchasePrice && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      Purchase Price
                    </div>
                    <div className="font-semibold">${parseFloat(purchasePrice).toFixed(2)}</div>
                  </div>
                )}
                {purchaseDate && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Purchase Date
                    </div>
                    <div className="font-semibold">
                      {new Date(purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {acquisitionInfo && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Acquisition Info</div>
                <div>{acquisitionInfo}</div>
              </div>
            )}

            {notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Notes</div>
                <div className="whitespace-pre-wrap">{notes}</div>
              </div>
            )}

            {!purchasePrice && !purchaseDate && !acquisitionInfo && !notes && (
              <div className="text-center py-8 text-muted-foreground">
                No notes or details yet. Click Edit to add information.
              </div>
            )}
          </div>
        )}

        {/* Grading History */}
        {card.gradingHistory && card.gradingHistory.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">Grading History</h4>
            <div className="space-y-2">
              {card.gradingHistory.map((history, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <div>
                    <span className="font-semibold">Grade {history.grade}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date((history.gradedAt as any).toDate ? (history.gradedAt as any).toDate() : history.gradedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {history.notes && (
                    <span className="text-xs text-muted-foreground">{history.notes}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

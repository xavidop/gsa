'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { extractCardInfo, type ExtractCardOutput } from '@/ai/ai-card-extraction';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import type { Collection, CollectionCard } from '@/lib/types';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  defaultCollectionId?: string;
  editCard?: CollectionCard;
  onCardUpdated?: () => void;
}

export function AddCardDialog({
  open,
  onOpenChange,
  collections,
  defaultCollectionId,
  editCard,
  onCardUpdated,
}: AddCardDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState(defaultCollectionId || '');
  
  const [cardName, setCardName] = useState('');
  const [set, setSet] = useState('');
  const [year, setYear] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState('Near Mint');
  const [isPublic, setIsPublic] = useState(false);

  // Populate form when editing a card or when dialog opens
  useEffect(() => {
    if (open && editCard) {
      setImagePreview(editCard.imageUrl || null);
      setCollectionId(editCard.collectionId || defaultCollectionId || '');
      setCardName(editCard.cardName || '');
      setSet(editCard.set || '');
      setYear(editCard.year || '');
      setCardNumber(editCard.cardNumber || '');
      setVariant(editCard.variant || '');
      setQuantity(String(editCard.quantity || 1));
      setPurchasePrice(editCard.purchasePrice?.toString() || '');
      setNotes(editCard.notes || '');
      setCondition(editCard.condition || 'Near Mint');
      setIsPublic(editCard.isPublic || false);
      setImageFile(null); // Reset file input when editing
    } else if (open && !editCard) {
      // Reset form for new card
      setImagePreview(null);
      setCollectionId(defaultCollectionId || '');
      setCardName('');
      setSet('');
      setYear('');
      setCardNumber('');
      setVariant('');
      setQuantity('1');
      setPurchasePrice('');
      setPurchaseDate('');
      setNotes('');
      setCondition('Near Mint');
      setIsPublic(false);
      setImageFile(null);
    }
  }, [open, editCard, defaultCollectionId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractWithAI = async (dataUri?: string) => {
    const imageData = dataUri || imagePreview;
    
    if (!imageFile || !imageData) {
      toast({
        title: 'Error',
        description: 'Please upload an image first',
        variant: 'destructive',
      });
      return;
    }

    setExtracting(true);
    try {
      const result = await extractCardInfo({ imageDataUri: imageData });
      
      setCardName(result.cardName);
      setSet(result.set || '');
      setYear(result.year || '');
      setCardNumber(result.cardNumber || '');
      setVariant(result.variant || '');
      
      toast({
        title: 'Success',
        description: `Card info extracted with ${Math.round(result.confidenceScore * 100)}% confidence`,
      });
    } catch (error) {
      console.error('Error extracting card info:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract card information. Please try manual entry.',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add cards',
        variant: 'destructive',
      });
      return;
    }

    if (!cardName) {
      toast({
        title: 'Error',
        description: 'Card name is required',
        variant: 'destructive',
      });
      return;
    }

    // Collection is now optional - users can add cards without assigning to a collection

    setLoading(true);
    try {
      let imageUrl = editCard?.imageUrl || '';
      
      // Upload image if provided
      if (imageFile) {
        const storageRef = ref(
          storage,
          `collection_cards/${user.uid}/${Date.now()}_${imageFile.name}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const cardData = {
        userId: user.uid,
        collectionId: collectionId || null,
        cardName,
        set: set || null,
        year: year || null,
        cardNumber: cardNumber || null,
        variant: variant || null,
        imageUrl: imageUrl || null,
        quantity: parseInt(quantity) || 1,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        notes: notes || null,
        condition,
        isPublic,
        updatedAt: Timestamp.now(),
      };

      if (editCard) {
        // Update existing card
        const cardRef = doc(firestore, `users/${user.uid}/collection_cards`, editCard.id);
        await updateDoc(cardRef, cardData);
        
        toast({
          title: 'Success',
          description: 'Card updated successfully',
        });

        onCardUpdated?.();
      } else {
        // Add new card to Firestore
        await addDoc(collection(firestore, `users/${user.uid}/collection_cards`), {
          ...cardData,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });

        toast({
          title: 'Success',
          description: 'Card added to collection',
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: 'Error',
        description: 'Failed to add card to collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCard ? 'Edit Card' : 'Add Card to Collection'}</DialogTitle>
          <DialogDescription>
            {editCard ? 'Update your card details' : 'Upload an image and extract info with AI, or enter details manually'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Card Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading || extracting}
              />
              <Button
                type="button"
                onClick={() => handleExtractWithAI()}
                disabled={extracting || loading || !imageFile}
                variant="secondary"
                size="sm"
              >
                {extracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract with AI
                  </>
                )}
              </Button>
            </div>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Card preview"
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          {/* Collection Selection */}
          <div className="space-y-2">
            <Label htmlFor="collection">Collection (Optional)</Label>
            <Select
              value={collectionId}
              onValueChange={setCollectionId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="cardName">Card Name *</Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g., Charizard, Pikachu, etc."
              disabled={loading}
              required
            />
          </div>

          {/* Two-column layout for smaller fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="set">Set</Label>
              <Input
                id="set"
                value={set}
                onChange={(e) => setSet(e.target.value)}
                placeholder="e.g., Base Set"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 1999"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="e.g., 4/102"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Input
                id="variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g., Holo, First Edition"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={condition}
                onValueChange={setCondition}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mint">Mint</SelectItem>
                  <SelectItem value="Near Mint">Near Mint</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this card..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={loading}
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              Make this card visible on my public profile
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editCard ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editCard ? 'Update Card' : 'Add Card'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

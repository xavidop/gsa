'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Eye, EyeOff, Trash2, Edit, FolderOpen } from 'lucide-react';
import Image from 'next/image';
import type { CollectionCard, Collection } from '@/lib/types';
import { useState } from 'react';

interface CollectionCardDisplayProps {
  card: CollectionCard;
  collections?: Collection[] | null;
  onCollectionChange?: (cardId: string, collectionId: string | null) => void;
  onVisibilityToggle?: (cardId: string, currentStatus: boolean) => void;
  onDelete?: (cardId: string) => void;
  onEdit?: (card: CollectionCard) => void;
}

export function CollectionCardDisplay({
  card,
  collections,
  onCollectionChange,
  onVisibilityToggle,
  onDelete,
  onEdit,
}: CollectionCardDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <motion.div
      className="relative w-full max-w-[320px] mx-auto h-[520px] rounded-3xl bg-card/60 backdrop-blur-sm border border-border overflow-hidden shadow-2xl shadow-primary/10 group"
      whileHover="hover"
      style={{ perspective: 800 }}
    >
      {/* Settings Button - Top right corner of the whole card */}
      {(onVisibilityToggle || onDelete || onEdit || onCollectionChange) && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenMenu(!openMenu);
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-background/95 backdrop-blur-sm border shadow-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent transition-all z-10"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Controls Menu */}
          {openMenu && (
            <>
              <div 
                className="fixed inset-0 z-[100]" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(false);
                }}
              />
              <div className="absolute top-12 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-[101] min-w-[180px]">
                <div className="flex flex-col gap-3">
                  {/* Collection Selector */}
                  {onCollectionChange && collections && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Collection</label>
                      <Select
                        value={card.collectionId || 'none'}
                        onValueChange={(value) => {
                          onCollectionChange(card.id, value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <FolderOpen className="h-3 w-3 mr-1" />
                          <SelectValue placeholder="No collection" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No collection</SelectItem>
                          {collections.map((coll) => (
                            <SelectItem key={coll.id} value={coll.id}>
                              {coll.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Visibility Toggle */}
                  {onVisibilityToggle && (
                    <div className="border-t pt-3">
                      <label className="text-xs text-muted-foreground mb-1.5 block">Visibility</label>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {card.isPublic ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-xs">
                            {card.isPublic ? 'Show in profile' : 'Hide from profile'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVisibilityToggle(card.id, card.isPublic || false);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${card.isPublic ? 'bg-primary' : 'bg-muted'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${card.isPublic ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete Button */}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        onDelete(card.id);
                        setOpenMenu(false);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Card
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <motion.div
        className="w-full h-full p-4"
        variants={{
          hover: {
            scale: 1.05,
            rotateY: 10,
            rotateX: -5,
          },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent opacity-50 pointer-events-none" />
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-3 py-2 bg-black/20 rounded-xl border-b border-border shrink-0">
            <div className="flex flex-col">
              {card.condition ? (
                <Badge variant="secondary" className="text-xs w-fit">
                  {card.condition}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Ungraded</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(card.quantity ?? 1) > 1 && (
                <Badge variant="default" className="text-xs">
                  ×{card.quantity}
                </Badge>
              )}
              {card.purchasePrice !== null && card.purchasePrice !== undefined && (
                <span className="font-headline text-lg text-accent font-bold leading-none">
                  ${card.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center py-4 relative">
            <div className="relative w-[220px] h-[300px] rounded-lg overflow-hidden shadow-lg shadow-black/50 border-2 border-accent/50">
              {card.imageUrl && !imageError ? (
                <Image
                  src={card.imageUrl}
                  alt={card.cardName}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-muted-foreground">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">🎴</div>
                    <div className="text-sm font-medium">{card.cardName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-3 bg-black/20 rounded-xl border-t border-border shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-base font-bold leading-tight truncate">{card.cardName}</h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {card.set || 'Unknown Set'}
                {card.year && ` • ${card.year}`}
              </p>
              {(card.cardNumber || card.variant) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {card.cardNumber && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                      #{card.cardNumber}
                    </Badge>
                  )}
                  {card.variant && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                      {card.variant}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

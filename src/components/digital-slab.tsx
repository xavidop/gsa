'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { GradedCard } from '@/lib/types';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { QRCode } from './qr-code';
import { usePathname } from 'next/navigation';

type SubgradeIconProps = {
  type: 'centering' | 'corners' | 'edges' | 'surface';
  className?: string;
};

function SubgradeIcon({ type, className }: SubgradeIconProps) {
  const Icon = Icons[type];
  return <Icon className={cn('h-5 w-5 text-muted-foreground', className)} />;
}

export function DigitalSlab({ card, isPublicPage = false }: { card: GradedCard, isPublicPage?: boolean }) {
  const pathname = usePathname();
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${card.publicId}` : '';

  return (
    <motion.div
      className="relative w-[320px] h-[500px] rounded-3xl bg-card/60 backdrop-blur-sm border border-border overflow-hidden p-4 shadow-2xl shadow-primary/10"
      whileHover="hover"
      style={{ perspective: 800 }}
    >
      <motion.div
        className="w-full h-full"
        variants={{
          hover: {
            scale: 1.05,
            rotateY: 10,
            rotateX: -5,
          },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent opacity-50" />
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-2 bg-black/20 rounded-t-xl border-b border-border">
            <div className="flex flex-col">
              <span className="font-headline text-accent font-bold text-2xl tracking-wider">
                GSA
              </span>
              <span className="text-xs text-muted-foreground -mt-1">
                GEM-MT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">GRADE</span>
              <span className="font-headline text-6xl text-accent font-bold">
                {card.grade}
              </span>
            </div>
          </div>

          {/* Image */}
          <div className="flex-grow my-4 flex items-center justify-center">
            <div className="relative w-[220px] h-[300px] rounded-md overflow-hidden shadow-lg shadow-black/50 border-2 border-accent/50">
               <Image
                src={card.frontImageUrl}
                alt={card.cardName || 'Trading Card'}
                fill
                className="object-cover"
                data-ai-hint="trading card"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-black/20 rounded-b-xl border-t border-border">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="font-headline text-lg font-bold leading-tight max-w-[180px] truncate">{card.cardName || "Unknown Card"}</h3>
                    <p className="text-xs text-muted-foreground">{card.set || "Unidentified Set"}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        {Object.entries(card.subgrades).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <SubgradeIcon type={key as keyof typeof card.subgrades} />
                                <span className="text-xs capitalize">{key}</span>
                                <span className="text-xs font-bold ml-auto">{value.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {isPublicPage && publicUrl && (
                     <div className="flex flex-col items-center gap-1">
                        <QRCode url={publicUrl} size={60} />
                        <span className="text-[8px] text-muted-foreground font-mono break-all">{card.publicId}</span>
                     </div>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

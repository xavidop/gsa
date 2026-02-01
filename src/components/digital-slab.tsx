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
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/card/${card.publicShareId}` : '';

  return (
    <motion.div
      className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto h-[460px] sm:h-[520px] rounded-3xl bg-card/60 backdrop-blur-sm border border-border overflow-hidden shadow-2xl shadow-primary/10"
      whileHover="hover"
      style={{ perspective: 800 }}
    >
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
              <span className="font-headline text-accent font-bold text-2xl tracking-wider">
                GSA
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">
                GEM-MT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">GRADE</span>
              <span className="font-headline text-5xl text-accent font-bold leading-none">
                {card.grade}
              </span>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center py-3 sm:py-4">
            <div className="relative w-[180px] sm:w-[220px] h-[250px] sm:h-[300px] rounded-lg overflow-hidden shadow-lg shadow-black/50 border-2 border-accent/50">
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
          <div className="px-3 py-3 bg-black/20 rounded-xl border-t border-border shrink-0">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-headline text-base font-bold leading-tight truncate">{card.cardName || "Unknown Card"}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{card.set || "Unidentified Set"}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                        {Object.entries(card.subgrades).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1">
                                <SubgradeIcon type={key as keyof typeof card.subgrades} className="h-3.5 w-3.5" />
                                <span className="text-[10px] capitalize">{key}</span>
                                <span className="text-[10px] font-bold ml-auto">{value.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {isPublicPage && publicUrl && (
                     <div className="flex flex-col items-center gap-1 shrink-0">
                        <QRCode url={publicUrl} size={56} />
                        <span className="text-[7px] text-muted-foreground font-mono text-center leading-tight max-w-[56px] break-all">{card.publicShareId}</span>
                     </div>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

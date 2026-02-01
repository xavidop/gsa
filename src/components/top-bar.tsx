'use client';

import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { AddCardDialog } from '@/components/add-card-dialog';
import type { Collection } from '@/lib/types';

export function TopBar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);

  // Fetch user's collections
  const collectionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'collections'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: collections = [] } = useCollection<Collection>(collectionsQuery);

  return (
    <div className="hidden lg:flex h-14 border-b items-center justify-end px-6 gap-3 bg-background/95 backdrop-blur sticky top-0 z-40">
      <Button 
        size="sm" 
        variant="outline"
        className="gap-2"
        onClick={() => setShowAddCardDialog(true)}
        disabled={!user}
      >
        <Plus className="h-4 w-4" />
        Add Card
      </Button>
      
      <Link href="/grade">
        <Button size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Grade Card
        </Button>
      </Link>

      {/* Add Card Dialog */}
      <AddCardDialog 
        open={showAddCardDialog} 
        onOpenChange={setShowAddCardDialog}
        collections={collections || []}
      />
    </div>
  );
}

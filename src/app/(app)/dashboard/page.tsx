'use client';

import { useMemo, useState, useEffect } from 'react';
import { collection, query, orderBy, doc, updateDoc, where, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { GradedCard, Collection } from '@/lib/types';
import { DigitalSlab } from '@/components/digital-slab';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Search, Grid, List, SlidersHorizontal, Eye, EyeOff, FolderOpen, FileDown, FolderPlus, Settings } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CollectionManager } from '@/components/collection-manager';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { AdvancedSearch } from '@/components/advanced-search';

type ViewMode = 'grid' | 'list';
type SortOption = 'date-desc' | 'date-asc' | 'grade-desc' | 'grade-asc' | 'name-asc' | 'name-desc';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [showMobileCollectionManager, setShowMobileCollectionManager] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [openCardMenu, setOpenCardMenu] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  // Advanced search states
  const [gradeMin, setGradeMin] = useState<number | undefined>();
  const [gradeMax, setGradeMax] = useState<number | undefined>();
  const [yearFilter, setYearFilter] = useState<string>('');
  const [setFilter, setSetFilter] = useState<string>('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const { toast } = useToast();

  // Fetch username for export
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user?.uid) return;
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        setUsername(userDoc.data()?.username || '');
      }
    };
    fetchUsername();
  }, [user?.uid, firestore]);

  // Fetch collections - now as subcollection under user (path-based security)
  const collectionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    
    return query(
      collection(firestore, 'users', user.uid, 'collections'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: collections = [], isLoading: collectionsLoading } = useCollection<Collection>(collectionsQuery);

  const toggleCardVisibility = async (cardId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const cardRef = doc(firestore, 'users', user.uid, 'graded_cards', cardId);
      const newStatus = !currentStatus;
      
      // Update the private card
      await updateDoc(cardRef, {
        isPublic: newStatus
      });

      // Get the card data to sync with public collection
      const cardSnapshot = await getDoc(cardRef);
      if (cardSnapshot.exists()) {
        const cardData = cardSnapshot.data();
        const publicShareId = cardData.publicShareId;

        if (newStatus && publicShareId) {
          // Card is now public - add/update in public collection
          const publicCardRef = doc(firestore, 'public_graded_cards', publicShareId);
          await setDoc(publicCardRef, {
            ...cardData,
            isPublic: true,
            id: cardId
          });
        } else if (!newStatus && publicShareId) {
          // Card is now private - remove from public collection
          const publicCardRef = doc(firestore, 'public_graded_cards', publicShareId);
          await deleteDoc(publicCardRef);
        }
      }
      
      toast({
        title: newStatus ? 'Card is now public' : 'Card is now private',
        description: newStatus 
          ? 'This card will appear on your public profile' 
          : 'This card is now hidden from your public profile',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update card visibility',
        variant: 'destructive',
      });
    }
  };

  const assignCardToCollection = async (cardId: string, collectionId: string | null) => {
    if (!user) return;

    try {
      const cardRef = doc(firestore, 'users', user.uid, 'graded_cards', cardId);
      await updateDoc(cardRef, {
        collectionId: collectionId || null
      });
      
      toast({
        title: 'Card updated',
        description: collectionId 
          ? 'Card assigned to collection' 
          : 'Card removed from collection',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update card collection',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredAndSortedCards);
    toast({
      title: 'Export successful',
      description: 'Your collection has been exported to CSV.',
    });
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(filteredAndSortedCards, username);
      toast({
        title: 'Export successful',
        description: 'Your portfolio report has been generated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report.',
        variant: 'destructive',
      });
    }
  };

  const cardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'graded_cards'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: cards, isLoading: loading } = useCollection<GradedCard>(cardsQuery);

  // Deduplicate cards by ID (in case duplicates exist in Firestore)
  const deduplicatedCards = useMemo(() => {
    if (!cards) return null;
    
    const seen = new Set<string>();
    const unique: GradedCard[] = [];
    
    for (const card of cards) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        unique.push(card);
      }
    }
    
    return unique;
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    if (!deduplicatedCards) return [];

    let filtered = [...deduplicatedCards];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.cardName?.toLowerCase().includes(query) ||
          card.set?.toLowerCase().includes(query)
      );
    }

    // Apply collection filter
    if (collectionFilter !== 'all') {
      if (collectionFilter === 'uncategorized') {
        filtered = filtered.filter((card) => !card.collectionId);
      } else {
        filtered = filtered.filter((card) => card.collectionId === collectionFilter);
      }
    }

    // Apply grade filter
    if (gradeFilter !== 'all') {
      const gradeValue = parseInt(gradeFilter);
      filtered = filtered.filter((card) => card.grade === gradeValue);
    }
    
    // Apply advanced search filters
    if (gradeMin !== undefined) {
      filtered = filtered.filter((card) => card.grade >= gradeMin);
    }
    if (gradeMax !== undefined) {
      filtered = filtered.filter((card) => card.grade <= gradeMax);
    }
    if (yearFilter) {
      filtered = filtered.filter((card) => card.year === yearFilter);
    }
    if (setFilter) {
      filtered = filtered.filter((card) => card.set?.toLowerCase().includes(setFilter.toLowerCase()));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const getTime = (date: any) => {
        if (!date) return 0;
        return date.toDate ? date.toDate().getTime() : date.getTime?.() || 0;
      };
      
      switch (sortBy) {
        case 'date-desc':
          return getTime(b.createdAt) - getTime(a.createdAt);
        case 'date-asc':
          return getTime(a.createdAt) - getTime(b.createdAt);
        case 'grade-desc':
          return b.grade - a.grade;
        case 'grade-asc':
          return a.grade - b.grade;
        case 'name-asc':
          return (a.cardName || '').localeCompare(b.cardName || '');
        case 'name-desc':
          return (b.cardName || '').localeCompare(a.cardName || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, searchQuery, collectionFilter, gradeFilter, sortBy, gradeMin, gradeMax, yearFilter, setFilter]);

  return (
    <div className="container py-6 sm:py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar with Collections - Hidden on mobile, use collection filter instead */}
        <div className="hidden lg:block space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Manage Collections</CardTitle>
              <CardDescription>Organize your cards into collections</CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionManager 
                collections={collections || []} 
                onCollectionCreated={() => {
                  // Refresh will happen automatically via useCollection
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline">My Collection</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {cards && cards.length > 0 
                    ? `${filteredAndSortedCards.length} of ${cards.length} cards` 
                    : 'View your GSA graded cards.'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mobile Collection Manager Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => setShowMobileCollectionManager(!showMobileCollectionManager)}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
                
                {cards && cards.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Collection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup>
                    <DropdownMenuRadioItem value="csv" onClick={handleExportCSV}>
                      Export as CSV
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pdf" onClick={handleExportPDF}>
                      Export as PDF Portfolio
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
              </div>
            </div>
            
            {/* Mobile Collection Manager */}
            {showMobileCollectionManager && (
              <Card className="lg:hidden">
                <CardHeader>
                  <CardTitle>Collections</CardTitle>
                  <CardDescription>Organize your cards into collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <CollectionManager
                    collections={collections || []}
                    onCollectionCreated={() => {
                      // Refresh will happen automatically via useCollection
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

      {/* Filters and Controls */}
      {cards && cards.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by card name or set..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Collection Filter */}
            <Select value={collectionFilter} onValueChange={setCollectionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {collections?.map((coll) => (
                  <SelectItem key={coll.id} value={coll.id}>
                    {coll.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grade Filter */}
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="8">Grade 8</SelectItem>
                <SelectItem value="7">Grade 7</SelectItem>
                <SelectItem value="6">Grade 6</SelectItem>
                <SelectItem value="5">Grade 5 or lower</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <DropdownMenuRadioItem value="date-desc">Newest First</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="date-asc">Oldest First</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="grade-desc">Highest Grade</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="grade-asc">Lowest Grade</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Advanced Search Toggle */}
            <Button 
              variant={showAdvancedSearch ? "default" : "outline"}
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="w-full sm:w-auto"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Advanced
            </Button>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Advanced Search Panel */}
          {showAdvancedSearch && (
            <AdvancedSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              gradeMin={gradeMin || 1}
              setGradeMin={setGradeMin}
              gradeMax={gradeMax || 10}
              setGradeMax={setGradeMax}
              year={yearFilter}
              setYear={setYearFilter}
              setFilter={setFilter}
              setSetFilter={setSetFilter}
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAndSortedCards.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 justify-items-center md:justify-items-start">
            {filteredAndSortedCards.map((card) => (
              <div key={card.id} className="relative group">
                <Link href={`/card/${card.publicShareId}`}>
                  <DigitalSlab card={card} />
                </Link>
                
                {/* Settings Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenCardMenu(openCardMenu === card.id ? null : card.id);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-background/95 backdrop-blur-sm border shadow-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent transition-all z-10"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {/* Controls Menu */}
                {openCardMenu === card.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setOpenCardMenu(null)}
                    />
                    <div className="absolute top-12 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-30 min-w-[180px]">
                      <div className="flex flex-col gap-3">
                        {/* Collection Selector */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Collection</Label>
                          <Select
                            value={card.collectionId || 'none'}
                            onValueChange={(value) => {
                              assignCardToCollection(card.id, value === 'none' ? null : value);
                              setOpenCardMenu(null);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <FolderOpen className="h-3 w-3 mr-1" />
                              <SelectValue placeholder="No collection" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No collection</SelectItem>
                              {collections?.map((coll) => (
                                <SelectItem key={coll.id} value={coll.id}>
                                  {coll.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Visibility Toggle */}
                        <div className="border-t pt-3">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Visibility</Label>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {card.isPublic !== false ? (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-xs">
                                {card.isPublic !== false ? 'Show in profile' : 'Hide from profile'}
                              </span>
                            </div>
                            <Switch
                              checked={card.isPublic !== false}
                              onCheckedChange={() => toggleCardVisibility(card.id, card.isPublic !== false)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedCards.map((card) => (
              <Card key={card.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <Link href={`/card/${card.publicShareId}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                      <div className="w-20 h-28 sm:w-24 sm:h-36 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                        <img
                          src={card.frontImageUrl}
                          alt={card.cardName || 'Card'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <h3 className="text-lg sm:text-xl font-bold font-headline truncate">{card.cardName || 'Unknown Card'}</h3>
                        <p className="text-sm text-muted-foreground truncate">{card.set || 'Unknown Set'}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          {Object.entries(card.subgrades).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground capitalize">{key}: </span>
                              <span className="font-semibold">{value.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:gap-1 flex-shrink-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">GRADE</div>
                        <div className="text-3xl sm:text-4xl font-bold font-headline text-accent">{card.grade}</div>
                      </div>
                    </Link>
                    <div className="flex flex-row gap-3 w-full sm:w-auto flex-shrink-0 sm:pl-4 sm:border-l pt-3 sm:pt-0 border-t sm:border-t-0">
                      {/* Collection Selector */}
                      <div className="flex-1 sm:flex-initial" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={card.collectionId || 'none'}
                          onValueChange={(value) => assignCardToCollection(card.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="h-8 text-xs w-full sm:w-[140px]">
                            <FolderOpen className="h-3 w-3 mr-1" />
                            <SelectValue placeholder="No collection" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No collection</SelectItem>
                          {collections?.map((coll) => (
                            <SelectItem key={coll.id} value={coll.id}>
                              {coll.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>

                      {/* Visibility Toggle */}
                      <div className="flex flex-1 sm:flex-initial flex-row items-center justify-center gap-2">
                        {card.isPublic !== false ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={card.isPublic !== false}
                          onCheckedChange={() => toggleCardVisibility(card.id, card.isPublic !== false)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {card.isPublic !== false ? 'Show in profile' : 'Hide from profile'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : cards && cards.length > 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardHeader>
            <CardTitle className="text-xl">No cards found</CardTitle>
            <CardDescription>Try adjusting your search or filters</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setGradeFilter('all'); setCollectionFilter('all'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
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
      </div>
    </div>
  );
}

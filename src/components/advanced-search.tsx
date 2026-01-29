'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Save, Star, X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { SearchPreset } from '@/lib/types';

interface AdvancedSearchProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  gradeMin: number;
  setGradeMin: (value: number) => void;
  gradeMax: number;
  setGradeMax: (value: number) => void;
  year: string;
  setYear: (value: string) => void;
  setFilter: string;
  setSetFilter: (value: string) => void;
}

export function AdvancedSearch({
  searchQuery,
  setSearchQuery,
  gradeMin,
  setGradeMin,
  gradeMax,
  setGradeMax,
  year,
  setYear,
  setFilter,
  setSetFilter,
}: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<SearchPreset[]>([]);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    loadPresets();
  }, [user]);

  const loadPresets = async () => {
    if (!user) return;
    
    const presetsRef = collection(firestore, 'users', user.uid, 'search_presets');
    const snapshot = await getDocs(presetsRef);
    const loadedPresets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SearchPreset[];
    setPresets(loadedPresets);
  };

  const handleSavePreset = async () => {
    if (!user || !presetName.trim()) return;

    try {
      const presetsRef = collection(firestore, 'users', user.uid, 'search_presets');
      await addDoc(presetsRef, {
        userId: user.uid,
        name: presetName,
        filters: {
          searchQuery,
          gradeMin,
          gradeMax,
          year,
          set: setFilter,
        },
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Preset saved',
        description: `"${presetName}" has been saved.`,
      });

      setPresetName('');
      setIsSavePresetOpen(false);
      loadPresets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preset.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadPreset = (preset: SearchPreset) => {
    setSearchQuery(preset.filters.searchQuery || '');
    setGradeMin(preset.filters.gradeMin || 1);
    setGradeMax(preset.filters.gradeMax || 10);
    setYear(preset.filters.year || '');
    setSetFilter(preset.filters.set || '');
    
    toast({
      title: 'Preset loaded',
      description: `Filters from "${preset.name}" applied.`,
    });
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'search_presets', presetId));
      toast({
        title: 'Preset deleted',
      });
      loadPresets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete preset.',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setGradeMin(1);
    setGradeMax(10);
    setYear('');
    setSetFilter('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Advanced Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Search & Filters</DialogTitle>
          <DialogDescription>
            Search your collection with advanced filters and save your favorite searches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Query</Label>
            <Input
              id="search"
              placeholder="Card name or set..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Grade Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeMin">Min Grade</Label>
              <Select value={gradeMin.toString()} onValueChange={(v) => setGradeMin(parseInt(v))}>
                <SelectTrigger id="gradeMin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeMax">Max Grade</Label>
              <Select value={gradeMax.toString()} onValueChange={(v) => setGradeMax(parseInt(v))}>
                <SelectTrigger id="gradeMax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year and Set */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="e.g., 1999"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set">Set Name</Label>
              <Input
                id="set"
                placeholder="e.g., Base Set"
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Saved Presets */}
          {presets.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label>Saved Searches</Label>
              </div>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start"
                      onClick={() => {
                        handleLoadPreset(preset);
                        setIsOpen(false);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {preset.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClearAll}>
            Clear All
          </Button>
          <Dialog open={isSavePresetOpen} onOpenChange={setIsSavePresetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save as Preset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search Preset</DialogTitle>
                <DialogDescription>Give this search a name to save it for later</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                  Save Preset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setIsOpen(false)}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

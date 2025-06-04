import { create } from 'zustand';
import type { ProcessedEarthquakeData, FilterState } from '../types/earthquake';

interface EarthquakeStore extends FilterState {
  // Actions for managing selection
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  
  // Actions for filtering
  setMagnitudeRange: (min: number, max: number) => void;
  setSelectedRegions: (regions: string[]) => void;
  toggleRegion: (region: string) => void;
  
  // Helper to check if earthquake matches current filters
  isEarthquakeVisible: (earthquake: ProcessedEarthquakeData) => boolean;
  
  // Reset filters
  resetFilters: () => void;
}

export const useEarthquakeStore = create<EarthquakeStore>((set, get) => ({
  // Initial state
  selectedId: null,
  hoveredId: null,
  minMagnitude: 0,
  maxMagnitude: 10,
  selectedRegions: [],

  // Actions
  setSelectedId: (id) => set({ selectedId: id }),
  setHoveredId: (id) => set({ hoveredId: id }),
  
  setMagnitudeRange: (min, max) => set({ minMagnitude: min, maxMagnitude: max }),
  
  setSelectedRegions: (regions) => set({ selectedRegions: regions }),
  
  toggleRegion: (region) => set((state) => ({
    selectedRegions: state.selectedRegions.includes(region)
      ? state.selectedRegions.filter(r => r !== region)
      : [...state.selectedRegions, region]
  })),
  
  isEarthquakeVisible: (earthquake) => {
    const state = get();
    
    // Check magnitude range
    if (earthquake.mag < state.minMagnitude || earthquake.mag > state.maxMagnitude) {
      return false;
    }
    
    // Check region filter (if any regions selected)
    if (state.selectedRegions.length > 0 && !state.selectedRegions.includes(earthquake.region)) {
      return false;
    }
    
    return true;
  },
  
  resetFilters: () => set({
    selectedId: null,
    hoveredId: null,
    minMagnitude: 0,
    maxMagnitude: 10,
    selectedRegions: []
  })
}));

// Simple selectors to reduce re-renders
export const useFilterState = () => useEarthquakeStore((state) => ({
  minMagnitude: state.minMagnitude,
  maxMagnitude: state.maxMagnitude,
  selectedRegions: state.selectedRegions,
  selectedId: state.selectedId,
  hoveredId: state.hoveredId
}));

export const useSelectionState = () => useEarthquakeStore((state) => ({ 
  selectedId: state.selectedId, 
  hoveredId: state.hoveredId 
}));

export const useMagnitudeFilter = () => useEarthquakeStore((state) => ({ 
  minMagnitude: state.minMagnitude, 
  maxMagnitude: state.maxMagnitude 
}));

export const useRegionFilter = () => useEarthquakeStore((state) => state.selectedRegions); 
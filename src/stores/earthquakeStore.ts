import { create } from 'zustand';
import type { ProcessedEarthquakeData } from '../types/earthquake';

interface ZoomState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface EarthquakeStore {
  // Chart state
  xAxis: keyof ProcessedEarthquakeData;
  yAxis: keyof ProcessedEarthquakeData;
  zoomState: ZoomState | null;
  
  // UI state
  tableSorting: Array<{ id: string; desc: boolean }>;
  
  // Chart actions
  setChartAxes: (xAxis: keyof ProcessedEarthquakeData, yAxis: keyof ProcessedEarthquakeData) => void;
  setZoomState: (zoom: ZoomState | null) => void;
  
  // UI actions
  setTableSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;
  
  // Computed data function
  getSynchronizedData: (rawData: ProcessedEarthquakeData[]) => ProcessedEarthquakeData[];
  
  // Reset actions
  resetAll: () => void;
}

export const useEarthquakeStore = create<EarthquakeStore>((set, get) => ({
  // Chart state
  xAxis: 'longitude',
  yAxis: 'latitude',
  zoomState: null,
  
  // UI state
  tableSorting: [],

  // Chart actions
  setChartAxes: (xAxis, yAxis) => {
    set({ 
      xAxis, 
      yAxis,
      zoomState: null // Reset zoom when axes change
    });
  },
  
  setZoomState: (zoom) => {
    set({ zoomState: zoom });
  },
  
  // UI actions
  setTableSorting: (sorting) => set({ tableSorting: sorting }),
  
  // Computed data function
  getSynchronizedData: (rawData) => {
    const { xAxis, yAxis } = get();
    return rawData.filter(earthquake => {
      const xValue = earthquake[xAxis] as number;
      const yValue = earthquake[yAxis] as number;
      return xValue !== null && 
             yValue !== null && 
             !isNaN(xValue) && 
             !isNaN(yValue);
    });
  },
  
  resetAll: () => set({
    xAxis: 'longitude',
    yAxis: 'latitude',
    zoomState: null,
    tableSorting: []
  })
}));

// Optimized selectors for chart functionality
export const useChartState = () => useEarthquakeStore((state) => ({
  xAxis: state.xAxis,
  yAxis: state.yAxis,
  zoomState: state.zoomState,
  setChartAxes: state.setChartAxes,
  setZoomState: state.setZoomState
}));

export const useTableState = () => useEarthquakeStore((state) => ({
  sorting: state.tableSorting,
  setSorting: state.setTableSorting
}));

export const useDataSync = () => useEarthquakeStore((state) => ({
  getSynchronizedData: state.getSynchronizedData,
  xAxis: state.xAxis,
  yAxis: state.yAxis
})); 
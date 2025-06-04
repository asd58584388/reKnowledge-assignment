export interface EarthquakeData {
  time: string;
  latitude: number;
  longitude: number;
  depth: number;
  mag: number;
  magType: string;
  nst: number | null;
  gap: number | null;
  dmin: number | null;
  rms: number | null;
  net: string;
  id: string;
  updated: string;
  place: string;
  type: string;
  horizontalError: number | null;
  depthError: number | null;
  magError: number | null;
  magNst: number | null;
  status: string;
  locationSource: string;
  magSource: string;
}

export interface ProcessedEarthquakeData extends EarthquakeData {
  timeDate: Date;
  updatedDate: Date;
  region: string;
  magnitudeCategory: string;
  depthCategory: string;
}

export interface ChartAxisOption {
  key: keyof ProcessedEarthquakeData;
  label: string;
  type: 'numeric' | 'categorical';
}

export interface FilterState {
  selectedId: string | null;
  hoveredId: string | null;
  minMagnitude: number;
  maxMagnitude: number;
  selectedRegions: string[];
} 
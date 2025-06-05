/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProcessedEarthquakeData } from '../types/earthquake';

interface EarthquakeContextType {
  selectedEarthquake: ProcessedEarthquakeData | null;
  hoveredEarthquake: ProcessedEarthquakeData | null;
  setSelectedEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
  setHoveredEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
}

const EarthquakeContext = createContext<EarthquakeContextType | undefined>(undefined);

interface EarthquakeProviderProps {
  children: ReactNode;
}

export const EarthquakeProvider: React.FC<EarthquakeProviderProps> = ({ children }) => {
  const [selectedEarthquake, setSelectedEarthquake] = useState<ProcessedEarthquakeData | null>(null);
  const [hoveredEarthquake, setHoveredEarthquake] = useState<ProcessedEarthquakeData | null>(null);

  const value: EarthquakeContextType = {
    selectedEarthquake,
    hoveredEarthquake,
    setSelectedEarthquake,
    setHoveredEarthquake,
  };

  return (
    <EarthquakeContext.Provider value={value}>
      {children}
    </EarthquakeContext.Provider>
  );
};

export const useEarthquakeContext = () => {
  const context = useContext(EarthquakeContext);
  if (context === undefined) {
    throw new Error('useEarthquakeContext must be used within an EarthquakeProvider');
  }
  return context;
}; 
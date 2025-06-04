import React, { useMemo } from 'react';
import type { ProcessedEarthquakeData } from '../../types/earthquake';
import { useEarthquakeStore } from '../../stores/earthquakeStore';

interface FilterPanelProps {
  data: ProcessedEarthquakeData[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ data }) => {
  const { 
    minMagnitude, 
    maxMagnitude, 
    selectedRegions,
    setMagnitudeRange, 
    toggleRegion, 
    resetFilters,
    isEarthquakeVisible
  } = useEarthquakeStore();

  // Simple data calculations without complex caching
  const { magnitudeRange, regions, filteredCount } = useMemo(() => {
    const magnitudes = data.map(eq => eq.mag).filter(mag => !isNaN(mag));
    const minMag = Math.min(...magnitudes);
    const maxMag = Math.max(...magnitudes);
    
    const regionCounts = data.reduce((acc, eq) => {
      acc[eq.region] = (acc[eq.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedRegions = Object.entries(regionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 regions
    
    const filteredCount = data.filter(eq => isEarthquakeVisible(eq)).length;
    
    return {
      magnitudeRange: { min: minMag, max: maxMag },
      regions: sortedRegions,
      filteredCount
    };
  }, [data, minMagnitude, maxMagnitude, selectedRegions, isEarthquakeVisible]);

  return (
    <div className="bg-white border-r border-gray-200 p-4 w-64 flex-shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Reset
        </button>
      </div>

      {/* Magnitude Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Magnitude Range
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8">Min:</span>
            <input
              type="range"
              min={magnitudeRange.min}
              max={magnitudeRange.max}
              step={0.1}
              value={minMagnitude}
              onChange={(e) => setMagnitudeRange(parseFloat(e.target.value), maxMagnitude)}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8">{minMagnitude.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8">Max:</span>
            <input
              type="range"
              min={magnitudeRange.min}
              max={magnitudeRange.max}
              step={0.1}
              value={maxMagnitude}
              onChange={(e) => setMagnitudeRange(minMagnitude, parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8">{maxMagnitude.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Range: {magnitudeRange.min.toFixed(1)} - {magnitudeRange.max.toFixed(1)}
        </div>
      </div>

      {/* Region Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Regions ({selectedRegions.length} selected)
        </label>
        <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
          {regions.map(([region, count]) => (
            <label
              key={region}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedRegions.includes(region)}
                onChange={() => toggleRegion(region)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1 text-sm text-gray-700 truncate" title={region}>
                {region}
              </span>
              <span className="text-xs text-gray-500">({count})</span>
            </label>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Showing top 10 regions by earthquake count
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Total earthquakes: {data.length}</div>
          <div>Filtered: {filteredCount}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FilterPanel); 
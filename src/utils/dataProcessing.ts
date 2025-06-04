import type { EarthquakeData, ProcessedEarthquakeData, FilterState } from '../types/earthquake';

// Cache for expensive computations
const dataCache = new Map<string, any>();

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

export const fetchEarthquakeData = async (): Promise<EarthquakeData[]> => {
  console.log('Starting fetch of earthquake data...');
  
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv', {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
    });
    
    console.log('Fetch response:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch earthquake data: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV data received, length:', csvText.length, 'chars');
    console.log('First 200 chars:', csvText.substring(0, 200));
    
    const parsedData = parseCSV(csvText);
    console.log('Parsed', parsedData.length, 'earthquake records');
    
    return parsedData;
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    throw error;
  }
};

const parseCSV = (csvText: string): EarthquakeData[] => {
  try {
    const lines = csvText.trim().split('\n');
    console.log('CSV has', lines.length, 'lines');
    
    if (lines.length < 2) {
      throw new Error('CSV data appears to be empty or invalid');
    }
    
    const headers = lines[0].split(',');
    console.log('CSV headers:', headers);
    
    return lines.slice(1).map((line, index) => {
      try {
        const values = parseCSVLine(line);
        const earthquake: any = {};
        
        headers.forEach((header, headerIndex) => {
          const value = values[headerIndex];
          
          // Handle numeric fields
          if (['latitude', 'longitude', 'depth', 'mag', 'nst', 'gap', 'dmin', 'rms', 
               'horizontalError', 'depthError', 'magError', 'magNst'].includes(header)) {
            earthquake[header] = value && value !== '' ? parseFloat(value) : null;
          } else {
            earthquake[header] = value || '';
          }
        });
        
        return earthquake as EarthquakeData;
      } catch (lineError) {
        console.warn(`Error parsing line ${index + 1}:`, lineError, 'Line:', line.substring(0, 100));
        return null;
      }
    }).filter(Boolean) as EarthquakeData[];
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse earthquake data');
  }
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const processEarthquakeData = (data: EarthquakeData[]): ProcessedEarthquakeData[] => {
  console.log('Processing', data.length, 'earthquake records...');
  
  const processed = data.map(earthquake => ({
    ...earthquake,
    timeDate: new Date(earthquake.time),
    updatedDate: new Date(earthquake.updated),
    region: extractRegion(earthquake.place),
    magnitudeCategory: getMagnitudeCategory(earthquake.mag),
    depthCategory: getDepthCategory(earthquake.depth)
  }));
  
  console.log('Processed data sample:', processed.slice(0, 2));
  return processed;
};

const extractRegion = (place: string): string => {
  if (!place) return 'Unknown';
  
  // Extract state/country from place description
  const parts = place.split(',');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    // Return state/country abbreviation or full name
    return lastPart;
  }
  
  return place;
};

const getMagnitudeCategory = (magnitude: number): string => {
  if (magnitude < 2.0) return 'Micro';
  if (magnitude < 3.0) return 'Minor';
  if (magnitude < 4.0) return 'Light';
  if (magnitude < 5.0) return 'Moderate';
  if (magnitude < 6.0) return 'Strong';
  if (magnitude < 7.0) return 'Major';
  return 'Great';
};

const getDepthCategory = (depth: number): string => {
  if (depth < 70) return 'Shallow';
  if (depth < 300) return 'Intermediate';
  return 'Deep';
};

// Memoized filter function for performance
export const createFilteredData = (
  data: ProcessedEarthquakeData[], 
  filterState: FilterState
): ProcessedEarthquakeData[] => {
  const cacheKey = `filtered_${JSON.stringify(filterState)}_${data.length}`;
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }
  
  const filtered = data.filter(earthquake => {
    // Check magnitude range
    if (earthquake.mag < filterState.minMagnitude || earthquake.mag > filterState.maxMagnitude) {
      return false;
    }
    
    // Check region filter (if any regions selected)
    if (filterState.selectedRegions.length > 0 && !filterState.selectedRegions.includes(earthquake.region)) {
      return false;
    }
    
    return true;
  });
  
  // Cache the result but limit cache size
  if (dataCache.size > 10) {
    const firstKey = dataCache.keys().next().value;
    dataCache.delete(firstKey);
  }
  dataCache.set(cacheKey, filtered);
  
  return filtered;
};

// Memoized data stats calculation
export const calculateDataStats = (data: ProcessedEarthquakeData[]) => {
  const cacheKey = `stats_${data.length}`;
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }
  
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
  
  const stats = {
    magnitudeRange: { min: minMag, max: maxMag },
    regions: sortedRegions,
    totalCount: data.length
  };
  
  // Cache the result
  if (dataCache.size > 10) {
    const firstKey = dataCache.keys().next().value;
    dataCache.delete(firstKey);
  }
  dataCache.set(cacheKey, stats);
  
  return stats;
};

export const getNumericColumns = (): Array<{ key: keyof ProcessedEarthquakeData; label: string }> => [
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'depth', label: 'Depth (km)' },
  { key: 'mag', label: 'Magnitude' },
  { key: 'nst', label: 'Number of Stations' },
  { key: 'gap', label: 'Gap (degrees)' },
  { key: 'dmin', label: 'Distance to Nearest Station' },
  { key: 'rms', label: 'RMS Travel Time Residual' },
  { key: 'horizontalError', label: 'Horizontal Error' },
  { key: 'depthError', label: 'Depth Error' },
  { key: 'magError', label: 'Magnitude Error' },
  { key: 'magNst', label: 'Magnitude Stations' }
];

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const formatNumber = (value: number | null, decimals: number = 2): string => {
  if (value === null || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}; 
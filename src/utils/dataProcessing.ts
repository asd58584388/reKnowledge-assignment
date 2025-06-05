import type { EarthquakeData, ProcessedEarthquakeData } from '../types/earthquake';

// Cache for expensive computations
const dataCache = new Map<string, unknown>();

// Throttle utility for performance optimization
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

export const fetchEarthquakeData = async (): Promise<EarthquakeData[]> => {
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv', {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch earthquake data: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const parsedData = parseCSV(csvText);
    
    return parsedData;
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    throw error;
  }
};

const parseCSV = (csvText: string): EarthquakeData[] => {
  try {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV data appears to be empty or invalid');
    }
    
    const headers = lines[0].split(',');
    
    return lines.slice(1).map((line, index) => {
      try {
        const values = parseCSVLine(line);
        const earthquake: Record<string, string | number | null> = {};
        
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
        
        return earthquake as unknown as EarthquakeData;
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

// Helper function to parse CSV line handling quoted values
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
  const processed = data.map(earthquake => ({
    ...earthquake,
    timeDate: new Date(earthquake.time),
    updatedDate: new Date(earthquake.updated),
    region: extractRegion(earthquake.place),
    magnitudeCategory: getMagnitudeCategory(earthquake.mag),
    depthCategory: getDepthCategory(earthquake.depth)
  }));
  
  return processed;
};

const extractRegion = (place: string): string => {
  if (!place || typeof place !== 'string') return 'Unknown';
  
  // Extract region from place string (e.g., "5km NE of Tokyo, Japan" -> "Japan")
  const parts = place.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : place.trim();
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
    if (firstKey !== undefined) {
      dataCache.delete(firstKey);
    }
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

export const formatNumber = (value: number, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
};

export const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(date);
}; 
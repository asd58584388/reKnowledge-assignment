import { useQuery } from '@tanstack/react-query';
import { fetchEarthquakeData, processEarthquakeData } from '../utils/dataProcessing';
import type { ProcessedEarthquakeData, EarthquakeData } from '../types/earthquake';

// Mock data for testing
const createMockData = (): EarthquakeData[] => {
  return [
    {
      time: '2024-01-15T10:30:00.000Z',
      latitude: 37.7749,
      longitude: -122.4194,
      depth: 10.5,
      mag: 4.2,
      magType: 'ml',
      nst: 25,
      gap: 45,
      dmin: 0.1,
      rms: 0.15,
      net: 'nc',
      id: 'mock1',
      updated: '2024-01-15T10:35:00.000Z',
      place: '10km NE of San Francisco, CA',
      type: 'earthquake',
      horizontalError: 0.5,
      depthError: 1.2,
      magError: 0.1,
      magNst: 30,
      status: 'reviewed',
      locationSource: 'nc',
      magSource: 'nc'
    },
    {
      time: '2024-01-15T09:15:00.000Z',
      latitude: 34.0522,
      longitude: -118.2437,
      depth: 15.3,
      mag: 3.8,
      magType: 'ml',
      nst: 20,
      gap: 38,
      dmin: 0.08,
      rms: 0.12,
      net: 'ci',
      id: 'mock2',
      updated: '2024-01-15T09:20:00.000Z',
      place: '5km SW of Los Angeles, CA',
      type: 'earthquake',
      horizontalError: 0.4,
      depthError: 0.8,
      magError: 0.08,
      magNst: 25,
      status: 'automatic',
      locationSource: 'ci',
      magSource: 'ci'
    },
    {
      time: '2024-01-15T08:45:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      depth: 8.2,
      mag: 2.1,
      magType: 'md',
      nst: 15,
      gap: 55,
      dmin: 0.15,
      rms: 0.18,
      net: 'ld',
      id: 'mock3',
      updated: '2024-01-15T08:50:00.000Z',
      place: '12km E of New York, NY',
      type: 'earthquake',
      horizontalError: 0.7,
      depthError: 1.5,
      magError: 0.15,
      magNst: 18,
      status: 'reviewed',
      locationSource: 'ld',
      magSource: 'ld'
    }
  ];
};

export const useEarthquakeData = () => {
  return useQuery<ProcessedEarthquakeData[], Error>({
    queryKey: ['earthquakes'],
    queryFn: async () => {
      console.log('Starting earthquake data fetch...');
      
      try {
        // Try to fetch real data first
        const rawData = await fetchEarthquakeData();
        console.log('Successfully fetched real data:', rawData.length, 'records');
        return processEarthquakeData(rawData);
      } catch (error) {
        console.warn('Failed to fetch real data, using mock data:', error);
        
        // If real data fails, use mock data for testing
        const mockData = createMockData();
        console.log('Using mock data:', mockData.length, 'records');
        return processEarthquakeData(mockData);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 
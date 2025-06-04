import React, { useMemo } from 'react';
import { useEarthquakeData } from '../hooks/useEarthquakeData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import FilterPanel from './filters/FilterPanel';
import EarthquakeChart from './chart/EarthquakeChart';
import EarthquakeTable from './table/EarthquakeTable';

export const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useEarthquakeData();

  // Memoize current date to prevent unnecessary re-renders
  const currentDate = useMemo(() => new Date().toLocaleDateString(), []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading earthquake data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h2>
          <p className="text-gray-500">No earthquake data was found.</p>
          <button 
            onClick={() => refetch()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-100">
      {/* Filter Sidebar */}
      <FilterPanel data={data} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Earthquake Data Visualization</h1>
              <p className="text-sm text-gray-600 mt-1">
                Interactive exploration of USGS earthquake data from the past month ({data.length} earthquakes)
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {currentDate}
            </div>
          </div>
        </header>

        {/* Two-Panel Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Chart Panel */}
          <div className="flex-1 bg-white border-r border-gray-200">
            <EarthquakeChart data={data} />
          </div>
          
          {/* Table Panel */}
          <div className="flex-1 bg-white">
            <EarthquakeTable data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}; 
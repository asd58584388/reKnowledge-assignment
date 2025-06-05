import React, { useMemo } from 'react';
import { useEarthquakeData } from '../hooks/useEarthquakeData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import EarthquakeChart from './chart/EarthquakeChart';
import EarthquakeTable from './table/EarthquakeTable';
import { useEarthquakeContext } from '../contexts/EarthquakeContext';

export const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useEarthquakeData();
  const { setSelectedEarthquake, setHoveredEarthquake } = useEarthquakeContext();
  
  // Track current chart axes to ensure data consistency
  const [chartAxes, setChartAxes] = React.useState<{
    xAxis: keyof import('../types/earthquake').ProcessedEarthquakeData;
    yAxis: keyof import('../types/earthquake').ProcessedEarthquakeData;
  }>({
    xAxis: 'longitude',
    yAxis: 'latitude'
  });

  // Create shared filtered dataset that both chart and table will use
  const synchronizedData = useMemo(() => {
    if (!data) return [];
    
    // Filter out earthquakes with invalid coordinates for current chart axes
    return data.filter(earthquake => {
      const xValue = earthquake[chartAxes.xAxis] as number;
      const yValue = earthquake[chartAxes.yAxis] as number;
      
      return xValue !== null && 
             yValue !== null && 
             !isNaN(xValue) && 
             !isNaN(yValue);
    });
  }, [data, chartAxes.xAxis, chartAxes.yAxis]);

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
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earthquake Data Visualization</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive exploration of USGS earthquake data from the past month 
              ({synchronizedData.length} earthquakes with valid coordinates
              {data.length !== synchronizedData.length && ` of ${data.length} total`})
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
          <EarthquakeChart 
            data={synchronizedData} 
            onAxesChange={setChartAxes}
            setSelectedEarthquake={setSelectedEarthquake} 
            setHoveredEarthquake={setHoveredEarthquake} 
          />
        </div>
        
        {/* Table Panel */}
        <div className="flex-1 bg-white">
          <EarthquakeTable 
            data={synchronizedData} 
            setSelectedEarthquake={setSelectedEarthquake} 
            setHoveredEarthquake={setHoveredEarthquake} 
          />
        </div>
      </div>
    </div>
  );
}; 
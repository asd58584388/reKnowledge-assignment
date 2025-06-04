import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import type { ProcessedEarthquakeData } from '../../types/earthquake';
import { useEarthquakeStore } from '../../stores/earthquakeStore';
import { useEarthquakeContext } from '../../contexts/EarthquakeContext';
import { formatDate, formatNumber } from '../../utils/dataProcessing';

interface EarthquakeTableProps {
  data: ProcessedEarthquakeData[];
}

interface TableColumn {
  key: keyof ProcessedEarthquakeData;
  label: string;
  width?: string;
  render?: (value: any, earthquake: ProcessedEarthquakeData) => React.ReactNode;
}

const EarthquakeTable: React.FC<EarthquakeTableProps> = ({ data }) => {
  const { 
    selectedId, 
    hoveredId, 
    setSelectedId, 
    setHoveredId, 
    isEarthquakeVisible 
  } = useEarthquakeStore();
  const { setSelectedEarthquake } = useEarthquakeContext();
  const tableRef = useRef<HTMLDivElement>(null);

  // Simple filtered data without complex caching
  const filteredData = useMemo(() => 
    data.filter(earthquake => isEarthquakeVisible(earthquake)),
    [data, isEarthquakeVisible]
  );

  // Limit rows for performance - only show first 1000 rows
  const displayData = useMemo(() => 
    filteredData.slice(0, 1000),
    [filteredData]
  );

  const getMagnitudeColorClass = useCallback((magnitude: number): string => {
    if (magnitude >= 5) return 'text-red-600';
    if (magnitude >= 4) return 'text-orange-600';
    if (magnitude >= 3) return 'text-yellow-600';
    if (magnitude >= 2) return 'text-lime-600';
    return 'text-green-600';
  }, []);

  const getStatusColorClass = useCallback((status: string): string => {
    switch (status.toLowerCase()) {
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'automatic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'timeDate',
      label: 'Date & Time',
      width: 'w-40',
      render: (value: Date) => formatDate(value)
    },
    {
      key: 'mag',
      label: 'Magnitude',
      width: 'w-20',
      render: (value: number) => (
        <span className={`font-semibold ${getMagnitudeColorClass(value)}`}>
          {formatNumber(value, 1)}
        </span>
      )
    },
    {
      key: 'place',
      label: 'Location',
      width: 'w-64',
      render: (value: string) => (
        <span className="truncate" title={value}>{value}</span>
      )
    },
    {
      key: 'depth',
      label: 'Depth (km)',
      width: 'w-24',
      render: (value: number) => formatNumber(value, 1)
    },
    {
      key: 'latitude',
      label: 'Latitude',
      width: 'w-24',
      render: (value: number) => formatNumber(value, 3)
    },
    {
      key: 'longitude',
      label: 'Longitude',
      width: 'w-24',
      render: (value: number) => formatNumber(value, 3)
    },
    {
      key: 'region',
      label: 'Region',
      width: 'w-20'
    },
    {
      key: 'magnitudeCategory',
      label: 'Category',
      width: 'w-20',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-20',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass(value)}`}>
          {value}
        </span>
      )
    }
  ], [getMagnitudeColorClass, getStatusColorClass]);

  const handleRowClick = useCallback((earthquake: ProcessedEarthquakeData) => {
    setSelectedId(earthquake.id);
    setSelectedEarthquake(earthquake);
  }, [setSelectedId, setSelectedEarthquake]);

  const handleRowHover = useCallback((earthquake: ProcessedEarthquakeData | null) => {
    setHoveredId(earthquake?.id || null);
  }, [setHoveredId]);

  // Enhanced scroll to selected row with better timing
  useEffect(() => {
    if (selectedId && tableRef.current) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        const selectedRow = tableRef.current?.querySelector(`[data-earthquake-id="${selectedId}"]`);
        if (selectedRow) {
          selectedRow.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  const getRowClassName = useCallback((earthquake: ProcessedEarthquakeData): string => {
    const isSelected = selectedId === earthquake.id;
    const isHovered = hoveredId === earthquake.id;
    
    // Enhanced visual feedback
    let classes = 'cursor-pointer transition-all duration-200 border-l-4 ';
    
    if (isSelected) {
      classes += 'bg-blue-50 hover:bg-blue-100 border-l-blue-500 shadow-md ring-2 ring-blue-200 ';
    } else if (isHovered) {
      classes += 'bg-yellow-50 hover:bg-yellow-100 border-l-yellow-400 shadow-sm ';
    } else {
      classes += 'hover:bg-gray-50 border-l-transparent hover:border-l-gray-300 ';
    }
    
    return classes.trim();
  }, [selectedId, hoveredId]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Earthquake Data</h2>
          <div className="text-sm text-gray-600">
            Showing {displayData.length} of {filteredData.length} earthquakes
            {filteredData.length > 1000 && (
              <span className="text-orange-600 ml-2">(Limited to first 1000 for performance)</span>
            )}
          </div>
        </div>
        
        {/* Interaction hints */}
        <div className="mt-2 text-xs text-gray-500">
          💡 Click table rows or chart points for bi-directional selection • Hover for preview
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin" ref={tableRef}>
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map(earthquake => (
              <tr
                key={earthquake.id}
                data-earthquake-id={earthquake.id}
                className={getRowClassName(earthquake)}
                onClick={() => handleRowClick(earthquake)}
                onMouseEnter={() => handleRowHover(earthquake)}
                onMouseLeave={() => handleRowHover(null)}
              >
                {columns.map(column => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                    {column.render
                      ? column.render(earthquake[column.key], earthquake)
                      : String(earthquake[column.key] || 'N/A')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No earthquakes match the current filters
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EarthquakeTable); 
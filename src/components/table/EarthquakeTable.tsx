import React, { useMemo, useRef, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Row,
  type Table,
  type HeaderGroup,
  type Header,
} from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import type { ProcessedEarthquakeData } from '../../types/earthquake';
import { useEarthquakeContext } from '../../contexts/EarthquakeContext';
import { formatDate, formatNumber } from '../../utils/dataProcessing';

interface EarthquakeTableProps {
  data: ProcessedEarthquakeData[];
  setSelectedEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
  setHoveredEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
}

// Individual row component with context-based highlighting
const VirtualizedRow = React.memo(({ 
  virtualRow, 
  row, 
  onRowClick, 
  onRowHover,
  totalWidth
}: {
  virtualRow: VirtualItem;
  row: Row<ProcessedEarthquakeData>;
  onRowClick: (rowId: string) => void;
  onRowHover: (rowId: string | null) => void;
  totalWidth: number;
}) => {
  const earthquake = row.original;
  const { selectedEarthquake, hoveredEarthquake } = useEarthquakeContext();
  
  // Check if this row is selected or hovered from context (chart interactions)
  const isSelected = selectedEarthquake?.id === earthquake.id;
  const isHovered = hoveredEarthquake?.id === earthquake.id;
  
  // Row styling - only depends on this row's specific state
  const rowClassName = useMemo(() => {
    let classes = 'cursor-pointer transition-all duration-200 border-l-4 ';
    
    if (isSelected) {
      classes += 'bg-blue-50 hover:bg-blue-100 border-l-blue-500 shadow-md ring-2 ring-blue-200 ';
    } else if (isHovered) {
      classes += 'bg-yellow-50 hover:bg-yellow-100 border-l-yellow-400 shadow-sm ';
    } else {
      classes += 'hover:bg-gray-50 border-l-transparent hover:border-l-gray-300 ';
    }
    
    return classes.trim();
  }, [isSelected, isHovered]);

  // Memoized event handlers to prevent parent re-renders
  const handleClick = useCallback(() => onRowClick(row.id), [row.id, onRowClick]);
  const handleMouseEnter = useCallback(() => onRowHover(row.id), [row.id, onRowHover]);
  const handleMouseLeave = useCallback(() => onRowHover(null), [onRowHover]);

  return (
    <div
      data-earthquake-id={row.id}
      className={`absolute flex border-b border-gray-200 ${rowClassName}`}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
        contain: 'layout style paint', // CSS containment for performance
        width: `${totalWidth}px`,
        minWidth: `${totalWidth}px`,
        left: 0,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {row.getVisibleCells().map(cell => (
        <div
          key={cell.id}
          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 flex items-center flex-shrink-0"
          style={{ 
            width: `${cell.column.getSize()}px`,
            minWidth: `${cell.column.getSize()}px`,
            maxWidth: `${cell.column.getSize()}px`,
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
      ))}
    </div>
  );
});

VirtualizedRow.displayName = 'VirtualizedRow';

// Header component that doesn't re-render on row state changes
const TableHeader = React.memo(({ table }: { table: Table<ProcessedEarthquakeData> }) => {
  // Calculate total table width based on column sizes
  const totalWidth = table.getVisibleLeafColumns().reduce((width, column) => width + column.getSize(), 0);
  
  return (
    <div 
      className="sticky top-0 z-20 bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-gray-300 shadow-sm"
      style={{ minWidth: `${totalWidth}px` }}
    >
      {table.getHeaderGroups().map((headerGroup: HeaderGroup<ProcessedEarthquakeData>) => (
        <div key={headerGroup.id} className="flex" style={{ width: `${totalWidth}px` }}>
          {headerGroup.headers.map((header: Header<ProcessedEarthquakeData, unknown>) => (
            <div
              key={header.id}
              className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 last:border-r-0 bg-white/50 flex-shrink-0"
              style={{ 
                width: `${header.getSize()}px`,
                minWidth: `${header.getSize()}px`,
                maxWidth: `${header.getSize()}px`,
              }}
            >
              {header.isPlaceholder ? null : (
                <div
                  {...{
                    className: header.column.getCanSort()
                      ? 'cursor-pointer select-none flex items-center justify-between group hover:text-blue-600 transition-colors duration-200'
                      : 'flex items-center justify-between',
                    onClick: header.column.getToggleSortingHandler(),
                  }}
                >
                  <span className="flex-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </span>
                  <span className="ml-2 flex-shrink-0">
                    {header.column.getIsSorted() === 'asc' && (
                      <span className="text-blue-500 text-sm">↑</span>
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <span className="text-blue-500 text-sm">↓</span>
                    )}
                    {!header.column.getIsSorted() && header.column.getCanSort() && (
                      <span className="text-gray-300 group-hover:text-gray-400 text-sm">↕</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

TableHeader.displayName = 'TableHeader';

const EarthquakeTable: React.FC<EarthquakeTableProps> = ({ data, setSelectedEarthquake, setHoveredEarthquake }) => {
  const { selectedEarthquake } = useEarthquakeContext();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Define columns using simple ColumnDef
  const columns = useMemo<ColumnDef<ProcessedEarthquakeData>[]>(() => [
    {
      id: 'timeDate',
      accessorKey: 'timeDate',
      header: 'Date & Time',
      cell: (info) => formatDate(info.getValue() as Date),
      size: 160,
      minSize: 140,
      maxSize: 200,
    },
    {
      id: 'mag',
      accessorKey: 'mag',
      header: 'Magnitude',
      cell: (info) => {
        const earthquake = info.row.original;
        const magnitude = earthquake.mag;
        const magError = earthquake.magError;
        
        const colorClass = magnitude >= 5 ? 'text-red-600' 
          : magnitude >= 4 ? 'text-orange-600' 
          : magnitude >= 3 ? 'text-yellow-600' 
          : magnitude >= 2 ? 'text-lime-600' 
          : 'text-green-600';
        
        const displayValue = magError !== null && magError !== undefined && !isNaN(magError)
          ? `${formatNumber(magnitude, 1)} ± ${formatNumber(magError, 2)}`
          : formatNumber(magnitude, 1);
        
        return (
          <span className={`font-semibold ${colorClass}`} title={magError ? `Magnitude: ${magnitude}, Error: ±${magError}` : `Magnitude: ${magnitude}`}>
            {displayValue}
          </span>
        );
      },
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      id: 'place',
      accessorKey: 'place',
      header: 'Location',
      cell: (info) => {
        const place = info.getValue() as string;
        return (
          <span className="truncate" title={place}>
            {place}
          </span>
        );
      },
      size: 250,
      minSize: 200,
      maxSize: 400,
    },
    {
      id: 'depth',
      accessorKey: 'depth',
      header: 'Depth (km)',
      cell: (info) => {
        const earthquake = info.row.original;
        const depth = earthquake.depth;
        const depthError = earthquake.depthError;
        
        const displayValue = depthError !== null && depthError !== undefined && !isNaN(depthError)
          ? `${formatNumber(depth, 1)} ± ${formatNumber(depthError, 1)}`
          : formatNumber(depth, 1);
        
        return (
          <span title={depthError ? `Depth: ${depth}km, Error: ±${depthError}km` : `Depth: ${depth}km`}>
            {displayValue}
          </span>
        );
      },
      size: 130,
      minSize: 110,
      maxSize: 150,
    },
    {
      id: 'latitude',
      accessorKey: 'latitude',
      header: 'Latitude',
      cell: (info) => {
        const earthquake = info.row.original;
        const latitude = earthquake.latitude;
        const horizontalError = earthquake.horizontalError;
        
        // Use horizontal error for both lat/lng since they're related to position accuracy
        const displayValue = horizontalError !== null && horizontalError !== undefined && !isNaN(horizontalError)
          ? `${formatNumber(latitude, 3)} ± ${formatNumber(horizontalError, 3)}`
          : formatNumber(latitude, 3);
        
        return (
          <span title={horizontalError ? `Latitude: ${latitude}°, Horizontal Error: ±${horizontalError}°` : `Latitude: ${latitude}°`}>
            {displayValue}
          </span>
        );
      },
      size: 140,
      minSize: 120,
      maxSize: 160,
    },
    {
      id: 'longitude',
      accessorKey: 'longitude',
      header: 'Longitude',
      cell: (info) => {
        const earthquake = info.row.original;
        const longitude = earthquake.longitude;
        const horizontalError = earthquake.horizontalError;
        
        // Use horizontal error for both lat/lng since they're related to position accuracy
        const displayValue = horizontalError !== null && horizontalError !== undefined && !isNaN(horizontalError)
          ? `${formatNumber(longitude, 3)} ± ${formatNumber(horizontalError, 3)}`
          : formatNumber(longitude, 3);
        
        return (
          <span title={horizontalError ? `Longitude: ${longitude}°, Horizontal Error: ±${horizontalError}°` : `Longitude: ${longitude}°`}>
            {displayValue}
          </span>
        );
      },
      size: 140,
      minSize: 120,
      maxSize: 160,
    },
    {
      id: 'region',
      accessorKey: 'region',
      header: 'Region',
      cell: (info) => info.getValue() as string,
      size: 120,
      minSize: 100,
      maxSize: 150,
    },
    {
      id: 'magnitudeCategory',
      accessorKey: 'magnitudeCategory',
      header: 'Category',
      cell: (info) => {
        const category = info.getValue() as string;
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {category}
          </span>
        );
      },
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue() as string;
        const colorClass = status.toLowerCase() === 'reviewed' 
          ? 'bg-green-100 text-green-800'
          : status.toLowerCase() === 'automatic' 
          ? 'bg-blue-100 text-blue-800'
          : 'bg-gray-100 text-gray-800';
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
            {status}
          </span>
        );
      },
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
  ], []);

  // Create table instance
  const table = useReactTable({
    data: data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    debugTable: false,
  });

  const { rows } = table.getRowModel();
  
  // Calculate total table width
  const totalWidth = useMemo(() => {
    return table.getVisibleLeafColumns().reduce((width, column) => width + column.getSize(), 0);
  }, [table]);

  // Virtualization setup with performance optimizations
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50, // Fixed row height for consistent performance
    overscan: 5, // Reduced overscan for better performance
  });

  // Auto-scroll to selected earthquake when selectedEarthquake changes
  React.useEffect(() => {
    if (selectedEarthquake) {
      // Find the index of the selected earthquake in the current filtered and sorted rows
      const rowIndex = rows.findIndex(row => row.original.id === selectedEarthquake.id);
      if (rowIndex !== -1) {
        // Scroll to the row with some options for better UX
        rowVirtualizer.scrollToIndex(rowIndex, {
          align: 'center', // Center the row in the viewport
          behavior: 'smooth' // Smooth scrolling animation
        });
      }
    }
  }, [selectedEarthquake, rows, rowVirtualizer]);

  // Stable callback references that don't cause re-renders
  const handleRowClick = useCallback((rowId: string) => {
    const earthquake = data.find(eq => eq.id === rowId);
    if (earthquake) {
      setSelectedEarthquake(earthquake);
    }
  }, [data, setSelectedEarthquake]);

  const handleRowHover = useCallback((rowId: string | null) => {
    if (rowId) {
      const earthquake = data.find(eq => eq.id === rowId);
      if (earthquake) {
        setHoveredEarthquake(earthquake);
      }
    } else {
      setHoveredEarthquake(null);
    }
  }, [data, setHoveredEarthquake]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Earthquake Data Table</h2>
          <div className="text-sm text-gray-600">
            Showing {rows.length} earthquakes
          </div>
        </div>
        
        {/* Data sync info */}
        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
          <div className="text-green-800 font-medium">
            ✓ Perfect chart-table synchronization • Every row corresponds to a chart point
          </div>
          <div className="text-xs text-green-600 mt-1">
            Data filtered by chart axis coordinate validity to ensure perfect matching
          </div>
        </div>
        
        {/* Performance info */}
        <div className="mt-2 text-xs text-gray-500">
          💡 Bi-directional selection • Chart clicks auto-scroll to table rows • Table clicks update chart selection
        </div>
      </div>

      {/* Table Container */}
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto scrollbar-thin"
        style={{ 
          contain: 'strict',
          willChange: 'transform', // Performance hint for smooth scrolling
        }}
      >
        {/* Table */}
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, minWidth: `${totalWidth}px` }} className="relative">
          {/* Header - separated component that doesn't re-render on row interactions */}
          <TableHeader table={table} />

          {/* Virtual Rows - each row only re-renders when its specific state changes */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<ProcessedEarthquakeData>;
            
            return (
              <VirtualizedRow
                key={row.id}
                virtualRow={virtualRow}
                row={row}
                onRowClick={handleRowClick}
                onRowHover={handleRowHover}
                totalWidth={totalWidth}
              />
            );
          })}
        </div>
        
        {/* Empty state */}
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No earthquake data available
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EarthquakeTable); 
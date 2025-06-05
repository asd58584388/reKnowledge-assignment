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
import { useEarthquakeStore } from '../../stores/earthquakeStore';
import { useEarthquakeContext } from '../../contexts/EarthquakeContext';
import { formatDate, formatNumber } from '../../utils/dataProcessing';

interface EarthquakeTableProps {
  data: ProcessedEarthquakeData[];
  setSelectedEarthquake: (earthquake: ProcessedEarthquakeData) => void;
  setHoveredEarthquake: (earthquake: ProcessedEarthquakeData) => void;
}

// Individual row component with selective Zustand subscriptions to prevent unnecessary re-renders
const VirtualizedRow = React.memo(({ 
  virtualRow, 
  row, 
  onRowClick, 
  onRowHover 
}: {
  virtualRow: VirtualItem;
  row: Row<ProcessedEarthquakeData>;
  onRowClick: (rowId: string) => void;
  onRowHover: (rowId: string | null) => void;
}) => {
  const earthquake = row.original;
  
  // CRITICAL: Use selective subscriptions to only re-render when THIS row's state changes
  const isSelected = useEarthquakeStore(useCallback(
    (state) => state.selectedId === earthquake.id,
    [earthquake.id]
  ));
  
  const isHovered = useEarthquakeStore(useCallback(
    (state) => state.hoveredId === earthquake.id,
    [earthquake.id]
  ));
  
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
      className={`absolute left-0 right-0 flex border-b border-gray-200 ${rowClassName}`}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
        contain: 'layout style paint', // CSS containment for performance
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {row.getVisibleCells().map(cell => (
        <div
          key={cell.id}
          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 flex items-center"
          style={{ 
            width: cell.column.getSize(),
            minWidth: cell.column.columnDef.minSize,
            maxWidth: cell.column.columnDef.maxSize,
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
  return (
    <div className="sticky top-0 z-20 bg-gray-100 border-b border-gray-200">
      {table.getHeaderGroups().map((headerGroup: HeaderGroup<ProcessedEarthquakeData>) => (
        <div key={headerGroup.id} className="flex">
          {headerGroup.headers.map((header: Header<ProcessedEarthquakeData, unknown>) => (
            <div
              key={header.id}
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
              style={{ 
                width: header.getSize(),
                minWidth: header.column.columnDef.minSize,
                maxWidth: header.column.columnDef.maxSize,
              }}
            >
              {header.isPlaceholder ? null : (
                <div
                  {...{
                    className: header.column.getCanSort()
                      ? 'cursor-pointer select-none flex items-center gap-2 hover:text-gray-700'
                      : 'flex items-center gap-2',
                    onClick: header.column.getToggleSortingHandler(),
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted() as string] ?? (
                    header.column.getCanSort() ? ' ⏸️' : ''
                  )}
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

const EarthquakeTable: React.FC<EarthquakeTableProps> = ({ data, setSelectedEarthquake,setHoveredEarthquake }) => {
  const { isEarthquakeVisible, setSelectedId, setHoveredId } = useEarthquakeStore();
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
        const magnitude = info.getValue() as number;
        const colorClass = magnitude >= 5 ? 'text-red-600' 
          : magnitude >= 4 ? 'text-orange-600' 
          : magnitude >= 3 ? 'text-yellow-600' 
          : magnitude >= 2 ? 'text-lime-600' 
          : 'text-green-600';
        
        return (
          <span className={`font-semibold ${colorClass}`}>
            {formatNumber(magnitude, 1)}
          </span>
        );
      },
      size: 80,
      minSize: 70,
      maxSize: 100,
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
      cell: (info) => formatNumber(info.getValue() as number, 1),
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      id: 'latitude',
      accessorKey: 'latitude',
      header: 'Latitude',
      cell: (info) => formatNumber(info.getValue() as number, 3),
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      id: 'longitude',
      accessorKey: 'longitude',
      header: 'Longitude',
      cell: (info) => formatNumber(info.getValue() as number, 3),
      size: 100,
      minSize: 80,
      maxSize: 120,
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

  // Filter data based on current filters - memoized to prevent unnecessary recalculation
  const filteredData = useMemo(() => 
    data.filter(earthquake => isEarthquakeVisible(earthquake)),
    [data, isEarthquakeVisible]
  );

  // Create table instance
  const table = useReactTable({
    data: filteredData,
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

  // Virtualization setup with performance optimizations
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50, // Fixed row height for consistent performance
    overscan: 5, // Reduced overscan for better performance
  });

  // Stable callback references that don't cause re-renders
  const handleRowClick = useCallback((rowId: string) => {
    const earthquake = filteredData.find(eq => eq.id === rowId);
    if (earthquake) {
      setSelectedEarthquake(earthquake);
    }
  }, [filteredData, setSelectedEarthquake]);

  const handleRowHover = useCallback((rowId: string | null) => {
    const earthquake = filteredData.find(eq => eq.id === rowId);
    if (earthquake) {
      setHoveredEarthquake(earthquake);
    }
  }, [filteredData, setHoveredEarthquake]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Earthquake Data (Selective Subscriptions)</h2>
          <div className="text-sm text-gray-600">
            Showing {rows.length} earthquakes
            {filteredData.length !== data.length && (
              <span className="text-blue-600 ml-2">
                (filtered from {data.length})
              </span>
            )}
          </div>
        </div>
        
        {/* Performance info */}
        <div className="mt-2 text-xs text-gray-500">
          💡 Selective Zustand subscriptions • Only affected rows re-render • Zero unnecessary updates
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
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }} className="relative">
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
              />
            );
          })}
        </div>
        
        {/* Empty state */}
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No earthquakes match the current filters
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EarthquakeTable); 
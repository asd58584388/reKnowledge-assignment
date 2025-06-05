import React, { useState, useMemo, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ProcessedEarthquakeData } from "../../types/earthquake";
import { getNumericColumns, formatNumber } from "../../utils/dataProcessing";

interface EarthquakeChartProps {
  data: ProcessedEarthquakeData[];
  onAxesChange: (axes: { xAxis: keyof ProcessedEarthquakeData; yAxis: keyof ProcessedEarthquakeData }) => void;
  setSelectedEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
  setHoveredEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
}

interface ChartDataPoint {
  id: string;
  x: number;
  y: number;
  magnitude: number;
  place: string;
  isCluster?: boolean;
  clusterSize?: number;
  earthquakeIds?: string[];
}

interface ZoomState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

// Downsampling algorithm using spatial clustering
const downsampleData = (
  points: ChartDataPoint[], 
  maxPoints: number,
  zoomState?: ZoomState
): ChartDataPoint[] => {
  if (points.length <= maxPoints) {
    return points;
  }

  // If zoomed, only process points in the zoom area
  let filteredPoints = points;
  if (zoomState) {
    filteredPoints = points.filter(point => 
      point.x >= zoomState.xMin && point.x <= zoomState.xMax &&
      point.y >= zoomState.yMin && point.y <= zoomState.yMax
    );
    
    // If zoomed area has few points, show all
    if (filteredPoints.length <= maxPoints) {
      return filteredPoints;
    }
  }

  // Calculate grid size for clustering
  const xRange = Math.max(...filteredPoints.map(p => p.x)) - Math.min(...filteredPoints.map(p => p.x));
  const yRange = Math.max(...filteredPoints.map(p => p.y)) - Math.min(...filteredPoints.map(p => p.y));
  
  const gridSize = Math.sqrt((xRange * yRange) / maxPoints);
  const clusters = new Map<string, ChartDataPoint[]>();

  // Group points into spatial clusters
  filteredPoints.forEach(point => {
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(point);
  });

  // Create representative points for each cluster
  const downsampled: ChartDataPoint[] = [];
  
  clusters.forEach(clusterPoints => {
    if (clusterPoints.length === 1) {
      // Single point - keep as is
      downsampled.push(clusterPoints[0]);
    } else {
      // Multiple points - create cluster representative
      const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
      const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
      const maxMag = Math.max(...clusterPoints.map(p => p.magnitude));
      
      downsampled.push({
        id: `cluster_${clusterPoints.map(p => p.id).join('_')}`,
        x: avgX,
        y: avgY,
        magnitude: maxMag,
        place: `${clusterPoints.length} earthquakes in this area`,
        isCluster: true,
        clusterSize: clusterPoints.length,
        earthquakeIds: clusterPoints.map(p => p.id)
      });
    }
  });

  return downsampled;
};

const EarthquakeChart: React.FC<EarthquakeChartProps> = ({ 
  data, 
  onAxesChange,
  setSelectedEarthquake,
  setHoveredEarthquake
}) => {
  const numericColumns = useMemo(() => getNumericColumns(), []);
  const [xAxis, setXAxis] = useState<keyof ProcessedEarthquakeData>("longitude");
  const [yAxis, setYAxis] = useState<keyof ProcessedEarthquakeData>("latitude");
  const [zoomState, setZoomState] = useState<ZoomState | null>(null);

  // Process and downsample data for chart visualization
  const chartData = useMemo(() => {
    // Convert earthquake data to chart points
    const allPoints = data.map((earthquake) => ({
      id: earthquake.id,
      x: earthquake[xAxis] as number,
      y: earthquake[yAxis] as number,
      magnitude: earthquake.mag,
      place: earthquake.place,
    }));

    // Apply downsampling with zoom consideration
    const MAX_POINTS = 200; // Reduced for better performance
    return downsampleData(allPoints, MAX_POINTS, zoomState || undefined);
  }, [data, xAxis, yAxis, zoomState]);

  // Calculate stats for user information
  const dataStats = useMemo(() => {
    const totalClusters = chartData.filter(p => p.isCluster).length;
    const totalPoints = chartData.filter(p => !p.isCluster).length;
    const totalRepresented = chartData.reduce((sum, p) => 
      sum + (p.isCluster ? p.clusterSize! : 1), 0
    );
    
    return {
      totalData: data.length,
      chartPoints: chartData.length,
      clusters: totalClusters,
      individualPoints: totalPoints,
      represented: totalRepresented,
      isDownsampled: totalRepresented < data.length
    };
  }, [data.length, chartData]);

  // Handle axis changes and notify parent
  const handleXAxisChange = useCallback((newXAxis: keyof ProcessedEarthquakeData) => {
    setXAxis(newXAxis);
    setZoomState(null); // Reset zoom when axis changes
    onAxesChange({ xAxis: newXAxis, yAxis });
  }, [yAxis, onAxesChange]);

  const handleYAxisChange = useCallback((newYAxis: keyof ProcessedEarthquakeData) => {
    setYAxis(newYAxis);
    setZoomState(null); // Reset zoom when axis changes
    onAxesChange({ xAxis, yAxis: newYAxis });
  }, [xAxis, onAxesChange]);

  // Reset zoom
  const handleResetZoom = useCallback(() => {
    setZoomState(null);
  }, []);

  const getAxisLabel = useCallback(
    (axis: keyof ProcessedEarthquakeData): string => {
      const column = numericColumns.find((col) => col.key === axis);
      return column?.label || String(axis);
    },
    [numericColumns]
  );

  const CustomTooltip = useCallback(
    ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0].payload as ChartDataPoint;
        return (
          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
            <p className="font-semibold text-blue-700">{dataPoint.place}</p>
            <p className="text-sm text-gray-600">
              Magnitude: {formatNumber(dataPoint.magnitude, 1)}
            </p>
            <p className="text-sm text-gray-600">
              {getAxisLabel(xAxis)}: {formatNumber(dataPoint.x)}
            </p>
            <p className="text-sm text-gray-600">
              {getAxisLabel(yAxis)}: {formatNumber(dataPoint.y)}
            </p>
            {dataPoint.isCluster && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-800 font-medium">
                  📍 Cluster of {dataPoint.clusterSize} earthquakes
                </p>
                <p className="text-xs text-blue-600">
                  Click to zoom in and see individual points
                </p>
              </div>
            )}
            {!dataPoint.isCluster && (
              <p className="text-xs text-gray-400 mt-1">
                Click to select • Hover to highlight
              </p>
            )}
          </div>
        );
      }
      return null;
    },
    [xAxis, yAxis, getAxisLabel]
  );

  const getDotColor = (dataPoint: ChartDataPoint): string => {
    if (dataPoint.isCluster) {
      // Cluster colors based on density
      const size = dataPoint.clusterSize!;
      if (size >= 20) return '#7c3aed'; // purple-600
      if (size >= 10) return '#2563eb'; // blue-600
      if (size >= 5) return '#0891b2'; // cyan-600
      return '#059669'; // emerald-600
    }
    
    // Individual point colors by magnitude
    if (dataPoint.magnitude >= 5) return '#b91c1c'; // red-700
    if (dataPoint.magnitude >= 4) return '#ea580c'; // orange-600
    if (dataPoint.magnitude >= 3) return '#d97706'; // amber-600
    if (dataPoint.magnitude >= 2) return '#84cc16'; // lime-500
    return '#22c55e'; // green-500
  };

  const getDotSize = (dataPoint: ChartDataPoint): number => {
    if (dataPoint.isCluster) {
      // Cluster size based on number of points
      const size = dataPoint.clusterSize!;
      return Math.max(8, Math.min(20, 6 + Math.log(size) * 3));
    }
    
    // Individual point size based on magnitude
    return Math.max(4, Math.min(12, dataPoint.magnitude * 2));
  };

  const handleDotClick = useCallback((dataPoint: ChartDataPoint) => {
    if (dataPoint.isCluster) {
      // Zoom into cluster area
      const margin = 0.1; // 10% margin around cluster
      const allClusterPoints = data.filter(eq => 
        dataPoint.earthquakeIds!.includes(eq.id)
      );
      
      const xValues = allClusterPoints.map(eq => eq[xAxis] as number);
      const yValues = allClusterPoints.map(eq => eq[yAxis] as number);
      
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      
      setZoomState({
        xMin: xMin - xRange * margin,
        xMax: xMax + xRange * margin,
        yMin: yMin - yRange * margin,
        yMax: yMax + yRange * margin
      });
    } else {
      // Select individual earthquake
      const earthquake = data.find(eq => eq.id === dataPoint.id);
      if (earthquake) {
        setSelectedEarthquake(earthquake);
      }
    }
  }, [data, xAxis, yAxis, setSelectedEarthquake]);

  const handleDotHover = useCallback((dataPoint: ChartDataPoint | null) => {
    if (dataPoint && !dataPoint.isCluster) {
      const earthquake = data.find(eq => eq.id === dataPoint.id);
      if (earthquake) {
        setHoveredEarthquake(earthquake);
      }
    } else {
      setHoveredEarthquake(null);
    }
  }, [data, setHoveredEarthquake]);

  const CustomDot = useCallback((props: unknown) => {
    const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartDataPoint };
    const dataPoint = payload as ChartDataPoint;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={getDotSize(dataPoint)}
        fill={getDotColor(dataPoint)}
        opacity={dataPoint.isCluster ? 0.8 : 0.7}
        stroke={dataPoint.isCluster ? "#ffffff" : "none"}
        strokeWidth={dataPoint.isCluster ? 2 : 0}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out'
        }}
        onMouseEnter={() => handleDotHover(dataPoint)}
        onMouseLeave={() => handleDotHover(null)}
        onClick={() => handleDotClick(dataPoint)}
      />
    );
  }, [handleDotClick, handleDotHover]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold mb-3">Earthquake Visualization</h2>
        
        {/* Data stats info */}
        <div className="mb-3 p-2 bg-purple-50 rounded text-sm">
          <div className="flex items-center justify-between">
            <span className="text-purple-800 font-medium">
              📊 Smart Downsampling: {dataStats.chartPoints} points representing {dataStats.represented} earthquakes
            </span>
            {zoomState && (
              <button
                onClick={handleResetZoom}
                className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
              >
                Reset Zoom
              </button>
            )}
          </div>
          {dataStats.isDownsampled && (
            <div className="text-xs text-purple-600 mt-1">
              {dataStats.clusters} clusters • {dataStats.individualPoints} individual points • Click clusters to zoom in
            </div>
          )}
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">X-Axis:</label>
            <select
              value={xAxis}
              onChange={(e) =>
                handleXAxisChange(e.target.value as keyof ProcessedEarthquakeData)
              }
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {numericColumns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Y-Axis:</label>
            <select
              value={yAxis}
              onChange={(e) =>
                handleYAxisChange(e.target.value as keyof ProcessedEarthquakeData)
              }
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {numericColumns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">Individual Points (Magnitude):</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>&lt;2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-lime-500"></div>
              <span>2-3</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-600"></div>
              <span>3-4</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span>4-5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-700"></div>
              <span>5+</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">Clusters (Density):</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-emerald-600 border-2 border-white"></div>
              <span>2-4</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-cyan-600 border-2 border-white"></div>
              <span>5-9</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white"></div>
              <span>10-19</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-purple-600 border-2 border-white"></div>
              <span>20+</span>
            </div>
          </div>
        </div>

        {/* Interaction hints */}
        <div className="mt-2 text-xs text-gray-500">
          💡 Click individual points to select • Click clusters to zoom in • {zoomState ? 'Zoomed view showing detailed data' : 'Downsampled view for performance'}
        </div>
      </div>

      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={getAxisLabel(xAxis)}
              domain={zoomState ? [zoomState.xMin, zoomState.xMax] : ['dataMin', 'dataMax']}
              tickFormatter={(value) => Math.round(value).toString()}
              label={{
                value: getAxisLabel(xAxis),
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={getAxisLabel(yAxis)}
              domain={zoomState ? [zoomState.yMin, zoomState.yMax] : ['dataMin', 'dataMax']}
              tickFormatter={(value) => Math.round(value).toString()}
              label={{
                value: getAxisLabel(yAxis),
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={chartData} shape={CustomDot} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(EarthquakeChart);

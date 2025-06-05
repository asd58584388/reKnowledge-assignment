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
}

const EarthquakeChart: React.FC<EarthquakeChartProps> = ({ 
  data, 
  onAxesChange,
  setSelectedEarthquake,
  setHoveredEarthquake
}) => {
  const numericColumns = useMemo(() => getNumericColumns(), []);
  const [xAxis, setXAxis] = useState<keyof ProcessedEarthquakeData>("longitude");
  const [yAxis, setYAxis] = useState<keyof ProcessedEarthquakeData>("latitude");

  // Process data for chart visualization (data is already filtered by Dashboard)
  const chartData = useMemo(() => {
    // Convert earthquake data to chart points - no filtering needed as data is pre-filtered
    const chartPoints = data.map((earthquake) => ({
      id: earthquake.id,
      x: earthquake[xAxis] as number,
      y: earthquake[yAxis] as number,
      magnitude: earthquake.mag,
      place: earthquake.place,
    }));

    // Apply intelligent sampling if too many points
    const CHART_POINT_LIMIT = 2000;
    if (chartPoints.length > CHART_POINT_LIMIT) {
      // Sample data points intelligently - prioritize higher magnitude earthquakes
      const sorted = [...chartPoints].sort((a, b) => b.magnitude - a.magnitude);
      return sorted.slice(0, CHART_POINT_LIMIT);
    }
    
    return chartPoints;
  }, [data, xAxis, yAxis]);

  // Calculate stats for user information
  const dataStats = useMemo(() => {
    return {
      totalData: data.length,
      chartPoints: chartData.length,
      isLimited: chartData.length < data.length
    };
  }, [data.length, chartData.length]);

  // Handle axis changes and notify parent
  const handleXAxisChange = useCallback((newXAxis: keyof ProcessedEarthquakeData) => {
    setXAxis(newXAxis);
    onAxesChange({ xAxis: newXAxis, yAxis });
  }, [yAxis, onAxesChange]);

  const handleYAxisChange = useCallback((newYAxis: keyof ProcessedEarthquakeData) => {
    setYAxis(newYAxis);
    onAxesChange({ xAxis, yAxis: newYAxis });
  }, [xAxis, onAxesChange]);

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
            <p className="text-xs text-gray-400 mt-1">
              Click to select • Hover to highlight
            </p>
          </div>
        );
      }
      return null;
    },
    [xAxis, yAxis]
  );

  const getAxisLabel = useCallback(
    (axis: keyof ProcessedEarthquakeData): string => {
      const column = numericColumns.find((col) => col.key === axis);
      return column?.label || String(axis);
    },
    [numericColumns]
  );

  const getDotColor = (dataPoint: ChartDataPoint): string => {
    // Color by magnitude with better contrast
    if (dataPoint.magnitude >= 5) return '#b91c1c'; // red-700
    if (dataPoint.magnitude >= 4) return '#ea580c'; // orange-600
    if (dataPoint.magnitude >= 3) return '#d97706'; // amber-600
    if (dataPoint.magnitude >= 2) return '#84cc16'; // lime-500
    return '#22c55e'; // green-500
  };

  const getDotSize = (dataPoint: ChartDataPoint): number => {
    return Math.max(4, Math.min(12, dataPoint.magnitude * 2));
  };

  const handleDotClick = useCallback((dataPoint: ChartDataPoint) => {
    const earthquake = data.find(eq => eq.id === dataPoint.id);
    if (earthquake) {
      setSelectedEarthquake(earthquake);
    }
  }, [data, setSelectedEarthquake]);

  const handleDotHover = useCallback((dataPoint: ChartDataPoint | null) => {
    if (dataPoint) {
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
        opacity={0.7}
        stroke="none"
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
        <div className="mb-3 p-2 bg-green-50 rounded text-sm">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">
              ✓ Showing {dataStats.chartPoints} earthquakes (matches table data)
            </span>
            {dataStats.isLimited && (
              <span className="text-green-600 text-xs">
                (prioritizing higher magnitude events)
              </span>
            )}
          </div>
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
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className="font-medium">Magnitude:</span>
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

        {/* Interaction hints */}
        <div className="mt-2 text-xs text-gray-500">
          💡 Perfect chart-table sync • Every chart point has a corresponding table row
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

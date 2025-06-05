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
import { useEarthquakeStore } from "../../stores/earthquakeStore";
import { getNumericColumns, formatNumber } from "../../utils/dataProcessing";

interface EarthquakeChartProps {
  data: ProcessedEarthquakeData[];
  setSelectedEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
  setHoveredEarthquake: (earthquake: ProcessedEarthquakeData | null) => void;
}

interface ChartDataPoint {
  id: string;
  x: number;
  y: number;
  magnitude: number;
  place: string;
  isSelected: boolean;
  isHovered: boolean;
}

const EarthquakeChart: React.FC<EarthquakeChartProps> = ({ 
  data, 
  setSelectedEarthquake,
  setHoveredEarthquake
}) => {
  // const {
  //   selectedId,
  //   hoveredId,
  //   setSelectedId,
  //   setHoveredId,
  // } = useEarthquakeStore();

  const numericColumns = useMemo(() => getNumericColumns(), []);
  const [xAxis, setXAxis] =
    useState<keyof ProcessedEarthquakeData>("longitude");
  const [yAxis, setYAxis] = useState<keyof ProcessedEarthquakeData>("latitude");

  // Simple filtered data without complex caching
  const chartData = useMemo(() => {
    return data
      
      .map((earthquake) => ({
        id: earthquake.id,
        x: earthquake[xAxis] as number,
        y: earthquake[yAxis] as number,
        magnitude: earthquake.mag,
        place: earthquake.place,
        // isSelected: selectedId === earthquake.id,
        // isHovered: hoveredId === earthquake.id,
      }))
      .filter(
        (point) =>
          point.x !== null &&
          point.y !== null &&
          !isNaN(point.x) &&
          !isNaN(point.y)
      )
      .slice(0, 1000); // Limit for performance
  }, [data, xAxis, yAxis]);

  const CustomTooltip = useCallback(
    ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
      console.log("active",active)
      console.log("payload",payload)
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
    if (dataPoint.isSelected) return '#dc2626'; // red-600 - strong selection color
    if (dataPoint.isHovered) return '#f59e0b'; // amber-500 - hover color

    // Color by magnitude with better contrast
    if (dataPoint.magnitude >= 5) return '#b91c1c'; // red-700
    if (dataPoint.magnitude >= 4) return '#ea580c'; // orange-600
    if (dataPoint.magnitude >= 3) return '#d97706'; // amber-600
    if (dataPoint.magnitude >= 2) return '#84cc16'; // lime-500
    return '#22c55e'; // green-500
  };

  const getDotSize = (dataPoint: ChartDataPoint): number => {
    const baseSize = Math.max(4, Math.min(12, dataPoint.magnitude * 2));

    if (dataPoint.isSelected) return baseSize * 2.5; // Much larger for selection
    if (dataPoint.isHovered) return baseSize * 1.8; // Larger for hover
    return baseSize;
  };

  const getDotOpacity = (dataPoint: ChartDataPoint): number => {
    if (dataPoint.isSelected) return 1.0;
    if (dataPoint.isHovered) return 0.9;
    return 0.7;
  };

  const handleDotClick = (dataPoint: ChartDataPoint) => {
    const earthquake = data.find(eq => eq.id === dataPoint.id);
    if (earthquake) {

      setSelectedEarthquake(earthquake);
    }
  };

  // const handleDotHover = useCallback((dataPoint: ChartDataPoint | null) => {
  //   setHoveredId(dataPoint?.id || null);
  // }, [setHoveredId]);

  const CustomDot = (props: unknown) => {
    const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartDataPoint };
    const dataPoint = payload as ChartDataPoint;
    console.log("props",props)

    return (
      <g>
        {/* Outer ring for selected state */}
        {dataPoint.isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={getDotSize(dataPoint) + 3}
            fill="none"
            stroke="#1e40af"
            strokeWidth={2}
            opacity={0.6}
          />
        )}

        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={getDotSize(dataPoint)}
          fill={getDotColor(dataPoint)}
          opacity={getDotOpacity(dataPoint)}
          stroke={dataPoint.isSelected ? '#1e40af' : dataPoint.isHovered ? '#f59e0b' : 'none'}
          strokeWidth={dataPoint.isSelected || dataPoint.isHovered ? 2 : 0}
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={() => handleDotHover(dataPoint)}
          onMouseLeave={() => handleDotHover(null)}
          onClick={() => handleDotClick(dataPoint)}
        />

        {/* Pulse animation for selected state */}
        {dataPoint.isSelected && (
          <circle
            cx={cx+5}
            cy={cy+5}
            r={getDotSize(dataPoint)}
            fill={getDotColor(dataPoint)}
            opacity={0.3}
          >
            <animate
              attributeName="r"
              values={`${getDotSize(dataPoint)};${getDotSize(dataPoint) + 5};${getDotSize(dataPoint)}`}
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>
    );
  };


  const handletest = (event: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
    console.log("event",event)
  }
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold mb-3">Earthquake Visualization</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">X-Axis:</label>
            <select
              value={xAxis}
              onChange={(e) =>
                setXAxis(e.target.value as keyof ProcessedEarthquakeData)
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
                setYAxis(e.target.value as keyof ProcessedEarthquakeData)
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
          💡 Click chart points or table rows for bi-directional selection •
          Hover for preview
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

            <Scatter data={chartData} shape={CustomDot} onClick={handletest} isAnimationActive={false}>
              
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(EarthquakeChart);

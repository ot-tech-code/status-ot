import React from 'react';
import { CheckHistoryItem } from '../types';

interface LatencyChartProps {
  history: CheckHistoryItem[];
  height?: number;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ history, height = 40 }) => {
  if (!history || history.length < 2) {
    return (
      <div className="h-10 flex items-center justify-center text-xs text-slate-600 font-mono">
        Collecting latency samples...
      </div>
    );
  }

  const values = history.map(h => h.responseTimeMs || 0);
  const maxVal = Math.max(...values, 100);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const width = 200;
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const latestLatency = values[values.length - 1];

  let strokeColor = '#10b981'; // emerald-500
  let fillColor = 'rgba(16, 185, 129, 0.15)';

  if (latestLatency > 800) {
    strokeColor = '#f59e0b'; // amber-500
    fillColor = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div className="relative group">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${latestLatency}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill={`url(#grad-${latestLatency})`} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};

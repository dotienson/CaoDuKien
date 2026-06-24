import React from 'react';

interface PredictionData {
  method: string;
  pah: number;
  error: number;
  style: {
    lineDash: string;
    markerType: 'circle' | 'square' | 'triangle' | 'star';
  };
}

interface HeightPredictionChartProps {
  data: PredictionData[];
}

export const HeightPredictionChart: React.FC<HeightPredictionChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  const minPah = Math.min(...data.map(d => d.pah - d.error));
  const maxPah = Math.max(...data.map(d => d.pah + d.error));
  const padding = 2; // cm padding
  const xMin = Math.floor(minPah - padding);
  const xMax = Math.ceil(maxPah + padding);

  const width = 800;
  const rowHeight = 40;
  const marginTop = 30;
  const marginBottom = 40;
  const marginLeft = 180;
  const marginRight = 100;
  const height = marginTop + marginBottom + data.length * rowHeight;

  const xScale = (val: number) => marginLeft + ((val - xMin) / (xMax - xMin)) * (width - marginLeft - marginRight);

  // Generate x-axis ticks
  const ticks = [];
  const range = xMax - xMin;
  let interval = 2;
  if (range > 40) interval = 10;
  else if (range > 20) interval = 5;

  const firstTick = Math.ceil(xMin / interval) * interval;

  for (let i = firstTick; i <= xMax; i += interval) {
    ticks.push(i);
  }

  const renderMarker = (x: number, y: number, type: string) => {
    switch (type) {
      case 'circle':
        return <circle cx={x} cy={y} r={5} fill="#000" />;
      case 'square':
        return <rect x={x - 4} y={y - 4} width={8} height={8} fill="#000" />;
      case 'triangle':
        return <polygon points={`${x},${y-5} ${x-5},${y+4} ${x+5},${y+4}`} fill="#000" />;
      case 'star':
        return (
          <polygon 
            points={`${x},${y-6} ${x+1.5},${y-2} ${x+6},${y-2} ${x+2.5},${y+1} ${x+4},${y+6} ${x},${y+3} ${x-4},${y+6} ${x-2.5},${y+1} ${x-6},${y-2} ${x-1.5},${y-2}`} 
            fill="#000" 
          />
        );
      default:
        return <circle cx={x} cy={y} r={5} fill="#000" />;
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 p-4">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: '400px' }}>
        {/* X Axis Line */}
        <line x1={marginLeft} y1={height - marginBottom} x2={width - marginRight} y2={height - marginBottom} stroke="#000" strokeWidth={1} />
        
        {/* X Axis Ticks and Labels */}
        {ticks.map(tick => (
          <g key={tick}>
            <line 
              x1={xScale(tick)} 
              y1={height - marginBottom} 
              x2={xScale(tick)} 
              y2={height - marginBottom + 5} 
              stroke="#000" 
              strokeWidth={1} 
            />
            <text 
              x={xScale(tick)} 
              y={height - marginBottom + 20} 
              textAnchor="middle" 
              fontSize="12" 
              fill="#000"
            >
              {tick}
            </text>
            {/* Grid line */}
            <line 
              x1={xScale(tick)} 
              y1={marginTop} 
              x2={xScale(tick)} 
              y2={height - marginBottom} 
              stroke="#e5e7eb" 
              strokeWidth={1} 
              strokeDasharray="2,2"
            />
          </g>
        ))}

        {/* Data Rows */}
        {data.map((d, i) => {
          const y = marginTop + (i + 0.5) * rowHeight;
          const xCenter = xScale(d.pah);
          const xLeft = xScale(d.pah - d.error);
          const xRight = xScale(d.pah + d.error);

          return (
            <g key={d.method}>
              {/* Method Label */}
              <text x={marginLeft - 15} y={y + 4} textAnchor="end" fontSize="12" fontWeight="bold" fill="#000">
                {d.method}
              </text>

              {/* Error Bar Line */}
              <line 
                x1={xLeft} 
                y1={y} 
                x2={xRight} 
                y2={y} 
                stroke="#000" 
                strokeWidth={1.5} 
                strokeDasharray={d.style.lineDash} 
              />

              {/* Error Bar Caps */}
              <line x1={xLeft} y1={y - 5} x2={xLeft} y2={y + 5} stroke="#000" strokeWidth={1.5} />
              <line x1={xRight} y1={y - 5} x2={xRight} y2={y + 5} stroke="#000" strokeWidth={1.5} />

              {/* Center Marker */}
              {renderMarker(xCenter, y, d.style.markerType)}

              {/* Value Label */}
              <text x={xRight + 10} y={y + 4} fontSize="12" fill="#000">
                {d.pah.toFixed(1)} ± {d.error.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

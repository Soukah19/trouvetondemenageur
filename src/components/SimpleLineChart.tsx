interface DataPoint {
  date?: string;
  label?: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

function SimpleLineChart({
  data,
  height = 200,
  color = '#10b981'
}: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Aucune donnée disponible
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const width = 100;
  const padding = 20;

  const pathD = data.map((point, index) => {
    const x = (index / (data.length - 1 || 1)) * width;
    const y = height - ((point.value - minValue) / range) * (height - padding * 2) - padding;
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <path
          d={areaD}
          fill="url(#areaGradient)"
        />

        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((point, index) => {
          const x = (index / (data.length - 1 || 1)) * width;
          const y = height - ((point.value - minValue) / range) * (height - padding * 2) - padding;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="0.8"
              fill={color}
            />
          );
        })}
      </svg>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        {data.length <= 10 && data.map((point, index) => (
          <div key={index} className="text-center">
            <div className="font-medium">
              {point.label || (point.date ? new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SimpleLineChart;
export { SimpleLineChart };

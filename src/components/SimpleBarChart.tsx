interface DataPoint {
  date?: string;
  label?: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

function SimpleBarChart({
  data,
  height = 200,
  color = '#3b82f6'
}: SimpleBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Aucune donnée disponible
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full gap-1">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${percentage}%`,
                  backgroundColor: item.color || color,
                  minHeight: item.value > 0 ? '2px' : '0px'
                }}
              />
              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

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

export default SimpleBarChart;
export { SimpleBarChart };

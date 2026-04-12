type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'white';
  text?: string;
};

export function LoadingSpinner({ size = 'md', color = 'blue', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    white: 'border-white',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      ></div>
      {text && <p className="text-sm text-gray-600 animate-pulse-subtle">{text}</p>}
    </div>
  );
}

import { Truck } from 'lucide-react';

interface LogoProps {
  variant?: 'blue' | 'green';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ variant = 'blue', size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-base',
      container: 'gap-2'
    },
    md: {
      icon: 'w-8 h-8',
      text: 'text-xl',
      container: 'gap-2'
    },
    lg: {
      icon: 'w-10 h-10',
      text: 'text-2xl',
      container: 'gap-3'
    }
  };

  const colorClasses = {
    blue: {
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-white',
      text: 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent'
    },
    green: {
      iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
      iconColor: 'text-white',
      text: 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent'
    }
  };

  const sizes = sizeClasses[size];
  const colors = colorClasses[variant];

  return (
    <div className={`flex items-center ${sizes.container} ${className}`}>
      <div className={`${colors.iconBg} ${sizes.icon} rounded-lg flex items-center justify-center shadow-lg`}>
        <Truck className={`${colors.iconColor} ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} />
      </div>
      {showText && (
        <h1 className={`${sizes.text} font-bold ${colors.text}`}>
          TrouveTonDemenageur
        </h1>
      )}
    </div>
  );
}

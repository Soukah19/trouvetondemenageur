import { Award, Shield, Zap, TrendingDown, Star } from 'lucide-react';

interface Badge {
  badge_type: string;
  earned_at: string;
  expires_at?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig = {
  verified: {
    icon: Shield,
    label: 'Vérifié',
    color: 'text-blue-600 bg-blue-50',
    description: 'Entreprise vérifiée avec documents validés'
  },
  top_rated: {
    icon: Star,
    label: 'Top Déménageur',
    color: 'text-yellow-600 bg-yellow-50',
    description: 'Note moyenne supérieure à 4.5/5'
  },
  responsive: {
    icon: Zap,
    label: 'Réactif',
    color: 'text-green-600 bg-green-50',
    description: 'Répond en moins de 2 heures'
  },
  best_price: {
    icon: TrendingDown,
    label: 'Meilleur Prix',
    color: 'text-purple-600 bg-purple-50',
    description: 'Offre les meilleurs tarifs du marché'
  },
  experienced: {
    icon: Award,
    label: 'Expérimenté',
    color: 'text-orange-600 bg-orange-50',
    description: 'Plus de 100 déménagements réalisés'
  }
};

export default function BadgeDisplay({ badges, size = 'md' }: BadgeDisplayProps) {
  if (badges.length === 0) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => {
        const config = badgeConfig[badge.badge_type as keyof typeof badgeConfig];
        if (!config) return null;

        const Icon = config.icon;
        const isExpired = badge.expires_at && new Date(badge.expires_at) < new Date();

        if (isExpired) return null;

        return (
          <div
            key={index}
            className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.color}`}
            title={config.description}
          >
            <Icon size={iconSizes[size]} />
            <span>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { calculateEstimatedPrice } from '../utils/priceValidation';
import { QuoteRequest } from '../lib/supabase';

type SmartPriceCalculatorProps = {
  request: QuoteRequest;
};

export function SmartPriceCalculator({ request }: SmartPriceCalculatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const estimate = calculateEstimatedPrice(request);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Estimation Intelligente</h3>
            <p className="text-sm text-gray-600">Basée sur vos critères</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? 'Masquer' : 'Détails'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
            <TrendingDown className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{estimate.min}€</p>
          <p className="text-xs text-gray-600 mt-1">Prix Min</p>
        </div>

        <div className="bg-blue-600 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-1 text-white mb-1">
            <Calculator className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-white">{estimate.recommended}€</p>
          <p className="text-xs text-blue-100 mt-1">Prix Conseillé</p>
        </div>

        <div className="bg-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{estimate.max}€</p>
          <p className="text-xs text-gray-600 mt-1">Prix Max</p>
        </div>
      </div>

      {showDetails && (
        <div className="bg-white rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">Détail du calcul</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type de logement:</span>
              <span className="font-medium">{request.home_size} - {request.home_type}</span>
            </div>

            {request.volume_m3 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium">{request.volume_m3} m³</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Étage départ:</span>
              <span className="font-medium">
                {request.floor_from} {request.elevator_from ? '(Ascenseur)' : '(Sans ascenseur)'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Étage arrivée:</span>
              <span className="font-medium">
                {request.floor_to} {request.elevator_to ? '(Ascenseur)' : '(Sans ascenseur)'}
              </span>
            </div>

            {request.services_needed.length > 0 && (
              <div>
                <span className="text-gray-600">Services supplémentaires:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.services_needed.map((service, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="bg-blue-50 rounded p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">💡 Comment utiliser cette estimation ?</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Prix incluant les frais de service</li>
                <li>Les prix en dessous du minimum peuvent indiquer des frais cachés</li>
                <li>Le prix conseillé est basé sur les tarifs du marché réel</li>
                <li>Les prix au-dessus du maximum peuvent être négociables</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

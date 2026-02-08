import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Search } from 'lucide-react';

type GeographicArea = {
  id: string;
  department: string;
  departmentCode: string;
  region: string;
  type: 'city' | 'region';
  displayText: string;
};

type GeographicAreaSelectorProps = {
  selectedAreas: GeographicArea[];
  onChange: (areas: GeographicArea[]) => void;
};

const FRENCH_REGIONS = [
  { name: 'Île-de-France', departments: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { name: 'Hauts-de-France', departments: ['02', '59', '60', '62', '80'] },
  { name: 'Normandie', departments: ['14', '27', '50', '61', '76'] },
  { name: 'Grand Est', departments: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'] },
  { name: 'Bretagne', departments: ['22', '29', '35', '56'] },
  { name: 'Pays de la Loire', departments: ['44', '49', '53', '72', '85'] },
  { name: 'Centre-Val de Loire', departments: ['18', '28', '36', '37', '41', '45'] },
  { name: 'Bourgogne-Franche-Comté', departments: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { name: 'Nouvelle-Aquitaine', departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { name: 'Occitanie', departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
  { name: 'Auvergne-Rhône-Alpes', departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { name: 'Provence-Alpes-Côte d\'Azur', departments: ['04', '05', '06', '13', '83', '84'] },
  { name: 'Corse', departments: ['2A', '2B'] }
];

const MAJOR_CITIES = [
  { name: 'Paris', department: 'Paris', code: '75', region: 'Île-de-France' },
  { name: 'Marseille', department: 'Bouches-du-Rhône', code: '13', region: 'Provence-Alpes-Côte d\'Azur' },
  { name: 'Lyon', department: 'Rhône', code: '69', region: 'Auvergne-Rhône-Alpes' },
  { name: 'Toulouse', department: 'Haute-Garonne', code: '31', region: 'Occitanie' },
  { name: 'Nice', department: 'Alpes-Maritimes', code: '06', region: 'Provence-Alpes-Côte d\'Azur' },
  { name: 'Nantes', department: 'Loire-Atlantique', code: '44', region: 'Pays de la Loire' },
  { name: 'Strasbourg', department: 'Bas-Rhin', code: '67', region: 'Grand Est' },
  { name: 'Montpellier', department: 'Hérault', code: '34', region: 'Occitanie' },
  { name: 'Bordeaux', department: 'Gironde', code: '33', region: 'Nouvelle-Aquitaine' },
  { name: 'Lille', department: 'Nord', code: '59', region: 'Hauts-de-France' },
  { name: 'Rennes', department: 'Ille-et-Vilaine', code: '35', region: 'Bretagne' },
  { name: 'Reims', department: 'Marne', code: '51', region: 'Grand Est' },
  { name: 'Le Havre', department: 'Seine-Maritime', code: '76', region: 'Normandie' },
  { name: 'Rouen', department: 'Seine-Maritime', code: '76', region: 'Normandie' },
  { name: 'Saint-Étienne', department: 'Loire', code: '42', region: 'Auvergne-Rhône-Alpes' },
  { name: 'Toulon', department: 'Var', code: '83', region: 'Provence-Alpes-Côte d\'Azur' },
  { name: 'Grenoble', department: 'Isère', code: '38', region: 'Auvergne-Rhône-Alpes' },
  { name: 'Dijon', department: 'Côte-d\'Or', code: '21', region: 'Bourgogne-Franche-Comté' },
  { name: 'Angers', department: 'Maine-et-Loire', code: '49', region: 'Pays de la Loire' },
  { name: 'Nîmes', department: 'Gard', code: '30', region: 'Occitanie' },
  { name: 'Villeurbanne', department: 'Rhône', code: '69', region: 'Auvergne-Rhône-Alpes' },
  { name: 'Le Mans', department: 'Sarthe', code: '72', region: 'Pays de la Loire' },
  { name: 'Aix-en-Provence', department: 'Bouches-du-Rhône', code: '13', region: 'Provence-Alpes-Côte d\'Azur' },
  { name: 'Clermont-Ferrand', department: 'Puy-de-Dôme', code: '63', region: 'Auvergne-Rhône-Alpes' },
  { name: 'Brest', department: 'Finistère', code: '29', region: 'Bretagne' },
  { name: 'Limoges', department: 'Haute-Vienne', code: '87', region: 'Nouvelle-Aquitaine' },
  { name: 'Tours', department: 'Indre-et-Loire', code: '37', region: 'Centre-Val de Loire' },
  { name: 'Amiens', department: 'Somme', code: '80', region: 'Hauts-de-France' },
  { name: 'Perpignan', department: 'Pyrénées-Orientales', code: '66', region: 'Occitanie' },
  { name: 'Metz', department: 'Moselle', code: '57', region: 'Grand Est' },
  { name: 'Besançon', department: 'Doubs', code: '25', region: 'Bourgogne-Franche-Comté' },
  { name: 'Orléans', department: 'Loiret', code: '45', region: 'Centre-Val de Loire' },
  { name: 'Mulhouse', department: 'Haut-Rhin', code: '68', region: 'Grand Est' },
  { name: 'Caen', department: 'Calvados', code: '14', region: 'Normandie' },
  { name: 'Nancy', department: 'Meurthe-et-Moselle', code: '54', region: 'Grand Est' }
];

export function GeographicAreaSelector({ selectedAreas, onChange }: GeographicAreaSelectorProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GeographicArea[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const search = searchInput.toLowerCase().trim();
    const results: GeographicArea[] = [];

    MAJOR_CITIES.forEach(city => {
      if (city.name.toLowerCase().includes(search)) {
        results.push({
          id: `city-${city.code}-${city.name}`,
          department: city.department,
          departmentCode: city.code,
          region: city.region,
          type: 'city',
          displayText: `${city.name} - ${city.code} ${city.region}`
        });
      }
    });

    FRENCH_REGIONS.forEach(region => {
      if (region.name.toLowerCase().includes(search)) {
        results.push({
          id: `region-${region.name}`,
          department: '',
          departmentCode: '',
          region: region.name,
          type: 'region',
          displayText: `${region.name} (toute la région)`
        });
      }
    });

    setSuggestions(results.slice(0, 10));
    setShowSuggestions(true);
  }, [searchInput]);

  const addArea = (area: GeographicArea) => {
    if (!selectedAreas.find(a => a.id === area.id)) {
      onChange([...selectedAreas, area]);
    }
    setSearchInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeArea = (areaId: string) => {
    onChange(selectedAreas.filter(a => a.id !== areaId));
  };

  const addWholeRegion = (regionName: string) => {
    const region = FRENCH_REGIONS.find(r => r.name === regionName);
    if (!region) return;

    const regionArea: GeographicArea = {
      id: `region-${regionName}`,
      department: '',
      departmentCode: '',
      region: regionName,
      type: 'region',
      displayText: `${regionName} (toute la région)`
    };

    addArea(regionArea);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zones géographiques couvertes *
        </label>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
            placeholder="Recherchez une ville ou une région..."
            className="w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-20 w-full mt-1 bg-white border-2 border-green-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => addArea(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-green-50 transition flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.displayText}
                  </div>
                  {suggestion.type === 'city' && (
                    <div className="text-xs text-gray-500">
                      Département {suggestion.departmentCode}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélection rapide par région
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FRENCH_REGIONS.map((region) => (
            <button
              key={region.name}
              type="button"
              onClick={() => addWholeRegion(region.name)}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-lg transition border border-gray-300 hover:border-green-400"
            >
              {region.name}
            </button>
          ))}
        </div>
      </div>

      {selectedAreas.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zones sélectionnées ({selectedAreas.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((area) => (
              <div
                key={area.id}
                className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{area.displayText}</span>
                <button
                  type="button"
                  onClick={() => removeArea(area.id)}
                  className="hover:bg-green-200 rounded-full p-0.5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAreas.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Recherchez et sélectionnez les zones où vous proposez vos services
        </p>
      )}
    </div>
  );
}

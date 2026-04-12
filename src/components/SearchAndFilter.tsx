import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export interface FilterOptions {
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sortBy: 'date' | 'price_low' | 'price_high' | 'rating';
  fromCity: string;
  toCity: string;
  movingDate: string;
}

interface SearchAndFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  showPriceFilter?: boolean;
  showRatingFilter?: boolean;
  showLocationFilter?: boolean;
  showDateFilter?: boolean;
}

export function SearchAndFilter({
  onFilterChange,
  showPriceFilter = true,
  showRatingFilter = false,
  showLocationFilter = true,
  showDateFilter = true,
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    sortBy: 'date',
    fromCity: '',
    toCity: '',
    movingDate: '',
  });

  function updateFilter(key: keyof FilterOptions, value: any) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }

  function resetFilters() {
    const defaultFilters: FilterOptions = {
      searchQuery: '',
      minPrice: 0,
      maxPrice: 10000,
      minRating: 0,
      sortBy: 'date',
      fromCity: '',
      toCity: '',
      movingDate: '',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.minPrice > 0 ||
    filters.maxPrice < 10000 ||
    filters.minRating > 0 ||
    filters.fromCity ||
    filters.toCity ||
    filters.movingDate;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as FilterOptions['sortBy'])}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Plus récent</option>
            {showPriceFilter && <option value="price_low">Prix croissant</option>}
            {showPriceFilter && <option value="price_high">Prix décroissant</option>}
            {showRatingFilter && <option value="rating">Meilleure note</option>}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              hasActiveFilters
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-gray-600 hover:text-red-600 p-2 hover:bg-gray-100 rounded-lg transition"
              title="Réinitialiser les filtres"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showLocationFilter && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville de départ
                </label>
                <input
                  type="text"
                  placeholder="Ex: Paris"
                  value={filters.fromCity}
                  onChange={(e) => updateFilter('fromCity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville d'arrivée
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lyon"
                  value={filters.toCity}
                  onChange={(e) => updateFilter('toCity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {showDateFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de déménagement
              </label>
              <input
                type="date"
                value={filters.movingDate}
                onChange={(e) => updateFilter('movingDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {showPriceFilter && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix minimum (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix maximum (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {showRatingFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note minimum
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0">Toutes les notes</option>
                <option value="3">3+ étoiles</option>
                <option value="4">4+ étoiles</option>
                <option value="4.5">4.5+ étoiles</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
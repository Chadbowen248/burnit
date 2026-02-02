// src/components/FoodSearch.tsx
import { useState, useEffect, useCallback } from "react";
import { searchFoods, SearchResult } from "./services/usdaApi";
import { Food } from "./types";

interface FoodSearchProps {
  onAddFood: (food: Food) => void;
  onSaveToFavorites: (food: Food) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onAddFood, onSaveToFavorites }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchFoods(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleAddFood = (result: SearchResult) => {
    const food: Food = {
      id: result.fdcId,
      name: result.brand 
        ? `${result.name} (${result.brand})`
        : result.name,
      calories: result.calories,
      protein: result.protein,
    };
    onAddFood(food);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleSaveToFavorites = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const food: Food = {
      id: Date.now(), // New ID for favorites
      name: result.brand 
        ? `${result.name} (${result.brand})`
        : result.name,
      calories: result.calories,
      protein: result.protein,
    };
    onSaveToFavorites(food);
  };

  return (
    <div className="food-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search foods (e.g. chicken breast)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && <span className="search-spinner">⏳</span>}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div
              key={result.fdcId}
              className="search-result-item"
              onClick={() => handleAddFood(result)}
            >
              <div className="result-info">
                <span className="result-name">
                  {result.name}
                  {result.brand && (
                    <span className="result-brand"> ({result.brand})</span>
                  )}
                </span>
                <span className="result-macros">
                  {result.calories} cal, {result.protein}g protein
                  {result.servingSize && (
                    <span className="result-serving"> per {result.servingSize}</span>
                  )}
                </span>
              </div>
              <button
                className="save-favorite-btn"
                onClick={(e) => handleSaveToFavorites(result, e)}
                title="Save to favorites"
              >
                ★
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="search-results">
          <div className="no-results">No results found</div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="search-backdrop" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default FoodSearch;

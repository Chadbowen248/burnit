// src/components/TrackerApp.tsx
import { useState, useEffect, useCallback } from "react";
import DayNavigation from "./DayNavigation";
import FoodAdder from "./FoodAdder";
import FoodList from "./FoodList";
import TotalsDisplay from "./TotalsDisplay";
import GoalsSettings from "./GoalsSettings";
import { Food, Goals, TrackerData, DailySummary } from "./types";
import { goals as defaultGoals } from "./data";
import FoodAPI from "../api/api";

const formatDateForAPI = (date: string): string => {
  // If already in YYYY-MM-DD format, return as-is
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log(`formatDateForAPI: "${date}" already in YYYY-MM-DD format`);
    return date;
  }
  
  // Convert from other date string formats to YYYY-MM-DD format
  const d = new Date(date);
  const formatted = d.toISOString().split('T')[0];
  console.log(`formatDateForAPI: "${date}" -> "${formatted}"`);
  return formatted;
};

const TrackerApp: React.FC = () => {
  // Clear any old localStorage data on app start
  useEffect(() => {
    // Remove old localStorage keys that might interfere
    localStorage.removeItem('trackerData');
    localStorage.removeItem('userFavorites'); 
    localStorage.removeItem('userGoals');
    localStorage.removeItem('useAPI');
    console.log('Cleared old localStorage data for clean API-only operation');
  }, []);

  const [trackerData, setTrackerData] = useState<TrackerData>({});
  const [userFavorites, setUserFavorites] = useState<Food[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [currentDate] = useState<string>(() => {
    // Use consistent YYYY-MM-DD format everywhere instead of locale-dependent toLocaleDateString()
    const today = new Date().toISOString().split('T')[0];
    console.log('Current date (fixed YYYY-MM-DD format):', today);
    return today;
  });
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [showGoalsSettings, setShowGoalsSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // New: Track initial data load
  const [error, setError] = useState<string | null>(null);

  // Load data for a specific date
  const loadDateData = useCallback(async (date: string) => {
    try {
      setError(null);
      const apiDate = formatDateForAPI(date);
      
      // Load foods for the date
      console.log('Loading foods for date:', apiDate);
      const foods = await FoodAPI.getFoods(apiDate);
      console.log('Loaded foods from API:', foods);
      
      // Calculate totals
      const totals = foods.reduce(
        (acc, food) => ({
          calories: acc.calories + (food.calories || 0),
          protein: acc.protein + (food.protein || 0),
          carbs: (acc.carbs || 0) + (food.carbs || 0),
          fat: (acc.fat || 0) + (food.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setTrackerData(prev => ({
        ...prev,
        [date]: { foods, totals }
      }));

    } catch (err: any) {
      console.error('Failed to load data for date:', date, err);
      setError(`Failed to load data: ${err.message}. Please check your internet connection.`);
      
      // Set empty data instead of crashing
      setTrackerData(prev => ({
        ...prev,
        [date]: { foods: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } }
      }));
    }
  }, []);

  // Load goals for a date
  const loadGoals = useCallback(async (date: string) => {
    try {
      const apiDate = formatDateForAPI(date);
      const goalsData = await FoodAPI.getGoals(apiDate);
      setGoals(goalsData);
    } catch (err: any) {
      console.error('Failed to load goals:', err);
      // Use default goals on error, but don't show error to user for goals
      setGoals(defaultGoals);
    }
  }, []);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      const favorites = await FoodAPI.getFavorites();
      setUserFavorites(favorites);
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
      setUserFavorites([]);
      // Don't show error for favorites as it's not critical
    }
  }, []);

  // Initialize data on mount and date change
  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      setLoading(true);
      
      try {
        // Load all data in parallel
        await Promise.all([
          loadDateData(selectedDate),
          loadGoals(selectedDate),
          loadFavorites()
        ]);
      } catch (err) {
        console.error('Failed to initialize data:', err);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };

    initializeData();
  }, [selectedDate, loadDateData, loadGoals, loadFavorites]);

  const addFood = async (food: Food) => {
    try {
      setLoading(true);
      setError(null);

      const foodWithDate = {
        ...food,
        date: formatDateForAPI(selectedDate),
        meal_type: food.meal_type || 'snack'
      };

      // Always save to API - no localStorage fallback
      console.log('Saving food to API:', foodWithDate);
      const savedFood = await FoodAPI.addFood(foodWithDate);
      console.log('Food saved successfully:', savedFood);
      
      // Update local state immediately
      setTrackerData(prev => {
        const dayData = prev[selectedDate] || { foods: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
        const newFoods = [...dayData.foods, savedFood];
        console.log('Updated foods list:', newFoods);
        const newTotals = newFoods.reduce(
          (acc, f) => ({
            calories: acc.calories + (f.calories || 0),
            protein: acc.protein + (f.protein || 0),
            carbs: (acc.carbs || 0) + (f.carbs || 0),
            fat: (acc.fat || 0) + (f.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        return { ...prev, [selectedDate]: { foods: newFoods, totals: newTotals } };
      });
    } catch (err: any) {
      console.error('Failed to add food:', err);
      console.error('Error details:', err.response?.data || err.response || err);
      setError(`Failed to add food: ${err.message}. Please check your internet connection and try again. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const editFood = async (index: number, updatedFood: Food) => {
    try {
      setLoading(true);
      setError(null);

      const dayData = trackerData[selectedDate];
      if (!dayData || !updatedFood.id) return;

      // Always update via API
      await FoodAPI.updateFood(updatedFood.id, updatedFood);

      // Update local state
      setTrackerData(prev => {
        const dayData = prev[selectedDate];
        if (!dayData) return prev;

        const newFoods = dayData.foods.map((f, i) =>
          i === index ? { ...updatedFood, instanceId: (f as any).instanceId } : f
        );
        const newTotals = newFoods.reduce(
          (acc, f) => ({
            calories: acc.calories + (f.calories || 0),
            protein: acc.protein + (f.protein || 0),
            carbs: (acc.carbs || 0) + (f.carbs || 0),
            fat: (acc.fat || 0) + (f.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        return { ...prev, [selectedDate]: { foods: newFoods, totals: newTotals } };
      });
    } catch (err: any) {
      console.error('Failed to edit food:', err);
      setError(`Failed to edit food: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteFood = async (index: number) => {
    try {
      setLoading(true);
      setError(null);

      const dayData = trackerData[selectedDate];
      if (!dayData) return;

      const food = dayData.foods[index];
      
      if (food.id) {
        // Always delete from API
        await FoodAPI.deleteFood(food.id);
      }

      // Update local state
      setTrackerData(prev => {
        const dayData = prev[selectedDate];
        if (!dayData) return prev;

        const newFoods = dayData.foods.filter((_, i) => i !== index);
        const newTotals = newFoods.reduce(
          (acc, f) => ({
            calories: acc.calories + (f.calories || 0),
            protein: acc.protein + (f.protein || 0),
            carbs: (acc.carbs || 0) + (f.carbs || 0),
            fat: (acc.fat || 0) + (f.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        return { ...prev, [selectedDate]: { foods: newFoods, totals: newTotals } };
      });
    } catch (err: any) {
      console.error('Failed to delete food:', err);
      setError(`Failed to delete food: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetDay = async () => {
    try {
      setLoading(true);
      setError(null);

      const dayData = trackerData[selectedDate];
      if (!dayData) return;

      // Delete all foods for this date via API
      for (const food of dayData.foods) {
        if (food.id) {
          await FoodAPI.deleteFood(food.id);
        }
      }

      // Update local state
      setTrackerData(prev => ({
        ...prev,
        [selectedDate]: { foods: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
      }));
    } catch (err: any) {
      console.error('Failed to reset day:', err);
      setError(`Failed to reset day: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveToFavorites = async (food: Food) => {
    try {
      const exists = userFavorites.some(
        (f) => f.name.toLowerCase() === food.name.toLowerCase()
      );
      if (exists) return;

      // Always save via API
      const favoriteFood = { ...food, is_favorite: true, date: formatDateForAPI(selectedDate) };
      const saved = await FoodAPI.addFood(favoriteFood);
      setUserFavorites(prev => [...prev, saved]);
    } catch (err: any) {
      console.error('Failed to save favorite:', err);
      setError(`Failed to save favorite: ${err.message}`);
    }
  };

  const removeFavorite = async (foodId: number) => {
    try {
      // Always delete via API
      await FoodAPI.deleteFood(foodId);
      setUserFavorites(prev => prev.filter(f => f.id !== foodId));
    } catch (err: any) {
      console.error('Failed to remove favorite:', err);
      setError(`Failed to remove favorite: ${err.message}`);
    }
  };

  const updateGoals = async (newGoals: Goals) => {
    try {
      setLoading(true);
      setError(null);

      const goalsWithDate = { ...newGoals, date: formatDateForAPI(selectedDate) };

      // Always save via API - no localStorage fallback
      await FoodAPI.setGoals(goalsWithDate);
      setGoals(newGoals);
    } catch (err: any) {
      console.error('Failed to update goals:', err);
      setError(`Failed to update goals: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen until initial data is loaded
  if (initialLoading) {
    return (
      <div className="container">
        <h1>Unfuck Yourself</h1>
        <div style={{ 
          background: '#e3f2fd', 
          color: '#1565c0', 
          padding: '20px', 
          borderRadius: '4px', 
          textAlign: 'center',
          fontSize: '16px' 
        }}>
          Loading your data...
        </div>
      </div>
    );
  }

  const dayData = trackerData[selectedDate] || {
    foods: [],
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };

  return (
    <div className="container">
      <h1>Unfuck Yourself</h1>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '10px',
          fontSize: '14px' 
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {loading && !initialLoading && (
        <div style={{ 
          background: '#e3f2fd', 
          color: '#1565c0', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '10px',
          fontSize: '14px' 
        }}>
          Saving...
        </div>
      )}

      <DayNavigation
        currentDate={currentDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        trackerData={trackerData}
        setTrackerData={setTrackerData}
      />
      
      <FoodAdder
        addFood={addFood}
        userFavorites={userFavorites}
        onSaveToFavorites={saveToFavorites}
        onRemoveFavorite={removeFavorite}
      />
      
      <FoodList
        foods={dayData.foods}
        onDelete={deleteFood}
        onEdit={editFood}
      />
      
      <TotalsDisplay
        totals={dayData.totals}
        goals={goals}
        onReset={resetDay}
        onEditGoals={() => setShowGoalsSettings(true)}
      />

      {showGoalsSettings && (
        <GoalsSettings
          goals={goals}
          onSave={(newGoals) => {
            updateGoals(newGoals);
            setShowGoalsSettings(false);
          }}
          onClose={() => setShowGoalsSettings(false)}
        />
      )}
    </div>
  );
};

export default TrackerApp;
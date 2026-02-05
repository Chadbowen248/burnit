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

// Fallback to localStorage for development/offline mode
const TRACKER_DATA_KEY = "trackerData";
const USER_FAVORITES_KEY = "userFavorites";
const USER_GOALS_KEY = "userGoals";
const USE_API_KEY = "useAPI";

const formatDateForAPI = (date: string): string => {
  // Convert from locale date string to YYYY-MM-DD format
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const TrackerApp: React.FC = () => {
  const [trackerData, setTrackerData] = useState<TrackerData>({});
  const [userFavorites, setUserFavorites] = useState<Food[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [currentDate] = useState<string>(new Date().toLocaleDateString());
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [showGoalsSettings, setShowGoalsSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useAPI, setUseAPI] = useState(true); // Try API first, fall back to localStorage
  const [error, setError] = useState<string | null>(null);

  // Load data for a specific date
  const loadDateData = useCallback(async (date: string) => {
    if (!useAPI) {
      // Fallback to localStorage
      const savedData = localStorage.getItem(TRACKER_DATA_KEY);
      const data = savedData ? JSON.parse(savedData) : {};
      setTrackerData(prev => ({ ...prev, [date]: data[date] || { foods: [], totals: { calories: 0, protein: 0 } } }));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiDate = formatDateForAPI(date);
      
      // Load foods for the date
      const foods = await FoodAPI.getFoods(apiDate);
      
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
      setError(`Failed to load data: ${err.message}`);
      
      // Fall back to localStorage if API fails
      if (useAPI) {
        console.log('Falling back to localStorage...');
        setUseAPI(false);
        localStorage.setItem(USE_API_KEY, 'false');
        loadDateData(date); // Retry with localStorage
      }
    } finally {
      setLoading(false);
    }
  }, [useAPI]);

  // Load goals for a date
  const loadGoals = useCallback(async (date: string) => {
    if (!useAPI) {
      const savedGoals = localStorage.getItem(USER_GOALS_KEY);
      setGoals(savedGoals ? JSON.parse(savedGoals) : defaultGoals);
      return;
    }

    try {
      const apiDate = formatDateForAPI(date);
      const goalsData = await FoodAPI.getGoals(apiDate);
      setGoals(goalsData);
    } catch (err: any) {
      console.error('Failed to load goals:', err);
      // Use default goals on error
      setGoals(defaultGoals);
    }
  }, [useAPI]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!useAPI) {
      const savedFavorites = localStorage.getItem(USER_FAVORITES_KEY);
      setUserFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
      return;
    }

    try {
      const favorites = await FoodAPI.getFavorites();
      setUserFavorites(favorites);
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
      setUserFavorites([]);
    }
  }, [useAPI]);

  // Initialize data on mount and date change
  useEffect(() => {
    // Check if we should use API
    const savedUseAPI = localStorage.getItem(USE_API_KEY);
    if (savedUseAPI === 'false') {
      setUseAPI(false);
    }
  }, []);

  useEffect(() => {
    loadDateData(selectedDate);
    loadGoals(selectedDate);
  }, [selectedDate, loadDateData, loadGoals]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Persist to localStorage as backup (even when using API)
  useEffect(() => {
    localStorage.setItem(TRACKER_DATA_KEY, JSON.stringify(trackerData));
  }, [trackerData]);

  useEffect(() => {
    localStorage.setItem(USER_FAVORITES_KEY, JSON.stringify(userFavorites));
  }, [userFavorites]);

  const addFood = async (food: Food) => {
    try {
      setLoading(true);
      setError(null);

      const foodWithDate = {
        ...food,
        date: formatDateForAPI(selectedDate),
        meal_type: food.meal_type || 'snack'
      };

      if (useAPI) {
        // Save to API
        const savedFood = await FoodAPI.addFood(foodWithDate);
        
        // Update local state
        setTrackerData(prev => {
          const dayData = prev[selectedDate] || { foods: [], totals: { calories: 0, protein: 0 } };
          const newFoods = [...dayData.foods, savedFood];
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
      } else {
        // Save to localStorage
        const foodWithInstanceId = { ...food, instanceId: Date.now() };
        setTrackerData(prev => {
          const dayData = prev[selectedDate] || { foods: [], totals: { calories: 0, protein: 0 } };
          const newFoods = [...dayData.foods, foodWithInstanceId];
          const newTotals = newFoods.reduce(
            (acc, f) => ({
              calories: acc.calories + f.calories,
              protein: acc.protein + f.protein,
            }),
            { calories: 0, protein: 0 }
          );
          return { ...prev, [selectedDate]: { foods: newFoods, totals: newTotals } };
        });
      }
    } catch (err: any) {
      console.error('Failed to add food:', err);
      setError(`Failed to add food: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editFood = async (index: number, updatedFood: Food) => {
    try {
      setLoading(true);
      setError(null);

      const dayData = trackerData[selectedDate];
      if (!dayData) return;

      if (useAPI && updatedFood.id) {
        // Update via API
        await FoodAPI.updateFood(updatedFood.id, updatedFood);
      }

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
      
      if (useAPI && food.id) {
        // Delete from API
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

      if (useAPI) {
        // Delete all foods for this date
        for (const food of dayData.foods) {
          if (food.id) {
            await FoodAPI.deleteFood(food.id);
          }
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

      if (useAPI) {
        // Save as favorite via API
        const favoriteFood = { ...food, is_favorite: true, date: formatDateForAPI(selectedDate) };
        const saved = await FoodAPI.addFood(favoriteFood);
        setUserFavorites(prev => [...prev, saved]);
      } else {
        // Save to localStorage
        setUserFavorites(prev => [...prev, food]);
      }
    } catch (err: any) {
      console.error('Failed to save favorite:', err);
      setError(`Failed to save favorite: ${err.message}`);
    }
  };

  const removeFavorite = async (foodId: number) => {
    try {
      if (useAPI) {
        await FoodAPI.deleteFood(foodId);
      }
      
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

      if (useAPI) {
        await FoodAPI.setGoals(goalsWithDate);
      } else {
        localStorage.setItem(USER_GOALS_KEY, JSON.stringify(newGoals));
      }
      
      setGoals(newGoals);
    } catch (err: any) {
      console.error('Failed to update goals:', err);
      setError(`Failed to update goals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
          {error} {!useAPI && "(Using offline mode)"}
          <button 
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div style={{ 
          background: '#e3f2fd', 
          color: '#1565c0', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '10px',
          fontSize: '14px' 
        }}>
          Loading...
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

      {!useAPI && (
        <div style={{ 
          background: '#fff3e0', 
          color: '#ef6c00', 
          padding: '10px', 
          borderRadius: '4px', 
          marginTop: '10px',
          fontSize: '12px',
          textAlign: 'center' 
        }}>
          Offline Mode - Changes saved locally only
          <button 
            onClick={() => {
              setUseAPI(true);
              localStorage.setItem(USE_API_KEY, 'true');
              loadDateData(selectedDate);
            }}
            style={{ marginLeft: '10px', fontSize: '12px' }}
          >
            Retry API
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackerApp;
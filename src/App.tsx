import React, { useState, useEffect } from 'react';
import './App.css';
import DailyFoodList from './components/DailyFoodList';
import FoodForm from './components/FoodForm';
import Summary from './components/Summary';
import Goals from './components/Goals';

interface FoodItem {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  date: string;
  meal_type: string;
  is_favorite: boolean;
}

interface DailyGoals {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  date: string;
}

function App() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [goals, setGoals] = useState<DailyGoals>({ calories: 2000, date: selectedDate });

  // Load food data from API
  const loadFoods = async () => {
    try {
      const api = await import('./api/api');
      const data = await api.default.getFoods(selectedDate);
      setFoods(data);
    } catch (error) {
      console.error('Failed to load foods:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const api = await import('./api/api');
      const data = await api.default.getGoals(selectedDate);
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
      // Set default goals if API fails
      setGoals({ calories: 2000, protein: 50, carbs: 250, fat: 65, date: selectedDate });
    }
  };

  const loadSummary = async () => {
    try {
      const api = await import('./api/api');
      const data = await api.default.getDailySummary(selectedDate);
      setSummary({
        calories: data.total_calories || 0,
        protein: data.total_protein || 0,
        carbs: data.total_carbs || 0,
        fat: data.total_fat || 0
      });
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  useEffect(() => {
    loadFoods();
    loadGoals();
    loadSummary();
  }, [selectedDate]);

  const handleFoodSubmit = async (food: Omit<FoodItem, 'id'>) => {
    try {
      const api = await import('./api/api');
      await api.default.addFood({ 
        ...food, 
        date: selectedDate, 
        is_favorite: false 
      });
      loadFoods();
      loadSummary();
    } catch (error) {
      console.error('Failed to add food:', error);
    }
  };

  const handleFoodUpdate = async (food: FoodItem) => {
    if (!food.id) return;
    try {
      const api = await import('./api/api');
      await api.default.updateFood(food.id, food));
      loadFoods();
      loadSummary();
    } catch (error) {
      console.error('Failed to update food:', error);
    }
  };

  const handleFoodDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this food?')) return;
    try {
      const api = await import('./api/api');
      await api.default.deleteFood(id);
      loadFoods();
      loadSummary();
    } catch (error) {
      console.error('Failed to delete food:', error);
    }
  };

  const handleGoalsUpdate = async (newGoals: Omit<DailyGoals, 'date'>) => {
    try {
      const api = await import('./api/api');
      await api.default.setGoals({ ...newGoals, date: selectedDate });
      loadGoals();
    } catch (error) {
      console.error('Failed to update goals:', error);
    }
  };

  const updateFoodInList = (updatedFood: FoodItem) => {
    setFoods(prev => prev.map(f => f.id === updatedFood.id ? updatedFood : f));
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Burnit Food Tracker</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
      </div>

      <div className="main-container">
        <div className="left-panel">
          <Goals
            goals={goals}
            onGoalsUpdate={handleGoalsUpdate}
          />
          <Summary
            daily={summary}
            goals={goals}
            date={selectedDate}
          />
        </div>

        <div className="right-panel">
          <FoodForm
            onSubmit={handleFoodSubmit}
            date={selectedDate}
          />
          <DailyFoodList
            foods={foods}
            onUpdate={handleFoodUpdate}
            onDelete={handleFoodDelete}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
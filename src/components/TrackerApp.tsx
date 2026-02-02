// src/components/TrackerApp.tsx
import { useState, useEffect } from "react";
import DayNavigation from "./DayNavigation";
import FoodAdder from "./FoodAdder";
import FoodList from "./FoodList";
import TotalsDisplay from "./TotalsDisplay";
import { Food, TrackerData } from "./types";

const TRACKER_DATA_KEY = "trackerData";
const USER_FAVORITES_KEY = "userFavorites";

const loadFromLocalStorage = (): TrackerData => {
  const savedData = localStorage.getItem(TRACKER_DATA_KEY);
  return savedData ? JSON.parse(savedData) : {};
};

const loadFavorites = (): Food[] => {
  const savedFavorites = localStorage.getItem(USER_FAVORITES_KEY);
  return savedFavorites ? JSON.parse(savedFavorites) : [];
};

const TrackerApp: React.FC = () => {
  const [trackerData, setTrackerData] = useState<TrackerData>(
    loadFromLocalStorage()
  );
  const [userFavorites, setUserFavorites] = useState<Food[]>(loadFavorites());
  const [currentDate] = useState<string>(new Date().toLocaleDateString());
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  // Persist tracker data
  useEffect(() => {
    localStorage.setItem(TRACKER_DATA_KEY, JSON.stringify(trackerData));
  }, [trackerData]);

  // Persist user favorites
  useEffect(() => {
    localStorage.setItem(USER_FAVORITES_KEY, JSON.stringify(userFavorites));
  }, [userFavorites]);

  // Initialize current date if needed
  useEffect(() => {
    if (!trackerData[currentDate]) {
      setTrackerData((prev: TrackerData) => ({
        ...prev,
        [currentDate]: { foods: [], totals: { calories: 0, protein: 0 } },
      }));
    }
  }, [currentDate, trackerData]);

  const addFood = (food: Food) => {
    setTrackerData((prev: TrackerData) => {
      const dayData = prev[selectedDate] || {
        foods: [],
        totals: { calories: 0, protein: 0 },
      };
      const foodWithInstanceId = { ...food, instanceId: Date.now() };
      const newFoods = [...dayData.foods, foodWithInstanceId];
      const newTotals = newFoods.reduce(
        (acc, f) => ({
          calories: acc.calories + f.calories,
          protein: acc.protein + f.protein,
        }),
        { calories: 0, protein: 0 }
      );
      return {
        ...prev,
        [selectedDate]: { foods: newFoods, totals: newTotals },
      };
    });
  };

  const deleteFood = (index: number) => {
    setTrackerData((prev: TrackerData) => {
      const dayData = prev[selectedDate];
      if (!dayData) return prev;

      const newFoods = dayData.foods.filter((_, i) => i !== index);
      const newTotals = newFoods.reduce(
        (acc, f) => ({
          calories: acc.calories + f.calories,
          protein: acc.protein + f.protein,
        }),
        { calories: 0, protein: 0 }
      );
      return {
        ...prev,
        [selectedDate]: { foods: newFoods, totals: newTotals },
      };
    });
  };

  const resetDay = () => {
    setTrackerData((prev: TrackerData) => ({
      ...prev,
      [selectedDate]: { foods: [], totals: { calories: 0, protein: 0 } },
    }));
  };

  const saveToFavorites = (food: Food) => {
    // Check if already exists (by name, case-insensitive)
    const exists = userFavorites.some(
      (f) => f.name.toLowerCase() === food.name.toLowerCase()
    );
    if (!exists) {
      setUserFavorites((prev) => [...prev, food]);
    }
  };

  const removeFavorite = (foodId: number) => {
    setUserFavorites((prev) => prev.filter((f) => f.id !== foodId));
  };

  const dayData = trackerData[selectedDate] || {
    foods: [],
    totals: { calories: 0, protein: 0 },
  };

  return (
    <div className="container">
      <h1>Unfuck Yourself</h1>
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
      <FoodList foods={dayData.foods} onDelete={deleteFood} />
      <TotalsDisplay totals={dayData.totals} onReset={resetDay} />
    </div>
  );
};

export default TrackerApp;

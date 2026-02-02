// src/components/TrackerApp.tsx
import { useState, useEffect } from "react";
import DayNavigation from "./DayNavigation";
import FoodAdder from "./FoodAdder";
import FoodList from "./FoodList";
import TotalsDisplay from "./TotalsDisplay";
import { Food, TrackerData } from "./types";

const loadFromLocalStorage = (): TrackerData => {
  const savedData = localStorage.getItem("trackerData");
  return savedData ? JSON.parse(savedData) : {};
};

const TrackerApp: React.FC = () => {
  const [trackerData, setTrackerData] = useState<TrackerData>(
    loadFromLocalStorage()
  );
  const [currentDate] = useState<string>(new Date().toLocaleDateString());
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  useEffect(() => {
    localStorage.setItem("trackerData", JSON.stringify(trackerData));
  }, [trackerData]);

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
      // Add unique instance id for tracking deletions
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
      <FoodAdder addFood={addFood} />
      <FoodList foods={dayData.foods} onDelete={deleteFood} />
      <TotalsDisplay totals={dayData.totals} onReset={resetDay} />
    </div>
  );
};

export default TrackerApp;

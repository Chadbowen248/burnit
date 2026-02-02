// src/components/TrackerApp/TrackerApp.tsx
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import DayNavigation from "./DayNavigation";
import FoodAdder from "./FoodAdder";
import FoodList from "./FoodList";
import TotalsDisplay from "./TotalsDisplay";
import { Food } from "./data";

interface DayData {
  foods: Food[];
  totals: { calories: number; protein: number };
}

interface TrackerData {
  [date: string]: DayData;
}

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
      const newFoods = [...dayData.foods, food];
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
      // Use the setter to update state immutably
      ...prev, // Spread the existing data to keep other dates unchanged
      [selectedDate]: { foods: [], totals: { calories: 0, protein: 0 } }, // Overwrite the selected date with empty data
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
      <FoodList foods={dayData.foods} />
      <TotalsDisplay totals={dayData.totals} onReset={resetDay} />
    </div>
  );
};

export default TrackerApp;

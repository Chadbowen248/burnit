// src/components/TrackerApp/DayNavigation.tsx
import { Dispatch, SetStateAction } from "react";
import { Food } from "./data";

interface DayData {
  foods: Food[];
  totals: { calories: number; protein: number };
}

interface TrackerData {
  [date: string]: DayData;
}

interface DayNavigationProps {
  currentDate: string;
  selectedDate: string;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  trackerData: TrackerData;
  setTrackerData: Dispatch<SetStateAction<TrackerData>>;
}

const DayNavigation: React.FC<DayNavigationProps> = ({
  currentDate,
  selectedDate,
  setSelectedDate,
  trackerData,
  setTrackerData,
}) => {
  const changeDate = (direction: number) => {
    const dateObj = new Date(selectedDate);
    dateObj.setDate(dateObj.getDate() + direction);
    const newDate = dateObj.toLocaleDateString();
    setSelectedDate(newDate);
    if (!trackerData[newDate]) {
      setTrackerData((prev) => ({
        ...prev,
        [newDate]: { foods: [], totals: { calories: 0, protein: 0 } },
      }));
    }
  };

  return (
    <div>
      <h2>
        {new Date(selectedDate).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </h2>
      <div className="button-group">
        <button className="button" onClick={() => changeDate(-1)}>
          ←
        </button>
        <button className="button" onClick={() => setSelectedDate(currentDate)}>
          Today
        </button>
        <button className="button" onClick={() => changeDate(1)}>
          →
        </button>
      </div>
    </div>
  );
};

export default DayNavigation;

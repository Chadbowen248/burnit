// src/components/DayNavigation.tsx
import { Dispatch, SetStateAction } from "react";
import { TrackerData } from "./types";

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
    // Use LOCAL timezone YYYY-MM-DD format, not UTC!
    const newDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDate);
    if (!trackerData[newDate]) {
      setTrackerData((prev) => ({
        ...prev,
        [newDate]: { foods: [], totals: { calories: 0, protein: 0 } },
      }));
    }
  };

  return (
    <div className="day-navigation">
      <h2 className="date-display">
        {new Date(selectedDate).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </h2>
      <div className="button-group">
        <button className="button nav-button" onClick={() => changeDate(-1)}>
          ←
        </button>
        <button className="button nav-button" onClick={() => setSelectedDate(currentDate)}>
          Today
        </button>
        <button className="button nav-button" onClick={() => changeDate(1)}>
          →
        </button>
      </div>
    </div>
  );
};

export default DayNavigation;

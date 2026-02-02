// src/components/TotalsDisplay.tsx
import { goals } from "./data";

interface Totals {
  calories: number;
  protein: number;
}

interface TotalsDisplayProps {
  totals: Totals;
  onReset?: () => void;
}

const TotalsDisplay: React.FC<TotalsDisplayProps> = ({ totals, onReset }) => {
  const caloriePercent = Math.min((totals.calories / goals.calories) * 100, 100);
  const proteinPercent = Math.min((totals.protein / goals.protein) * 100, 100);
  const caloriesOver = totals.calories > goals.calories;
  const proteinMet = totals.protein >= goals.protein;

  return (
    <div className="totals-display">
      <div className="total-row">
        <span className={`total-label ${caloriesOver ? "over" : ""}`}>
          Calories: {totals.calories} / {goals.calories}
        </span>
        <progress 
          value={totals.calories} 
          max={goals.calories} 
          className={caloriesOver ? "over" : ""}
        />
      </div>
      <div className="total-row">
        <span className={`total-label ${proteinMet ? "met" : ""}`}>
          Protein: {totals.protein}g / {goals.protein}g
        </span>
        <progress 
          value={totals.protein} 
          max={goals.protein}
          className={proteinMet ? "met" : ""}
        />
      </div>
      {onReset && (
        <button className="button reset-button" onClick={onReset}>
          Reset Day
        </button>
      )}
    </div>
  );
};

export default TotalsDisplay;

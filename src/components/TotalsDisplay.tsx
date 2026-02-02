// src/components/TrackerApp/TotalsDisplay.tsx
import { goals } from "./data";

interface Totals {
  calories: number;
  protein: number;
}

interface TotalsDisplayProps {
  totals: Totals;
  onReset?: () => void; // New: Optional callback for reset action
}

const TotalsDisplay: React.FC<TotalsDisplayProps> = ({ totals, onReset }) => (
  <div className="totals-display">
    <p>
      Calories: {totals.calories} / {goals.calories} (goal)
    </p>
    <progress value={totals.calories} max={goals.calories} />
    <p>
      Protein: {totals.protein}g / {goals.protein} (goal)
    </p>
    <progress value={totals.protein} max={goals.protein} />
    {onReset && (
      <button className="button" onClick={onReset}>
        Reset
      </button>
    )}
  </div>
);

export default TotalsDisplay;

// src/components/GoalsSettings.tsx
import { useState } from "react";
import { Goals } from "./types";

interface GoalsSettingsProps {
  goals: Goals;
  onSave: (goals: Goals) => void;
  onClose: () => void;
}

const GoalsSettings: React.FC<GoalsSettingsProps> = ({ goals, onSave, onClose }) => {
  const [calories, setCalories] = useState(goals.calories.toString());
  const [protein, setProtein] = useState(goals.protein.toString());

  const handleSave = () => {
    onSave({
      calories: parseInt(calories) || 2000,
      protein: parseInt(protein) || 150,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Goals</h3>
        <div className="goals-form">
          <label>
            Daily Calories
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="500"
              max="10000"
            />
          </label>
          <label>
            Daily Protein (g)
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              min="20"
              max="500"
            />
          </label>
        </div>
        <div className="modal-buttons">
          <button className="button" onClick={handleSave}>
            Save
          </button>
          <button className="button secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalsSettings;

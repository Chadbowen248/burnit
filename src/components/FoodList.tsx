// src/components/FoodList.tsx
import { useState } from "react";
import { Food } from "./types";

interface FoodListProps {
  foods: Food[];
  onDelete?: (index: number) => void;
  onEdit?: (index: number, food: Food) => void;
}

interface EditingState {
  index: number;
  name: string;
  calories: string;
  protein: string;
}

const FoodList: React.FC<FoodListProps> = ({ foods, onDelete, onEdit }) => {
  const [editing, setEditing] = useState<EditingState | null>(null);

  const startEdit = (index: number, food: Food) => {
    setEditing({
      index,
      name: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
    });
  };

  const saveEdit = () => {
    if (editing && onEdit) {
      onEdit(editing.index, {
        id: foods[editing.index].id,
        name: editing.name,
        calories: parseInt(editing.calories) || 0,
        protein: parseInt(editing.protein) || 0,
      });
    }
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  return (
    <ul>
      {foods.map((food, index) => (
        <li key={`${food.id}-${index}`} className="food-item">
          {editing?.index === index ? (
            <div className="food-edit-form">
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Name"
                className="edit-input edit-name"
              />
              <div className="edit-numbers">
                <input
                  type="number"
                  value={editing.calories}
                  onChange={(e) => setEditing({ ...editing, calories: e.target.value })}
                  placeholder="Cal"
                  className="edit-input edit-number"
                />
                <input
                  type="number"
                  value={editing.protein}
                  onChange={(e) => setEditing({ ...editing, protein: e.target.value })}
                  placeholder="Pro"
                  className="edit-input edit-number"
                />
              </div>
              <div className="edit-buttons">
                <button className="save-button" onClick={saveEdit}>✓</button>
                <button className="cancel-button" onClick={cancelEdit}>✕</button>
              </div>
            </div>
          ) : (
            <>
              <div className="food-info">
                <span className="food-name">{food.name}</span>
                <span className="food-macros">
                  {food.calories} cal, {food.protein}g protein
                </span>
              </div>
              <div className="food-actions">
                {onEdit && (
                  <button
                    className="edit-button"
                    onClick={() => startEdit(index, food)}
                    aria-label={`Edit ${food.name}`}
                  >
                    ✎
                  </button>
                )}
                {onDelete && (
                  <button
                    className="delete-button"
                    onClick={() => onDelete(index)}
                    aria-label={`Delete ${food.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export default FoodList;

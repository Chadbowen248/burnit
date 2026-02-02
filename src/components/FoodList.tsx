// src/components/FoodList.tsx
import { Food } from "./types";

interface FoodListProps {
  foods: Food[];
  onDelete?: (index: number) => void;
}

const FoodList: React.FC<FoodListProps> = ({ foods, onDelete }) => (
  <ul>
    {foods.map((food, index) => (
      <li key={`${food.id}-${index}`} className="food-item">
        <div className="food-info">
          <span className="food-name">{food.name}</span>
          <span className="food-macros">
            {food.calories} cal, {food.protein}g protein
          </span>
        </div>
        {onDelete && (
          <button
            className="delete-button"
            onClick={() => onDelete(index)}
            aria-label={`Delete ${food.name}`}
          >
            ×
          </button>
        )}
      </li>
    ))}
  </ul>
);

export default FoodList;

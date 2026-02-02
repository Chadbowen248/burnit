// src/components/TrackerApp/FoodList.tsx
import { Food } from "./data";

interface FoodListProps {
  foods: Food[];
}

const FoodList: React.FC<FoodListProps> = ({ foods }) => (
  <ul>
    {foods.map((food, index) => (
      <li key={index}>
        {food.name}:<br></br>
        {food.calories} cal, {food.protein}g protein
      </li>
    ))}
  </ul>
);

export default FoodList;

// src/components/FoodAdder.tsx
import { useState } from "react";
import { initialFoods } from "./data";
import { Food } from "./types";

interface FoodAdderProps {
  addFood: (food: Food) => void;
  userFavorites: Food[];
  onSaveToFavorites: (food: Food) => void;
  onRemoveFavorite: (foodId: number) => void;
}

const FoodAdder: React.FC<FoodAdderProps> = ({ 
  addFood, 
  userFavorites, 
  onSaveToFavorites,
  onRemoveFavorite 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);

  // Combine initial foods with user favorites
  const allFoods = [...initialFoods, ...userFavorites];

  const openModal = () => {
    setName("");
    setCalories(0);
    setProtein(0);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && calories > 0 && protein >= 0) {
      const newFood: Food = {
        id: Date.now(),
        name,
        calories,
        protein,
      };
      addFood(newFood);
      // Offer to save to favorites
      if (window.confirm(`Save "${name}" to favorites?`)) {
        onSaveToFavorites(newFood);
      }
      closeModal();
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const foodId = parseInt(e.target.value, 10);
    const food = allFoods.find((f) => f.id === foodId);
    if (food) addFood({ ...food });
    e.target.value = "";
  };

  return (
    <div className="food-adder">
      {/* Quick select from favorites/presets */}
      <select
        className="custom-select"
        onChange={handleSelectChange}
      >
        <option value="">⭐ Quick add from list</option>
        {userFavorites.length > 0 && (
          <optgroup label="Your Favorites">
            {userFavorites.map((food) => (
              <option key={`fav-${food.id}`} value={food.id}>
                {food.name} ({food.calories} cal, {food.protein}g)
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label="Preset Foods">
          {initialFoods.map((food) => (
            <option key={`preset-${food.id}`} value={food.id}>
              {food.name} ({food.calories} cal, {food.protein}g)
            </option>
          ))}
        </optgroup>
      </select>

      <button className="button custom-button" onClick={openModal}>
        + Custom Entry
      </button>

      {/* Show user favorites with remove option */}
      {userFavorites.length > 0 && (
        <div className="favorites-list">
          <div className="favorites-header">
            <span>Your Favorites</span>
          </div>
          {userFavorites.map((food) => (
            <div key={food.id} className="favorite-item">
              <span className="favorite-name">{food.name}</span>
              <span className="favorite-macros">
                {food.calories} cal, {food.protein}g
              </span>
              <button
                className="remove-favorite-btn"
                onClick={() => onRemoveFavorite(food.id)}
                title="Remove from favorites"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <>
          <div className="modal-overlay" onClick={closeModal} />
          <div className="modal">
            <h3>Add Custom Food</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="food-name">Name</label>
                <input
                  id="food-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chicken breast"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="food-calories">Calories</label>
                <input
                  id="food-calories"
                  type="number"
                  value={calories || ""}
                  onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  min={1}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="food-protein">Protein (g)</label>
                <input
                  id="food-protein"
                  type="number"
                  value={protein || ""}
                  onChange={(e) => setProtein(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  min={0}
                  required
                />
              </div>
              <div className="modal-button-group">
                <button className="button" type="submit">
                  Add
                </button>
                <button className="button" type="button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default FoodAdder;

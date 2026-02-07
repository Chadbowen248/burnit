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
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  // Combine preset foods with user favorites into one list
  const allFoods = [
    ...userFavorites.map(f => ({ ...f, isUserAdded: true })),
    ...initialFoods.map(f => ({ ...f, isUserAdded: false }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  const openModal = () => {
    setName("");
    setCalories(0);
    setProtein(0);
    setSaveToFavorites(false);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && calories > 0 && protein >= 0) {
      const newFood: Omit<Food, 'id'> = {
        name,
        calories,
        protein,
      };
      addFood(newFood as Food);
      if (saveToFavorites) {
        onSaveToFavorites(newFood as Food);
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
      {/* Quick select - single merged list */}
      <select
        className="custom-select"
        onChange={handleSelectChange}
      >
        <option value="">⭐ Quick add from list</option>
        {allFoods.map((food) => (
          <option key={food.id} value={food.id}>
            {food.name} ({food.calories} cal, {food.protein}g)
          </option>
        ))}
      </select>

      <div className="food-adder-buttons">
        <button className="button custom-button" onClick={openModal}>
          + Custom Entry
        </button>
        {userFavorites.length > 0 && (
          <button 
            className="button manage-button" 
            onClick={() => setIsManageOpen(true)}
            title="Manage your added foods"
          >
            ✎
          </button>
        )}
      </div>

      {/* Manage user-added foods modal */}
      {isManageOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsManageOpen(false)} />
          <div className="modal">
            <h3>Your Added Foods</h3>
            <p className="modal-subtitle">Remove items you no longer need</p>
            <div className="manage-list">
              {userFavorites.map((food) => (
                <div key={food.id} className="manage-item">
                  <span className="manage-name">{food.name}</span>
                  <span className="manage-macros">
                    {food.calories} cal, {food.protein}g
                  </span>
                  <button
                    className="remove-btn"
                    onClick={() => food.id && onRemoveFavorite(food.id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-button-group">
              <button className="button" onClick={() => setIsManageOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add custom food modal */}
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
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveToFavorites}
                    onChange={(e) => setSaveToFavorites(e.target.checked)}
                  />
                  <span>Save to quick-add list</span>
                </label>
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

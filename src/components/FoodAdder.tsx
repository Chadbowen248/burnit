// src/components/FoodAdder.tsx
import { useState } from "react";
import { initialFoods } from "./data";
import { Food } from "./types";

interface FoodAdderProps {
  addFood: (food: Food) => void;
}

const FoodAdder: React.FC<FoodAdderProps> = ({ addFood }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);

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
      closeModal();
    }
  };

  return (
    <div className="food-adder">
      <select
        className="custom-select"
        onChange={(e) => {
          const food = initialFoods.find(
            (f) => f.id === parseInt(e.target.value, 10)
          );
          if (food) addFood({ ...food });
          e.target.value = "";
        }}
      >
        <option value="">Select a food to add</option>
        {initialFoods.map((food) => (
          <option key={food.id} value={food.id}>
            {food.name} ({food.calories} cal, {food.protein}g protein)
          </option>
        ))}
      </select>

      <button className="button custom-button" onClick={openModal}>
        Custom
      </button>

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

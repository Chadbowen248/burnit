// src/components/TrackerApp/FoodAdder.tsx
import { useState } from "react"; // Import useState for modal and form state
import { initialFoods, Food } from "./data"; // Existing imports

interface FoodAdderProps {
  addFood: (food: Food) => void;
}

const FoodAdder: React.FC<FoodAdderProps> = ({ addFood }) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // State to toggle modal visibility
  const [name, setName] = useState(""); // State for food name input
  const [calories, setCalories] = useState(0); // State for calories (number)
  const [protein, setProtein] = useState(0); // State for protein (number)

  // Function to open the modal and reset form fields
  const openModal = () => {
    setName("");
    setCalories(0);
    setProtein(0);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => setIsModalOpen(false);

  // Function to handle form submit: create new Food and add it
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (name && calories > 0 && protein >= 0) {
      // Basic validation
      const newFood: Food = {
        id: Date.now(), // Generate unique ID (timestamp as number)
        name,
        calories,
        protein,
      };
      addFood(newFood); // Call the passed addFood function
      closeModal(); // Close modal after adding
    }
  };

  return (
    <div>
      {/* Existing select for predefined foods */}
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
            {food.name}
            <br></br>({food.calories} cal, {food.protein}g protein)
          </option>
        ))}
      </select>

      {/* New "Add Custom" button */}
      <button className="button" onClick={openModal}>
        Custom
      </button>

      {/* Modal: Conditionally render when open */}
      {isModalOpen && (
        <div className="modal">
          {/* Simple modal overlay; in production, use a lib like react-modal for better accessibility/overlay */}
          <h3>Add Custom Food</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Calories:
              <input
                type="text"
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
                min={1}
                required
              />
            </label>
            <br />
            <label>
              Protein:
              <input
                type="text"
                value={protein}
                onChange={(e) => setProtein(parseInt(e.target.value, 10) || 0)}
                min={0}
                required
              />
            </label>
            <br />
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
      )}
    </div>
  );
};

export default FoodAdder;

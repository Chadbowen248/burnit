// src/components/TrackerApp/data.ts
export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
}

export interface Goals {
  calories: number;
  protein: number;
}

export const initialFoods: Food[] = [
  { id: 15, name: "Yogurt & Beef", calories: 365, protein: 48 },
  { id: 8, name: "Mexican Toppings", calories: 40, protein: 2 },
  { id: 9, name: "Protein Coffee", calories: 130, protein: 30 },
  { id: 5, name: "Protein Bar", calories: 190, protein: 16 },
  { id: 12, name: "Protein Shake", calories: 200, protein: 38 },
  { id: 13, name: "Tortilla Soup 480g", calories: 260, protein: 22 },
  { id: 4, name: "Eggs & Chicken", calories: 640, protein: 47 },
  { id: 7, name: "Chobani Flip", calories: 165, protein: 9 },
  { id: 2, name: "Cottage Cheese", calories: 220, protein: 25 },
  { id: 1, name: "Desert", calories: 260, protein: 4 },
  { id: 19, name: "4 eggs", calories: 280, protein: 24 },
  { id: 3, name: "Chicken Wrap", calories: 460, protein: 44 },
  { id: 18, name: "Canned Chicken", calories: 210, protein: 46 },
  { id: 20, name: "Ground Beef 4oz", calories: 180, protein: 25 },
  { id: 16, name: "Yogurt 170g", calories: 100, protein: 19 },
  { id: 14, name: "chicken Meatballs", calories: 160, protein: 17 },
  // { id: 11, name: "Beef & Rice", calories: 541, protein: 35 },
  // { id: 6, name: "Yogurt and Oreo", calories: 230, protein: 16 },
  // { id: 8, name: "Soup & Shrimp", calories: 625, protein: 27 },
  // { id: 13, name: "1 cup rice", calories: 205, protein: 5 },
  // { id: 10, name: "Garlic Shrimp", calories: 350, protein: 20 },
  // Add more
];

export const goals: Goals = { calories: 2000, protein: 200 }; // Customizable goals  { name: "Protein Shake 360", calories: 360, protein: 61 },

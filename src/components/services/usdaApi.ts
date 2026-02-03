// USDA FoodData Central API service
// Free API - get your own key at: https://fdc.nal.usda.gov/api-key-signup.html
// Using DEMO_KEY for now (rate limited but works)

const API_KEY = "DEMO_KEY";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export interface USDAFood {
  fdcId: number;
  description: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: {
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }[];
}

export interface SearchResult {
  fdcId: number;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  servingSize?: string;
}

// Nutrient IDs we care about
const NUTRIENT_IDS = {
  CALORIES: 1008, // Energy (kcal)
  PROTEIN: 1003, // Protein (g)
};

function extractNutrient(food: USDAFood, nutrientId: number): number {
  const nutrient = food.foodNutrients.find(
    (n) => n.nutrientId === nutrientId
  );
  return nutrient ? Math.round(nutrient.value) : 0;
}

export async function searchFoods(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&pageSize=15&dataType=Foundation,SR Legacy,Branded`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.foods || []).map((food: USDAFood): SearchResult => {
      const servingInfo = food.servingSize
        ? `${food.servingSize}${food.servingSizeUnit || "g"}`
        : "100g";

      return {
        fdcId: food.fdcId,
        name: food.description,
        brand: food.brandName,
        calories: extractNutrient(food, NUTRIENT_IDS.CALORIES),
        protein: extractNutrient(food, NUTRIENT_IDS.PROTEIN),
        servingSize: servingInfo,
      };
    });
  } catch (error) {
    console.error("USDA API search error:", error);
    return [];
  }
}

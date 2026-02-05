// Shared types for the food tracker

export interface Food {
  id?: number;  // Optional for new foods
  instanceId?: number; // For local tracking until saved
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  quantity?: number;
  unit?: string;
  date?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_favorite?: boolean;
  usda_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  date?: string;
}

export interface DayData {
  foods: Food[];
  totals: { calories: number; protein: number; carbs?: number; fat?: number };
}

export interface TrackerData {
  [date: string]: DayData;
}

export interface DailySummary {
  entries_count: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

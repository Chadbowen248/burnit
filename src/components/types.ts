// Shared types for the food tracker

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

export interface DayData {
  foods: Food[];
  totals: { calories: number; protein: number };
}

export interface TrackerData {
  [date: string]: DayData;
}

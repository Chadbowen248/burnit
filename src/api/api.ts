import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001';

class FoodAPI {
  private client = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  async getFoods(date?: string) {
    const { data } = await this.client.get('/foods', { params: { date } });
    return data;
  }

  async addFood(food: Omit<FoodType, 'id'>) {
    const { data } = await this.client.post('/foods', food);
    return data;
  }

  async updateFood(id: number, food: Partial<FoodType>) {
    const { data } = await this.client.put(`/foods/${id}`, food);
    return data;
  }

  async deleteFood(id: number) {
    await this.client.delete(`/foods/${id}`);
  }

  async getDailySummary(date: string) {
    const { data } = await this.client.get(`/summary/${date}`);
    return data;
  }

  async getGoals(date: string) {
    const { data } = await this.client.get(`/goals/${date}`);
    return data;
  }

  async setGoals(goals: DailyGoals) {
    const { data } = await this.client.post('/goals', goals);
    return data;
  }
}

export interface FoodType {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyGoals {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  date: string;
}

export default new FoodAPI();
import axios from 'axios';
import { Food, Goals, DailySummary } from '../components/types';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001';

class FoodAPI {
  private client = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  async getFoods(date?: string): Promise<Food[]> {
    const { data } = await this.client.get('/foods', { params: { date } });
    return data;
  }

  async addFood(food: Omit<Food, 'id' | 'instanceId'>): Promise<Food> {
    const { data } = await this.client.post('/foods', food);
    return data;
  }

  async updateFood(id: number, food: Partial<Food>): Promise<Food> {
    const { data } = await this.client.put(`/foods/${id}`, food);
    return data;
  }

  async deleteFood(id: number): Promise<void> {
    await this.client.delete(`/foods/${id}`);
  }

  async getDailySummary(date: string): Promise<DailySummary> {
    const { data } = await this.client.get(`/summary/${date}`);
    return data;
  }

  async getGoals(date: string): Promise<Goals> {
    const { data } = await this.client.get(`/goals/${date}`);
    return data;
  }

  async setGoals(goals: Goals): Promise<Goals> {
    const { data } = await this.client.post('/goals', goals);
    return data;
  }

  async getFavorites(): Promise<Food[]> {
    const { data } = await this.client.get('/foods', { params: { is_favorite: true } });
    return data;
  }
}

export default new FoodAPI();
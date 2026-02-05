const axios = require('axios');

const DEV_API_URL = 'http://localhost:3001';
const API_URL = process.env.NODE_ENV === 'development' ? DEV_API_URL : '/api';

// Food API client
const foodClient = {
  async getFoods(date, mealType) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (mealType) params.append('meal_type', mealType);
    return axios.get(`${API_URL}/foods?${params}`);
  },

  async addFood(food) {
    return axios.post(`${API_URL}/foods`, food);
  },

  async updateFood(id, food) {
    return axios.put(`${API_URL}/foods/${id}`, food);
  },

  async deleteFood(id) {
    return axios.delete(`${API_URL}/foods/${id}`);
  },

  async getDailySummary(date) {
    return axios.get(`${API_URL}/summary/${date}`);
  },

  async getGoals(date) {
    return axios.get(`${API_URL}/goals/${date}`);
  },

  async setGoals(goals) {
    return axios.post(`${API_URL}/goals`, goals);
  }
};

module.exports = foodClient;
// ML API service for FinSight advanced predictions
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';
const ML_API_ENDPOINT = `${ML_API_BASE_URL}/api/ml`;

export const mlAPI = {
  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML Health check failed:', error);
      return { status: 'unavailable', ml_available: false };
    }
  },

  // Get full analysis
  async getFullAnalysis(username) {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/analyze/${username}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ML analysis:', error);
      return { success: false, error: error.message };
    }
  },

  // Get ML predictions for transactions
  async getPredictions(username) {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/predictions/${username}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return { success: false, error: error.message };
    }
  },

  // Get spending forecasts
  async getForecasts(username) {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/forecasts/${username}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      return { success: false, error: error.message };
    }
  },

  // Get behavioral insights and recommendations
  async getInsights(username) {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/insights/${username}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      return { success: false, error: error.message };
    }
  },

  // Get risk analysis
  async getRiskAnalysis(username) {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/risk-analysis/${username}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching risk analysis:', error);
      return { success: false, error: error.message };
    }
  },

  // Refresh analysis
  async refreshAnalysis(username) {
    try {
      const response = await fetch(`${ML_API_ENDPOINT}/refresh/${username}`, {
        method: 'POST'
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      return { success: false, error: error.message };
    }
  }
};

export default mlAPI;

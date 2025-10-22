// API service for FinSight backend
const API_BASE_URL = import.meta.env.VITE_TRANSACTION_API_URL || 'http://localhost:8000';
const API_ENDPOINT = `${API_BASE_URL}/api`;

export const transactionAPI = {
  // Get all transactions for a user
  async getTransactions(username) {
    try {
      const response = await fetch(`${API_ENDPOINT}/transactions/${username}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { success: false, data: [] };
    }
  },

  // Add a new transaction
  async addTransaction(transactionData) {
    try {
      const response = await fetch(`${API_ENDPOINT}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, message: error.message };
    }
  }
};

export default transactionAPI;

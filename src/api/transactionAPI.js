import { supabase } from '../lib/supabase'

export const transactionAPI = {
  // Get all transactions for a user
  async getTransactions(username) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('username', username)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      
      if (error) {
        console.error('Error fetching transactions:', error)
        return { success: false, data: [] }
      }
      
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return { success: false, data: [] }
    }
  },

  // Add a new transaction
  async addTransaction(transactionData) {
    try {
      const username = transactionData.username
      
      // Get last balance
      const { data: lastTransaction } = await supabase
        .from('transactions')
        .select('balance_after')
        .eq('username', username)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      const lastBalance = lastTransaction?.balance_after || 0
      
      // Calculate new balance
      const amount = parseFloat(transactionData.amount)
      const category = transactionData.category
      const newBalance = (category === 'Salary' || category === 'Income')
        ? lastBalance + amount
        : lastBalance - amount
      
      // Insert new transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            username: username,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            merchant: transactionData.merchant,
            amount: amount,
            category: category,
            mood: transactionData.mood || 'Neutral',
            location: transactionData.location || '',
            calendar_event: transactionData.calendar || 'Regular',
            group_id: 1,
            balance_after: newBalance
          }
        ])
        .select()
        .single()
      
      if (error) {
        console.error('Error adding transaction:', error)
        return { success: false, message: error.message }
      }
      
      return {
        success: true,
        message: `Transaction saved successfully for ${username}`,
        data: data
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      return { success: false, message: error.message }
    }
  }
}

export default transactionAPI


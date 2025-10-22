import { supabase } from '../lib/supabase'

export const usersAPI = {
  // Check if email already exists
  checkEmailExists: async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking email:', error)
        return { exists: false }
      }
      
      return { exists: !!data }
    } catch (error) {
      console.error('Error checking email:', error)
      return { exists: false }
    }
  },

  // Register new user
  signup: async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: userData.username,
            email: userData.email,
            password: userData.password, // In production, hash this!
          }
        ])
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { 
            success: false, 
            message: error.message.includes('email') 
              ? 'Email already registered' 
              : 'Username already taken' 
          }
        }
        console.error('Error during signup:', error)
        return { success: false, message: 'Signup failed. Please try again.' }
      }
      
      return {
        success: true,
        message: 'Account created successfully',
        user: {
          username: data.username,
          email: data.email
        }
      }
    } catch (error) {
      console.error('Error during signup:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, email')
        .eq('username', credentials.username)
        .eq('password', credentials.password) // In production, use proper auth!
        .single()
      
      if (error || !data) {
        return { success: false, message: 'Invalid credentials' }
      }
      
      return {
        success: true,
        message: 'Login successful',
        user: {
          username: data.username,
          email: data.email
        }
      }
    } catch (error) {
      console.error('Error during login:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  },

  // Health check
  checkHealth: async () => {
    try {
      const { error } = await supabase.from('users').select('count').limit(1)
      return { status: error ? 'unhealthy' : 'healthy' }
    } catch (error) {
      return { status: 'unhealthy' }
    }
  }
}

export default usersAPI


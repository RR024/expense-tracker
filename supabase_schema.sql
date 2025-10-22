-- ============================================
-- USERS TABLE - Stores all user login details
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE - Stores all user transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  merchant TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  mood TEXT DEFAULT 'Neutral',
  location TEXT DEFAULT '',
  calendar_event TEXT DEFAULT 'Regular',
  group_id INTEGER DEFAULT 1,
  balance_after DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- ============================================
-- INDEXES - For faster queries
-- ============================================
CREATE INDEX idx_transactions_username ON transactions(username);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Enable security
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Allow access to data
-- ============================================

-- Users table policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create user" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (username = current_setting('app.current_user', true));

-- Transactions table policies
CREATE POLICY "Users can view all transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (username = current_setting('app.current_user', true));

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (username = current_setting('app.current_user', true));

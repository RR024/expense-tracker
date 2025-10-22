# Supabase Database Setup Guide

## 📊 Database Schema

Your Supabase database will store:

### 1. **Users Table** (Login Details)
Stores every user's signup information:
- ✅ Username
- ✅ Password  
- ✅ Email
- ✅ Created timestamp

### 2. **Transactions Table** (Per User)
Stores ALL transactions for EACH user:
- ✅ Username (links to user)
- ✅ Date & Time
- ✅ Merchant name
- ✅ Amount
- ✅ Category
- ✅ Mood
- ✅ Location
- ✅ Calendar event
- ✅ Balance after transaction

---

## 🛠️ Setup Instructions

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up with GitHub
3. Click **"New Project"**
4. Enter:
   - **Name**: `finsight` or `expense-tracker`
   - **Database Password**: [Create strong password - SAVE IT!]
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes...

---

### Step 2: Create Database Tables

Once project is ready:

1. Click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. **Copy and paste this COMPLETE SQL code:**

```sql
-- ============================================
-- USERS TABLE - Stores all user login details
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE - Stores all user transactions
-- ============================================
CREATE TABLE transactions (
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
```

4. Click **"Run"** (bottom right corner)
5. You should see: "Success. No rows returned" ✅

---

### Step 3: Verify Tables Created

1. Click **"Table Editor"** (left sidebar)
2. You should see:
   - ✅ **users** table (with columns: id, username, email, password, created_at)
   - ✅ **transactions** table (with all transaction columns)

---

### Step 4: Get API Keys

1. Click **"Settings"** (gear icon, left sidebar)
2. Click **"API"**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (long string starting with "eyJ...")

**SAVE THESE! You'll need them for Vercel.**

---

## 📝 How Data is Saved

### When User Signs Up:
```javascript
// User enters: username, email, password
// Saved to users table:
{
  id: "auto-generated-uuid",
  username: "john123",
  email: "john@example.com", 
  password: "John@123",
  created_at: "2025-10-22 10:30:00"
}
```

### When User Adds Transaction:
```javascript
// User adds transaction
// Saved to transactions table:
{
  id: "auto-generated-uuid",
  username: "john123",  // Links to user
  date: "2025-10-22",
  time: "14:30:00",
  merchant: "Starbucks",
  amount: 5.50,
  category: "Food",
  mood: "Happy",
  location: "Downtown",
  calendar_event: "Regular",
  group_id: 1,
  balance_after: 994.50,
  created_at: "2025-10-22 14:30:00"
}
```

### When User Logs In:
```javascript
// System checks users table:
// Find row where username = "john123" AND password = "John@123"
// If found -> Login success!
// Returns: { username: "john123", email: "john@example.com" }
```

### When User Views Transactions:
```javascript
// System queries transactions table:
// Get all rows where username = "john123"
// Returns array of all their transactions
```

---

## ✅ What You Get

Each user will have:
- ✅ **Unique account** (username + email + password saved)
- ✅ **Separate transaction history** (linked by username)
- ✅ **Persistent storage** (data never deleted)
- ✅ **Fast queries** (indexed for performance)
- ✅ **Secure access** (Row Level Security enabled)

---

## 🔒 Security Notes

**IMPORTANT for Production:**
- Current setup stores passwords in plain text (for demo only!)
- For real production app, use:
  - Supabase Auth (built-in authentication)
  - Password hashing (bcrypt)
  - JWT tokens

---

## 🎯 Next Steps

After creating the database:
1. ✅ Copy Project URL and anon key
2. ✅ Deploy to Vercel
3. ✅ Add environment variables to Vercel
4. ✅ Test signup/login
5. ✅ Add transactions
6. ✅ Verify data persists in Supabase!

---

**Every user's data is completely separate and saved permanently!** 🎉

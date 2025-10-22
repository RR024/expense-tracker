# FinSight - Python Backend Integration Guide

## 🎯 Overview

Your Python backend has been successfully integrated with the React frontend! You now have:

- **Python HTTP Server** (`server.py`) - Saves transaction data to CSV files
- **React API Service** (`transactionAPI.js`) - Connects frontend to backend
- **Enhanced Dashboard** - Supports mood tracking, location, and backend sync

## 📁 File Structure

```
neuronexus/
├── backend/
│   └── server.py          # Python API server
└── neuronexus/
    └── src/
        ├── api/
        │   └── transactionAPI.js  # API service
        └── Dashboard.jsx   # Enhanced with backend integration
```

## 🚀 Quick Start

### 1. Start Python Backend

```bash
cd d:\Projects\neuronexus\backend
python server.py
```

Server will run at: `http://localhost:8000`

### 2. Start React Frontend

```bash
cd d:\Projects\neuronexus\neuronexus
npm run dev
```

Frontend will run at: `http://localhost:5174`

## 🎮 How to Use

### In the Dashboard:

1. **Toggle Python Backend ON/OFF**
   - Look for the toggle switch at the top right of "Transaction Manager"
   - **OFF** = Data saved only in browser (localStorage)
   - **ON** = Data saved to Python backend (CSV files)

2. **Add Transaction with Extended Fields:**
   - Type, Merchant/Name, Amount, Category
   - **Mood** 😊 (Happy, Sad, Stressed, Neutral)
   - **Location** 📍 (e.g., Mumbai, Delhi)
   - Date

3. **When Backend is ON:**
   - Transactions automatically save to `user_{username}.csv`
   - Data persists even after browser refresh
   - Can be analyzed with Python data science tools

## 🔌 API Endpoints

### GET Transactions
```http
GET http://localhost:8000/api/transactions/{username}
```

Returns all transactions for a specific user.

### POST Transaction
```http
POST http://localhost:8000/api/transactions
Content-Type: application/json

{
  "username": "john",
  "merchant": "Starbucks",
  "amount": "250",
  "category": "Food",
  "mood": "Happy",
  "location": "Mumbai",
  "calendar": ""
}
```

## 📊 Data Storage

### CSV Format
Each user gets their own CSV file: `user_{username}.csv`

Columns:
- Date
- Time
- Merchant
- Amount
- Category
- Mood
- Location
- Calendar

### Example:
```csv
Date,Time,Merchant,Amount,Category,Mood,Location,Calendar
2025-10-11,14:30:25,Starbucks,250,Food,Happy,Mumbai,
2025-10-11,15:45:10,Uber,180,Transport,Neutral,Delhi,
```

## 🔧 Features

### Frontend Features:
- ✅ Real-time transaction adding
- ✅ Search by name or category
- ✅ Filter by category dropdown
- ✅ Delete transactions
- ✅ Mood tracking
- ✅ Location tracking
- ✅ Optional backend sync

### Backend Features:
- ✅ CORS enabled for React app
- ✅ JSON API responses
- ✅ Per-user CSV storage
- ✅ Automatic timestamp recording
- ✅ Error handling

## 🎨 Enhanced Dashboard Fields

**New fields added from your Python backend:**

1. **Mood** - Track emotional state during purchase
   - Happy 😊
   - Sad 😢
   - Stressed 😰
   - Neutral 😐

2. **Location** - Where the transaction happened
   - City names, store locations, etc.

3. **Calendar Integration** - (Future feature)
   - Link transactions to calendar events
   - Track spending around events

## 🔄 Data Flow

```
User fills form → React Dashboard
                     ↓
    [Backend Toggle: ON?]
                     ↓
         YES ←              → NO
          ↓                    ↓
    POST to Python      Save to browser
    Save to CSV         (temporary)
          ↓
   Success response
```

## 📝 Notes

- Backend toggle allows switching between local and server storage
- CSV files are created in the same directory as `server.py`
- Each username gets a separate CSV file
- Frontend works independently even if backend is down

## 🎯 Next Steps

1. **Analytics Dashboard** - Use pandas to analyze CSV data
2. **Charts & Graphs** - Visualize spending patterns
3. **Calendar Integration** - Connect to Google Calendar API
4. **ML Predictions** - Predict spending based on mood/location
5. **Export Features** - Download CSV, Excel, PDF reports

## 🐛 Troubleshooting

**Backend not connecting?**
- Check if Python server is running (`http://localhost:8000`)
- Verify CORS is enabled in `server.py`
- Check browser console for errors

**Data not saving?**
- Toggle backend switch to ON
- Check Python server terminal for errors
- Verify user is logged in (username required)

**CSV file not created?**
- Check file permissions in backend folder
- Ensure pandas is installed: `pip install pandas`

---

Made with ❤️ for FinSight Hackathon 2025

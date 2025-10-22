import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, Calendar, PieChart, Plus, Search, Edit, Trash2, RefreshCw, X, MessageCircle, Send } from 'lucide-react'
import transactionAPI from './api/transactionAPI'

function Dashboard({ user, events }) {
  const [transactions, setTransactions] = useState([])

  // Initial income modal state
  const [showInitialIncomeModal, setShowInitialIncomeModal] = useState(false)
  const [initialIncome, setInitialIncome] = useState('')

  // Update income modal state
  const [showUpdateIncomeModal, setShowUpdateIncomeModal] = useState(false)
  const [updateIncomeData, setUpdateIncomeData] = useState({
    amount: '',
    source: 'Salary',
    date: new Date().toISOString().split('T')[0]
  })

  // Form state - Enhanced with mood and location from Python backend
  const [formData, setFormData] = useState({
    type: 'Expense',
    name: '',
    amount: '',
    category: 'Food',
    date: '2025-10-11',
    mood: 'Neutral',
    location: ''
  })

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [useBackend, setUseBackend] = useState(true) // Backend is ON by default - saves to Python server

  // Finance chat state
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  
  // Get next 5 upcoming events
  const getUpcomingEvents = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= today
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5)
  }
  
  const upcomingEvents = getUpcomingEvents()
  
  // Format date for display
  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    if (date.getTime() === today.getTime()) return 'Today'
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
    
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Calculate spending insights
  const calculateInsights = () => {
    const expenses = transactions.filter(t => t.type === 'Expense')
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    
    // Group by category
    const categorySpending = {}
    expenses.forEach(t => {
      if (!categorySpending[t.category]) {
        categorySpending[t.category] = 0
      }
      categorySpending[t.category] += t.amount
    })
    
    // Convert to array and sort by amount
    const categoryArray = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
    
    return {
      totalExpenses,
      categorySpending: categoryArray
    }
  }

  const insights = calculateInsights()
  const monthlyBudget = 50000
  const budgetUsed = insights.totalExpenses
  const budgetPercentage = (budgetUsed / monthlyBudget * 100).toFixed(1)

  // Debug logging for insights - runs whenever transactions change
  useEffect(() => {
    console.log('📊 Insights Debug:', {
      totalTransactions: transactions.length,
      totalExpenses: insights.totalExpenses,
      categoryCount: insights.categorySpending.length,
      categories: insights.categorySpending.map(c => `${c.category}: ₹${c.amount}`),
      budgetUsed,
      budgetPercentage
    })
  }, [transactions]) // Re-run when transactions change

  // Calculate real-time stats from transactions
  const calculateStats = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalBalance = totalIncome - totalExpenses
    
    // Calculate average transaction amount for this month
    const averageThisMonth = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
      : 0
    
    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      averageThisMonth
    }
  }

  const stats = calculateStats()

  // Load transactions from Python backend on mount (if enabled)
  useEffect(() => {
    if (useBackend && user?.username) {
      console.log('🔄 Loading transactions for user:', user.username)
      loadTransactionsFromBackend()
    }
  }, [user?.username]) // Trigger when username changes

  const loadTransactionsFromBackend = async () => {
    console.log('📥 Fetching transactions from backend...')
    const result = await transactionAPI.getTransactions(user.username)
    console.log('📦 Backend response:', result)
    
    if (result.success && result.data.length > 0) {
      const formattedTransactions = result.data
        .map((t, index) => ({
          id: index + 1,
          date: new Date(t.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          dateObj: new Date(t.Date), // Keep date object for sorting
          name: t.Merchant,
          type: t.Category === 'Salary' ? 'Income' : 'Expense',
          category: t.Category,
          amount: parseFloat(t.Amount),
          mood: t.Mood,
          location: t.Location
        }))
        .sort((a, b) => b.dateObj - a.dateObj) // Sort by date, newest first
      
      console.log('✅ Loaded', formattedTransactions.length, 'transactions (sorted by date)')
      console.log('📝 Transaction types:', {
        income: formattedTransactions.filter(t => t.type === 'Income').length,
        expense: formattedTransactions.filter(t => t.type === 'Expense').length
      })
      console.log('💰 Sample transactions:', formattedTransactions.slice(0, 5))
      console.log('🔍 Expense transactions:', formattedTransactions.filter(t => t.type === 'Expense').slice(0, 5))
      setTransactions(formattedTransactions)
    } else {
      console.log('ℹ️ No transactions found for user:', user.username)
      // New user - show initial income modal
      setShowInitialIncomeModal(true)
    }
  }

  // Handle initial income submission
  const handleInitialIncomeSubmit = async () => {
    if (!initialIncome || parseFloat(initialIncome) <= 0) {
      alert('Please enter a valid income amount!')
      return
    }

    const incomeTransaction = {
      id: 1,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      name: 'Initial Balance',
      type: 'Income',
      category: 'Salary',
      amount: parseFloat(initialIncome),
      mood: 'Happy',
      location: ''
    }

    // Save to backend if enabled
    if (useBackend && user?.username) {
      const backendData = {
        username: user.username,
        merchant: 'Initial Balance',
        amount: initialIncome,
        category: 'Salary',
        mood: 'Happy',
        location: '',
        calendar: ''
      }

      const result = await transactionAPI.addTransaction(backendData)
      if (result.success) {
        console.log('✅ Initial income saved to backend:', result.message)
      } else {
        console.error('❌ Backend save failed:', result.message)
      }
    }

    setTransactions([incomeTransaction])
    setShowInitialIncomeModal(false)
    setInitialIncome('')
  }

  // Handle update income submission
  const handleUpdateIncomeSubmit = async () => {
    if (!updateIncomeData.amount || parseFloat(updateIncomeData.amount) <= 0) {
      alert('Please enter a valid income amount!')
      return
    }

    const incomeTransaction = {
      id: transactions.length + 1,
      date: new Date(updateIncomeData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      name: updateIncomeData.source,
      type: 'Income',
      category: 'Salary',
      amount: parseFloat(updateIncomeData.amount),
      mood: 'Happy',
      location: ''
    }

    // Save to backend if enabled
    if (useBackend && user?.username) {
      const backendData = {
        username: user.username,
        merchant: updateIncomeData.source,
        amount: updateIncomeData.amount,
        category: 'Salary',
        mood: 'Happy',
        location: '',
        calendar: ''
      }

      const result = await transactionAPI.addTransaction(backendData)
      if (result.success) {
        console.log('✅ Income updated and saved to backend:', result.message)
      } else {
        console.error('❌ Backend save failed:', result.message)
      }
    }

    setTransactions([...transactions, incomeTransaction])
    setShowUpdateIncomeModal(false)
    setUpdateIncomeData({
      amount: '',
      source: 'Salary',
      date: new Date().toISOString().split('T')[0]
    })
  }

  // Add transaction handler - Enhanced to support backend
  const handleAddTransaction = async () => {
    if (!formData.name || !formData.amount) {
      alert('Please fill in all required fields!')
      return
    }

    const newTransaction = {
      id: transactions.length + 1,
      date: new Date(formData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      name: formData.name,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      mood: formData.mood,
      location: formData.location
    }

    // Save to Python backend if enabled
    if (useBackend && user?.username) {
      const backendData = {
        username: user.username,
        merchant: formData.name,
        amount: formData.amount,
        category: formData.category,
        mood: formData.mood,
        location: formData.location,
        calendar: '' // Can be linked to calendar events later
      }

      const result = await transactionAPI.addTransaction(backendData)
      if (result.success) {
        console.log('✅ Saved to backend:', result.message)
      } else {
        console.error('❌ Backend save failed:', result.message)
      }
    }

    setTransactions([...transactions, newTransaction])
    
    // Reset form
    setFormData({
      type: 'Expense',
      name: '',
      amount: '',
      category: 'Food',
      date: '2025-10-11',
      mood: 'Neutral',
      location: ''
    })
  }

  // Delete transaction handler
  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  // Finance chat handler
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return

    // Add user message
    const userMessage = { type: 'user', text: chatInput }
    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)

    // Generate AI response based on finance analysis
    const aiResponse = generateFinanceAdvice(chatInput, transactions, stats)
    
    setTimeout(() => {
      setChatMessages([...updatedMessages, { type: 'ai', text: aiResponse }])
    }, 500)

    setChatInput('')
  }

  // Finance AI logic - analyzes transactions and provides investment advice
  const generateFinanceAdvice = (question, transactions, stats) => {
    const lowerQuestion = question.toLowerCase()
    
    // Calculate surplus money (balance - average monthly expenses)
    const monthlyExpenses = stats.totalExpenses
    const surplus = stats.totalBalance - monthlyExpenses
    
    // Get spending patterns
    const insights = calculateInsights()
    const topCategory = insights.categorySpending[0]
    
    // Finance-only responses
    if (lowerQuestion.includes('invest') || lowerQuestion.includes('investment') || lowerQuestion.includes('extra money')) {
      if (surplus <= 0) {
        return `Based on your current balance of ₹${stats.totalBalance.toLocaleString('en-IN')}, I recommend focusing on reducing expenses before investing. Your monthly expenses are ₹${monthlyExpenses.toLocaleString('en-IN')}. Consider cutting down on ${topCategory?.category} spending (₹${topCategory?.amount.toLocaleString('en-IN')}).`
      } else if (surplus < 10000) {
        return `You have a surplus of ₹${surplus.toLocaleString('en-IN')}. I recommend building an emergency fund first. Aim for 3-6 months of expenses (₹${(monthlyExpenses * 3).toLocaleString('en-IN')} - ₹${(monthlyExpenses * 6).toLocaleString('en-IN')}). Consider opening a high-interest savings account or liquid fund.`
      } else if (surplus < 50000) {
        return `Great! You have ₹${surplus.toLocaleString('en-IN')} surplus. Here's my advice:\n\n1. Emergency Fund (50%): ₹${(surplus * 0.5).toLocaleString('en-IN')} in liquid fund\n2. SIP in Index Fund (30%): ₹${(surplus * 0.3).toLocaleString('en-IN')}/month\n3. Fixed Deposit (20%): ₹${(surplus * 0.2).toLocaleString('en-IN')} for stability\n\nThis balanced approach provides safety + growth.`
      } else {
        return `Excellent! With ₹${surplus.toLocaleString('en-IN')} surplus, you have solid investment opportunities:\n\n1. Equity Mutual Funds (40%): ₹${(surplus * 0.4).toLocaleString('en-IN')} - Long-term growth\n2. PPF/ELSS (25%): ₹${(surplus * 0.25).toLocaleString('en-IN')} - Tax saving + returns\n3. Gold ETF (15%): ₹${(surplus * 0.15).toLocaleString('en-IN')} - Hedge against inflation\n4. Emergency Fund (20%): ₹${(surplus * 0.2).toLocaleString('en-IN')} - Liquid fund\n\nConsider starting SIPs for disciplined investing!`
      }
    }
    
    if (lowerQuestion.includes('budget') || lowerQuestion.includes('spend') || lowerQuestion.includes('save')) {
      const budgetPercentage = (monthlyExpenses / stats.totalIncome * 100).toFixed(1)
      return `Your current spending is ${budgetPercentage}% of income. Here's your breakdown:\n\n💰 Income: ₹${stats.totalIncome.toLocaleString('en-IN')}\n💸 Expenses: ₹${stats.totalExpenses.toLocaleString('en-IN')}\n💵 Balance: ₹${stats.totalBalance.toLocaleString('en-IN')}\n\nTop spending category: ${topCategory?.category} (₹${topCategory?.amount.toLocaleString('en-IN')})\n\nRecommendation: Follow 50-30-20 rule - 50% needs, 30% wants, 20% savings. ${budgetPercentage > 70 ? 'Try reducing discretionary spending.' : 'You\'re doing great!'}`
    }
    
    if (lowerQuestion.includes('category') || lowerQuestion.includes('where') || lowerQuestion.includes('spending')) {
      const topThree = insights.categorySpending.slice(0, 3)
      let response = `Your top spending categories:\n\n`
      topThree.forEach((cat, i) => {
        response += `${i + 1}. ${cat.category}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage.toFixed(1)}%)\n`
      })
      response += `\nConsider setting category-wise budgets to control spending.`
      return response
    }
    
    if (lowerQuestion.includes('balance') || lowerQuestion.includes('how much')) {
      return `Current Financial Status:\n\n💰 Total Balance: ₹${stats.totalBalance.toLocaleString('en-IN')}\n📈 Total Income: ₹${stats.totalIncome.toLocaleString('en-IN')}\n📉 Total Expenses: ₹${stats.totalExpenses.toLocaleString('en-IN')}\n💵 Surplus: ₹${surplus.toLocaleString('en-IN')}\n\n${surplus > 0 ? 'You have surplus funds available for investment!' : 'Focus on expense reduction before investing.'}`
    }
    
    if (lowerQuestion.includes('sip') || lowerQuestion.includes('mutual fund')) {
      const recommendedSIP = surplus > 0 ? Math.floor(surplus * 0.3 / 1000) * 1000 : 500
      return `SIP (Systematic Investment Plan) Recommendation:\n\n💡 Suggested monthly SIP: ₹${recommendedSIP.toLocaleString('en-IN')}\n\nBest options:\n1. Nifty 50 Index Fund - Low cost, market returns\n2. Flexi-cap Fund - Diversified equity\n3. ELSS - Tax saving under 80C\n\nStart small, increase gradually. Long-term (5+ years) gives best results!`
    }
    
    if (lowerQuestion.includes('emergency') || lowerQuestion.includes('fund')) {
      const requiredFund = monthlyExpenses * 6
      const currentSavings = surplus > 0 ? surplus : 0
      return `Emergency Fund Analysis:\n\n🎯 Required: ₹${requiredFund.toLocaleString('en-IN')} (6 months expenses)\n💰 Current Surplus: ₹${currentSavings.toLocaleString('en-IN')}\n📊 Gap: ₹${(requiredFund - currentSavings).toLocaleString('en-IN')}\n\nRecommendation: Keep in liquid fund or high-interest savings account for easy access during emergencies.`
    }
    
    // Default finance response
    return `I'm your finance advisor! I can help you with:\n\n💰 Investment advice for surplus funds\n📊 Budget analysis & spending insights\n💵 SIP and mutual fund recommendations\n🎯 Emergency fund planning\n📈 Category-wise spending breakdown\n\nAsk me about your finances, investments, or budgeting!`
  }

  // Filter transactions based on search and category
  const filteredTransactions = transactions.filter(transaction => {
    const name = transaction.merchant || transaction.name || ''
    const category = transaction.category || ''
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All Categories' || category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back! <span className="text-violet-400">Your Financial Overview</span>
        </h1>
        <p className="text-slate-400">Saturday, October 11, 2025</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Balance" 
          amount={`₹${stats.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Wallet className="w-5 h-5 text-violet-400" />}
        />
        <StatCard 
          title="Total Income" 
          amount={`₹${stats.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
        />
        <StatCard 
          title="Total Expenses" 
          amount={`₹${stats.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingDown className="w-5 h-5 text-red-400" />}
        />
        <StatCard 
          title="Average This Month" 
          amount={`₹${stats.averageThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<PieChart className="w-5 h-5 text-violet-400" />}
        />
      </div>

      {/* Transaction Manager */}
      <div className="bg-slate-900 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-violet-400" />
            Transaction Manager
          </h2>
          
          {/* Backend Toggle */}
          <div className="flex items-center gap-4">
            {/* Update Income Button */}
            <button
              onClick={() => setShowUpdateIncomeModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors text-sm"
              title="Add income to update total income"
            >
              <TrendingUp className="w-4 h-4" />
              Update Income
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={loadTransactionsFromBackend}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg transition-colors text-sm"
              title="Reload transactions from backend"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            {/* Backend Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Python Backend:</span>
              <button
                onClick={() => setUseBackend(!useBackend)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  useBackend ? 'bg-violet-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  useBackend ? 'right-0.5' : 'left-0.5'
                }`}></div>
              </button>
              <span className={`text-sm font-semibold ${useBackend ? 'text-green-400' : 'text-slate-500'}`}>
                {useBackend ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Add New Transaction</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              >
                <option>Expense</option>
                <option>Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Merchant/Name</label>
              <input 
                type="text" 
                placeholder="e.g. Grocery Store"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              >
                <option>Food</option>
                <option>Travel</option>
                <option>Transport</option>
                <option>Salary</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Entertainment</option>
                <option>Healthcare</option>
                <option>Others</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Mood 😊</label>
              <select 
                value={formData.mood}
                onChange={(e) => setFormData({...formData, mood: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              >
                <option>Happy</option>
                <option>Sad</option>
                <option>Stressed</option>
                <option>Neutral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Location 📍</label>
              <input 
                type="text" 
                placeholder="e.g. Mumbai"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              />
            </div>
          </div>
          <button 
            onClick={handleAddTransaction}
            className="mt-4 bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction {useBackend && ''}
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
          >
            <option>All Categories</option>
            <option>Food</option>
            <option>Transport</option>
            <option>Salary</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Entertainment</option>
            <option>Healthcare</option>
            <option>Other</option>
          </select>
        </div>

        {/* Transaction Table - Shows most recent 10 transactions */}
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-400">
              Showing most recent 10 transactions {filteredTransactions.length > 10 && `(${filteredTransactions.length} total)`}
            </p>
          </div>
          <table className="w-full">
            <thead className="text-left text-slate-400 text-sm border-b border-slate-800">
              <tr>
                <th className="pb-3">DATE</th>
                <th className="pb-3">NAME</th>
                <th className="pb-3">TYPE</th>
                <th className="pb-3">CATEGORY</th>
                <th className="pb-3">AMOUNT</th>
                <th className="pb-3">NOTES</th>
                <th className="pb-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-slate-800">
                    <td className="py-4">{t.date}</td>
                    <td className="py-4">{t.name}</td>
                    <td className="py-4">
                      <span className={`text-sm ${t.type === 'Income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === 'Income' ? '↑' : '↓'} {t.type}
                      </span>
                    </td>
                    <td className="py-4">{t.category}</td>
                    <td className="py-4">₹{t.amount.toLocaleString()}</td>
                    <td className="py-4 text-slate-500">N/A</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button className="text-slate-400 hover:text-violet-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-slate-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            Upcoming Events & Bills
          </h2>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming events.</p>
              <p className="text-sm mt-2">Add events in the Calendar section</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-violet-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-violet-400 font-medium">
                          {formatEventDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    +{events.length - 5} more events in Calendar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Insights */}
        <div className="bg-slate-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-violet-400" />
            Detailed Insights
            <span className="text-xs bg-violet-600 px-2 py-1 rounded">
              {transactions.length} txns | {insights.categorySpending.length} categories
            </span>
          </h2>
          
          <div className="mb-6">
            <h3 className="text-sm text-slate-400 mb-3">Spending by Category</h3>
            
            {/* Debug Info */}
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs">
              <p className="text-blue-300 font-semibold mb-1">🔍 Debug Info:</p>
              <p className="text-slate-300">Total Transactions: {transactions.length}</p>
              <p className="text-slate-300">Expense Transactions: {transactions.filter(t => t.type === 'Expense').length}</p>
              <p className="text-slate-300">Income Transactions: {transactions.filter(t => t.type === 'Income').length}</p>
              <p className="text-slate-300">Categories Found: {insights.categorySpending.length}</p>
              <p className="text-slate-300">Total Expenses: ₹{insights.totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            
            {insights.categorySpending.length > 0 ? (
              <div className="space-y-3">
                {insights.categorySpending.map((cat) => (
                  <div key={cat.category} className="bg-slate-800 rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-200">
                        {cat.category}
                      </span>
                      <span className="text-sm font-semibold text-violet-400">
                        ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-violet-500 h-2 rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No expenses yet to show insights.</p>
              </div>
            )}
          </div>

          {insights.totalExpenses > 0 && (
            <div>
              <h3 className="text-sm text-slate-400 mb-3 flex items-center justify-between">
                <span>Budget Status</span>
              </h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Monthly Budget</span>
                  <span className="font-semibold">₹{monthlyBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={`text-xs mb-2 ${budgetPercentage > 80 ? 'text-red-400 font-semibold' : budgetPercentage > 60 ? 'text-yellow-400' : 'text-slate-500'}`}>
                  ₹{budgetUsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })} of ₹{monthlyBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })} used
                </div>
                <div className="mt-2 bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${budgetPercentage > 80 ? 'bg-red-500' : budgetPercentage > 60 ? 'bg-yellow-500' : 'bg-violet-500'}`}
                    style={{width: `${Math.min(budgetPercentage, 100)}%`}}
                  ></div>
                </div>
                <div className={`text-xs mt-2 ${budgetPercentage > 80 ? 'text-red-400 font-semibold' : budgetPercentage > 60 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {budgetPercentage}% of budget used
                  {budgetPercentage > 100 && ' - Budget exceeded!'}
                  {budgetPercentage > 80 && budgetPercentage <= 100 && ' - Nearing limit!'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-slate-900 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-violet-400" />
          Monthly Summary
        </h2>
        <div className="text-center py-12 text-slate-500">
          <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No transactions yet to display summary.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12 rounded-lg">
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-violet-500" />
                <span className="font-bold">FinSight</span>
              </div>
              <p className="text-sm text-slate-400">
                All-in-one financial wellness platform helping you manage money smarter.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-violet-400">Dashboard</a></li>
                <li><a href="#" className="hover:text-violet-400">Expenses</a></li>
                <li><a href="#" className="hover:text-violet-400">Calendar</a></li>
                <li><a href="#" className="hover:text-violet-400">Insights</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-violet-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-violet-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-violet-400">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500 mt-8 pt-8 border-t border-slate-800">
            © 2025 FinSight. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Initial Income Modal */}
      {showInitialIncomeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-violet-500/30 animate-fadeIn">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-500/20 p-3 rounded-lg">
                    <Wallet className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Welcome to FinSight!</h2>
                    <p className="text-sm text-slate-400 mt-1">Let's set up your initial balance</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                As a new user, please enter your current total income or starting balance. 
                This will help us track your financial journey.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Initial Income/Balance (₹)
                </label>
                <input
                  type="number"
                  value={initialIncome}
                  onChange={(e) => setInitialIncome(e.target.value)}
                  placeholder="e.g., 50000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 You can add more income or expenses later
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={handleInitialIncomeSubmit}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Set Initial Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Income Modal */}
      {showUpdateIncomeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-green-500/30 animate-fadeIn">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Update Income</h2>
                    <p className="text-sm text-slate-400 mt-1">Add new income to your account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpdateIncomeModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Income Source
                </label>
                <select
                  value={updateIncomeData.source}
                  onChange={(e) => setUpdateIncomeData({...updateIncomeData, source: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                >
                  <option value="Salary">Salary</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Freelance">Freelance Income</option>
                  <option value="Investment">Investment Returns</option>
                  <option value="Gift">Gift/Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={updateIncomeData.amount}
                  onChange={(e) => setUpdateIncomeData({...updateIncomeData, amount: e.target.value})}
                  placeholder="e.g., 50000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={updateIncomeData.date}
                  onChange={(e) => setUpdateIncomeData({...updateIncomeData, date: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              
              <p className="text-xs text-slate-500 mt-2">
                💰 This will add to your Total Income and update your balance
              </p>
            </div>
            
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowUpdateIncomeModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateIncomeSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Add Income
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-6 right-6 bg-violet-600 hover:bg-violet-700 text-white p-4 rounded-full shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 z-40 group"
        title="Finance Assistant"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Finance Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full h-[600px] border border-violet-500/30 animate-fadeIn flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-500/20 p-3 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Finance Assistant</h2>
                    <p className="text-sm text-slate-400 mt-1">AI-powered investment & budgeting advisor</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-400 mt-20">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-violet-500/50" />
                  <h3 className="text-lg font-semibold mb-2">Start a conversation!</h3>
                  <p className="text-sm">Ask me about investments, budgeting, or spending insights.</p>
                  <div className="mt-6 space-y-2 text-xs">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      💡 "How should I invest my extra money?"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      📊 "Show me my spending breakdown"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      💰 "What's my current balance?"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      📈 "Recommend me some SIP plans"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      🎯 "Help me with emergency fund planning"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      💸 "Where am I spending the most?"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      🏦 "How can I save more money?"
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      📉 "Analyze my budget performance"
                    </div>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.type === 'user'
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {msg.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-2 text-violet-400 text-xs font-semibold">
                          <MessageCircle className="w-3 h-3" />
                          Finance AI
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Area */}
            <div className="p-6 border-t border-slate-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Ask about investments, budgeting, savings..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                🤖  analyzes your transactions for personalized advice
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function StatCard({ title, amount, icon }) {
  return (
    <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{amount}</div>
    </div>
  )
}

export default Dashboard

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { Wallet, Calendar as CalendarIcon, LogOut, TrendingUp, User, Settings, HelpCircle, ChevronDown } from 'lucide-react'
import Dashboard from './Dashboard'
import Calendar from './Calendar'
import Insights from './Insights'
import Login from './Login'
import Landing from './Landing'

function App() {
  console.log('🚀 App component loaded!')
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [events, setEvents] = useState([]) // Shared events state

  // Check for existing session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated')
    const savedUser = localStorage.getItem('user')
    const savedEvents = localStorage.getItem('calendarEvents')
    
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(savedUser))
    }
    
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }
  }, [])
  
  // Save events to localStorage whenever they change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendarEvents', JSON.stringify(events))
    }
  }, [events])

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Show welcome notification
    setShowWelcome(true)
    setTimeout(() => setShowWelcome(false), 4000) // Hide after 4 seconds
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Landing />
            )
          } 
        />

        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout} showWelcome={showWelcome}>
                <Dashboard user={user} events={events} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendar"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout} showWelcome={showWelcome}>
                <Calendar events={events} setEvents={setEvents} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/insights"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout} showWelcome={showWelcome}>
                <Insights user={user} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Redirect any unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// Layout component with header
function Layout({ user, onLogout, showWelcome, children }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  
  // Security modals
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [showActiveSessionsModal, setShowActiveSessionsModal] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    darkMode: true,
    compactView: false,
    emailNotifications: true,
    pushNotifications: true,
    billReminders: true,
    currency: 'INR (₹)',
    dateFormat: 'DD/MM/YYYY'
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings
  const handleSaveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setShowSettingsModal(false)
    // Show success toast
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  // Toggle setting
  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Update setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Welcome Notification */}
      {showWelcome && user && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white px-6 py-4 rounded-lg shadow-2xl shadow-violet-500/50 z-50 animate-slide-in border border-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Welcome back, {user.username}! 👋</p>
              <p className="text-xs text-violet-200">You're successfully logged in</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg shadow-2xl shadow-green-500/50 z-50 animate-slide-in border border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Settings Saved! ✓</p>
              <p className="text-xs text-green-200">Your preferences have been updated</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-violet-500" />
              <span className="text-xl font-bold">FinSight</span>
            </div>
            <nav className="flex gap-6">
              <Link to="/" className="hover:text-violet-400 transition-colors">Dashboard</Link>
              <Link to="/calendar" className="hover:text-violet-400 transition-colors">Calendar</Link>
              <Link to="/insights" className="hover:text-violet-400 transition-colors">Insights</Link>
            </nav>
            
            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-700 bg-slate-900">
                    <p className="font-semibold text-white">{user?.username}</p>
                    {user?.email && (
                      <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setShowAccountModal(true)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm"
                    >
                      <User className="w-4 h-4 text-violet-400" />
                      <span>Account Details</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setShowSettingsModal(true)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm"
                    >
                      <Settings className="w-4 h-4 text-violet-400" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setShowHelpModal(true)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm"
                    >
                      <HelpCircle className="w-4 h-4 text-violet-400" />
                      <span>Help & Support</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-700">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        onLogout()
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Account Details Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-violet-400" />
                Account Details
              </h2>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user?.username}</h3>
                  <p className="text-sm text-slate-400">Active User</p>
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide">Username</label>
                  <p className="text-white font-medium mt-1">{user?.username}</p>
                </div>
                {user?.email && (
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Email</label>
                    <p className="text-white font-medium mt-1">{user.email}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide">Account Type</label>
                  <p className="text-violet-400 font-medium mt-1">Premium User</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide">Member Since</label>
                  <p className="text-white font-medium mt-1">October 2025</p>
                </div>
              </div>

              <button
                onClick={() => setShowAccountModal(false)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-400" />
                Settings
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Appearance */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                  Appearance
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dark Mode</span>
                    <button
                      onClick={() => toggleSetting('darkMode')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.darkMode ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        settings.darkMode ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compact View</span>
                    <button
                      onClick={() => toggleSetting('compactView')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.compactView ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        settings.compactView ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                  Notifications
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <button
                      onClick={() => toggleSetting('emailNotifications')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.emailNotifications ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        settings.emailNotifications ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push Notifications</span>
                    <button
                      onClick={() => toggleSetting('pushNotifications')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.pushNotifications ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        settings.pushNotifications ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bill Reminders</span>
                    <button
                      onClick={() => toggleSetting('billReminders')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.billReminders ? 'bg-violet-600' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        settings.billReminders ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                  Currency & Region
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Currency</label>
                    <select 
                      value={settings.currency}
                      onChange={(e) => updateSetting('currency', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Date Format</label>
                    <select 
                      value={settings.dateFormat}
                      onChange={(e) => updateSetting('dateFormat', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                  Security
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                  <button 
                    onClick={() => {
                      setShowSettingsModal(false)
                      setShowChangePasswordModal(true)
                    }}
                    className="w-full text-left text-sm py-2 hover:text-violet-400 transition-colors"
                  >
                    Change Password
                  </button>
                  <button 
                    onClick={() => {
                      setShowSettingsModal(false)
                      setShowTwoFactorModal(true)
                    }}
                    className="w-full text-left text-sm py-2 hover:text-violet-400 transition-colors"
                  >
                    Two-Factor Authentication
                  </button>
                  <button 
                    onClick={() => {
                      setShowSettingsModal(false)
                      setShowActiveSessionsModal(true)
                    }}
                    className="w-full text-left text-sm py-2 hover:text-violet-400 transition-colors"
                  >
                    Active Sessions
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-violet-400" />
                Help & Support
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      alert('Opening support chat...\n\nEmail: support@finsight.com\nPhone: +91-XXXX-XXXX-XX')
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Contact Support</p>
                        <p className="text-xs text-slate-400">Get help from our team</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      alert('Documentation:\n\n1. Getting Started Guide\n2. Feature Tutorials\n3. API Reference\n4. Best Practices\n\nVisit: docs.finsight.com')
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Documentation</p>
                        <p className="text-xs text-slate-400">Learn how to use FinSight</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <details className="bg-slate-800 rounded-lg p-4 cursor-pointer">
                    <summary className="font-medium text-sm">How do I add a transaction?</summary>
                    <p className="text-xs text-slate-400 mt-2">Go to Dashboard, use the Transaction Manager section to add income or expenses.</p>
                  </details>
                  <details className="bg-slate-800 rounded-lg p-4 cursor-pointer">
                    <summary className="font-medium text-sm">How do I create calendar events?</summary>
                    <p className="text-xs text-slate-400 mt-2">Navigate to Calendar page, fill in the event form, and click "Add Event".</p>
                  </details>
                  <details className="bg-slate-800 rounded-lg p-4 cursor-pointer">
                    <summary className="font-medium text-sm">Can I export my data?</summary>
                    <p className="text-xs text-slate-400 mt-2">Yes, data export feature is coming soon in Settings.</p>
                  </details>
                  <details className="bg-slate-800 rounded-lg p-4 cursor-pointer">
                    <summary className="font-medium text-sm">How do I change my budget?</summary>
                    <p className="text-xs text-slate-400 mt-2">Visit Settings → Budget Settings to modify your monthly budget.</p>
                  </details>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/30 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-sm">Need More Help?</h3>
                <p className="text-xs text-slate-300 mb-3">Our support team is here for you</p>
                <div className="space-y-2 text-xs">
                  <p className="flex items-center gap-2">
                    <span className="text-violet-400">📧</span>
                    <span>support@finsight.com</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-violet-400">🕒</span>
                    <span>Mon-Fri, 9AM-6PM IST</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </h2>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              
              {/* Password Requirements */}
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Password must contain:</p>
                <ul className="space-y-1 text-xs text-slate-500">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-600">○</span> One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-600">○</span> One number
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-600">○</span> One special character
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    setShowSuccessToast(true)
                    setTimeout(() => setShowSuccessToast(false), 3000)
                  }}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Two-Factor Authentication
              </h2>
              <button
                onClick={() => setShowTwoFactorModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">2FA Status</p>
                  <p className="text-xs text-slate-400 mt-1">Currently disabled</p>
                </div>
                <div className="w-12 h-6 bg-slate-600 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-violet-600/10 border border-violet-500/30 rounded-lg p-4">
                <p className="text-sm text-violet-300 mb-2">🔒 Enhanced Security</p>
                <p className="text-xs text-slate-400">
                  Enable two-factor authentication to add an extra layer of security to your account.
                </p>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Setup Instructions</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">1</div>
                    <div className="flex-1">
                      <p className="text-sm">Download an authenticator app</p>
                      <p className="text-xs text-slate-400">Google Authenticator or Authy</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">2</div>
                    <div className="flex-1">
                      <p className="text-sm">Scan the QR code</p>
                      <p className="text-xs text-slate-400">Or enter the setup key manually</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">3</div>
                    <div className="flex-1">
                      <p className="text-sm">Enter the 6-digit code</p>
                      <p className="text-xs text-slate-400">From your authenticator app</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowTwoFactorModal(false)
                  alert('2FA setup will be available soon!')
                }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showActiveSessionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Active Sessions
              </h2>
              <button
                onClick={() => setShowActiveSessionsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Info Banner */}
              <div className="bg-violet-600/10 border border-violet-500/30 rounded-lg p-4">
                <p className="text-sm text-violet-300">
                  Manage devices where you're currently logged in. You can log out from any device remotely.
                </p>
              </div>

              {/* Current Session */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-slate-400 uppercase tracking-wide">Current Session</h3>
                <div className="bg-gradient-to-r from-violet-600/20 to-violet-800/20 border border-violet-500/50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className="w-12 h-12 bg-violet-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">Windows • Chrome</p>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active Now</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">IP: 192.168.1.100</p>
                        <p className="text-xs text-slate-400">Location: India • Last active: Just now</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Sessions */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-slate-400 uppercase tracking-wide">Other Sessions</h3>
                <div className="space-y-3">
                  {/* Session 1 */}
                  <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">iPhone 14 • Safari</p>
                          <p className="text-xs text-slate-400 mt-1">IP: 192.168.1.101</p>
                          <p className="text-xs text-slate-400">Location: India • Last active: 2 hours ago</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Session logged out successfully!')}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 bg-red-900/20 hover:bg-red-900/30 rounded-lg"
                      >
                        Logout
                      </button>
                    </div>
                  </div>

                  {/* Session 2 */}
                  <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">iPad Pro • Safari</p>
                          <p className="text-xs text-slate-400 mt-1">IP: 192.168.1.102</p>
                          <p className="text-xs text-slate-400">Location: India • Last active: 1 day ago</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Session logged out successfully!')}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 bg-red-900/20 hover:bg-red-900/30 rounded-lg"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout All */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to logout from all other devices?')) {
                    alert('Logged out from all other devices!')
                  }
                }}
                className="w-full bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 font-semibold py-3 rounded-lg transition-colors"
              >
                Logout All Other Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

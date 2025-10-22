import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import usersAPI from './api/usersAPI'

function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login') // 'login' or 'signup'
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Signup form
  const [signupUsername, setSignupUsername] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Password validation states
  const [passwordFocused, setPasswordFocused] = useState(false)
  const passwordValidations = {
    length: signupPassword.length >= 8,
    uppercase: /[A-Z]/.test(signupPassword),
    lowercase: /[a-z]/.test(signupPassword),
    number: /[0-9]/.test(signupPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(signupPassword),
  }
  const isPasswordValid = Object.values(passwordValidations).every(v => v)
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await usersAPI.login({
        username: loginUsername,
        password: loginPassword
      })
      
      if (result.success) {
        onLogin(result.user)
      } else {
        setError(result.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validate password match
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    // Validate password strength
    if (!isPasswordValid) {
      setError('Password does not meet all requirements')
      return
    }
    
    setLoading(true)
    
    try {
      // Check if email exists
      const emailCheck = await usersAPI.checkEmailExists(signupEmail)
      if (emailCheck.exists) {
        setError('Email already registered')
        setLoading(false)
        return
      }
      
      // Attempt signup
      const result = await usersAPI.signup({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword
      })
      
      if (result.success) {
        setSuccess('Account created successfully! Logging you in...')
        setTimeout(() => {
          onLogin(result.user)
        }, 1500)
      } else {
        setError(result.message || 'Signup failed')
      }
    } catch (err) {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <style>{`
        .form-3d {
          position: relative;
        }

        .wrapper-3d {
          position: relative;
          transform: skewY(-14deg);
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .wrapper-3d li,
        .wrapper-3d button {
          position: relative;
          list-style: none;
          width: 350px;
          z-index: var(--i);
          transition: 0.3s;
          color: white;
          margin-bottom: 2px;
        }

        .input-3d,
        .button-3d {
          width: 100%;
          height: 55px;
          position: relative;
          padding: 14px 20px;
          border: none;
          font-size: 15px;
        }

        .button-3d {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: none;
          cursor: pointer;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        /* 3D Left Side Effect */
        .wrapper-3d li::before,
        .wrapper-3d button::before {
          position: absolute;
          content: '';
          top: 0;
          left: -45px;
          width: 45px;
          height: 55px;
          transform-origin: right;
          transform: skewY(45deg);
          transition: 0.3s;
        }

        /* 3D Top Effect */
        .wrapper-3d li::after,
        .wrapper-3d button::after {
          position: absolute;
          content: '';
          width: 350px;
          height: 45px;
          top: -45px;
          left: 0;
          transform-origin: bottom;
          transform: skewX(45deg);
          transition: 0.3s;
        }

        /* First input - Lightest slate */
        .wrapper-3d li:nth-child(1)::after,
        .wrapper-3d li:nth-child(1)::before {
          background: linear-gradient(135deg, #475569 0%, #3f4856 100%);
        }

        .wrapper-3d li:nth-child(1) .input-3d {
          background: linear-gradient(135deg, #475569 0%, #3f4856 100%);
          outline: none;
          border: none;
          color: white;
        }

        /* Second input - Medium slate */
        .wrapper-3d li:nth-child(2)::after,
        .wrapper-3d li:nth-child(2)::before {
          background: linear-gradient(135deg, #334155 0%, #2d3a4d 100%);
        }

        .wrapper-3d li:nth-child(2) .input-3d {
          background: linear-gradient(135deg, #334155 0%, #2d3a4d 100%);
          outline: none;
          border: none;
          color: white;
        }

        /* Third input - Dark slate */
        .wrapper-3d li:nth-child(3)::after,
        .wrapper-3d li:nth-child(3)::before {
          background: linear-gradient(135deg, #1e293b 0%, #1a2332 100%);
        }

        .wrapper-3d li:nth-child(3) .input-3d {
          background: linear-gradient(135deg, #1e293b 0%, #1a2332 100%);
          outline: none;
          border: none;
          color: white;
        }

        /* Fourth input - Darkest slate */
        .wrapper-3d li:nth-child(4)::after,
        .wrapper-3d li:nth-child(4)::before {
          background: linear-gradient(135deg, #0f172a 0%, #0d1424 100%);
        }

        .wrapper-3d li:nth-child(4) .input-3d {
          background: linear-gradient(135deg, #0f172a 0%, #0d1424 100%);
          outline: none;
          border: none;
          color: white;
        }

        .input-3d::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .input-3d:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
        }

        /* Button 3D effect - violet gradient */
        .wrapper-3d button::before {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .wrapper-3d button::after {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        /* Hover animation - slide left */
        .wrapper-3d li:hover,
        .wrapper-3d button:hover {
          transform: translateX(-25px);
        }

        .button-3d:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
        }

        .button-3d:hover::before,
        .button-3d:hover::after {
          background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
        }

        .button-3d:active {
          transform: translateX(-10px);
        }

        .button-3d:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-3d:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        /* Make sure parent li has position relative */
        .wrapper-3d li {
          position: relative;
        }
      `}</style>

      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/50">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Fin<span className="text-violet-400">Sight</span>
            </h1>
          </div>
          <p className="text-2xl font-bold text-white mb-2">
            {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
          </p>
          <p className="text-slate-400">
            {activeTab === 'login' 
              ? 'Sign in to access your financial dashboard' 
              : 'Join FinSight to manage your finances'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg mb-16 shadow-xl">
          <button
            onClick={() => {
              setActiveTab('login')
              setError('')
              setSuccess('')
              setPasswordFocused(false)
            }}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab('signup')
              setError('')
              setSuccess('')
              setPasswordFocused(false)
            }}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center gap-3 text-red-400 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/40 rounded-lg flex items-center gap-3 text-green-400 shadow-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* 3D Form - Centered with consistent alignment */}
        <div className="flex justify-center mt-8">
          {/* Login Form */}
          {activeTab === 'login' && (
            <form className="form-3d" onSubmit={handleLoginSubmit}>
              <ul className="wrapper-3d">
                <li style={{ '--i': 2 }}>
                  <input
                    className="input-3d"
                    type="text"
                    placeholder="Username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </li>
                <li style={{ '--i': 1 }}>
                  <input
                    className="input-3d"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </li>
                <button className="button-3d" style={{ '--i': 0 }} type="submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </ul>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <form className="form-3d" onSubmit={handleSignupSubmit}>
              <ul className="wrapper-3d">
                <li style={{ '--i': 4 }}>
                  <input
                    className="input-3d"
                    type="text"
                    placeholder="Username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </li>
                <li style={{ '--i': 3 }}>
                  <input
                    className="input-3d"
                    type="email"
                    placeholder="Email (required)"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </li>
                <li style={{ '--i': 2 }}>
                  <input
                    className="input-3d"
                    type="password"
                    placeholder="Password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    required
                  />
                </li>
                <li style={{ '--i': 1 }}>
                  <input
                    className="input-3d"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </li>
                <button 
                  className="button-3d" 
                  style={{ '--i': 0 }} 
                  type="submit" 
                  disabled={loading || !isPasswordValid || signupPassword !== confirmPassword}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </ul>
            </form>
          )}
        </div>

        {/* Password Requirements - Below 3D form for signup */}
        {activeTab === 'signup' && passwordFocused && (
          <div className="mt-8 p-5 bg-slate-800/60 border border-slate-700/50 rounded-xl backdrop-blur-sm shadow-xl">
            <p className="text-sm text-slate-300 font-semibold mb-4">Password Requirements:</p>
            <div className="space-y-2.5">
              <PasswordRequirement met={passwordValidations.length} text="At least 8 characters" />
              <PasswordRequirement met={passwordValidations.uppercase} text="One uppercase letter (A-Z)" />
              <PasswordRequirement met={passwordValidations.lowercase} text="One lowercase letter (a-z)" />
              <PasswordRequirement met={passwordValidations.number} text="One number (0-9)" />
              <PasswordRequirement met={passwordValidations.special} text="One special character (!@#$%...)" />
            </div>
          </div>
        )}

        {/* Password Match Indicator for signup */}
        {activeTab === 'signup' && confirmPassword && (
          <div className="mt-5 flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800/40">
            {signupPassword === confirmPassword ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">Passwords match</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">Passwords do not match</span>
              </>
            )}
          </div>
        )}

        {/* Footer Text */}
        <div className="text-center mt-10">
          <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
            {activeTab === 'login' ? (
              <>
                <span className="text-lg">🔒</span>
                <span>Secure login with authentication</span>
              </>
            ) : (
              <>
                <span className="text-lg">🔐</span>
                <span>All data is encrypted and secure</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// Password Requirement Component
function PasswordRequirement({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-400' : 'text-slate-400'}`}>
        {text}
      </span>
    </div>
  )
}

export default Login
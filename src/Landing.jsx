import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingDown, PiggyBank, Users, Wallet, Calendar, Brain, ChevronRight, ArrowRight, Zap, Shield, Eye } from 'lucide-react';
import FallingIcons from './FallingIcons';

const Landing = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const features = [
    {
      icon: <TrendingDown className="w-8 h-8" />,
      title: "Predicts Risky Spending",
      description: "AI analyzes patterns to warn you before overspending happens"
    },
    {
      icon: <PiggyBank className="w-8 h-8" />,
      title: "Proactive Savings",
      description: "Smart strategies that adapt to your lifestyle and goals"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Fair Group Expenses",
      description: "Automatically manages and splits shared costs equitably"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Voice AI Assistant",
      description: "Integrated with Google Wallet for seamless voice commands"
    }
  ];

  const steps = [
    { title: "Connect Wallet & Calendar", description: "Link your financial accounts and schedule" },
    { title: "AI Analyzes Context", description: "FinSight learns your patterns and behavior" },
    { title: "Proactive Recommendations", description: "Get insights before you need them" }
  ];

  return (
    <div className="bg-slate-950 text-white overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-violet-600/30 rounded-full blur-3xl"
          style={{
            top: '10%',
            left: '20%',
            transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
          style={{
            bottom: '20%',
            right: '15%',
            transform: `translate(${-mousePos.x * 0.015}px, ${-mousePos.y * 0.015}px)`
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)`
          }}
        />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div 
            className="inline-block mb-6 opacity-0 animate-fadeIn"
            style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">AI-Powered Financial Intelligence</span>
            </div>
          </div>

          <h1 
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 opacity-0 animate-fadeIn"
            style={{ 
              animationDelay: '0.4s', 
              animationFillMode: 'forwards',
              background: 'linear-gradient(to right, #fff, #a78bfa, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Smarter Spending.<br />Proactive Savings.
          </h1>

          <p 
            className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto opacity-0 animate-fadeIn"
            style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
          >
            FinSight helps you predict risky spending, suggest savings strategies, and manage shared expenses — all in one AI-powered dashboard.
          </p>

          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fadeIn"
            style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
          >
            <button 
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              Try Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105">
              Join Waitlist
            </button>
          </div>
        </div>

        {/* Falling physics-based icons */}
        <FallingIcons
          trigger="auto"
          gravity={0.56}
          mouseConstraintStiffness={0.9}
          backgroundColor="transparent"
          wireframes={false}
          icons={[
            {
              icon: (
                <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Wallet className="w-6 h-6 text-violet-400" />
                </div>
              ),
              className: 'icon-wallet-1'
            },
            {
              icon: (
                <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
              ),
              className: 'icon-brain-1'
            },
            {
              icon: (
                <div className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
              ),
              className: 'icon-shield-1'
            },
            {
              icon: (
                <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Wallet className="w-5 h-5 text-violet-400" />
                </div>
              ),
              className: 'icon-wallet-2'
            },
            {
              icon: (
                <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
              ),
              className: 'icon-brain-2'
            },
            {
              icon: (
                <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
              ),
              className: 'icon-shield-2'
            }
          ]}
        />
      </section>

      {/* Problem Section */}
      <section className="relative py-32 px-6">
        <div 
          className="max-w-4xl mx-auto text-center"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollY - 400) / 300)),
            transform: `translateY(${Math.max(0, 100 - (scrollY - 400) / 5)}px)`
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent blur-3xl" />
            <h2 className="text-5xl md:text-6xl font-bold mb-8 relative">
              Most people spend <span className="text-violet-400">reactively</span>.
            </h2>
            <p className="text-2xl text-slate-300 relative">
              FinSight helps you act <span className="text-blue-400 font-semibold">proactively</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-20">
            Intelligent Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-violet-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20"
                style={{
                  opacity: Math.min(1, Math.max(0, (scrollY - 1000 - i * 100) / 200)),
                  transform: `translateY(${Math.max(0, 50 - (scrollY - 1000 - i * 100) / 4)}px)`
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-20">How It Works</h2>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-600 via-blue-600 to-indigo-600 hidden md:block" />
            
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative mb-16 last:mb-0"
                style={{
                  opacity: Math.min(1, Math.max(0, (scrollY - 1800 - i * 200) / 200)),
                  transform: `translateX(${Math.max(0, 50 - (scrollY - 1800 - i * 200) / 4)}px)`
                }}
              >
                <div className={`flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xl">
                        {i + 1}
                      </div>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                    </div>
                    <p className="text-slate-400 text-lg">{step.description}</p>
                  </div>
                  <div className="hidden md:block w-8 h-8 rounded-full bg-violet-600 border-4 border-slate-950 z-10" />
                  <div className="hidden md:block flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">See FinSight in Action</h2>
            <p className="text-xl text-slate-300">Experience the future of financial management</p>
          </div>
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-600/20 backdrop-blur-xl border border-white/10 p-2">
            <div className="aspect-video rounded-2xl bg-slate-900/50 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-20 h-20 mx-auto mb-4 text-violet-400" />
                <p className="text-2xl text-slate-400">Demo Preview</p>
                <p className="text-slate-500 mt-2">Interactive prototype coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-16 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 backdrop-blur-xl border border-white/10">
            <h2 className="text-5xl font-bold mb-6">Ready to Take Control?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of users making smarter financial decisions with AI
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="group px-10 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full font-semibold text-xl hover:shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 mx-auto"
            >
              Get Started Now
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">FinSight</h3>
              <p className="text-slate-400">Your AI-Powered Financial Compass</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">LinkedIn</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-slate-500">
            Built with passion by innovators at Hackathon 2025
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;

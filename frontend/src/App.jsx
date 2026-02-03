import React, { useState, useEffect, useRef } from 'react';

const AgenticAICopilot = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const heroRef = useRef(null);

  // Scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = (window.scrollY / fullHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🎙',
      title: 'Voice-First Intelligence',
      description: 'Speak naturally in Hinglish. No training, no menus. Just conversation.',
      visual: 'Waveform'
    },
    {
      icon: '🧠',
      title: 'Learns Your Business',
      description: 'Remembers every customer, every transaction. Builds your business memory.',
      visual: 'Network'
    },
    {
      icon: '⚡',
      title: 'Acts Autonomously',
      description: 'Sends reminders, creates invoices, follows up. While you focus on growth.',
      visual: 'Actions'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Indian SMBs' },
    { value: '₹50Cr+', label: 'Managed Monthly' },
    { value: '94%', label: 'Time Saved' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  const useCases = [
    {
      industry: 'Construction',
      challenge: 'Tracking material purchases and labor payments',
      solution: 'AI automatically logs expenses, manages supplier invoices, sends payment reminders',
      result: '40% faster payment collection'
    },
    {
      industry: 'Retail',
      challenge: 'Managing inventory and customer orders',
      solution: 'Voice commands update stock, create invoices, WhatsApp order confirmations',
      result: 'Zero inventory errors'
    },
    {
      industry: 'Services',
      challenge: 'Following up with clients for repeat business',
      solution: 'AI tracks service history, sends personalized follow-ups automatically',
      result: '3x customer retention'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] overflow-x-hidden font-sans relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,800;1,9..144,300&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }
        
        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Fraunces', serif;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 30px) scale(1.02); }
        }

        @keyframes pulse {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-pulse-bar {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }

        .animate-rotate {
          animation: rotate 20s linear infinite;
        }

        .grain-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #0a0808;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 159, 67, 0.3);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 159, 67, 0.5);
        }

        ::selection {
          background: rgba(255, 159, 67, 0.3);
          color: #f5f3f0;
        }

        .gradient-text {
          background: linear-gradient(135deg, #f5f3f0 0%, #ffb366 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-card {
          background: rgba(26, 15, 10, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 159, 67, 0.15);
        }

        .glass-card:hover {
          background: rgba(26, 15, 10, 0.6);
          border-color: rgba(255, 159, 67, 0.25);
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Ambient Background */}
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 bg-[#ff9f43] -top-[250px] -right-[150px] animate-float" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 bg-[#ff6b35] -bottom-[200px] -left-[150px] animate-float" style={{ animationDelay: '5s' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[150px] opacity-15 bg-[#ffb366] top-1/2 left-1/2 animate-float" style={{ animationDelay: '10s' }} />
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#1a0f0a]/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#ff9f43] to-[#ffb366] transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-8 py-6 backdrop-blur-xl bg-[#0a0808]/80 border-b border-[#ff9f43]/10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold gradient-text">Saathi AI</div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors">Features</a>
            <a href="#how-it-works" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors">How It Works</a>
            <a href="#use-cases" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors">Use Cases</a>
            <button className="px-6 py-2.5 bg-[#ff9f43] text-[#0a0808] rounded-lg font-semibold hover:bg-[#ffb366] transition-all hover:scale-105">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex flex-col justify-center items-center text-center px-8 pt-32 pb-20 relative z-10">
        <div className="mb-6 px-6 py-2 bg-[#ff9f43]/10 border border-[#ff9f43]/30 rounded-full text-[#ff9f43] text-sm font-semibold animate-fadeInUp">
          🇮🇳 Built for Indian SMBs
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 opacity-0 animate-fadeInUp leading-[1.05] max-w-5xl" style={{ animationDelay: '0.2s' }}>
          <span className="gradient-text">Your Business.</span><br />
          <span className="gradient-text">Run by AI.</span><br />
          <span className="text-[#f5f3f0]">Built for India.</span>
        </h1>

        <p className="text-xl md:text-2xl text-[#a89d94] mb-12 max-w-3xl opacity-0 animate-fadeInUp leading-relaxed" style={{ animationDelay: '0.4s' }}>
          The only business co-pilot that speaks Hinglish, works on WhatsApp, and understands how Indian businesses actually operate.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <button className="group px-8 py-4 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold text-lg hover:bg-[#ffb366] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,159,67,0.4)]">
            Start Free — No Credit Card
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <button className="px-8 py-4 glass-card text-[#f5f3f0] rounded-xl font-semibold text-lg hover:scale-105 transition-all">
            Watch 2-Min Demo
          </button>
        </div>

        {/* Hero Visual - AI Pulse */}
        <div className="w-full max-w-2xl h-40 flex items-center justify-center gap-2 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
          {[35, 55, 75, 95, 115, 135, 115, 95, 75, 55, 35, 55, 75, 95, 75, 55, 35].map((height, idx) => (
            <div
              key={idx}
              className="w-2 bg-gradient-to-t from-[#ff9f43] to-[#ffb366] rounded-full animate-pulse-bar shadow-[0_0_20px_rgba(255,159,67,0.5)]"
              style={{
                height: `${height}px`,
                animationDelay: `${idx * 0.08}s`
              }}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#ff9f43]/40 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-[#ff9f43] rounded-full animate-glow" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-8 text-center transition-all hover:scale-105"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-[#a89d94] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Intelligence That Feels Natural
            </h2>
            <p className="text-xl text-[#a89d94] max-w-3xl mx-auto">
              No dashboards. No training. Just conversation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`glass-card rounded-3xl p-10 transition-all duration-500 cursor-pointer ${
                  activeFeature === idx ? 'scale-105 border-[#ff9f43]/40' : ''
                }`}
                onMouseEnter={() => setActiveFeature(idx)}
              >
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-[#f5f3f0]">{feature.title}</h3>
                <p className="text-[#a89d94] leading-relaxed mb-6">{feature.description}</p>
                
                {/* Visual Indicator */}
                <div className="h-32 flex items-center justify-center">
                  {feature.visual === 'Waveform' && (
                    <div className="flex gap-1">
                      {[20, 35, 50, 65, 50, 35, 20].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-[#ff9f43] rounded-full animate-pulse-bar"
                          style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                  {feature.visual === 'Network' && (
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 border-2 border-[#ff9f43]/30 rounded-full animate-pulse" />
                      <div className="absolute inset-4 border-2 border-[#ff9f43]/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute inset-8 border-2 border-[#ff9f43] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-[#ff9f43] rounded-full shadow-[0_0_20px_rgba(255,159,67,0.8)]" />
                      </div>
                    </div>
                  )}
                  {feature.visual === 'Actions' && (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="h-2 bg-[#ff9f43]/30 rounded-full w-full" />
                      <div className="h-2 bg-[#ff9f43]/50 rounded-full w-4/5 animate-shimmer" 
                           style={{ background: 'linear-gradient(90deg, rgba(255,159,67,0.2) 0%, rgba(255,159,67,0.8) 50%, rgba(255,159,67,0.2) 100%)', backgroundSize: '200% 100%' }} />
                      <div className="h-2 bg-[#ff9f43]/30 rounded-full w-3/5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-8 relative z-10 bg-gradient-to-b from-transparent via-[#1a0f0a]/30 to-transparent">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Simple. Powerful. Yours.
            </h2>
          </div>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-[#ff9f43] font-bold text-lg mb-4">STEP 1</div>
                <h3 className="text-4xl font-bold mb-6 text-[#f5f3f0]">
                  Just Speak
                </h3>
                <p className="text-xl text-[#a89d94] leading-relaxed mb-6">
                  "Rahul ko kal reminder bhejna"
                </p>
                <p className="text-[#a89d94] leading-relaxed">
                  No forms. No buttons. No learning curve. The AI understands natural Hinglish commands and gets to work immediately.
                </p>
              </div>
              <div className="glass-card rounded-3xl p-12 h-80 flex items-center justify-center">
                <div className="text-6xl">🎙</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="glass-card rounded-3xl p-12 h-80 flex items-center justify-center order-2 md:order-1">
                <div className="space-y-4 w-full">
                  <div className="glass-card rounded-xl p-4 border-[#ff9f43]/30">
                    <div className="font-semibold mb-1">Customer: Rahul</div>
                    <div className="text-sm text-[#a89d94]">Amount: ₹500</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 border-[#ff9f43]/30">
                    <div className="font-semibold mb-1">Action: Send Reminder</div>
                    <div className="text-sm text-[#a89d94]">Via: WhatsApp</div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-[#ff9f43] font-bold text-lg mb-4">STEP 2</div>
                <h3 className="text-4xl font-bold mb-6 text-[#f5f3f0]">
                  AI Understands
                </h3>
                <p className="text-[#a89d94] leading-relaxed">
                  It knows who Rahul is, what he owes, and when to follow up. Every transaction is remembered. Every customer is known.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-[#ff9f43] font-bold text-lg mb-4">STEP 3</div>
                <h3 className="text-4xl font-bold mb-6 text-[#f5f3f0]">
                  Approve & Done
                </h3>
                <p className="text-[#a89d94] leading-relaxed">
                  Review the action, approve with one tap, and it's sent. Or let it run autonomously while you focus on what matters.
                </p>
              </div>
              <div className="glass-card rounded-3xl p-12 h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl mb-4">✓</div>
                  <div className="text-[#4cd964] font-semibold">Reminder Sent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-32 px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Built for Real India
            </h2>
            <p className="text-xl text-[#a89d94] max-w-3xl mx-auto">
              From construction to retail, service businesses to manufacturing
            </p>
          </div>

          <div className="space-y-8">
            {useCases.map((useCase, idx) => (
              <div
                key={idx}
                className="glass-card rounded-3xl p-10 hover:scale-[1.02] transition-all"
              >
                <div className="grid md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-[#ff9f43] font-bold text-sm mb-2">INDUSTRY</div>
                    <div className="text-2xl font-bold">{useCase.industry}</div>
                  </div>
                  <div>
                    <div className="text-[#ff9f43] font-bold text-sm mb-2">CHALLENGE</div>
                    <div className="text-[#a89d94]">{useCase.challenge}</div>
                  </div>
                  <div>
                    <div className="text-[#ff9f43] font-bold text-sm mb-2">SOLUTION</div>
                    <div className="text-[#a89d94]">{useCase.solution}</div>
                  </div>
                  <div>
                    <div className="text-[#ff9f43] font-bold text-sm mb-2">RESULT</div>
                    <div className="text-[#4cd964] font-bold text-xl">{useCase.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 relative z-10">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="glass-card rounded-[3rem] p-16 border-2 border-[#ff9f43]/30">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 gradient-text leading-tight">
              Your Business Deserves<br />an AI That Gets It
            </h2>
            <p className="text-xl text-[#a89d94] mb-12 max-w-2xl mx-auto leading-relaxed">
              Join 10,000+ Indian businesses running smarter with AI. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-10 py-5 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold text-xl hover:bg-[#ffb366] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,159,67,0.5)]">
                Start Free Trial
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button className="px-10 py-5 glass-card text-[#f5f3f0] rounded-xl font-bold text-xl hover:scale-105 transition-all">
                Talk to Sales
              </button>
            </div>
            <div className="mt-8 text-sm text-[#a89d94]">
              ✓ No credit card required  ✓ 14-day free trial  ✓ Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 border-t border-[#ff9f43]/10 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">Saathi AI</div>
              <p className="text-[#a89d94] text-sm">
                AI-powered business co-pilot built for Indian SMBs
              </p>
            </div>
            <div>
              <div className="font-bold mb-4">Product</div>
              <div className="space-y-2 text-[#a89d94]">
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Features</div>
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Pricing</div>
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Security</div>
              </div>
            </div>
            <div>
              <div className="font-bold mb-4">Company</div>
              <div className="space-y-2 text-[#a89d94]">
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">About</div>
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Blog</div>
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Careers</div>
              </div>
            </div>
            <div>
              <div className="font-bold mb-4">Support</div>
              <div className="space-y-2 text-[#a89d94]">
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Help Center</div>
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">Contact</div>
                <div className="hover:text-[#ff9f43] transition-colors cursor-pointer">WhatsApp</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#ff9f43]/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[#a89d94] text-sm">
              © 2026 Saathi AI. Built in India, for India.
            </div>
            <div className="flex gap-6 text-[#a89d94] text-sm">
              <span className="hover:text-[#ff9f43] transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-[#ff9f43] transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-[#ff9f43] transition-colors cursor-pointer">Cookigotes</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AgenticAICopilot;
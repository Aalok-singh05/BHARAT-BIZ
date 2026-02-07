import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './index.css';

const AgenticAICopilot = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef(null);

  // Spotlight Logic (Tracks mouse position on cards)
  const handleMouseMove = (e) => {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  };

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

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] overflow-x-hidden relative selection:bg-[#ff9f43]/30">
      
      {/* Ambient Background - Animated Orbs */}
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 bg-[#ff9f43] -top-[250px] -right-[150px] animate-float" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 bg-[#ff6b35] -bottom-[200px] -left-[150px] animate-float" style={{ animationDelay: '5s' }} />
      </div>

      <div className="grain-overlay" />

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#1a0f0a]/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#ff9f43] to-[#ffb366] transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-6 backdrop-blur-xl bg-[#0a0808]/80 border-b border-[#ff9f43]/10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold gradient-text no-underline">Saathi AI</Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#demo" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors text-sm font-medium">
              How it works
            </a>
            <a href="#features" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors text-sm font-medium">
              Features
            </a>
            
            <Link to="/dashboard" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors text-sm font-medium">
              Dashboard
            </Link>

            {/* Split Auth Buttons */}
            <div className="flex items-center gap-4 ml-2">
              <Link to="/login">
                <button className="text-[#f5f3f0] hover:text-[#ff9f43] font-semibold transition-colors">
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button className="px-5 py-2.5 bg-[#ff9f43] text-[#0a0808] rounded-lg font-bold hover:bg-[#ffb366] transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,159,67,0.3)]">
                  Start Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-20 relative z-10">
        <div className="mb-6 px-6 py-2 bg-[#ff9f43]/10 border border-[#ff9f43]/30 rounded-full text-[#ff9f43] text-sm font-semibold animate-fadeInUp">
          🇮🇳 Built for Indian SMBs
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fadeInUp leading-[1.1] max-w-5xl">
          <span className="gradient-text">Bharat BIZ.</span><br />
          <span className="gradient-text">Run by AI.</span><br />
          <span className="text-[#f5f3f0]">Business Ab Jeetega</span>
        </h1>

        <p className="text-lg md:text-2xl text-[#a89d94] mb-12 max-w-3xl animate-fadeInUp leading-relaxed" style={{ animationDelay: '0.2s' }}>
          The only business co-pilot that speaks Hinglish and understands how Indian businesses actually operate.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <button className="group px-8 py-4 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold text-lg hover:bg-[#ffb366] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,159,67,0.4)]">
            Start Free Trial
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <Link to="/Dashboard" className="px-8 py-4 glass-card rounded-xl font-bold text-lg hover:scale-105 transition-all flex items-center justify-center">
            Merchant Dashboard
          </Link>
        </div>

        {/* Hero Visual - Pulse Bars */}
        <div className="w-full max-w-2xl h-32 flex items-end justify-center gap-1.5 md:gap-3 opacity-80">
          {[40, 70, 45, 90, 65, 100, 80, 110, 95, 120, 85, 60, 40].map((height, idx) => (
            <div
              key={idx}
              className="w-2 md:w-3 bg-gradient-to-t from-[#ff9f43] to-[#ffb366] rounded-full animate-pulse-bar shadow-[0_0_15px_rgba(255,159,67,0.3)]"
              style={{ height: `${height}px`, animationDelay: `${idx * 0.1}s` }}
            />
          ))}
        </div>
      </section>
      {/* ... after Hero Section ... */}

      {/* NEW: LIVE LOGIC PLAYGROUND */}
      <section id= "demo" className="py-24 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 gradient-text">It Speaks Your Language</h2>
            <p className="text-[#a89d94]">No English? No problem. Saathi understands business Hinglish.</p>
          </div>

          {/* THE PLAYGROUND CONTAINER */}
          <div className="glass-card spotlight-card p-1 rounded-[2rem] border border-[#ff9f43]/20 relative overflow-hidden" onMouseMove={handleMouseMove}>
            {/* Spotlight Glow */}
            <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                 style={{ background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,159,67,0.1), transparent 40%)` }}
            />

            <div className="bg-[#0a0808]/80 backdrop-blur-xl rounded-[1.8rem] p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center relative z-10">
              
              {/* LEFT: THE INPUT (What you say) */}
              <div className="space-y-8">
                <div className="flex flex-col gap-4">
                  <div className="text-[#ff9f43] text-sm font-bold tracking-widest uppercase">You Say (Voice Note)</div>
                  
                  {/* Animated Chat Bubble */}
                  <div className="relative group cursor-default">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff9f43] to-[#ff6b35] rounded-2xl opacity-20 blur group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-[#1a1512] border border-[#ff9f43]/30 p-6 rounded-2xl rounded-bl-none">
                      <p className="text-2xl md:text-3xl font-medium text-[#f5f3f0] leading-tight">
                        "Rahul bhai ka <span className="text-[#ff9f43]">500 rupay</span> likh lo, <span className="text-[#4cd964]">cement</span> ka udhaar hai."
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[#a89d94] text-sm">
                        <span className="animate-pulse">🎤</span> Recording...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-3">
                  {['Understands Accents', 'Detects Context (Udhaar vs Jama)', 'Auto-Categorizes Items'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[#a89d94]">
                      <div className="w-5 h-5 rounded-full bg-[#ff9f43]/10 flex items-center justify-center text-[#ff9f43] text-xs">✓</div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: THE OUTPUT (What Saathi Does) */}
              <div className="relative">
                {/* Connection Line (Visual Connector) */}
                <div className="absolute top-1/2 -left-6 md:-left-12 w-6 md:w-12 h-[2px] bg-gradient-to-r from-[#ff9f43]/50 to-transparent hidden md:block"></div>
                <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-[#ff9f43] rounded-full shadow-[0_0_10px_#ff9f43] hidden md:block animate-pulse"></div>

                <div className="text-[#4cd964] text-sm font-bold tracking-widest uppercase mb-4">Saathi Does</div>

                {/* The Ledger Card */}
                <div className="glass-card bg-[#121212] border border-[#ff9f43]/20 rounded-xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  {/* Card Header */}
                  <div className="bg-[#1a1512] p-4 border-b border-white/5 flex justify-between items-center">
                    <div className="font-bold text-[#f5f3f0]">New Entry Added</div>
                    <div className="px-2 py-1 bg-[#ff9f43]/20 text-[#ff9f43] text-xs rounded border border-[#ff9f43]/30">Pending</div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <div>
                        <div className="text-[#a89d94] text-xs uppercase">Customer</div>
                        <div className="text-xl font-bold text-white">Rahul Bhai</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#a89d94] text-xs uppercase">Amount</div>
                        <div className="text-2xl font-bold text-[#ff9f43]">₹500.00</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[#a89d94] text-xs uppercase mb-1">Type</div>
                        <div className="flex items-center gap-2 text-[#f5f3f0]">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Credit (Udhaar)
                        </div>
                      </div>
                      <div>
                        <div className="text-[#a89d94] text-xs uppercase mb-1">Item</div>
                        <div className="text-[#f5f3f0]">Cement Bag</div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-4 mt-2 flex gap-3">
                      <button className="flex-1 py-2 bg-[#ff9f43] text-black text-xs font-bold rounded hover:bg-[#ffb366] transition-colors">
                        Send WhatsApp Bill
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating "AI Confidence" Tag */}
                <div className="absolute -bottom-4 -right-4 glass-card px-4 py-2 rounded-full text-xs text-[#4cd964] border border-[#4cd964]/30 shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <span>⚡</span> AI Confidence: 99.8%
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-8 text-center">
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-[#a89d94] text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid WITH SPOTLIGHT */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">Intelligence That Feels Natural</h2>
            <p className="text-[#a89d94] text-xl">No menus. No training. Just conversation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setActiveFeature(idx)}
                className={`glass-card spotlight-card rounded-3xl p-10 transition-all duration-500 relative overflow-hidden group ${
                  activeFeature === idx ? 'border-[#ff9f43]/50 scale-[1.02]' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {/* Spotlight Gradient Layer */}
                <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                     style={{
                       background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,159,67,0.15), transparent 40%)`
                     }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-5xl mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-[#a89d94] mb-8">{feature.description}</p>
                  <div className="h-24 flex items-center justify-center">
                    {feature.visual === 'Waveform' && (
                      <div className="flex gap-1.5 items-center">
                        {[30, 50, 40, 60, 30].map((h, i) => (
                          <div key={i} className="w-1.5 bg-[#ff9f43] rounded-full animate-pulse-bar" style={{ height: `${h}px`, animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                    )}
                    {feature.visual === 'Network' && <div className="w-16 h-16 rounded-full border-4 border-[#ff9f43]/30 animate-ping" />}
                    {feature.visual === 'Actions' && <div className="w-full h-2 bg-[#ff9f43]/20 rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-[#ff9f43] animate-shimmer" style={{ width: '40%' }} /></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* NEW: TRUST & ECOSYSTEM SECTION */}
      <section className="py-24 px-6 relative z-10 border-t border-[#ff9f43]/10">
        <div className="max-w-[1200px] mx-auto">
          
          {/* 1. THE ECOSYSTEM ROW */}
          <div className="mb-24">
            <p className="text-center text-[#a89d94] mb-8 text-sm uppercase tracking-widest">Works seamlessly with</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {/* WhatsApp */}
              <div className="flex items-center gap-2 text-xl font-bold text-[#25D366]">
                <span className="text-3xl">💬</span> WhatsApp
              </div>
              {/* UPI */}
              {/*<div className="flex items-center gap-2 text-xl font-bold text-[#f5f3f0]">
                <span className="text-3xl">₹</span> UPI
              </div>
              
              <div className="flex items-center gap-2 text-xl font-bold text-[#f5b041]">
                <span className="text-3xl">📊</span> Tally/Vyapar
              </div>*/}
            </div>
          </div>

          {/* 2. AUDIO TESTIMONIALS */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Card 1 */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff9f43]"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2a2420] flex items-center justify-center text-xl border border-[#ff9f43]/30">
                  👨🏽‍💼
                </div>
                <div>
                  <div className="text-[#f5f3f0] font-bold text-lg">Rajesh Kumar</div>
                  <div className="text-[#a89d94] text-sm mb-4">Kirana Store Owner, Jaipur</div>
                  
                  {/* Fake Audio Player UI */}
                  <div className="bg-[#1a1512] p-3 rounded-xl flex items-center gap-3 border border-[#ff9f43]/10 w-full md:w-[300px]">
                    <button className="w-8 h-8 rounded-full bg-[#ff9f43] flex items-center justify-center text-black pl-1 hover:scale-105 transition-transform">
                      ▶
                    </button>
                    <div className="flex-1 h-8 flex items-center gap-0.5">
                      {/* Audio Waveform Animation */}
                      {[40, 70, 30, 80, 50, 90, 40, 60, 30, 50, 70, 40].map((h, i) => (
                        <div key={i} className="w-1 bg-[#ff9f43]/50 rounded-full animate-pulse-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#a89d94]">0:14</div>
                  </div>
                  
                  <p className="mt-4 text-[#a89d94] italic">"Earlier I used to spend 2 hours matching bills. Now I just speak to Saathi, and it's done in 5 minutes."</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#4cd964]"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1a2e1e] flex items-center justify-center text-xl border border-[#4cd964]/30">
                  👩🏽
                </div>
                <div>
                  <div className="text-[#f5f3f0] font-bold text-lg">Priya Sharma</div>
                  <div className="text-[#a89d94] text-sm mb-4">Boutique Owner, Delhi</div>
                  
                  {/* Fake Audio Player UI */}
                  <div className="bg-[#1a1512] p-3 rounded-xl flex items-center gap-3 border border-[#4cd964]/10 w-full md:w-[300px]">
                    <button className="w-8 h-8 rounded-full bg-[#4cd964] flex items-center justify-center text-black pl-1 hover:scale-105 transition-transform">
                      ▶
                    </button>
                    <div className="flex-1 h-8 flex items-center gap-0.5">
                      {[50, 30, 60, 20, 70, 40, 80, 30, 50, 60, 40, 70].map((h, i) => (
                        <div key={i} className="w-1 bg-[#4cd964]/50 rounded-full animate-pulse-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}></div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#a89d94]">0:22</div>
                  </div>

                  <p className="mt-4 text-[#a89d94] italic">"My payment collection speed has doubled. The WhatsApp reminders Saathi sends are very professional."</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SECURITY BADGE */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#1a1512] border border-[#ff9f43]/20">
              <span className="text-[#4cd964]">🔒</span>
              <span className="text-[#a89d94] text-sm font-medium">Bank-Grade Encryption (AES-256) &nbsp; • &nbsp; Your Data Stays Yours</span>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#ff9f43]/10 text-center relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold gradient-text">Saathi AI</div>
          <div className="text-[#a89d94] text-sm">© 2026 Saathi AI. Built in India for the world.</div>
          <div className="flex gap-6 text-sm text-[#a89d94]">
            <span className="hover:text-[#ff9f43] cursor-pointer">Privacy</span>
            <span className="hover:text-[#ff9f43] cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AgenticAICopilot;
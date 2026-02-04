import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './index.css';


const AgenticAICopilot = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
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
      result: '40% faster collection'
    },
    {
      industry: 'Retail',
      challenge: 'Managing inventory and customer orders',
      result: 'Zero inventory errors'
    },
    {
      industry: 'Services',
      challenge: 'Following up with clients for repeat business',
      result: '3x retention'
    }
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
          <div className="text-2xl font-bold gradient-text">Helper</div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors">Features</a>
            <a href="#use-cases" className="text-[#a89d94] hover:text-[#ff9f43] transition-colors">Use Cases</a>
            <Link to="/Dashboard" className="px-6 py-2.5 bg-[#ff9f43] text-[#0a0808] rounded-lg font-semibold hover:bg-[#ffb366] transition-all hover:scale-105">
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-20 relative z-10">
        <div className="mb-6 px-6 py-2 bg-[#ff9f43]/10 border border-[#ff9f43]/30 rounded-full text-[#ff9f43] text-sm font-semibold animate-fadeInUp">
          🇮🇳 Built for Indian SMBs
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fadeInUp leading-[1.1] max-w-5xl">
          <span className="gradient-text">Your Business.</span><br />
          <span className="gradient-text">Run by AI.</span><br />
          <span className="text-[#f5f3f0]">Built for India.</span>
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

      {/* Features Grid */}
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
                className={`glass-card rounded-3xl p-10 transition-all duration-500 ${activeFeature === idx ? 'border-[#ff9f43]/50 scale-[1.02]' : 'opacity-70'}`}
                onMouseEnter={() => setActiveFeature(idx)}
              >
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
            ))}
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
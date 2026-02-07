import React, { useState, useRef, useEffect } from 'react';

const AgenticChat = ({ onClose }) => {
  // --- STATE ---
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);

  // --- SPOTLIGHT LOGIC (Now Active!) ---
  const handleMouseMove = (e) => {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      type: 'text',
      content: "Hello! I'm Saathi. I can manage your orders, send reminders, or check payments. What's the plan?",
      timestamp: '10:00 AM'
    }
  ]);

  // --- AUTO SCROLL ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // --- HANDLE SEND ---
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      type: 'text',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // 2. Simulate AI "Reasoning" & Action
    setTimeout(() => {
      let aiResponse;
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('invoice') || lowerInput.includes('bill')) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'action_invoice',
          content: "I've drafted an invoice for Rahul based on his last order.",
          data: { customer: 'Rahul Sharma', amount: '₹5,000', items: 'Cement & Bricks', due: '20 Feb' },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (lowerInput.includes('remind') || lowerInput.includes('payment') || lowerInput.includes('money')) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'action_reminder',
          content: "Ready to send this WhatsApp reminder?",
          data: { customer: 'Sunita Devi', message: 'Namaste Sunita ji, payment of ₹800 is pending. Please pay via UPI.' },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'text',
          content: "I understood that. Would you like me to create an entry for this?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      setIsThinking(false);
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  // --- RENDER HELPERS ---
  const renderActionCard = (msg) => {
    if (msg.type === 'action_invoice') {
      return (
        // Added 'spotlight-card' and 'onMouseMove' here
        <div 
          onMouseMove={handleMouseMove}
          className="mt-3 glass-card spotlight-card bg-[#0a0808]/80 p-5 rounded-xl border-l-4 border-[#ff9f43] relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]"
        >
           {/* Spotlight Glow Layer */}
           <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
               style={{ background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(255,159,67,0.15), transparent 40%)` }}
           />
           
           <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[#a89d94] text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff9f43]"></span> Draft Invoice
              </div>
              <div className="text-[#ff9f43] font-bold font-mono">{msg.data.amount}</div>
            </div>
            <div className="text-white font-bold text-lg mb-1">{msg.data.customer}</div>
            <div className="text-sm text-[#a89d94] mb-4">{msg.data.items} • Due {msg.data.due}</div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-[#ff9f43] text-black text-xs font-bold rounded-lg hover:bg-[#ffb366] transition-all shadow-lg shadow-[#ff9f43]/20">
                Send Invoice
              </button>
              <button className="flex-1 py-2 bg-white/5 text-white text-xs font-semibold rounded-lg hover:bg-white/10 border border-white/10">
                Edit Details
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (msg.type === 'action_reminder') {
      return (
        <div 
          onMouseMove={handleMouseMove}
          className="mt-3 glass-card spotlight-card bg-[#0a0808]/80 p-5 rounded-xl border-l-4 border-[#4cd964] relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]"
        >
          {/* Spotlight Glow Layer (Green for success/whatsapp) */}
          <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
               style={{ background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(76, 217, 100, 0.15), transparent 40%)` }}
           />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-[#4cd964] text-lg">📱</div>
              <div className="text-[#a89d94] text-xs uppercase tracking-wide">WhatsApp Preview</div>
            </div>
            <div className="bg-[#1a1a1a]/80 p-3 rounded-lg text-sm text-[#f5f3f0] italic mb-4 border border-white/5 font-mono">
              "{msg.data.message}"
            </div>
            <button className="w-full py-2 bg-[#4cd964] text-black text-xs font-bold rounded-lg hover:bg-[#5de075] transition-all shadow-[0_0_15px_rgba(76,217,100,0.3)] flex items-center justify-center gap-2">
              <span>🚀</span> Send Now
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0808] relative overflow-hidden border-l border-[#ff9f43]/10 shadow-2xl">
      
      {/* Header */}
      <div className="p-5 border-b border-[#ff9f43]/10 flex justify-between items-center backdrop-blur-xl bg-[#0a0808]/80 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff9f43] to-[#ff6b35] flex items-center justify-center shadow-[0_0_20px_rgba(255,159,67,0.3)]">
              <span className="text-lg">🤖</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4cd964] border-2 border-[#0a0808] rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#f5f3f0] leading-tight">Saathi Copilot</h2>
            <div className="text-[10px] text-[#a89d94] uppercase tracking-wider font-medium">
              Business Assistant
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#a89d94] transition-all">
          ✕
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
            <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              {msg.type !== 'action_only' && (
                <div className={`p-4 rounded-2xl relative shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-[#ff9f43] to-[#ffb366] text-[#0a0808] font-medium rounded-tr-none' 
                    : 'glass-card text-[#f5f3f0] rounded-tl-none border border-[#ff9f43]/10'
                }`}>
                  <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                </div>
              )}

              {/* Action Widget Injection */}
              {msg.type.startsWith('action') && renderActionCard(msg)}

              <span className="text-[10px] text-[#a89d94] mt-1.5 px-1 opacity-60 font-mono">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex justify-start animate-pulse">
            <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 border border-[#ff9f43]/10">
              <div className="w-1.5 h-1.5 bg-[#ff9f43] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#ff9f43] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-[#ff9f43] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#ff9f43]/10 bg-[#0a0808]/90 backdrop-blur-xl sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'Create invoice for Rahul'..."
            className="w-full bg-[#1a1512]/50 border border-[#ff9f43]/20 rounded-xl py-4 pl-5 pr-14 text-[#f5f3f0] placeholder-[#a89d94]/50 focus:outline-none focus:border-[#ff9f43]/50 focus:bg-[#1a1512] transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all ${
              input.trim() 
                ? 'bg-[#ff9f43] text-black hover:scale-105 shadow-[0_0_10px_rgba(255,159,67,0.4)]' 
                : 'bg-transparent text-[#a89d94] opacity-50 cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgenticChat;
import React, { useState, useRef, useEffect } from 'react';

const AgenticChat = ({ onClose }) => {
  // --- STATE ---
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);

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
      // Logic to decide what the AI does based on keywords (Simulation)
      let aiResponse;
      
      if (input.toLowerCase().includes('invoice') || input.toLowerCase().includes('bill')) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'action_invoice', // SPECIAL ACTION TYPE
          content: "I've drafted an invoice for Rahul based on his last order.",
          data: { customer: 'Rahul Sharma', amount: '₹5,000', items: 'Cement & Bricks', due: '20 Feb' },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (input.toLowerCase().includes('remind') || input.toLowerCase().includes('payment')) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'action_reminder', // SPECIAL ACTION TYPE
          content: "Ready to send this WhatsApp reminder?",
          data: { customer: 'Sunita Devi', message: 'Namaste Sunita ji, payment of ₹800 is pending. Please pay via UPI.' },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'text',
          content: "I understood that. Is there a specific order ID you are referring to?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      setIsThinking(false);
      setMessages(prev => [...prev, aiResponse]);
    }, 2000); // 2s thinking delay
  };

  // --- RENDER HELPERS ---
  const renderActionCard = (msg) => {
    if (msg.type === 'action_invoice') {
      return (
        <div className="mt-3 glass-card bg-[#0a0808]/80 p-4 rounded-xl border-l-4 border-[#ff9f43]">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[#a89d94] text-xs uppercase tracking-wide">Draft Invoice</div>
            <div className="text-[#ff9f43] font-bold">{msg.data.amount}</div>
          </div>
          <div className="text-white font-bold text-lg mb-1">{msg.data.customer}</div>
          <div className="text-sm text-[#a89d94] mb-4">{msg.data.items} • Due {msg.data.due}</div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-[#ff9f43] text-black text-xs font-bold rounded-lg hover:bg-[#ffb366] transition-all">
              Send Invoice
            </button>
            <button className="flex-1 py-2 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20">
              Edit
            </button>
          </div>
        </div>
      );
    }
    if (msg.type === 'action_reminder') {
      return (
        <div className="mt-3 glass-card bg-[#0a0808]/80 p-4 rounded-xl border-l-4 border-[#4cd964]">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[#4cd964]">📱</div>
            <div className="text-[#a89d94] text-xs uppercase tracking-wide">WhatsApp Preview</div>
          </div>
          <div className="bg-[#1a1a1a] p-3 rounded-lg text-sm text-[#f5f3f0] italic mb-4 border border-white/5">
            "{msg.data.message}"
          </div>
          <button className="w-full py-2 bg-[#4cd964] text-black text-xs font-bold rounded-lg hover:bg-[#5de075] transition-all shadow-[0_0_15px_rgba(76,217,100,0.3)]">
            Send Now
          </button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0808] relative overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-[#ff9f43]/10 flex justify-between items-center backdrop-blur-md bg-[#0a0808]/80 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff9f43] to-[#ff6b35] flex items-center justify-center shadow-[0_0_20px_rgba(255,159,67,0.3)] animate-pulse-glow">
            🧠
          </div>
          <div>
            <h2 className="font-bold text-xl text-[#f5f3f0]">Saathi Copilot</h2>
            <div className="text-xs text-[#4cd964] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd964] animate-pulse"></span>
              Online & Ready
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-[#a89d94] hover:text-white transition-colors text-2xl">×</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              
              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl relative ${
                msg.sender === 'user' 
                  ? 'bg-[#ff9f43] text-[#0a0808] rounded-tr-none' 
                  : 'glass-card text-[#f5f3f0] rounded-tl-none border border-[#ff9f43]/20'
              }`}>
                <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
              </div>

              {/* Action Widget Injection */}
              {msg.type.startsWith('action') && renderActionCard(msg)}

              <span className="text-[10px] text-[#a89d94] mt-1 opacity-60">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-[#ff9f43] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#ff9f43] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-[#ff9f43] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#ff9f43]/10 bg-[#0a0808]/90 backdrop-blur-xl sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Saathi to create an invoice, send reminders..."
            className="w-full bg-[#1a1512] border border-[#ff9f43]/20 rounded-xl py-4 pl-6 pr-14 text-[#f5f3f0] placeholder-[#a89d94] focus:outline-none focus:border-[#ff9f43] transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          />
          <button 
            type="submit"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              input.trim() ? 'bg-[#ff9f43] text-black hover:scale-110' : 'bg-[#2a2420] text-[#a89d94]'
            }`}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgenticChat;
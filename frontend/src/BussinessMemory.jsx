import React, { useState, useMemo } from 'react';

// Reusable Stat Card Component
const StatCard = ({ label, value, subValue, icon, color }) => (
  <div className="glass-card p-6 rounded-[2rem] border-l-4 transition-all hover:scale-[1.02]" style={{ borderColor: color }}>
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#a89d94]">Metric</span>
    </div>
    <div className="text-3xl font-bold text-[#f5f3f0] mb-1">{value}</div>
    <div className="text-sm text-[#a89d94] flex items-center gap-2">{subValue}</div>
  </div>
);

const BusinessMemory = () => {
  // View State: 'month' or 'date'
  const [viewType, setViewType] = useState('month'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  // Mock Data
  const businessData = {
    monthly: {
      totalRevenue: 145800,
      online: 82000,
      offline: 63800,
      success: 342,
      cancelled: 12,
    },
    inventory: [
      { id: 1, item: 'Basmati Rice (5kg)', stock: 3, threshold: 10, status: 'Low Stock', demand: 'High', suggested: 15 },
      { id: 2, item: 'Mustard Oil (1L)', stock: 0, threshold: 5, status: 'Out of Stock', demand: 'Medium', suggested: 20 },
    ],
    transactions: [
      { id: 101, customer: 'Vikram Seth', amount: 1200, type: 'online', time: '10:30 AM', status: 'Success', date: '2026-02-04' },
      { id: 102, customer: 'Sunita Jee', amount: 450, type: 'offline', time: '11:15 AM', status: 'Success', date: '2026-02-04' },
      { id: 103, customer: 'Local Cash', amount: 800, type: 'offline', time: '01:00 PM', status: 'Cancelled', date: '2026-02-04' },
      { id: 104, customer: 'Rahul Grocery', amount: 2100, type: 'online', time: '09:00 AM', status: 'Success', date: '2026-02-03' },
    ]
  };

  // Logic to switch between Monthly and Daily data
  const displayTransactions = useMemo(() => {
    if (viewType === 'month') return businessData.transactions;
    return businessData.transactions.filter(t => t.date === selectedDate);
  }, [viewType, selectedDate]);

  const runAISummary = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiSummary({
        text: viewType === 'month' 
          ? "Monthly revenue is tracking 12% higher than January. Online orders via WhatsApp are your primary growth driver."
          : `For ${selectedDate}, you've processed ${displayTransactions.length} orders. Cash flow is healthy, but 1 cancellation noted.`,
        restock: "Urgent: Mustard Oil is out of stock. 4 customers mentioned it in voice notes today."
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* 1. AI Intelligence Bar */}
        <div className="glass-card mb-8 p-4 rounded-[2rem] border-[#ff9f43]/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 px-4">
            <span className="text-2xl animate-pulse">✨</span>
            <p className="text-sm text-[#a89d94]">
              {isAnalyzing ? "Saathi AI is crunching the numbers..." : "Ready to summarize your business performance."}
            </p>
          </div>
          <button 
            onClick={runAISummary}
            disabled={isAnalyzing}
            className="px-8 py-3 bg-gradient-to-r from-[#ff9f43] to-[#ffb366] text-[#0a0808] rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? "Analysing..." : "🧠 Summarize Sales"}
          </button>
        </div>

        {/* AI Result Panel */}
        {aiSummary && (
          <div className="mb-8 glass-card p-6 rounded-[2rem] border-[#ff9f43]/40 animate-fadeInUp">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-[#ff9f43] font-bold text-xs uppercase mb-2">Performance Insight</h4>
                <p className="text-sm leading-relaxed">{aiSummary.text}</p>
              </div>
              <div className="border-l border-white/10 md:pl-8">
                <h4 className="text-[#ffb366] font-bold text-xs uppercase mb-2">Inventory Logic</h4>
                <p className="text-sm leading-relaxed">{aiSummary.restock}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Header & View Toggles */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Business Memory</h1>
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewType('month')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'month' ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94]'}`}
              >Monthly View</button>
              <button 
                onClick={() => setViewType('date')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'date' ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94]'}`}
              >Specific Date</button>
            </div>
          </div>

          {viewType === 'date' && (
            <div className="flex items-center gap-4 glass-card p-2 px-4 rounded-2xl border-white/10 animate-fadeInUp">
              <span className="text-xs font-bold text-[#ff9f43]">Calendar:</span>
              <input 
                type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm outline-none cursor-pointer scheme-dark"
              />
            </div>
          )}
        </div>

        {/* 3. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Revenue" value={`₹${businessData.monthly.totalRevenue.toLocaleString()}`} subValue="Total this month" icon="💰" color="#ff9f43" />
          <StatCard label="Channels" value={`₹${businessData.monthly.online.toLocaleString()}`} subValue={`Offline: ₹${businessData.monthly.offline.toLocaleString()}`} icon="🌐" color="#4cd964" />
          <StatCard label="Volume" value={businessData.monthly.success} subValue={`${businessData.monthly.cancelled} Cancelled`} icon="📦" color="#ffb366" />
          <div className="glass-card p-6 rounded-[2rem] border-l-4 border-red-500 bg-red-500/5">
            <div className="text-xl mb-1">⚠️ Alerts</div>
            <div className="text-3xl font-bold">{businessData.inventory.length} Items Low</div>
            <p className="text-[10px] text-red-400 font-bold uppercase mt-2">Action Required</p>
          </div>
        </div>

        {/* 4. Content Sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Transaction List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold">
              {viewType === 'month' ? "Recent Monthly Activity" : `Orders for ${selectedDate}`}
            </h2>
            <div className="space-y-4">
              {displayTransactions.map(t => (
                <div key={t.id} className="glass-card p-5 rounded-2xl flex items-center justify-between hover:border-[#ff9f43]/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-8 rounded-full ${t.status === 'Success' ? 'bg-[#4cd964]' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-bold text-sm">{t.customer}</div>
                      <div className="text-[10px] text-[#a89d94] uppercase">{t.time} • {t.type} • {t.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${t.status === 'Cancelled' ? 'text-red-400 line-through' : ''}`}>₹{t.amount}</div>
                    <div className="text-[10px] text-[#a89d94]">{t.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Restock Panel */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Smart Restock</h2>
            <div className="glass-card rounded-[2.5rem] p-6 border-[#ff9f43]/10">
              <div className="space-y-6">
                {businessData.inventory.map(item => (
                  <div key={item.id} className="relative p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-sm">{item.item}</span>
                      <span className="text-[#4cd964] text-xs font-bold">+{item.suggested}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mb-2">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(item.stock / item.threshold) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#a89d94] uppercase tracking-widest">
                      <span>Stock: {item.stock}</span>
                      <span>Demand: {item.demand}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-[#ff9f43] hover:text-[#0a0808] transition-all">
                Generate Purchase Order
              </button>
            </div>
          </div>

        </div>
      </div>
      <div className="fixed -bottom-20 -right-20 w-96 h-96 bg-[#ff9f43]/5 blur-[120px] rounded-full -z-10" />
    </div>
  );
};

export default BusinessMemory;
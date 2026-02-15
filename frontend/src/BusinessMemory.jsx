import React, { useState, useEffect } from 'react';

// Reusable Stat Card Component
const StatCard = ({ label, value, subValue, icon, color }) => (
    <div className="glass-card p-6 rounded-[2rem] border-l-4 transition-all hover:scale-[1.02]" style={{ borderColor: color }}>
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                {icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a89d94]">{label}</span>
        </div>
        <div className="text-3xl font-bold text-[#f5f3f0] mb-1">{value}</div>
        <div className="text-sm text-[#a89d94] flex items-center gap-2">{subValue}</div>
    </div>
);

const BusinessMemory = () => {
    // View State: 'month' or 'date'
    const [viewType, setViewType] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Real Data State
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        period: '',
        stats: { totalRevenue: 0, online: 0, offline: 0, success: 0, cancelled: 0 },
        inventory: [],
        transactions: []
    });

    // Notes State
    const [note, setNote] = useState('');
    const [savedNotes, setSavedNotes] = useState(() => {
        // Simple local storage for now
        const saved = localStorage.getItem('manager_notes');
        return saved ? JSON.parse(saved) : [];
    });

    // Fetch Data
    useEffect(() => {
        fetchBusinessData();
    }, [viewType, selectedDate]);

    const fetchBusinessData = async () => {
        setLoading(true);
        try {
            let url = `/api/analytics/business-memory?view_type=${viewType}`;
            if (viewType === 'date') {
                url += `&selected_date=${selectedDate}`;
            }
            const res = await fetch(url);
            const result = await res.json();
            setData(result);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch business memory", err);
            setLoading(false);
        }
    };



    const saveNote = () => {
        if (!note.trim()) return;
        const newNote = {
            id: Date.now(),
            text: note,
            date: new Date().toLocaleString()
        };
        const updated = [newNote, ...savedNotes];
        setSavedNotes(updated);
        localStorage.setItem('manager_notes', JSON.stringify(updated));
        setNote('');
    };

    const deleteNote = (id) => {
        const updated = savedNotes.filter(n => n.id !== id);
        setSavedNotes(updated);
        localStorage.setItem('manager_notes', JSON.stringify(updated));
    };

    return (
        <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* 2. Header & View Toggles */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Business Memory</h1>
                        <p className="text-[#a89d94] text-sm">Your digital second brain for business.</p>
                    </div>

                    <div className="flex gap-4 items-center">
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

                        {viewType === 'date' && (
                            <div className="flex items-center gap-2 glass-card p-2 px-4 rounded-xl border-white/10 animate-fadeInUp">
                                <input
                                    type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-sm outline-none cursor-pointer scheme-dark text-[#ff9f43] font-bold"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-[#ff9f43]">Loading Business Memory...</div>
                ) : (
                    <>
                        {/* 3. Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <StatCard label="Revenue" value={`₹${data.stats.totalRevenue.toLocaleString()}`} subValue={data.period} icon="💰" color="#ff9f43" />
                            <StatCard label="Orders" value={data.stats.success} subValue={`${data.stats.cancelled} Cancelled`} icon="📦" color="#4cd964" />
                            <div className="glass-card p-6 rounded-[2rem] border-l-4 transition-all hover:scale-[1.02] border-[#ffb366]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">📝</div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a89d94]">Notes</span>
                                </div>
                                <div className="text-3xl font-bold text-[#f5f3f0] mb-1">{savedNotes.length}</div>
                                <div className="text-sm text-[#a89d94]">Saved Insights</div>
                            </div>

                            <div className={`glass-card p-6 rounded-[2rem] border-l-4 ${data.inventory.length > 0 ? 'border-red-500 bg-red-500/5' : 'border-[#4cd964]'}`}>
                                <div className="text-xl mb-1">{data.inventory.length > 0 ? '⚠️ Alerts' : '✅ Stable'}</div>
                                <div className="text-3xl font-bold">{data.inventory.length} Items</div>
                                <p className="text-[10px] font-bold uppercase mt-2 opacity-70">Low Stock</p>
                            </div>
                        </div>

                        {/* 4. Content Sections */}
                        <div className="grid lg:grid-cols-3 gap-8">

                            {/* Transaction List */}
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-2xl font-bold">
                                    {viewType === 'month' ? `Activity in ${data.period}` : `Activity on ${selectedDate}`}
                                </h2>
                                <div className="space-y-4">
                                    {data.transactions.length === 0 ? (
                                        <div className="p-8 text-center text-[#a89d94] glass-card rounded-2xl">No transactions found for this period.</div>
                                    ) : (
                                        data.transactions.map(t => (
                                            <div key={t.id} className="glass-card p-5 rounded-2xl flex items-center justify-between hover:border-[#ff9f43]/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-1.5 h-8 rounded-full ${t.status === 'Completed' ? 'bg-[#4cd964]' : 'bg-red-500'}`} />
                                                    <div>
                                                        <div className="font-bold text-sm">{t.customer || 'Unknown Customer'}</div>
                                                        <div className="text-[10px] text-[#a89d94] uppercase">{t.time} • {t.date}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-bold ${t.status === 'Cancelled' ? 'text-red-400 line-through' : ''}`}>₹{t.amount?.toLocaleString()}</div>
                                                    <div className="text-[10px] text-[#a89d94]">{t.status}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Restock & Notes */}
                            <div className="space-y-8">

                                {/* Manager Notes */}
                                <div className="glass-card rounded-[2.5rem] p-6 border-[#ff9f43]/10">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <span>🧠 Manager Notes</span>
                                    </h3>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Add a quick note..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#ff9f43]"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                                        />
                                        <button onClick={saveNote} className="bg-[#ff9f43] text-black px-4 rounded-xl font-bold hover:scale-105 transition-transform">+</button>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                        {savedNotes.map(n => (
                                            <div key={n.id} className="group p-3 bg-white/5 rounded-xl text-sm relative hover:bg-white/10 transition-colors">
                                                <p className="pr-6">{n.text}</p>
                                                <p className="text-[10px] text-[#a89d94] mt-1">{n.date}</p>
                                                <button
                                                    onClick={() => deleteNote(n.id)}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:scale-110 transition-all"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {savedNotes.length === 0 && <div className="text-center text-[#a89d94] text-xs py-4">No notes safely stored.</div>}
                                    </div>
                                </div>

                                {/* Smart Restock */}
                                <div className="glass-card rounded-[2.5rem] p-6 border-[#ff9f43]/10">
                                    <h3 className="font-bold text-lg mb-4">Inventory Alerts</h3>
                                    <div className="space-y-4">
                                        {data.inventory.length === 0 ? (
                                            <div className="text-center py-6 text-[#4cd964] text-sm">All items well stocked! ✅</div>
                                        ) : (
                                            data.inventory.map((item, i) => (
                                                <div key={i} className="relative p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-bold text-sm w-3/4 truncate">{item.item}</span>
                                                        <span className="text-red-400 text-xs font-bold">{item.stock} left</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/10 rounded-full mb-2">
                                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((item.stock / 10) * 100, 100)}%` }} />
                                                    </div>
                                                    <div className="text-[10px] text-[#a89d94] uppercase tracking-widest">
                                                        Running Low
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>
                    </>
                )}
            </div>
            <div className="fixed -bottom-20 -right-20 w-96 h-96 bg-[#ff9f43]/5 blur-[120px] rounded-full -z-10" />
        </div>
    );
};

export default BusinessMemory;

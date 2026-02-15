import React, { useState, useEffect } from 'react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Fetch Customers
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:8000/customers');
            const data = await res.json();
            setCustomers(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch customers", err);
            setLoading(false);
        }
    };

    const startEdit = async (phone) => {
        // For now, just open detail modal which will fetch details
        try {
            const res = await fetch(`http://localhost:8000/customers/${phone}`);
            const data = await res.json();
            setSelectedCustomer(data);
            setIsDetailModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch customer detail", err);
        }
    };

    const filteredCustomers = customers.filter(c =>
        (c.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone_number.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text">Customer Directory</h1>
                        <p className="text-[#a89d94] text-sm mt-1">Manage relationships and track credit.</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md mb-8 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:text-[#ff9f43]">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 outline-none focus:border-[#ff9f43]/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 animate-fadeInUp">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[#a89d94] text-[10px] uppercase tracking-widest font-bold">
                                <th className="p-6">Customer</th>
                                <th className="p-6">Outstanding</th>
                                <th className="p-6">Orders</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCustomers.map(c => (
                                <tr key={c.phone_number} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => startEdit(c.phone_number)}>
                                    <td className="p-6">
                                        <div className="font-bold text-lg">{c.business_name || 'Unregistered'}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-[10px] text-[#a89d94] font-mono tracking-tighter">{c.phone_number}</div>
                                            <a
                                                href={`https://wa.me/${c.phone_number.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#4cd964] hover:scale-110 transition-transform"
                                                title="Chat on WhatsApp"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                            </a>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className={`text-xl font-bold ${c.outstanding_balance > 0 ? 'text-[#ff9f43]' : 'text-[#4cd964]'}`}>
                                            ₹{c.outstanding_balance.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="font-bold">{c.order_count}</div>
                                        <div className="text-[10px] text-[#a89d94]">Total Orders</div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="px-4 py-2 glass-card rounded-xl text-xs font-bold hover:bg-white/10 text-[#ff9f43]">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && !loading && (
                                <tr><td colSpan="4" className="p-8 text-center text-[#a89d94]">No customers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[#0a0808]/80" onClick={() => setIsDetailModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-2xl p-8 rounded-[2rem] border-[#ff9f43]/30 animate-fadeInUp max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-3xl font-bold gradient-text">{selectedCustomer.business_name || 'Unregistered Business'}</h2>
                                <p className="text-[#a89d94] font-mono">{selectedCustomer.phone_number}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-2xl hover:scale-110">✖</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="glass-card p-4 rounded-xl bg-white/5">
                                <div className="text-xs text-[#a89d94] uppercase">Outstanding Balance</div>
                                <div className="text-2xl font-bold text-[#ff9f43]">₹{selectedCustomer.outstanding_balance.toLocaleString()}</div>
                            </div>
                            <div className="glass-card p-4 rounded-xl bg-white/5">
                                <div className="text-xs text-[#a89d94] uppercase">Credit Limit</div>
                                <div className="text-2xl font-bold text-[#f5f3f0]">₹{selectedCustomer.credit_limit.toLocaleString()}</div>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
                        <div className="space-y-3">
                            {selectedCustomer.recent_orders.length === 0 ? (
                                <p className="text-[#a89d94]">No recent orders.</p>
                            ) : (
                                selectedCustomer.recent_orders.map(o => (
                                    <div key={o.order_id} className="glass-card p-4 rounded-xl flex justify-between items-center bg-white/[0.02]">
                                        <div>
                                            <div className="font-bold text-sm">Order #{o.order_id.substring(0, 8)}</div>
                                            <div className="text-xs text-[#a89d94]">{new Date(o.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">₹{o.total_amount.toLocaleString()}</div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {o.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Customers;

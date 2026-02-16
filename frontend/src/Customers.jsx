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
            const res = await fetch('/api/customers');
            const data = await res.json();
            setCustomers(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch customers", err);
            setLoading(false);
        }
    };

    const startEdit = async (phone) => {
        try {
            const res = await fetch(`/api/customers/${phone}`);
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

    // Modal Tabs
    const [modalTab, setModalTab] = useState('orders');

    return (
        <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-4 sm:p-6 md:p-10 lg:p-12 pt-8 md:pt-12 font-sans relative overflow-x-hidden">
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 outline-none focus:border-[#ff9f43]/50 transition-all font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 animate-fadeInUp">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-white/5 text-[#a89d94] text-[10px] uppercase tracking-widest font-bold">
                                    <th className="p-4 md:p-6">Customer</th>
                                    <th className="p-4 md:p-6">Outstanding</th>
                                    <th className="p-4 md:p-6">Orders</th>
                                    <th className="p-4 md:p-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCustomers.map(c => (
                                    <tr key={c.phone_number} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => startEdit(c.phone_number)}>
                                        <td className="p-4 md:p-6">
                                            <div className="font-bold text-lg">{c.business_name || 'Unregistered'}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="text-xs text-[#a89d94] font-mono tracking-wider">{c.phone_number}</div>
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
                                        <td className="p-4 md:p-6">
                                            <div className={`text-2xl font-bold font-mono tracking-tight ${c.outstanding_balance > 0 ? 'text-[#ff9f43]' : 'text-[#4cd964]'}`}>
                                                ₹{c.outstanding_balance.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-bold text-lg">{c.order_count}</div>
                                            <div className="text-[10px] text-[#a89d94] uppercase tracking-wider">Total Orders</div>
                                        </td>
                                        <td className="p-4 md:p-6 text-right">
                                            <button className="px-5 py-2 glass-card rounded-xl text-xs font-bold hover:bg-white/10 text-[#ff9f43] border border-[#ff9f43]/20">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {loading && (
                                    <tr><td colSpan="4" className="p-8 text-center text-[#ff9f43] animate-pulse">Loading Customers...</td></tr>
                                )}
                                {!loading && filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-[#a89d94]">No customers found.</td>
                                    </tr>
                                )}</tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[#0a0808]/90" onClick={() => setIsDetailModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-4xl p-8 rounded-[2.5rem] border-[#ff9f43]/30 animate-fadeInUp max-h-[90vh] overflow-hidden flex flex-col">

                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-8 shrink-0">
                            <div>
                                <h2 className="text-4xl font-bold gradient-text">{selectedCustomer.business_name || 'Unregistered Business'}</h2>
                                <p className="text-[#a89d94] font-mono text-lg mt-1 tracking-wide">{selectedCustomer.phone_number}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 shrink-0">
                            <div className="glass-card p-6 rounded-[1.5rem] bg-white/[0.03]">
                                <div className="text-xs text-[#a89d94] uppercase tracking-widest font-bold mb-2">Lifetime Value</div>
                                <div className="text-3xl font-bold text-[#4cd964] font-mono">₹{selectedCustomer.lifetime_value?.toLocaleString() || '0'}</div>
                            </div>
                            <div className="glass-card p-6 rounded-[1.5rem] bg-white/[0.03]">
                                <div className="text-xs text-[#a89d94] uppercase tracking-widest font-bold mb-2">Outstanding</div>
                                <div className={`text-3xl font-bold font-mono ${selectedCustomer.outstanding_balance > 0 ? 'text-[#ff9f43]' : 'text-[#f5f3f0]'}`}>
                                    ₹{selectedCustomer.outstanding_balance?.toLocaleString() || '0'}
                                </div>
                            </div>
                            <div className="glass-card p-6 rounded-[1.5rem] bg-white/[0.03]">
                                <div className="text-xs text-[#a89d94] uppercase tracking-widest font-bold mb-2">Credit Limit</div>
                                <div className="text-3xl font-bold text-[#f5f3f0] font-mono">₹{selectedCustomer.credit_limit?.toLocaleString() || '0'}</div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex gap-2 mb-6 shrink-0 border-b border-white/10 pb-1">
                            {['orders', 'payments', 'settings'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setModalTab(tab)}
                                    className={`px-6 py-3 rounded-t-2xl text-sm font-bold uppercase tracking-wider transition-all ${modalTab === tab
                                        ? 'bg-[#ff9f43] text-[#0a0808] translate-y-[1px]'
                                        : 'text-[#a89d94] hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

                            {/* ORDERS TAB */}
                            {modalTab === 'orders' && (
                                <div className="space-y-3">
                                    {!selectedCustomer.recent_orders?.length ? (
                                        <div className="text-center py-12 text-[#a89d94]">No orders found.</div>
                                    ) : (
                                        selectedCustomer.recent_orders.map(o => (
                                            <div key={o.order_id} className="glass-card p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-[#ff9f43] font-mono text-sm">Order #{o.order_id.substring(0, 8)}</div>
                                                        <div className="text-xs text-[#a89d94] mt-1">{new Date(o.date).toLocaleDateString()} • {new Date(o.date).toLocaleTimeString()}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-lg font-mono">₹{o.total_amount?.toLocaleString()}</div>
                                                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${o.status === 'completed' ? 'bg-[#4cd964]/20 text-[#4cd964]' : 'bg-[#ff9f43]/20 text-[#ff9f43]'
                                                            }`}>
                                                            {o.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Items Summary */}
                                                <div className="text-sm text-[#f5f3f0]/80 bg-white/5 p-3 rounded-xl font-mono text-xs leading-relaxed">
                                                    {o.items_summary}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* PAYMENTS TAB */}
                            {modalTab === 'payments' && (
                                <div className="space-y-2">
                                    {!selectedCustomer.payment_history?.length ? (
                                        <div className="text-center py-12 text-[#a89d94]">No payment history.</div>
                                    ) : (
                                        selectedCustomer.payment_history.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 rounded-xl hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                <div>
                                                    <div className={`font-bold text-sm ${p.type === 'payment' ? 'text-[#4cd964]' : 'text-[#ff9f43]'}`}>
                                                        {p.type === 'payment' ? 'Received Payment' : 'Credit Added'}
                                                    </div>
                                                    <div className="text-xs text-[#a89d94] font-mono mt-1">{new Date(p.date).toLocaleDateString()}</div>
                                                </div>
                                                <div className={`font-bold font-mono text-lg ${p.type === 'payment' ? 'text-[#4cd964]' : 'text-[#f5f3f0]'}`}>
                                                    {p.type === 'payment' ? '-' : '+'} ₹{p.amount.toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* SETTINGS TAB */}
                            {modalTab === 'settings' && (
                                <div className="space-y-6 p-4">
                                    <div className="glass-card p-6 rounded-2xl bg-white/[0.02]">
                                        <h3 className="font-bold text-lg mb-4">Account Actions</h3>
                                        <div className="flex gap-4">
                                            <button className="flex-1 py-3 bg-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/30 transition-colors">
                                                Block Customer
                                            </button>
                                            <button className="flex-1 py-3 bg-[#ff9f43]/20 text-[#ff9f43] font-bold rounded-xl hover:bg-[#ff9f43]/30 transition-colors">
                                                Adjust Credit Limit
                                            </button>
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 rounded-2xl bg-white/[0.02]">
                                        <h3 className="font-bold text-lg mb-4">Communication</h3>
                                        <button className="w-full py-4 bg-[#4cd964] text-[#0a0808] font-bold rounded-xl hover:scale-[1.02] transition-transform">
                                            Send WhatsApp Reminder
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Customers;

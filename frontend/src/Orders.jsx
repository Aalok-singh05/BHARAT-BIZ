import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, COMPLETED, PENDING, REJECTED
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let url = 'http://localhost:8000/orders';
            if (filterStatus !== 'ALL') {
                // Map frontend filter to backend status if needed. 
                // Backend expects exact status string? 
                // Let's assume backend status match.
                // Or we fetch all and filter client side? 
                // Backend has ?status=... support.
                // Let's use backend filtering for efficiency.
                // But "PENDING" might map to "waiting_owner_approval" etc.
                // For now, let's fetch ALL and client-side filter for simpler mapping.
            }

            const res = await fetch(url);
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'text-gray-500';
        const s = status.toLowerCase();
        if (s.includes('completed') || s.includes('approved')) return 'text-[#4cd964]';
        if (s.includes('rejected')) return 'text-red-500';
        if (s.includes('waiting') || s.includes('pending')) return 'text-[#ff9f43]';
        return 'text-[#a89d94]';
    };

    const filteredOrders = orders.filter(o => {
        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'COMPLETED') return o.status === 'completed';
        if (filterStatus === 'PENDING') return o.status === 'waiting_owner_confirmation'; // Adjust status mapping
        if (filterStatus === 'REJECTED') return o.status === 'rejected';
        return true;
    });

    const viewDetail = async (orderId) => {
        try {
            const res = await fetch(`http://localhost:8000/orders/${orderId}`);
            const data = await res.json();
            setSelectedOrder(data);
            setIsDetailModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch order detail", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text">Order History</h1>
                        <p className="text-[#a89d94] text-sm mt-1">Track and manage past orders.</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl">
                        {['ALL', 'COMPLETED', 'PENDING', 'REJECTED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === status ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94] hover:text-white'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 animate-fadeInUp">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[#a89d94] text-[10px] uppercase tracking-widest font-bold">
                                <th className="p-6">Order ID</th>
                                <th className="p-6">Date</th>
                                <th className="p-6">Customer</th>
                                <th className="p-6">Amount</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOrders.map(o => (
                                <tr key={o.order_id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => viewDetail(o.order_id)}>
                                    <td className="p-6 font-mono text-xs">{o.order_id.substring(0, 8)}...</td>
                                    <td className="p-6 text-sm">{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td className="p-6 font-bold">{o.customer_name}</td>
                                    <td className="p-6 font-bold">₹{o.total_amount.toLocaleString()}</td>
                                    <td className={`p-6 text-xs font-bold uppercase ${getStatusColor(o.status)}`}>{o.status}</td>
                                    <td className="p-6 text-right">
                                        <button className="px-4 py-2 glass-card rounded-xl text-xs font-bold hover:bg-white/10 text-[#ff9f43]">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && !loading && (
                                <tr><td colSpan="6" className="p-8 text-center text-[#a89d94]">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[#0a0808]/80" onClick={() => setIsDetailModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-3xl p-8 rounded-[2rem] border-[#ff9f43]/30 animate-fadeInUp max-h-[90vh] overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            <div className="glass-card p-4 rounded-xl bg-white/5">
                                <div className="text-xs text-[#a89d94] uppercase">Customer</div>
                                <div className="font-bold">{selectedOrder.customer_name}</div>
                                <div className="text-xs font-mono">{selectedOrder.customer_phone}</div>
                            </div>
                            <div className="glass-card p-4 rounded-xl bg-white/5">
                                <div className="text-xs text-[#a89d94] uppercase">Invoice</div>
                                <div className="font-bold">{selectedOrder.invoice_number || 'N/A'}</div>
                            </div>
                            <div className="glass-card p-4 rounded-xl bg-white/5">
                                <div className="text-xs text-[#a89d94] uppercase">Total Amount</div>
                                <div className="font-bold text-xl text-[#ff9f43]">₹{selectedOrder.total_amount.toLocaleString()}</div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Items</h3>
                        <div className="space-y-4 mb-8">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5 hover:border-[#ff9f43]/20 transition-colors">
                                    <div>
                                        <div className="font-bold text-lg">{item.material_name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.color && (
                                                <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-[#f5f3f0] uppercase tracking-wide">
                                                    {item.color}
                                                </span>
                                            )}
                                            <span className="text-xs text-[#a89d94]">
                                                {item.quantity}m × ₹{item.price}/m
                                            </span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-[#ff9f43]">₹{item.amount.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        {selectedOrder.invoice_number && (
                            <div className="flex justify-end gap-4">
                                <button className="px-6 py-3 bg-[#ff9f43] text-[#0a0808] font-bold rounded-xl hover:scale-105 transition-transform">
                                    Download Invoice PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Orders;

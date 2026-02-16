import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Package, AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

const API_BASE = '/api';

const ApprovalQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders/pending`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
      // Fallback demo data
      setOrders([
        {
          order_id: 'demo-001',
          customer_phone: '919876543210',
          customer_name: 'Rahul Sharma',
          items: [
            { material: 'Blue Cotton', quantity: 20, price_per_meter: 150, status: 'ACCEPTED' },
            { material: 'Red Silk', quantity: 10, price_per_meter: 450, status: 'ACCEPTED' }
          ],
          total_estimate: 7500,
          created_at: new Date().toISOString()
        },
        {
          order_id: 'demo-002',
          customer_phone: '919123456789',
          customer_name: 'Priya Verma',
          items: [
            { material: 'White Linen', quantity: 15, price_per_meter: 200, status: 'ACCEPTED' }
          ],
          total_estimate: 3000,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Approve order
  const handleApprove = async (orderId) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Approval failed');
      }
      setOrders(orders.filter(o => o.order_id !== orderId));
      showSuccess('Order approved! Invoice generated & customer notified.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject order
  const handleReject = async (orderId) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/reject`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Rejection failed');
      }
      setOrders(orders.filter(o => o.order_id !== orderId));
      showSuccess('Order rejected. Customer notified.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Unknown';
    return phone.replace(/^91/, '+91 ').replace(/(\d{5})(\d{5})$/, '$1 $2');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-4 sm:p-6 md:p-10 lg:p-12 pt-8 md:pt-12 font-sans relative overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto relative z-10">

        {/* 1. Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 animate-fadeInUp">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">Approval Queue</h1>
            <p className="text-[#a89d94] text-lg">Orders waiting for your decision</p>
          </div>
          <button
            onClick={fetchPendingOrders}
            className="px-4 py-3 glass-card rounded-xl hover:bg-[#ff9f43]/10 transition-all group self-end md:self-auto"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-[#ff9f43] group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="fixed top-6 right-6 z-50 animate-fadeInUp">
            <div className="bg-[#4cd964]/20 border border-[#4cd964]/40 rounded-xl px-6 py-4 backdrop-blur-xl flex items-center gap-3 shadow-lg shadow-[#4cd964]/10">
              <CheckCircle className="w-5 h-5 text-[#4cd964]" />
              <span className="text-[#4cd964] font-semibold text-sm">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-xl px-6 py-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ff6b35]" />
            <span className="text-[#ff6b35] text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-[#ff6b35] hover:text-white text-sm">✕</button>
          </div>
        )}

        {/* 2. Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card rounded-[2rem] p-6 hover:scale-[1.02] transition-all bg-white/[0.02]">
            <div className="text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Pending Approvals</div>
            <div className="text-4xl font-bold gradient-text mb-1">{orders.length}</div>
            <div className="text-[#ff9f43] text-sm flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" /> Waiting for review
            </div>
          </div>
          <div className="glass-card rounded-[2rem] p-6 hover:scale-[1.02] transition-all bg-white/[0.02]">
            <div className="text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Total Value</div>
            <div className="text-4xl font-bold gradient-text mb-1">
              ₹{orders.reduce((sum, o) => sum + (o.total_estimate || 0), 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[#ff9f43] text-sm font-medium">Potential revenue</div>
          </div>
          <div className="glass-card rounded-[2rem] p-6 hover:scale-[1.02] transition-all bg-white/[0.02]">
            <div className="text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Items</div>
            <div className="text-4xl font-bold gradient-text mb-1">
              {orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
            </div>
            <div className="text-[#ff9f43] text-sm flex items-center gap-1 font-medium">
              <Package className="w-3 h-3" /> Line items
            </div>
          </div>
        </div>

        {/* 3. Order Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#ff9f43] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#ff9f43] animate-pulse font-medium">Loading Queue...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] p-16 text-center animate-fadeInUp border-white/5">
            <div className="text-7xl mb-6 grayscale opacity-50">✅</div>
            <h3 className="text-3xl font-bold mb-3 gradient-text">All Clear!</h3>
            <p className="text-[#a89d94] text-lg">No orders pending approval. You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order, idx) => (
              <div
                key={order.order_id}
                className="glass-card rounded-[2.5rem] p-6 md:p-8 animate-fadeInUp border border-white/5 hover:border-[#ff9f43]/30 transition-all shadow-lg shadow-black/20"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[#f5f3f0] mb-2 flex items-center gap-2">
                      {order.customer_name || formatPhone(order.customer_phone)}
                      {/* Removing ID from here as requested */}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#a89d94]">
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                        <span>📱 {formatPhone(order.customer_phone)}</span>
                        <a
                          href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4cd964] hover:scale-110 transition-transform"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      </div>
                      <span className="bg-white/5 px-3 py-1 rounded-full">🕐 {formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right bg-[#ff9f43]/5 p-4 rounded-2xl border border-[#ff9f43]/10">
                    <div className="text-3xl font-bold gradient-text font-mono">
                      ₹{(order.total_estimate || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-[#a89d94] mt-1 uppercase tracking-widest font-bold">Estimated Total</div>
                  </div>
                </div>

                {/* Item Table */}
                <div className="glass-card rounded-3xl overflow-hidden mb-8 border-white/5 bg-black/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px] text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="p-4 text-[#a89d94] font-bold uppercase text-xs tracking-wider">Material</th>
                          <th className="p-4 text-[#a89d94] font-bold uppercase text-xs tracking-wider">Color</th>
                          <th className="text-right p-4 text-[#a89d94] font-bold uppercase text-xs tracking-wider">Qty (m)</th>
                          <th className="text-right p-4 text-[#a89d94] font-bold uppercase text-xs tracking-wider">Rate</th>
                          <th className="text-right p-4 text-[#a89d94] font-bold uppercase text-xs tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(order.items || []).map((item, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-bold text-[#f5f3f0]">{item.material}</td>
                            <td className="p-4 text-[#f5f3f0]/80">{item.color || 'N/A'}</td>
                            <td className="p-4 text-right text-[#f5f3f0] font-mono">{item.quantity}</td>
                            <td className="p-4 text-right text-[#f5f3f0] font-mono">₹{item.price_per_meter}</td>
                            <td className="p-4 text-right font-bold text-[#ffb366] font-mono">
                              ₹{((item.quantity || 0) * (item.price_per_meter || 0)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleReject(order.order_id)}
                    disabled={actionLoading === order.order_id}
                    className="px-8 py-4 bg-[#ff6b35]/10 text-[#ff6b35] rounded-xl font-bold text-sm border border-[#ff6b35]/20 hover:bg-[#ff6b35] hover:text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-2 sm:order-1"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(order.order_id)}
                    disabled={actionLoading === order.order_id}
                    className="flex-1 px-8 py-4 bg-[#4cd964] text-[#0a0808] rounded-xl font-bold text-sm hover:bg-[#5ce67d] transition-all shadow-[0_0_30px_rgba(76,217,100,0.2)] hover:shadow-[0_0_40px_rgba(76,217,100,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    {actionLoading === order.order_id ? (
                      <div className="w-5 h-5 border-2 border-[#0a0808] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Approve & Generate Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;

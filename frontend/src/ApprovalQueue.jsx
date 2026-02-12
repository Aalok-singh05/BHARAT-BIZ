import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Package, AlertTriangle, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen text-[#f5f3f0] relative">

      {/* Header */}
      <div className="mb-8 animate-fadeInUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">Approval Queue</h1>
            <p className="text-[#a89d94] text-lg">Orders waiting for your decision</p>
          </div>
          <button
            onClick={fetchPendingOrders}
            className="px-4 py-3 glass-card rounded-xl hover:bg-[#ff9f43]/10 transition-all group"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-[#ff9f43] group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 animate-fadeInUp">
          <div className="bg-[#4cd964]/20 border border-[#4cd964]/40 rounded-xl px-6 py-4 backdrop-blur-xl flex items-center gap-3">
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
          <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Pending Approvals</div>
          <div className="text-4xl font-bold gradient-text mb-1">{orders.length}</div>
          <div className="text-[#ff9f43] text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" /> Waiting for your review
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
          <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Total Value</div>
          <div className="text-4xl font-bold gradient-text mb-1">
            ₹{orders.reduce((sum, o) => sum + (o.total_estimate || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[#ff9f43] text-sm">Pending revenue</div>
        </div>
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
          <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Items</div>
          <div className="text-4xl font-bold gradient-text mb-1">
            {orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
          </div>
          <div className="text-[#ff9f43] text-sm flex items-center gap-1">
            <Package className="w-3 h-3" /> Line items across orders
          </div>
        </div>
      </div>

      {/* Order Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#ff9f43] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center animate-fadeInUp">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold mb-2">All Clear!</h3>
          <p className="text-[#a89d94]">No orders pending approval. You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <div
              key={order.order_id}
              className="glass-card rounded-3xl p-6 md:p-8 animate-fadeInUp border border-transparent hover:border-[#ff9f43]/20 transition-all"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#f5f3f0] mb-1">
                    {order.customer_name || formatPhone(order.customer_phone)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-[#a89d94]">
                    <span>📱 {formatPhone(order.customer_phone)}</span>
                    <span>🕐 {formatDate(order.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold gradient-text">
                    ₹{(order.total_estimate || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-[#a89d94] mt-1">Estimated Total</div>
                </div>
              </div>

              {/* Item Table */}
              <div className="glass-card rounded-xl overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ff9f43]/10">
                      <th className="text-left p-3 text-[#a89d94] font-semibold">Material</th>
                      <th className="text-right p-3 text-[#a89d94] font-semibold">Qty (m)</th>
                      <th className="text-right p-3 text-[#a89d94] font-semibold">Rate (₹/m)</th>
                      <th className="text-right p-3 text-[#a89d94] font-semibold">Amount</th>
                      <th className="text-center p-3 text-[#a89d94] font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="p-3 font-semibold text-[#f5f3f0]">{item.material}</td>
                        <td className="p-3 text-right text-[#f5f3f0]">{item.quantity}</td>
                        <td className="p-3 text-right text-[#f5f3f0]">₹{item.price_per_meter}</td>
                        <td className="p-3 text-right font-semibold text-[#ffb366]">
                          ₹{((item.quantity || 0) * (item.price_per_meter || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            item.status === 'ACCEPTED'
                              ? 'bg-[#4cd964]/20 text-[#4cd964] border border-[#4cd964]/40'
                              : 'bg-[#ff9f43]/20 text-[#ff9f43] border border-[#ff9f43]/40'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleApprove(order.order_id)}
                  disabled={actionLoading === order.order_id}
                  className="flex-1 px-6 py-4 bg-[#4cd964] text-[#0a0808] rounded-xl font-bold text-sm hover:bg-[#5ce67d] transition-all shadow-[0_0_20px_rgba(76,217,100,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === order.order_id ? (
                    <div className="w-4 h-4 border-2 border-[#0a0808] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve & Generate Invoice
                </button>
                <button
                  onClick={() => handleReject(order.order_id)}
                  disabled={actionLoading === order.order_id}
                  className="px-6 py-4 bg-[#ff6b35]/20 text-[#ff6b35] rounded-xl font-bold text-sm border border-[#ff6b35]/40 hover:bg-[#ff6b35] hover:text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;

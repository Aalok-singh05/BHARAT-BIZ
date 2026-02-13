import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MerchantDashboard = () => {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    totalPending: 0,
    lowStockCount: 0,
    weeklyOrders: 0
  });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, trendRes] = await Promise.all([
        fetch('http://localhost:8000/analytics/summary'),
        fetch('http://localhost:8000/analytics/revenue?days=7')
      ]);

      const summary = await summaryRes.json();
      const trend = await trendRes.json();

      setMetrics(summary);
      setRevenueTrend(trend);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setLoading(false);
    }
  };

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue), 1000);

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Welcome Back, Jai</h1>
            <p className="text-[#a89d94] text-sm mt-1">Here's what's happening in your business today.</p>
          </div>
          <Link to="/orders" className="px-6 py-3 bg-[#ff9f43] text-[#0a0808] font-bold rounded-xl hover:scale-105 transition-transform">
            View Recent Orders
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fadeInUp">
          {/* Card 1: Revenue */}
          <div className="glass-card p-6 rounded-[2rem] border-white/5">
            <div className="text-[#a89d94] text-xs uppercase font-bold tracking-widest mb-2">Today's Revenue</div>
            <div className="text-3xl font-bold gradient-text">₹{metrics.todayRevenue.toLocaleString()}</div>
          </div>

          {/* Card 2: Pending */}
          <div className="glass-card p-6 rounded-[2rem] border-white/5">
            <div className="text-[#a89d94] text-xs uppercase font-bold tracking-widest mb-2">Pending Payments</div>
            <div className="text-3xl font-bold text-[#ff9f43]">₹{metrics.totalPending.toLocaleString()}</div>
          </div>

          {/* Card 3: Orders */}
          <div className="glass-card p-6 rounded-[2rem] border-white/5">
            <div className="text-[#a89d94] text-xs uppercase font-bold tracking-widest mb-2">Orders (7 Days)</div>
            <div className="text-3xl font-bold text-white">{metrics.weeklyOrders}</div>
          </div>

          {/* Card 4: Low Stock */}
          <div className="glass-card p-6 rounded-[2rem] border-white/5">
            <div className="text-[#a89d94] text-xs uppercase font-bold tracking-widest mb-2">Low Stock Items</div>
            <div className={`text-3xl font-bold ${metrics.lowStockCount > 0 ? 'text-red-500' : 'text-[#4cd964]'}`}>
              {metrics.lowStockCount}
            </div>
          </div>
        </div>

        {/* Charts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeInUp">

          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 border-white/5">
            <h3 className="text-xl font-bold mb-8">Revenue Trend (Last 7 Days)</h3>

            <div className="h-64 flex items-end justify-between gap-4">
              {revenueTrend.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-2 group">
                  <div
                    className="w-full bg-[#ff9f43]/20 rounded-t-xl transition-all duration-500 hover:bg-[#ff9f43] relative"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{day.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#a89d94] font-mono">{new Date(day.date).getDate()}</div>
                </div>
              ))}
              {revenueTrend.length === 0 && !loading && (
                <div className="w-full h-full flex items-center justify-center text-[#a89d94]">No revenue data available.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-[2.5rem] p-8 border-white/5">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <Link to="/inventory" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[#ff9f43]/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🏷️</div>
                <div>
                  <div className="font-bold text-sm">Update Prices</div>
                  <div className="text-[10px] text-[#a89d94]">Adjust material rates</div>
                </div>
              </Link>

              <Link to="/customers" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[#4cd964]/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👤</div>
                <div>
                  <div className="font-bold text-sm">View Customers</div>
                  <div className="text-[10px] text-[#a89d94]">Check balances</div>
                </div>
              </Link>

              <button onClick={() => alert("Generate Report functionality coming soon in Phase 6B!")} className="w-full text-left flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[#ff6b35]/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📄</div>
                <div>
                  <div className="font-bold text-sm">Download Report</div>
                  <div className="text-[10px] text-[#a89d94]">PDF Summary</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MerchantDashboard;
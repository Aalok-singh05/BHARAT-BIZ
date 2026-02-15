import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, Users } from 'lucide-react';

const MerchantDashboard = () => {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    totalPending: 0,
    lowStockCount: 0,
    weeklyOrders: 0,
    actionableRevenue: 0
  });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, trendRes, activityRes] = await Promise.all([
        fetch('http://localhost:8000/analytics/summary'),
        fetch('http://localhost:8000/analytics/revenue?days=7'),
        fetch('http://localhost:8000/analytics/activity')
      ]);

      const summary = await summaryRes.json();
      const trend = await trendRes.json();
      const activity = await activityRes.json();

      setMetrics(summary);
      setRevenueTrend(trend);
      setRecentActivity(activity);
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

          {/* Card 2: Actionable Revenue (NEW) */}
          <div className="glass-card p-6 rounded-[2rem] border-[#ff9f43]/30 bg-[#ff9f43]/5 pulse-glow">
            <div className="text-[#ff9f43] text-xs uppercase font-bold tracking-widest mb-2 flex items-center justify-between">
              Waiting Approval <span className="w-2 h-2 rounded-full bg-[#ff9f43] animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-[#ff9f43]">₹{metrics.actionableRevenue?.toLocaleString()}</div>
          </div>

          {/* Card 3: Pending Payments */}
          <div className="glass-card p-6 rounded-[2rem] border-white/5">
            <div className="text-[#a89d94] text-xs uppercase font-bold tracking-widest mb-2">Pending Payments</div>
            <div className="text-3xl font-bold text-white">₹{metrics.totalPending.toLocaleString()}</div>
          </div>

          {/* Card 4: Low Stock */}
          <div className="glass-card p-6 rounded-[2rem] border-white/5">
            <div className="text-[#a89d94] text-xs uppercase font-bold tracking-widest mb-2">Low Stock Items</div>
            <div className={`text-3xl font-bold ${metrics.lowStockCount > 0 ? 'text-red-500' : 'text-[#4cd964]'}`}>
              {metrics.lowStockCount}
            </div>
          </div>
        </div>

        {/* Charts & Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeInUp">

          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8 border-white/5 flex flex-col justify-between h-full min-h-[450px] relative z-0">
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

          {/* Recent Activity & Quick Actions */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="glass-card rounded-[2.5rem] p-6 border-white/5 flex flex-col gap-4 relative z-0">
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <div className="flex gap-4">
                <Link to="/approvals" className="flex-1 p-3 bg-[#ff9f43]/20 text-[#ff9f43] rounded-xl hover:bg-[#ff9f43]/30 text-center text-xs font-bold transition-colors flex flex-col items-center gap-2 group">
                  <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Review Pending
                </Link>
                <Link to="/inventory" className="flex-1 p-3 bg-white/5 data-[active]:bg-white/10 rounded-xl hover:bg-white/10 text-center text-xs font-bold transition-colors flex flex-col items-center gap-2 group">
                  <Package className="w-6 h-6 text-[#a89d94] group-hover:text-white group-hover:scale-110 transition-all" />
                  Update Stock
                </Link>
                <Link to="/customers" className="flex-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 text-center text-xs font-bold transition-colors flex flex-col items-center gap-2 group">
                  <Users className="w-6 h-6 text-[#a89d94] group-hover:text-white group-hover:scale-110 transition-all" />
                  Customers
                </Link>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="glass-card rounded-[2.5rem] p-6 border-white/5 h-[380px] flex flex-col relative z-0 overflow-hidden">
              <h3 className="text-xl font-bold mb-6 shrink-0">Recent Activity</h3>
              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${item.type === 'ORDER' ? 'bg-[#ff9f43]/20 text-[#ff9f43]' : 'bg-[#4cd964]/20 text-[#4cd964]'
                      }`}>
                      {item.type === 'ORDER' ? '📦' : '💰'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#f5f3f0]">
                        {item.type === 'ORDER' ? 'New Order' : 'Payment Received'}
                      </div>
                      <div className="text-xs text-[#a89d94]">
                        {item.customer} • <span className={item.type === 'ORDER' ? 'text-[#ff9f43]' : 'text-[#4cd964]'}>
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a89d94] mt-1 opacity-60">
                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center text-[#a89d94] text-xs py-10">No recent activity</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default MerchantDashboard;
import React from 'react';
import { Link } from 'react-router';

// Accept props from App.js
const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const navItems = [
    { name: 'Home', icon: '🏠', path: '/' },
    { name: 'Dashboard', icon: '📊', path: '/Dashboard' },
    { name: 'Approvals', icon: '✅', path: '/approvals' },
    { name: 'Payments', icon: '💰', path: '/payments' },
    { name: 'Documents', icon: '📄', path: '/documents' },
    { name: 'Business Memory', icon: '🧠', path: '/business-memory' },
    { name: 'Inventory', icon: '📦', path: '/inventory' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-[100] transition-all duration-500 ease-in-out border-r border-[#ff9f43]/10 glass-card backdrop-blur-2xl
        ${isExpanded ? 'w-72' : 'w-20'}`}
    >
      <div className="grain-overlay opacity-[0.02] absolute inset-0 pointer-events-none" />

      {/* Header / Toggle Button */}
      <div className="p-6 mb-8 flex items-center gap-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 flex flex-col justify-center items-center gap-1.5 hover:bg-white/5 rounded-xl transition-all group"
          aria-label="Toggle Sidebar"
        >
          <div className={`h-0.5 bg-[#ff9f43] transition-all duration-300 ${isExpanded ? 'w-6' : 'w-5 group-hover:w-6'}`} />
          <div className={`h-0.5 bg-[#ff9f43] transition-all duration-300 ${isExpanded ? 'w-4' : 'w-5 group-hover:w-6'}`} />
          <div className={`h-0.5 bg-[#ff9f43] transition-all duration-300 ${isExpanded ? 'w-6' : 'w-5 group-hover:w-6'}`} />
        </button>

        {isExpanded && (
          <span className="text-xl font-bold gradient-text animate-fadeInUp">
            Helper AI
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="px-4 space-y-4">
        {navItems.map((item) => (
          <Link
            to={item.path}
            key={item.name}
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all group
              hover:bg-[#ff9f43]/10 hover:border-[#ff9f43]/20 border border-transparent
              ${!isExpanded ? 'justify-center' : ''}`}
            title={!isExpanded ? item.name : ''}
          >
            <span className="text-xl group-hover:scale-110 transition-transform">
              {item.icon}
            </span>

            {isExpanded && (
              <span className="text-sm font-semibold text-[#a89d94] group-hover:text-[#f5f3f0] transition-colors whitespace-nowrap overflow-hidden animate-fadeInUp">
                {item.name}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="absolute bottom-8 left-0 w-full px-4">
        <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 ${!isExpanded ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-[#ff9f43] flex items-center justify-center font-bold text-[#0a0808] text-xs">JD</div>
          {isExpanded && (
            <div className="flex flex-col animate-fadeInUp text-left">
              <span className="text-xs font-bold text-[#f5f3f0]">Jai's Shop</span>
              <span className="text-[10px] text-[#a89d94]">Premium Plan</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
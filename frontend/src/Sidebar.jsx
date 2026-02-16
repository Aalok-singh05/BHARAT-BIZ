import {
  LayoutDashboard,
  ClipboardList,
  SquareCheck,
  Banknote,
  FileText,
  Users,
  Brain,
  Package
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Orders', icon: <ClipboardList size={20} />, path: '/orders' },
    { name: 'Approvals', icon: <SquareCheck size={20} />, path: '/approvals' },
    { name: 'Payments', icon: <Banknote size={20} />, path: '/payments' },
    { name: 'Documents', icon: <FileText size={20} />, path: '/documents' },
    { name: 'Customers', icon: <Users size={20} />, path: '/customers' },
    { name: 'Business Memory', icon: <Brain size={20} />, path: '/business-memory' },
    { name: 'Inventory', icon: <Package size={20} />, path: '/inventory' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isExpanded && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full z-[100] transition-all duration-300 ease-in-out border-r border-[#ff9f43]/10 glass-card backdrop-blur-2xl flex flex-col
          ${isExpanded ? 'w-64' : 'w-0 md:w-20'}
          md:relative md:h-screen`}
      >
        <div className="grain-overlay opacity-[0.02] absolute inset-0 pointer-events-none" />

        {/* Header / Toggle Button */}
        <div
          className="p-4 md:p-5 flex items-center justify-between border-b border-[#ff9f43]/5 cursor-pointer shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={`flex items-center gap-3 transition-opacity duration-300 overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <span className="text-lg font-bold gradient-text whitespace-nowrap">
              Saathi AI
            </span>
          </div>

          <button
            className="w-8 h-8 flex flex-col justify-center items-center gap-1.5 hover:bg-white/5 rounded-lg transition-all group shrink-0"
            aria-label="Toggle Sidebar"
          >
            <div className={`h-0.5 bg-[#ff9f43] transition-all duration-300 ${isExpanded ? 'w-5' : 'w-4 group-hover:w-5'}`} />
            <div className={`h-0.5 bg-[#ff9f43] transition-all duration-300 ${isExpanded ? 'w-3' : 'w-4 group-hover:w-5'}`} />
            <div className={`h-0.5 bg-[#ff9f43] transition-all duration-300 ${isExpanded ? 'w-5' : 'w-4 group-hover:w-5'}`} />
          </button>
        </div>

        {/* Navigation Links - Scrollable Area */}
        <nav className={`px-2 md:px-3 flex-1 overflow-y-auto hide-scrollbar py-3 space-y-1 ${!isExpanded ? 'hidden md:block' : ''}`}>
          {navItems.map((item) => (
            <Link
              to={item.path}
              key={item.name}
              onClick={() => {
                // Auto-close sidebar on mobile after navigation
                if (window.innerWidth < 768) setIsExpanded(false);
              }}
              className={`flex items-center h-11 rounded-xl cursor-pointer transition-all group shrink-0 relative overflow-hidden
                border border-transparent
                ${isActive(item.path)
                  ? 'bg-[#ff9f43]/15 border-[#ff9f43]/25'
                  : 'hover:bg-[#ff9f43]/10 hover:border-[#ff9f43]/20'}
                ${isExpanded ? 'px-4 gap-3' : 'justify-center px-0'}`}
              title={!isExpanded ? item.name : ''}
            >
              <span className={`${isActive(item.path) ? 'text-[#ff9f43]' : 'text-[#a89d94] group-hover:text-[#ff9f43]'} transition-colors shrink-0 flex items-center justify-center`}>
                {item.icon}
              </span>

              <span
                className={`text-sm font-medium transition-all duration-200 whitespace-nowrap overflow-hidden
                  ${isActive(item.path) ? 'text-[#f5f3f0]' : 'text-[#c4b5ac] group-hover:text-[#f5f3f0]'}
                  ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer Section - Profile Link */}
        <div className={`p-3 md:p-4 mt-auto shrink-0 border-t border-[#ff9f43]/5 ${!isExpanded ? 'hidden md:block' : ''}`}>
          <Link
            to="/profile"
            onClick={() => {
              if (window.innerWidth < 768) setIsExpanded(false);
            }}
            className={`flex items-center h-11 rounded-xl bg-white/5 border border-white/5 hover:bg-[#ff9f43]/10 hover:border-[#ff9f43]/20 transition-all group
              ${isExpanded ? 'px-3 gap-3' : 'justify-center px-0'}`}
          >
            <div className="w-8 h-8 rounded-full bg-[#ff9f43] flex items-center justify-center font-bold text-[#0a0808] text-xs group-hover:scale-110 transition-transform shrink-0">
              P
            </div>

            <div
              className={`flex flex-col whitespace-nowrap transition-all duration-200
              ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}
            >
              <span className="text-xs font-bold text-[#f5f3f0] group-hover:text-[#ff9f43] transition-colors truncate">
                My Profile
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
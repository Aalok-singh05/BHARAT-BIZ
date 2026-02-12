import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Demo from './Demo.jsx';
import Document from './Documents.jsx';
import BusinessMemory from './BussinessMemory.jsx';
import InventoryManagement from './InventoryManagement.jsx';
import MerchantDashboard from './Dashboard.jsx';
import Sidebar from './Sidebar.jsx';
import Agenticchat from './AgenticChat.jsx';
import AuthPage from './AuthPage.jsx';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const hideSidebarRoutes = ['/', '/login', '/signup'];
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    /* Background changed to the deeper Buzzworthy Black (#0a0a0a) */
    /* selection:bg-[#2b59ff]/30 ensures high-contrast text selection across the whole app */
    <div className="App flex min-h-screen bg-[#0a0a0a] text-[#ffffff] overflow-x-hidden selection:bg-[#2b59ff]/30">
      
      {/* Sidebar Container */}
      {shouldShowSidebar && (
        <div className="leftSection fixed h-full z-50"> 
          <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </div>
      )}

      {/* Main Content Layout */}
      <div 
        className={`rightSection flex-1 transition-all duration-700 ease-in-out min-w-0 ${
          shouldShowSidebar 
            ? (isExpanded ? 'ml-72' : 'ml-20') // Matches Sidebar widths
            : 'w-full'                         // Full bleed for Landing/Auth
        }`}
      >
        {/* Container Padding: 
            Buzzworthy uses larger, more 'breathable' padding (p-12) 
            compared to standard dashboards.
        */}
        <div className={shouldShowSidebar ? "p-6 md:p-12 bg-[#0a0a0a]" : ""}>
          <Routes>
            <Route path="/" element={<Demo />} />        
            <Route path="/documents" element={<Document />} />
            <Route path="/business-memory" element={<BusinessMemory />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/dashboard" element={<MerchantDashboard />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/AgenticChat" element={<Agenticchat/>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
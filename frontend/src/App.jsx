import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // 1. Import useLocation
import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // 1. Import useLocation
import Demo from './Demo.jsx';
import Document from './Documents.jsx';
import BusinessMemory from './BussinessMemory.jsx';
import InventoryManagement from './InventoryManagement.jsx';
import MerchantDashboard from './Dashboard.jsx';
import Sidebar from './Sidebar.jsx';
import Agenticchat from './AgenticChat.jsx';
import AuthPage from './AuthPage.jsx';
import Document from './Documents.jsx';
import BusinessMemory from './BussinessMemory.jsx';
import InventoryManagement from './InventoryManagement.jsx';
import MerchantDashboard from './Dashboard.jsx';
import Sidebar from './Sidebar.jsx';
import Agenticchat from './AgenticChat.jsx';
import AuthPage from './AuthPage.jsx';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. Get current path
  const location = useLocation();

  // 3. Define which pages should hide the sidebar
  // You can add more paths here if needed
  const hideSidebarRoutes = ['/', '/login', '/signup'];
  
  // Check if current path matches any of the hidden route

  // 3. Define which pages should hide the sidebar
  // You can add more paths here if needed
  
  // Check if current path matches any of the hidden routes
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="App flex min-h-screen bg-[#0a0808] overflow-x-hidden">
      
      {/* 4. Only render Sidebar if allowed */}
      {shouldShowSidebar && (
        <div className="leftSection fixed h-full z-50"> 
          <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </div>
      )}

      {/* 5. Adjust layout: 
          If sidebar is hidden -> w-full (full width)
          If sidebar is shown  -> standard margins 
      */}
      <div 
        className={`rightSection flex-1 transition-all duration-500 ease-in-out min-w-0 ${
          shouldShowSidebar 
            ? (isExpanded ? 'ml-72' : 'ml-20') // Sidebar is present
            : 'w-full'                         // Sidebar is gone (Full Width)
        }`}
      >
        {/* We remove padding for the home page so the hero section touches the edges */}
        <div className={shouldShowSidebar ? "p-4 md:p-8" : ""}>
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
        

export default App;

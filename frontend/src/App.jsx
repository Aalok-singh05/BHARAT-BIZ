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
import ApprovalQueue from './ApprovalQueue.jsx';
import PaymentRecorder from './PaymentRecorder.jsx';
import Customers from './Customers.jsx';
import Orders from './Orders.jsx';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current path
  const location = useLocation();

  // Routes where sidebar should be hidden
  const hideSidebarRoutes = ['/', '/login', '/signup'];

  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="App flex min-h-screen bg-[#0a0808] overflow-x-hidden">

      {/* Sidebar */}
      {shouldShowSidebar && (
        <div className="leftSection fixed h-full z-50">
          <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </div>
      )}

      {/* Main Content */}
      <div
        className={`rightSection flex-1 transition-all duration-500 ease-in-out min-w-0 ${shouldShowSidebar
          ? (isExpanded ? 'ml-72' : 'ml-20')
          : 'w-full'
          }`}
      >
        <div className={shouldShowSidebar ? 'p-4 md:p-8' : ''}>
          <Routes>
            <Route path="/" element={<Demo />} />
            <Route path="/documents" element={<Document />} />
            <Route path="/business-memory" element={<BusinessMemory />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/dashboard" element={<MerchantDashboard />} />
            <Route path="/approvals" element={<ApprovalQueue />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payments" element={<PaymentRecorder />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/AgenticChat" element={<Agenticchat />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;

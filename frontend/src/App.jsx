import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Demo from './Demo.jsx';
import Document from './Documents.jsx';
import BusinessMemory from './BusinessMemory.jsx';
import InventoryManagement from './InventoryManagement.jsx';
import MerchantDashboard from './Dashboard.jsx'; // Ensure file exists
import Sidebar from './Sidebar.jsx';
import Agenticchat from './AgenticChat.jsx';
import AuthPage from './AuthPage.jsx';
import ApprovalQueue from './ApprovalQueue.jsx';
import PaymentRecorder from './PaymentRecorder.jsx';
import Customers from './Customers.jsx';
import Orders from './Orders.jsx';

import Profile from './profile.jsx';

import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const hideSidebarRoutes = ['/login', '/signup', '/']; // Removed '/' from hidden if '/' is protected
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <AuthProvider>
      <div className={`App bg-[#0a0808] ${shouldShowSidebar ? 'flex h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'}`}>

        {/* Sidebar */}
        {shouldShowSidebar && (
          <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        )}

        {/* Main Content */}
        <div className={shouldShowSidebar ? "rightSection flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden relative" : "w-full"}>
          <div className={shouldShowSidebar ? `flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth` : ""}>
            <Routes>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/" element={<Demo />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/documents" element={<Document />} />
                <Route path="/business-memory" element={<BusinessMemory />} />
                <Route path="/inventory" element={<InventoryManagement />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<MerchantDashboard />} />
                <Route path="/approvals" element={<ApprovalQueue />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/payments" element={<PaymentRecorder />} />
                <Route path="/AgenticChat" element={<Agenticchat />} />
              </Route>
            </Routes>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;

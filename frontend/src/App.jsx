import React, { useState } from 'react';
import Demo from './Demo.jsx';
import Document from './Documents.jsx';
import BusinessMemory from './BussinessMemory.jsx';
import InventoryManagement from './InventoryManagement.jsx';
import { Routes, Route } from 'react-router-dom';
import MerchantDashboard from './Dashboard.jsx';
import Sidebar from './Sidebar.jsx';
import Agenticchat from './AgenticChat.jsx'

function App() {
  // Lift the sidebar state to the parent App
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="App flex min-h-screen bg-[#0a0808] overflow-x-hidden">
      <div className="leftSection">
        {/* Pass the state and toggle function as props */}
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>

      <div 
        className={`rightSection flex-1 transition-all duration-500 ease-in-out min-w-0 ${
          isExpanded ? 'ml-72' : 'ml-20'
        }`}
      >
        <div className="p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Demo />} />        
            <Route path="/documents" element={<Document />} />
            <Route path="/business-memory" element={<BusinessMemory />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/Dashboard" element={<MerchantDashboard />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
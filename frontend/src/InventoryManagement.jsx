import React, { useState, useMemo, useRef } from 'react';

const InventoryManagement = () => {
  // --- Central Data State ---
  const [inventory, setInventory] = useState([
    { id: 'SKU-001', name: 'Basmati Rice 5kg', category: 'Grocery', price: 550, quantity: 4, expiry: '2026-12-01' },
    { id: 'SKU-002', name: 'Mustard Oil 1L', category: 'Grocery', price: 185, quantity: 0, expiry: '2026-08-15' },
    { id: 'SKU-003', name: 'LED Bulb 9W', category: 'Electronics', price: 120, quantity: 45, expiry: 'N/A' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const aiFileInputRef = useRef(null);

  // --- Handlers ---
  const handleManualUpdate = (id, newValue) => {
    const val = parseInt(newValue);
    if (isNaN(val) || val < 0) return setEditingId(null);

    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: val } : item
    ));
    setEditingId(null);
  };

  const simulateAIUpdate = (type) => {
    setIsProcessing(true);
    setTimeout(() => {
      // Logic: AI finds "Mustard Oil" in the input and sets it to 20
      setInventory(prev => prev.map(item => 
        item.id === 'SKU-002' ? { ...item, quantity: 20 } : item
      ));
      setIsProcessing(false);
      setIsAIModalOpen(false);
      alert(`Saathi AI: Successfully processed ${type} and updated Mustard Oil to 20 units.`);
    }, 2000);
  };

  // --- Filtering Logic ---
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, inventory]);

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header & AI Trigger */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Inventory Ledger</h1>
            <p className="text-[#a89d94] text-sm mt-1">Manual precision meets AI intelligence.</p>
          </div>
          
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="group px-8 py-3 bg-gradient-to-r from-[#ff9f43] to-[#ffb366] text-[#0a0808] rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,159,67,0.2)]"
          >
            <span>✨</span> AI Update Assistant
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-8 group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:text-[#ff9f43]">🔍</span>
          <input 
            type="text" 
            placeholder="Search item to update..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 outline-none focus:border-[#ff9f43]/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Inventory Table */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[#a89d94] text-[10px] uppercase tracking-widest font-bold">
                <th className="p-6">Product Details</th>
                <th className="p-6">Current Stock</th>
                <th className="p-6">Price & Expiry</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="font-bold text-lg">{item.name}</div>
                    <div className="text-[10px] text-[#a89d94] font-mono uppercase tracking-tighter">{item.id}</div>
                  </td>
                  
                  <td className="p-6">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          type="number"
                          className="w-24 bg-[#ff9f43] text-[#0a0808] font-bold px-3 py-1.5 rounded-lg outline-none"
                          defaultValue={item.quantity}
                          onKeyDown={(e) => e.key === 'Enter' && handleManualUpdate(item.id, e.target.value)}
                          onBlur={(e) => handleManualUpdate(item.id, e.target.value)}
                        />
                        <span className="text-[10px] font-bold text-[#ff9f43] animate-pulse">ENTER TO SAVE</span>
                      </div>
                    ) : (
                      <div className={`text-2xl font-bold ${item.quantity < 10 ? (item.quantity === 0 ? 'text-red-500' : 'text-[#ff9f43]') : 'text-white'}`}>
                        {item.quantity}
                      </div>
                    )}
                  </td>

                  <td className="p-6">
                    <div className="font-bold">₹{item.price}</div>
                    <div className="text-[10px] text-[#a89d94] uppercase tracking-widest">Exp: {item.expiry}</div>
                  </td>

                  <td className="p-6 text-right">
                    <button 
                      onClick={() => setEditingId(item.id)}
                      className="px-5 py-2 glass-card rounded-xl text-xs font-bold hover:bg-[#ff9f43] hover:text-[#0a0808] transition-all border-[#ff9f43]/30"
                    >
                      Update Quantity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[#0a0808]/80" onClick={() => !isProcessing && setIsAIModalOpen(false)} />
          
          <div className="relative glass-card w-full max-w-md p-10 rounded-[3rem] border-[#ff9f43]/30 animate-fadeInUp overflow-hidden">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-[#0a0808]/80 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 border-4 border-[#ff9f43] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold gradient-text">Saathi AI is scanning your input...</p>
              </div>
            )}

            <h3 className="text-3xl font-bold gradient-text mb-2 text-center text-white">AI Assistant</h3>
            <p className="text-[#a89d94] text-center text-sm mb-10 italic">"Upload a photo of a bill or tell me what you've received."</p>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => aiFileInputRef.current.click()}
                className="flex flex-col items-center gap-4 p-8 glass-card rounded-3xl border-dashed border-white/20 hover:border-[#ff9f43]/50 transition-all group"
              >
                <span className="text-4xl">📸</span>
                <span className="text-xs font-bold text-[#a89d94] uppercase tracking-widest">Photo</span>
                <input type="file" ref={aiFileInputRef} className="hidden" accept="image/*" onChange={() => simulateAIUpdate('Photo')} />
              </button>

              <button 
                onClick={() => simulateAIUpdate('Voice Note')}
                className="flex flex-col items-center gap-4 p-8 glass-card rounded-3xl border-dashed border-white/20 hover:border-[#ff9f43]/50 transition-all group"
              >
                <div className="relative">
                  <span className="text-4xl">🎙️</span>
                  <div className="absolute inset-0 bg-[#ff9f43]/20 blur-xl animate-pulse" />
                </div>
                <span className="text-xs font-bold text-[#a89d94] uppercase tracking-widest">Voice</span>
              </button>
            </div>

            <button 
              disabled={isProcessing}
              onClick={() => setIsAIModalOpen(false)} 
              className="w-full mt-10 text-[#a89d94] font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
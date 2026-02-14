import React, { useState, useEffect } from 'react';

const InventoryManagement = () => {
  // --- Tabs ---
  const [activeTab, setActiveTab] = useState('stock'); // Default to stock now

  // --- Price Management State ---
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // --- Stock Management State ---
  const [inventory, setInventory] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Batch Form
  const [newBatch, setNewBatch] = useState({
    material_name: '',
    rolls: '',
    meters_per_roll: '',
    total_meters: ''
  });

  // --- Load Data ---
  useEffect(() => {
    if (activeTab === 'prices') fetchPrices();
    if (activeTab === 'stock') fetchInventory();
  }, [activeTab]);

  // --- API Calls ---
  const fetchPrices = async () => {
    setLoadingPrices(true);
    try {
      const res = await fetch('http://localhost:8000/config/prices');
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch prices", err);
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingStock(true);
    try {
      const res = await fetch('http://localhost:8000/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleUpdatePrice = async (materialName) => {
    if (!tempPrice) return setEditingPriceId(null);
    try {
      const res = await fetch('http://localhost:8000/config/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_name: materialName,
          price_per_meter: parseFloat(tempPrice)
        })
      });

      if (res.ok) {
        setPrices(prev => prev.map(p =>
          p.material_name === materialName
            ? { ...p, price_per_meter: parseFloat(tempPrice) }
            : p
        ));
      }
    } catch (err) {
      console.error("Failed to update price", err);
      alert("Failed to update price");
    }
    setEditingPriceId(null);
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      // Calculate total meters if not manually set (though backend expects it)
      // For now assume user enters total
      const payload = {
        material_name: newBatch.material_name,
        rolls: parseInt(newBatch.rolls),
        meters_per_roll: parseFloat(newBatch.meters_per_roll),
        total_meters: parseFloat(newBatch.total_meters)
      };

      const res = await fetch('http://localhost:8000/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        fetchInventory(); // Refresh
        setNewBatch({ material_name: '', rolls: '', meters_per_roll: '', total_meters: '' });
      } else {
        alert("Failed to add batch");
      }
    } catch (err) {
      console.error("Error adding batch", err);
      alert("Error adding batch");
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Inventory & Pricing</h1>
            <p className="text-[#a89d94] text-sm mt-1">Manage stock levels and material costs.</p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94] hover:text-white'}`}
            >
              Stock Management
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'prices' ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94] hover:text-white'}`}
            >
              Material Prices
            </button>
          </div>
        </div>

        {/* --- STOCK TAB --- */}
        {activeTab === 'stock' && (
          <div className="animate-fadeInUp">
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-3 bg-[#4cd964] text-[#0a0808] font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <span>+</span> Add New Stock
              </button>
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[#a89d94] text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-6">Batch ID</th>
                    <th className="p-6">Material</th>
                    <th className="p-6">Color</th>
                    <th className="p-6">Available Stock</th>
                    <th className="p-6">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.map(b => (
                    <tr key={b.batch_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-6 font-mono text-xs text-[#ff9f43]">{b.batch_id}</td>
                      <td className="p-6 font-bold">{b.material_name}</td>
                      <td className="p-6">{b.color || 'N/A'}</td>
                      <td className="p-6">
                        <div className="font-bold">{b.rolls_available} Rolls</div>
                        <div className="text-xs text-[#a89d94]">{b.loose_meters_available} meters (loose)</div>
                      </td>
                      <td className="p-6 text-xs text-[#a89d94]">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {inventory.length === 0 && !loadingStock && (
                    <tr><td colSpan="5" className="p-8 text-center text-[#a89d94]">No stock found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRICES TAB --- */}
        {activeTab === 'prices' && (
          <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 animate-fadeInUp">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[#a89d94] text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-6">Material Name</th>
                  <th className="p-6">Category</th>
                  <th className="p-6">Price / Meter (₹)</th>
                  <th className="p-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {prices.map(item => (
                  <tr key={item.material_id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6 font-bold text-lg">{item.material_name}</td>
                    <td className="p-6 text-[#a89d94] text-sm">{item.category || 'N/A'}</td>

                    <td className="p-6">
                      {editingPriceId === item.material_id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="number"
                            className="w-32 bg-[#ff9f43] text-[#0a0808] font-bold px-3 py-1.5 rounded-lg outline-none"
                            placeholder={item.price_per_meter}
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdatePrice(item.material_name)}
                          />
                          <button onClick={() => handleUpdatePrice(item.material_name)} className="text-xs font-bold text-[#ff9f43]">SAVE</button>
                        </div>
                      ) : (
                        <div className="text-xl font-bold text-[#ff9f43]">₹{item.price_per_meter}</div>
                      )}
                    </td>

                    <td className="p-6 text-right">
                      {editingPriceId !== item.material_id && (
                        <button
                          onClick={() => {
                            setEditingPriceId(item.material_id);
                            setTempPrice(item.price_per_meter);
                          }}
                          className="px-5 py-2 glass-card rounded-xl text-xs font-bold hover:bg-white/10 transition-all border-[#ff9f43]/30"
                        >
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Batch Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[#0a0808]/80" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative glass-card w-full max-w-lg p-8 rounded-[2rem] border-[#ff9f43]/30 animate-fadeInUp">
              <h2 className="text-2xl font-bold gradient-text mb-6">Add New Stock</h2>
              <form onSubmit={handleAddBatch} className="space-y-4">
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Material Name</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                    value={newBatch.material_name}
                    onChange={e => setNewBatch({ ...newBatch, material_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#a89d94] uppercase font-bold">Rolls</label>
                    <input
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                      value={newBatch.rolls}
                      onChange={e => setNewBatch({ ...newBatch, rolls: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#a89d94] uppercase font-bold">Meters / Roll</label>
                    <input
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                      value={newBatch.meters_per_roll}
                      onChange={e => setNewBatch({ ...newBatch, meters_per_roll: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Total Meters</label>
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                    value={newBatch.total_meters}
                    onChange={e => setNewBatch({ ...newBatch, total_meters: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-[#ff9f43] text-[#0a0808] font-bold rounded-xl hover:scale-105 transition-transform mt-4">
                  Save Stock
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InventoryManagement;
import React, { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const InventoryManagement = () => {
  // --- Sorting State ---
  const [sortConfig, setSortConfig] = useState({ key: 'rolls_available', direction: 'asc' });

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
    color: '',
    rolls: '',
    meters_per_roll: '',
    total_meters: ''
  });

  // --- Material Creation State ---
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', price: '', category: '' });

  // Reset forms when modals open
  useEffect(() => {
    if (isAddModalOpen) {
      setNewBatch({ material_name: '', color: '', rolls: '', meters_per_roll: '', total_meters: '' });
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (isMaterialModalOpen) {
      setNewMaterial({ name: '', price: '', category: '' });
    }
  }, [isMaterialModalOpen]);


  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterial.name || !newMaterial.price) {
      alert("Name and Price are required!");
      return;
    }

    try {
      const res = await fetch('/api/config/prices/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_name: newMaterial.name,
          price_per_meter: parseFloat(newMaterial.price),
          category: newMaterial.category || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsMaterialModalOpen(false);
        fetchPrices(); // Refresh list
        alert("Material added successfully!");
      } else {
        alert(data.detail || "Failed to add material");
      }
    } catch (err) {
      console.error("Error adding material", err);
      alert("Error adding material");
    }
  };

  // Derived state for suggestions
  const materialOptions = React.useMemo(() => {
    // Ensure we have unique names and filter out empty ones
    const names = prices.map(p => p.material_name).filter(Boolean);
    return [...new Set(names)];
  }, [prices]);


  // Auto-fill total
  useEffect(() => {
    if (newBatch.rolls && newBatch.meters_per_roll) {
      const total = parseFloat(newBatch.rolls) * parseFloat(newBatch.meters_per_roll);
      setNewBatch(prev => ({ ...prev, total_meters: total }));
    }
  }, [newBatch.rolls, newBatch.meters_per_roll]);

  // --- Load Data ---
  useEffect(() => {
    if (activeTab === 'prices') fetchPrices();
    if (activeTab === 'stock') fetchInventory();
  }, [activeTab]);

  // --- API Calls ---
  const fetchPrices = async () => {
    setLoadingPrices(true);
    try {
      const res = await fetch('/api/config/prices');
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
      const res = await fetch('/api/inventory');
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
      const res = await fetch('/api/config/prices', {
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
      if (!newBatch.material_name || !newBatch.rolls || !newBatch.meters_per_roll) {
        alert("Please fill in all required fields.");
        return;
      }

      const payload = {
        material_name: newBatch.material_name,
        color: newBatch.color || "Unknown",
        rolls: parseInt(newBatch.rolls),
        meters_per_roll: parseFloat(newBatch.meters_per_roll),
        total_meters: parseFloat(newBatch.total_meters)
      };

      const res = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setIsAddModalOpen(false);
        fetchInventory(); // Refresh
        setNewBatch({ material_name: '', color: '', rolls: '', meters_per_roll: '', total_meters: '' });
      } else {
        alert(data.detail || "Failed to add batch");
      }
    } catch (err) {
      console.error("Error adding batch", err);
      alert("Error adding batch");
    }
  };

  // --- Sorting Logic ---
  const sortedInventory = React.useMemo(() => {
    let sortableItems = [...inventory];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Specific handling for dates or numbers if needed
        if (sortConfig.key === 'created_at') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [inventory, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-[#ff9f43]" />
      : <ArrowDown className="w-4 h-4 text-[#ff9f43]" />;
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
                    <th
                      className="p-6 cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => requestSort('rolls_available')}
                    >
                      <div className="flex items-center gap-2">
                        Available Stock
                        {getSortIcon('rolls_available')}
                      </div>
                    </th>
                    <th
                      className="p-6 cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => requestSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Received
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedInventory.map(b => (
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
                  {sortedInventory.length === 0 && !loadingStock && (
                    <tr><td colSpan="5" className="p-8 text-center text-[#a89d94]">No stock found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRICES TAB --- */}
        {activeTab === 'prices' && (
          <div className="animate-fadeInUp">
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsMaterialModalOpen(true)}
                className="px-6 py-3 bg-[#4cd964] text-[#0a0808] font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <span>+</span> Add New Material
              </button>
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
              <table className="w-full text-left border-collapse">
                {/* ... table headers ... */}
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
          </div>
        )}

        {/* Add Material Modal */}
        {isMaterialModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[#0a0808]/80" onClick={() => setIsMaterialModalOpen(false)} />
            <div className="relative glass-card w-full max-w-lg p-8 rounded-[2rem] border-[#ff9f43]/30 animate-fadeInUp">
              <h2 className="text-2xl font-bold gradient-text mb-6">Add New Material</h2>
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Material Name *</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                    placeholder="e.g. Silk 80s"
                    value={newMaterial.name}
                    onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Price per Meter (₹) *</label>
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                    placeholder="e.g. 150"
                    value={newMaterial.price}
                    onChange={e => setNewMaterial({ ...newMaterial, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Category (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43]"
                    placeholder="e.g. Premium"
                    value={newMaterial.category}
                    onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsMaterialModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 text-[#a89d94] font-bold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#ff9f43] text-[#0a0808] font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                    Create Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Batch Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[#0a0808]/80" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative glass-card w-full max-w-lg p-8 rounded-[2rem] border-[#ff9f43]/30 animate-fadeInUp">
              <h2 className="text-2xl font-bold gradient-text mb-6">Add New Stock</h2>
              <form onSubmit={handleAddBatch} className="space-y-4">

                {/* Material Datlist for Suggestions */}
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Material Name</label>
                  <input
                    list="material-options"
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43] placeholder-[#a89d94]/30"
                    placeholder="e.g. Cotton 60s"
                    value={newBatch.material_name}
                    onChange={e => setNewBatch({ ...newBatch, material_name: e.target.value })}
                    required
                  />
                  <datalist id="material-options">
                    {materialOptions.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>

                {/* Color Input (New) */}
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Color / Variant</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43] placeholder-[#a89d94]/30"
                    placeholder="e.g. Red, Blue, Print-A"
                    value={newBatch.color}
                    onChange={e => setNewBatch({ ...newBatch, color: e.target.value })}
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

                {/* Auto Calculated Total */}
                <div>
                  <label className="text-xs text-[#a89d94] uppercase font-bold">Total Meters (Auto)</label>
                  <input
                    type="number"
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#ff9f43] opacity-60 cursor-not-allowed"
                    value={newBatch.total_meters}
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
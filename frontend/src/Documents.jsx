import React, { useState, useMemo, useCallback, useRef } from 'react';

// --- Sub-Component: The Entry Modal ---
const AddDocumentModal = ({ isOpen, onClose, onSave }) => {
  const [entryMode, setEntryMode] = useState('ai'); // 'ai' or 'manual'
  const [docType, setDocType] = useState('invoices'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Form States
  const [manualData, setManualData] = useState({
    name: '',
    amount: '',
    details: '',
    category: 'General',
    file: null
  });

  const fileInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAISave = (type) => {
    setIsProcessing(true);
    // Simulate AI extraction from Photo/Audio
    setTimeout(() => {
      onSave({
        id: Date.now(),
        type: docType,
        name: "AI Extracted Entry",
        date: new Date().toLocaleDateString('en-IN'),
        amount: docType === 'invoices' ? "₹" + (Math.floor(Math.random() * 2000) + 100) : null,
        details: `Extracted from ${type} input using Saathi AI.`,
        category: 'AI Processed',
        fileName: `ai_${type}_${Date.now()}.pdf`,
        status: 'Verified'
      });
      setIsProcessing(false);
      resetAndClose();
    }, 2000);
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    if (!manualData.name || (docType === 'invoices' && !manualData.amount)) {
      return alert("Please fill required fields");
    }
    setIsProcessing(true);
    setTimeout(() => {
      onSave({
        id: Date.now(),
        type: docType,
        name: manualData.name,
        date: new Date().toLocaleDateString('en-IN'),
        amount: docType === 'invoices' ? `₹${manualData.amount}` : null,
        details: manualData.details || 'Manual Entry',
        category: manualData.category,
        fileName: manualData.file ? manualData.file.name : 'manual_upload.pdf',
        status: 'Saved'
      });
      setIsProcessing(false);
      resetAndClose();
    }, 800);
  };

  const resetAndClose = () => {
    setManualData({ name: '', amount: '', details: '', category: 'General', file: null });
    setEntryMode('ai');
    setIsRecording(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0808]/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg glass-card rounded-[2.5rem] p-8 border border-[#ff9f43]/30 shadow-2xl overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-[#0a0808]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 border-4 border-[#ff9f43] border-t-transparent rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold gradient-text mb-2">Saathi AI is working</h3>
            <p className="text-[#a89d94] text-sm">Extracting details and updating your vault...</p>
          </div>
        )}

        {/* Header & Mode Switcher */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold gradient-text">Add Entry</h2>
            <p className="text-[10px] text-[#a89d94] uppercase tracking-widest mt-1">
              Select {docType === 'invoices' ? 'Invoice' : 'Document'} Method
            </p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setEntryMode('ai')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${entryMode === 'ai' ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94]'}`}
            >✨ AI</button>
            <button 
              onClick={() => setEntryMode('manual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${entryMode === 'manual' ? 'bg-[#ff9f43] text-[#0a0808]' : 'text-[#a89d94]'}`}
            >📝 Manual</button>
          </div>
        </div>

        {/* Entry Forms */}
        {entryMode === 'ai' ? (
          <div className="space-y-6 animate-fadeInUp">
            <div className="grid grid-cols-2 gap-4">
              {/* Photo Input */}
              <button 
                onClick={() => aiFileInputRef.current.click()}
                className="flex flex-col items-center justify-center gap-4 p-8 glass-card border-dashed border-white/20 hover:border-[#ff9f43]/50 transition-all rounded-3xl group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">📸</span>
                <span className="text-xs font-bold text-[#a89d94]">Upload Photo</span>
                <input type="file" ref={aiFileInputRef} className="hidden" accept="image/*" onChange={() => handleAISave('Photo')} />
              </button>

              {/* Audio Input */}
              <button 
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => { setIsRecording(false); handleAISave('Voice'); }}
                className={`flex flex-col items-center justify-center gap-4 p-8 glass-card border-dashed transition-all rounded-3xl group ${isRecording ? 'border-[#ff9f43] bg-[#ff9f43]/10 scale-95' : 'border-white/20 hover:border-[#ff9f43]/50'}`}
              >
                <div className="relative">
                  <span className="text-4xl">🎙️</span>
                  {isRecording && <span className="absolute inset-0 rounded-full bg-[#ff9f43] animate-ping opacity-40" />}
                </div>
                <span className="text-xs font-bold text-[#a89d94]">
                  {isRecording ? "Listening..." : "Hold to Speak"}
                </span>
              </button>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] text-[#a89d94] leading-relaxed text-center italic">
                "Saathi AI can extract customer names, amounts, and dates from photos of bills or voice notes in Hinglish."
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSave} className="space-y-4 animate-fadeInUp">
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#ff9f43]/50"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="invoices">Invoice Category</option>
              <option value="others">Other Documents</option>
            </select>

            <input 
              type="text" placeholder="Customer Name *" required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[#ff9f43]/50 outline-none"
              value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})}
            />

            {docType === 'invoices' ? (
              <input 
                type="number" placeholder="Amount (₹) *" required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[#ff9f43]/50 outline-none"
                value={manualData.amount} onChange={e => setManualData({...manualData, amount: e.target.value})}
              />
            ) : (
              <textarea 
                placeholder="Order Details / Description *" required
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 focus:border-[#ff9f43]/50 outline-none resize-none"
                value={manualData.details} onChange={e => setManualData({...manualData, details: e.target.value})}
              />
            )}

            <button type="submit" className="w-full py-4 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold hover:scale-[1.02] transition-all">
              Save Entry
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Main Page Component ---
const DocumentVault = () => {
  // ... (State and list logic remains identical to previous functional step)
  const [documents, setDocuments] = useState([
    { id: 1, type: 'invoices', name: 'Rajesh Kumar', date: '01/02/2026', amount: '₹4,500', category: 'Construction' },
    { id: 2, type: 'others', name: 'Amit Singh', date: '03/02/2026', details: 'Site map and labor requirements', fileName: 'site_plan.pdf', category: 'Planning' },
  ]);

  const [activeTab, setActiveTab] = useState('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleSave = (newDoc) => {
    setDocuments(prev => [newDoc, ...prev]);
    setActiveTab(newDoc.type);
  };

  const toggleSelect = (id) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const deleteSelected = () => {
    if (window.confirm(`Delete ${selectedDocs.length} items?`)) {
      setDocuments(prev => prev.filter(doc => !selectedDocs.includes(doc.id)));
      setSelectedDocs([]);
      setIsSelectionMode(false);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => doc.type === activeTab);
  }, [documents, activeTab]);

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-20 font-sans relative">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-1">Business Vault</h1>
            <p className="text-[#a89d94] text-sm">Secure storage for your shop's records</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'others' && (
              <button 
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedDocs([]);
                }}
                className={`px-5 py-3 rounded-xl font-bold transition-all border ${isSelectionMode ? 'bg-red-500/10 border-red-500 text-red-500' : 'glass-card border-white/10 text-[#a89d94]'}`}
              >
                {isSelectionMode ? 'Cancel' : 'Select Files'}
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,159,67,0.2)]"
            >
              + New Entry
            </button>
          </div>
        </header>

        {/* Tab Controls */}
        <div className="flex gap-8 mb-8 border-b border-white/5">
          {['invoices', 'others'].map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setIsSelectionMode(false); }}
              className={`pb-4 px-2 capitalize font-bold transition-all ${activeTab === tab ? 'text-[#ff9f43] border-b-2 border-[#ff9f43]' : 'text-[#a89d94]'}`}
            >
              {tab === 'others' ? 'Other Documents' : tab}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="space-y-4">
          {filteredDocs.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => isSelectionMode && toggleSelect(doc.id)}
              className={`glass-card p-5 rounded-2xl flex items-center justify-between transition-all group ${isSelectionMode ? 'cursor-pointer' : ''} ${selectedDocs.includes(doc.id) ? 'border-[#ff9f43] bg-[#ff9f43]/5' : 'hover:border-white/20'}`}
            >
              <div className="flex items-center gap-4">
                {isSelectionMode && (
                  <div className={`w-5 h-5 rounded border ${selectedDocs.includes(doc.id) ? 'bg-[#ff9f43] border-[#ff9f43]' : 'border-white/20'}`}>
                    {selectedDocs.includes(doc.id) && <span className="text-[#0a0808] text-xs flex items-center justify-center">✓</span>}
                  </div>
                )}
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-lg">
                  {doc.type === 'invoices' ? '💰' : '📄'}
                </div>
                <div>
                  <h3 className="font-bold text-[#f5f3f0] text-sm md:text-base">{doc.name}</h3>
                  <p className="text-[10px] md:text-xs text-[#a89d94] truncate max-w-[150px] md:max-w-sm">
                    {doc.type === 'invoices' ? doc.date : doc.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="font-bold text-[#ff9f43]">{doc.amount || ''}</div>
                  <div className="text-[10px] text-[#a89d94] uppercase tracking-tighter">{doc.date}</div>
                </div>
                {!isSelectionMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); alert(`Downloading...`); }}
                    className="p-2.5 bg-white/5 hover:bg-[#ff9f43] hover:text-[#0a0808] rounded-xl transition-all"
                  >
                    ⬇️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <AddDocumentModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default DocumentVault;
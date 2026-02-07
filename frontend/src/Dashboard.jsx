// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import AgenticChat from './AgenticChat'; // Ensure this file exists

// const MerchantDashboard = () => {
//   // --- LAYOUT STATE ---
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [activeView, setActiveView] = useState('Dashboard');

//   // --- EXISTING LOGIC STATE ---
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [orders, setOrders] = useState([
//     {
//       id: 1,
//       customerName: 'Rahul Sharma',
//       orderDate: '2026-02-01',
//       amount: 2500,
//       status: 'In Transit',
//       paymentStatus: 'Pending',
//       daysLate: 3,
//       items: 'Electronics - Mobile Charger, Earphones'
//     },
//     {
//       id: 2,
//       customerName: 'Priya Verma',
//       orderDate: '2026-02-02',
//       amount: 1200,
//       status: 'Delivered',
//       paymentStatus: 'Paid',
//       daysLate: 0,
//       items: 'Groceries - Rice, Dal, Oil'
//     },
//     {
//       id: 3,
//       customerName: 'Amit Kumar',
//       orderDate: '2026-02-03',
//       amount: 3500,
//       status: 'Processing',
//       paymentStatus: 'Pending',
//       daysLate: 1,
//       items: 'Hardware - Paint Brushes, Cement'
//     }
//   ]);

//   const [aiInsights, setAiInsights] = useState([
//     { id: 1, type: 'payment', message: "Rahul's payment is 3 days late. Should I send a voice nudge?", priority: 'high' },
//     { id: 2, type: 'delivery', message: "Sunita's order was delivered 7 days ago but payment pending. Remind?", priority: 'high' }
//   ]);

//   // --- MODAL & ENTRY STATES ---
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [entryMode, setEntryMode] = useState('manual');
//   const [isListening, setIsListening] = useState(false);
//   const [voiceTranscript, setVoiceTranscript] = useState('');
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
  
//   const [newOrder, setNewOrder] = useState({
//     customerName: '', amount: '', status: 'Processing', paymentStatus: 'Pending', items: '',
//     orderDate: new Date().toISOString().split('T')[0]
//   });

//   // --- LOGIC HANDLERS ---
//   const metrics = {
//     totalPending: orders.reduce((sum, order) => order.paymentStatus !== 'Paid' ? sum + Number(order.amount) : sum, 0),
//     ordersInTransit: orders.filter(order => order.status === 'In Transit').length,
//     monthlyRevenue: orders.reduce((sum, order) => sum + Number(order.amount), 0)
//   };

//   const handleSendReminder = (order) => alert(`WhatsApp reminder sent to ${order.customerName}!`);
//   const handleAiAction = (insightId) => setAiInsights(aiInsights.filter(i => i.id !== insightId));

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewOrder(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmitNewOrder = (e) => {
//     if (e) e.preventDefault();
//     const entry = { id: orders.length + 1, ...newOrder, amount: Number(newOrder.amount), daysLate: 0 };
//     setOrders([entry, ...orders]);
//     resetModal();
//   };

//   const resetModal = () => {
//     setNewOrder({ customerName: '', amount: '', status: 'Processing', paymentStatus: 'Pending', items: '', orderDate: new Date().toISOString().split('T')[0] });
//     setIsModalOpen(false); setEntryMode('manual'); setIsListening(false); setVoiceTranscript(''); setIsAnalyzing(false); setUploadProgress(0);
//   };

//   // --- AI SIMULATIONS ---
//   const toggleListening = () => {
//     if (isListening) {
//       setIsListening(false);
//     } else {
//       setIsListening(true);
//       setVoiceTranscript("Listening...");
//       setTimeout(() => {
//         setVoiceTranscript("Recognized: \"Suresh ke liye 5000 ka cement likh do, payment abhi pending hai\"");
//         setNewOrder({
//           customerName: 'Suresh Bhai', amount: '5000', items: 'Cement Bags (AI Voice Detected)',
//           status: 'Processing', paymentStatus: 'Pending', orderDate: new Date().toISOString().split('T')[0]
//         });
//         setIsListening(false);
//         setTimeout(() => setEntryMode('manual'), 1500);
//       }, 2500);
//     }
//   };

//   const handlePhotoUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setIsAnalyzing(true);
//     let progress = 0;
//     const interval = setInterval(() => {
//       progress += 10;
//       setUploadProgress(progress);
//       if (progress >= 100) clearInterval(interval);
//     }, 200);
//     setTimeout(() => {
//       setNewOrder({
//         customerName: 'Vikram Construction', amount: '12500', items: 'Extract from handwritten bill: 50x Bricks, 20kg Sand',
//         status: 'Processing', paymentStatus: 'Udhaar', orderDate: new Date().toISOString().split('T')[0]
//       });
//       setIsAnalyzing(false); setUploadProgress(0); setEntryMode('manual');
//     }, 3000);
//   };

//   // --- STYLE HELPERS ---
//   const getStatusColor = (status) => {
//     switch(status) {
//       case 'Delivered': return 'text-[#4cd964] shadow-[0_0_15px_rgba(76,217,100,0.4)]';
//       case 'In Transit': return 'text-[#ff9f43] shadow-[0_0_15px_rgba(255,159,67,0.4)]';
//       case 'Processing': return 'text-[#ffb366] shadow-[0_0_15px_rgba(255,179,102,0.4)]';
//       default: return 'text-[#a89d94]';
//     }
//   };

//   const getPaymentStatusColor = (status) => {
//     switch(status) {
//       case 'Paid': return 'bg-[#4cd964]/20 text-[#4cd964] border-[#4cd964]/40';
//       case 'Pending': return 'bg-[#ff9f43]/20 text-[#ff9f43] border-[#ff9f43]/40';
//       case 'Udhaar': return 'bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/40';
//       default: return 'bg-[#a89d94]/20 text-[#a89d94] border-[#a89d94]/40';
//     }
//   };

//   // --- SIDEBAR MENU ITEMS ---
//   const menuItems = [
//     { name: 'Dashboard', icon: '📊' },
//     { name: 'Inventory', icon: '📦' },
//     { name: 'Documents', icon: '📄' },
//     { name: 'Memory', icon: '🧠' }, // Shortened for sidebar width
//     { name: 'Agent', icon: '🎙️' }
//   ];

//   return (
//     <div className="flex h-screen bg-[#0a0808] text-[#f5f3f0] font-sans overflow-hidden selection:bg-[#ff9f43]/30">
      
//       {/* 1. Global Ambient Background */}
//       <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
//         <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 bg-[#ff9f43] -top-[200px] -right-[100px]" />
//         <div className="absolute w-[400px] h-[400px] rounded-full blur-[150px] opacity-10 bg-[#ff6b35] -bottom-[150px] -left-[100px]" />
//         <div className="grain-overlay" />
//       </div>

//       {/* 2. SIDEBAR */}
//       <aside 
//         className={`relative z-40 h-full border-r border-[#ff9f43]/10 backdrop-blur-xl bg-[#0a0808]/80 transition-all duration-300 ease-in-out flex flex-col
//           ${isSidebarOpen ? 'w-64' : 'w-20'}
//         `}
//       >
//         {/* Sidebar Header */}
//         <div className="h-20 flex items-center justify-center border-b border-[#ff9f43]/10 relative">
//           <div className={`font-bold text-xl gradient-text whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
//             Saathi AI
//           </div>
//           {!isSidebarOpen && <div className="absolute text-2xl">🤖</div>}
          
//           <button 
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             className="absolute -right-3 top-8 w-6 h-6 bg-[#1a0f0a] border border-[#ff9f43]/30 rounded-full flex items-center justify-center text-[#ff9f43] text-xs hover:scale-110 transition-transform z-50"
//           >
//             {isSidebarOpen ? '◀' : '▶'}
//           </button>
//         </div>

//         {/* Menu */}
//         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
//           {menuItems.map((item) => (
//             <button
//               key={item.name}
//               onClick={() => setActiveView(item.name)}
//               className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
//                 ${activeView === item.name 
//                   ? 'bg-[#ff9f43]/10 border border-[#ff9f43]/30 text-[#ff9f43]' 
//                   : 'hover:bg-[#ff9f43]/5 text-[#a89d94] hover:text-[#f5f3f0]'
//                 }
//               `}
//             >
//               <span className="text-xl min-w-[24px] text-center">{item.icon}</span>
//               <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
//                 {item.name}
//               </span>
//               {activeView === item.name && <div className="absolute left-0 w-1 h-6 bg-[#ff9f43] rounded-r-full shadow-[0_0_10px_#ff9f43]" />}
//             </button>
//           ))}
//         </nav>

//         {/* User Profile */}
//         <div className="p-4 border-t border-[#ff9f43]/10">
//           <div className={`flex items-center gap-3 ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff9f43] to-[#ff6b35] flex items-center justify-center font-bold text-[#0a0808] shrink-0">
//               MK
//             </div>
//             <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
//               <div className="text-sm font-semibold text-[#f5f3f0] whitespace-nowrap">Mukesh Kumar</div>
//               <Link to="/" className="text-xs text-[#a89d94] hover:text-[#ff9f43]">Log Out</Link>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* 3. MAIN CONTENT AREA */}
//       <main className="flex-1 h-full overflow-y-auto relative z-10 scrollbar-hide">
        
//         {/* Top Header */}
//         <header className="sticky top-0 z-30 h-20 px-8 flex items-center justify-between backdrop-blur-md bg-[#0a0808]/50 border-b border-[#ff9f43]/10">
//           <h2 className="text-2xl font-bold text-[#f5f3f0]">{activeView}</h2>
//           <div className="flex gap-4">
//              <button className="hidden md:block glass-card px-4 py-2 rounded-lg text-sm hover:bg-[#ff9f43] hover:text-black transition-colors">
//                🔔 Alerts ({aiInsights.length})
//              </button>
//              <button 
//                onClick={() => setIsModalOpen(true)}
//                className="glass-card px-4 py-2 rounded-lg text-sm bg-[#ff9f43] text-black font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,159,67,0.3)]"
//              >
//                + New Order
//              </button>
//           </div>
//         </header>

//         <div className="p-6 md:p-8 max-w-[1600px] mx-auto">

//           {/* === VIEW: DASHBOARD (Your Original Logic) === */}
//           {activeView === 'Dashboard' && (
//             <div className="animate-fadeInUp">
//                {/* Metrics */}
//                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//                 <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
//                   <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Total Pending</div>
//                   <div className="text-4xl font-bold gradient-text mb-1">₹{metrics.totalPending.toLocaleString('en-IN')}</div>
//                   <div className="text-[#ff9f43] text-sm">{orders.filter(o => o.paymentStatus !== 'Paid').length} pending payments</div>
//                 </div>
//                 <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
//                   <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">In Transit</div>
//                   <div className="text-4xl font-bold gradient-text mb-1">{metrics.ordersInTransit}</div>
//                   <div className="text-[#ff9f43] text-sm">Active shipments</div>
//                 </div>
//                 <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
//                   <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Revenue</div>
//                   <div className="text-4xl font-bold gradient-text mb-1">₹{metrics.monthlyRevenue.toLocaleString('en-IN')}</div>
//                   <div className="text-[#4cd964] text-sm">+12% from last month</div>
//                 </div>
//               </div>

//               {/* Main Grid: Orders & AI */}
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Order List */}
//                 <div className="lg:col-span-2">
//                   <div className="glass-card rounded-3xl p-6 md:p-8">
//                     <h2 className="text-2xl font-bold text-[#f5f3f0] mb-6">Recent Orders</h2>
//                     <div className="space-y-4">
//                       {orders.map((order) => (
//                         <div key={order.id} className="glass-card rounded-xl p-5 hover:border-[#ff9f43]/30 transition-all">
//                           <div className="grid md:grid-cols-12 gap-4 items-center">
//                             <div className="col-span-3">
//                               <div className="font-bold text-[#f5f3f0]">{order.customerName}</div>
//                               <div className="text-sm text-[#a89d94] mt-1">{order.orderDate}</div>
//                             </div>
//                             <div className="col-span-3 text-sm text-[#a89d94] line-clamp-2">{order.items}</div>
//                             <div className="col-span-2"><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span></div>
//                             <div className="col-span-2"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span></div>
//                             <div className="col-span-2 flex justify-end">
//                               <button onClick={() => handleSendReminder(order)} className="px-3 py-1.5 bg-[#ff9f43]/20 text-[#ff9f43] rounded-lg text-xs font-semibold border border-[#ff9f43]/40 hover:bg-[#ff9f43] hover:text-black transition-all">📱 Remind</button>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 {/* AI Panel */}
//                 <div className="lg:col-span-1">
//                   <div className="glass-card rounded-3xl p-6 sticky top-6">
//                     <div className="flex items-center gap-3 mb-6">
//                       <div className="w-10 h-10 bg-gradient-to-br from-[#ff9f43] to-[#ffb366] rounded-xl flex items-center justify-center text-2xl animate-pulse-glow">🧠</div>
//                       <div><h3 className="text-xl font-bold">Saathi AI</h3><div className="text-xs text-[#a89d94]">Your business assistant</div></div>
//                     </div>
//                     <div className="space-y-4">
//                       {aiInsights.map((insight) => (
//                         <div key={insight.id} className="glass-card rounded-xl p-4 border-l-4 border-[#ff9f43]">
//                           <div className="text-sm text-[#f5f3f0] mb-3">{insight.message}</div>
//                           <div className="flex gap-2">
//                             <button onClick={() => handleAiAction(insight.id)} className="flex-1 px-2 py-1.5 bg-[#ff9f43] text-[#0a0808] rounded-lg text-xs font-bold">Yes</button>
//                             <button onClick={() => handleAiAction(insight.id)} className="flex-1 px-2 py-1.5 bg-white/5 text-white rounded-lg text-xs">Later</button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* === VIEW: AGENT INTERFACE === */}
//           {activeView === 'Agent' && (
//             <div className="h-[70vh] flex flex-col items-center justify-center glass-card rounded-3xl animate-fadeInUp relative overflow-hidden">
//                 <div className="absolute w-[300px] h-[300px] bg-[#ff9f43] blur-[100px] opacity-20 rounded-full animate-pulse"></div>
//                 <div className="text-6xl mb-6 z-10">🎙️</div>
//                 <h3 className="text-3xl font-bold mb-2 z-10">I'm Listening...</h3>
//                 <p className="text-[#a89d94] mb-8 z-10 text-lg">Try saying "Show me uncollected payments for this month"</p>
//                 <button 
//                   onClick={() => setIsChatOpen(true)}
//                   className="px-10 py-5 bg-[#ff9f43] text-black rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,159,67,0.4)] z-10"
//                 >
//                   Open Full Chat
//                 </button>
//              </div>
//           )}

//           {/* === VIEW: PLACEHOLDERS (Inventory, etc.) === */}
//           {['Inventory', 'Documents', 'Memory'].includes(activeView) && (
//              <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fadeInUp glass-card rounded-3xl">
//                <div className="text-6xl mb-4">🚧</div>
//                <h3 className="text-2xl font-bold text-[#f5f3f0] mb-2">{activeView} Module</h3>
//                <p className="text-[#a89d94]">This feature is currently under development.</p>
//              </div>
//           )}

//         </div>
//       </main>

//       {/* --- MODALS (Outside Layout) --- */}
      
//       {/* 1. NEW ORDER MODAL */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
//           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={resetModal} />
          
//           <div className="glass-card w-full max-w-lg rounded-3xl p-0 relative z-10 border border-[#ff9f43]/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeInUp">
//             {/* Modal Content (Preserved from your code) */}
//             <div className="p-6 pb-0 border-b border-[#ff9f43]/10">
//               <h3 className="text-2xl font-bold gradient-text mb-6">Create New Order</h3>
//               <div className="flex gap-2">
//                 {['manual', 'voice', 'photo'].map(mode => (
//                    <button 
//                     key={mode}
//                     onClick={() => setEntryMode(mode)}
//                     className={`flex-1 pb-4 text-sm font-semibold transition-all relative capitalize ${entryMode === mode ? 'text-[#ff9f43]' : 'text-[#a89d94]'}`}
//                   >
//                     {mode === 'manual' ? '📝' : mode === 'voice' ? '🎙️' : '📸'} {mode}
//                     {entryMode === mode && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff9f43]" />}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="p-8">
//               {/* MANUAL FORM */}
//               {entryMode === 'manual' && (
//                 <form onSubmit={handleSubmitNewOrder} className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm text-[#a89d94] mb-1">Customer Name</label>
//                       <input type="text" name="customerName" required value={newOrder.customerName} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none" />
//                     </div>
//                     <div>
//                       <label className="block text-sm text-[#a89d94] mb-1">Amount (₹)</label>
//                       <input type="number" name="amount" required value={newOrder.amount} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none" />
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm text-[#a89d94] mb-1">Items</label>
//                     <textarea name="items" required value={newOrder.items} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none h-20 resize-none" />
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <select name="status" value={newOrder.status} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] outline-none"><option value="Processing">Processing</option><option value="In Transit">In Transit</option><option value="Delivered">Delivered</option></select>
//                     <select name="paymentStatus" value={newOrder.paymentStatus} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] outline-none"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Udhaar">Udhaar</option></select>
//                   </div>
//                   <div className="pt-4 flex gap-3">
//                     <button type="button" onClick={resetModal} className="flex-1 px-4 py-3 bg-white/5 text-[#a89d94] rounded-xl font-semibold hover:bg-white/10">Cancel</button>
//                     <button type="submit" className="flex-1 px-4 py-3 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold hover:bg-[#ffb366]">Create Order</button>
//                   </div>
//                 </form>
//               )}
//               {/* VOICE & PHOTO MODES (Simulated) */}
//               {entryMode === 'voice' && (
//                 <div className="text-center py-6">
//                    <button onClick={toggleListening} className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto transition-all ${isListening ? 'bg-[#ff9f43] text-black animate-pulse' : 'border border-[#ff9f43] text-[#ff9f43]'}`}>{isListening ? '⏹' : '🎙'}</button>
//                    <p className="text-[#f5f3f0] font-bold">{isListening ? 'Listening...' : 'Tap to Speak'}</p>
//                    {voiceTranscript && <p className="mt-4 text-sm italic text-[#ff9f43] bg-white/5 p-2 rounded">{voiceTranscript}</p>}
//                 </div>
//               )}
//               {entryMode === 'photo' && (
//                 <div className="text-center py-6">
//                    <label className="block w-full h-40 border-2 border-dashed border-[#ff9f43]/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#ff9f43]/5">
//                      <span className="text-4xl mb-2">📸</span>
//                      <span className="text-[#a89d94]">Upload Bill</span>
//                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
//                    </label>
//                    {isAnalyzing && <div className="mt-4 text-[#ff9f43] animate-pulse">Analyzing Image... {uploadProgress}%</div>}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 2. CHAT DRAWER */}
//       <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0a0808] shadow-[-20px_0_50px_rgba(0,0,0,0.8)] transform transition-transform duration-500 z-[70] border-l border-[#ff9f43]/20 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
//          {/* Close button provided by AgenticChat usually, but added here just in case */}
//          <button onClick={() => setIsChatOpen(false)} className="absolute top-4 left-4 text-[#a89d94] hover:text-white md:hidden">Close</button>
//          <AgenticChat onClose={() => setIsChatOpen(false)} />
//       </div>

//       {/* 3. FLOATING CHAT TRIGGER (Only visible if chat is closed) */}
//       {!isChatOpen && (
//         <button 
//           onClick={() => setIsChatOpen(true)}
//           className="fixed bottom-8 right-8 w-14 h-14 bg-[#ff9f43] rounded-full flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,159,67,0.4)] hover:scale-110 transition-all z-50 animate-bounce"
//         >
//           🧠
//         </button>
//       )}

//       {/* Backdrop for Chat */}
//       {isChatOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setIsChatOpen(false)} />}
//     </div>
//   );
// };

// export default MerchantDashboard;

import React, { useState } from 'react';
import AgenticChat from './AgenticChat';

const MerchantDashboard = () => {
  // --- STATE MANAGEMENT ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [orders, setOrders] = useState([
    {
      id: 1,
      customerName: 'Rahul Sharma',
      orderDate: '2026-02-01',
      amount: 2500,
      status: 'In Transit',
      paymentStatus: 'Pending',
      daysLate: 3,
      items: 'Electronics - Mobile Charger, Earphones'
    },
    {
      id: 2,
      customerName: 'Priya Verma',
      orderDate: '2026-02-02',
      amount: 1200,
      status: 'Delivered',
      paymentStatus: 'Paid',
      daysLate: 0,
      items: 'Groceries - Rice, Dal, Oil'
    },
    {
      id: 3,
      customerName: 'Amit Kumar',
      orderDate: '2026-02-03',
      amount: 3500,
      status: 'Processing',
      paymentStatus: 'Pending',
      daysLate: 1,
      items: 'Hardware - Paint Brushes, Cement'
    }
  ]);

  const [aiInsights, setAiInsights] = useState([
    {
      id: 1,
      type: 'payment',
      message: "Rahul's payment is 3 days late. Should I send a voice nudge?",
      priority: 'high'
    },
    {
      id: 2,
      type: 'delivery',
      message: "Sunita's order was delivered 7 days ago but payment pending. Remind?",
      priority: 'high'
    }
  ]);

  // --- MODAL & ENTRY STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' | 'voice' | 'photo'
  
  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Photo States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    amount: '',
    status: 'Processing',
    paymentStatus: 'Pending',
    items: '',
    orderDate: new Date().toISOString().split('T')[0]
  });

  // --- LOGIC HANDLERS ---
  const metrics = {
    totalPending: orders.reduce((sum, order) => 
      order.paymentStatus !== 'Paid' ? sum + Number(order.amount) : sum, 0
    ),
    ordersInTransit: orders.filter(order => order.status === 'In Transit').length,
    monthlyRevenue: orders.reduce((sum, order) => sum + Number(order.amount), 0)
  };

  const handleSendReminder = (order) => {
    alert(`WhatsApp reminder sent to ${order.customerName}!`);
  };

  const handleMarkDelivered = (orderId) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'Delivered' } : order
    ));
  };

  const handleAiAction = (insightId) => {
    setAiInsights(aiInsights.filter(i => i.id !== insightId));
  };

  // --- FORM HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitNewOrder = (e) => {
    if (e) e.preventDefault();
    
    const entry = {
      id: orders.length + 1,
      ...newOrder,
      amount: Number(newOrder.amount),
      daysLate: 0
    };

    setOrders([entry, ...orders]);
    resetModal();
  };

  const resetModal = () => {
    setNewOrder({
      customerName: '',
      amount: '',
      status: 'Processing',
      paymentStatus: 'Pending',
      items: '',
      orderDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
    setEntryMode('manual');
    setIsListening(false);
    setVoiceTranscript('');
    setIsAnalyzing(false);
    setUploadProgress(0);
  };

  // --- AI SIMULATIONS ---
  
  // 1. Voice Logic
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setVoiceTranscript("Listening...");
      
      setTimeout(() => {
        setVoiceTranscript("Recognized: \"Suresh ke liye 5000 ka cement likh do, payment abhi pending hai\"");
        setNewOrder({
          customerName: 'Suresh Bhai',
          amount: '5000',
          items: 'Cement Bags (AI Voice Detected)',
          status: 'Processing',
          paymentStatus: 'Pending',
          orderDate: new Date().toISOString().split('T')[0]
        });
        setIsListening(false);
        setTimeout(() => setEntryMode('manual'), 1500);
      }, 2500);
    }
  };

  // 2. Photo Logic (New)
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 200);

    // Simulate AI Processing delay
    setTimeout(() => {
      // Mock extracted data from an "Image"
      setNewOrder({
        customerName: 'Vikram Construction',
        amount: '12500',
        items: 'Extract from handwritten bill: 50x Bricks, 20kg Sand',
        status: 'Processing',
        paymentStatus: 'Udhaar', // Extracted from image context
        orderDate: new Date().toISOString().split('T')[0]
      });
      setIsAnalyzing(false);
      setUploadProgress(0);
      setEntryMode('manual'); // Switch to form to review
    }, 3000);
  };

  // Style Helpers
  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'text-[#4cd964] shadow-[0_0_15px_rgba(76,217,100,0.4)]';
      case 'In Transit': return 'text-[#ff9f43] shadow-[0_0_15px_rgba(255,159,67,0.4)]';
      case 'Processing': return 'text-[#ffb366] shadow-[0_0_15px_rgba(255,179,102,0.4)]';
      default: return 'text-[#a89d94]';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-[#4cd964]/20 text-[#4cd964] border-[#4cd964]/40';
      case 'Pending': return 'bg-[#ff9f43]/20 text-[#ff9f43] border-[#ff9f43]/40';
      case 'Udhaar': return 'bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/40';
      default: return 'bg-[#a89d94]/20 text-[#a89d94] border-[#a89d94]/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-8 font-sans relative">
      
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 bg-[#ff9f43] -top-[200px] -right-[100px]" />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[150px] opacity-10 bg-[#ff6b35] -bottom-[150px] -left-[100px]" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fadeInUp">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">Merchant Dashboard</h1>
          <p className="text-[#a89d94] text-lg">Your business, managed by AI</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
            <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Total Pending</div>
            <div className="text-4xl font-bold gradient-text mb-1">₹{metrics.totalPending.toLocaleString('en-IN')}</div>
            <div className="text-[#ff9f43] text-sm">{orders.filter(o => o.paymentStatus !== 'Paid').length} pending payments</div>
          </div>
          <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
            <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">In Transit</div>
            <div className="text-4xl font-bold gradient-text mb-1">{metrics.ordersInTransit}</div>
            <div className="text-[#ff9f43] text-sm">Active shipments</div>
          </div>
          <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
            <div className="text-[#a89d94] text-sm font-semibold mb-2 uppercase tracking-wide">Revenue</div>
            <div className="text-4xl font-bold gradient-text mb-1">₹{metrics.monthlyRevenue.toLocaleString('en-IN')}</div>
            <div className="text-[#4cd964] text-sm">+12% from last month</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order List */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#f5f3f0]">Order Management</h2>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-[#ff9f43] text-[#0a0808] rounded-lg font-bold text-sm hover:bg-[#ffb366] transition-all shadow-[0_0_20px_rgba(255,159,67,0.3)] hover:scale-105"
                >
                  + New Order
                </button>
              </div>

              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card rounded-xl p-5 hover:border-[#ff9f43]/30 transition-all">
                    <div className="grid md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <div className="font-bold text-[#f5f3f0]">{order.customerName}</div>
                        <div className="text-sm text-[#a89d94] mt-1">{order.orderDate}</div>
                      </div>
                      <div className="col-span-3 text-sm text-[#a89d94] line-clamp-2">{order.items}</div>
                      <div className="col-span-2"><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span></div>
                      <div className="col-span-2"><span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span></div>
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => handleSendReminder(order)} className="px-3 py-1.5 bg-[#ff9f43]/20 text-[#ff9f43] rounded-lg text-xs font-semibold border border-[#ff9f43]/40 hover:bg-[#ff9f43] hover:text-black transition-all">📱 Remind</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff9f43] to-[#ffb366] rounded-xl flex items-center justify-center text-2xl animate-pulse-glow">🧠</div>
                <div><h3 className="text-xl font-bold">Saathi AI</h3><div className="text-xs text-[#a89d94]">Your business assistant</div></div>
              </div>
              <div className="space-y-4">
                {aiInsights.map((insight) => (
                  <div key={insight.id} className="glass-card rounded-xl p-4 border-l-4 border-[#ff9f43]">
                    <div className="text-sm text-[#f5f3f0] mb-3">{insight.message}</div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAiAction(insight.id)} className="flex-1 px-2 py-1.5 bg-[#ff9f43] text-[#0a0808] rounded-lg text-xs font-bold">Yes</button>
                      <button onClick={() => handleAiAction(insight.id)} className="flex-1 px-2 py-1.5 bg-white/5 text-white rounded-lg text-xs">Later</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ORDER MODAL WITH 3 TABS (Manual, Voice, Photo) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={resetModal} />
          
          <div className="glass-card w-full max-w-lg rounded-3xl p-0 relative z-10 border border-[#ff9f43]/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeInUp">
            
            {/* Modal Header & Tabs */}
            <div className="p-6 pb-0 border-b border-[#ff9f43]/10">
              <h3 className="text-2xl font-bold gradient-text mb-6">Create New Order</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEntryMode('manual')}
                  className={`flex-1 pb-4 text-sm font-semibold transition-all relative ${entryMode === 'manual' ? 'text-[#ff9f43]' : 'text-[#a89d94]'}`}
                >
                  📝 Manual
                  {entryMode === 'manual' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff9f43]" />}
                </button>
                <button 
                  onClick={() => setEntryMode('voice')}
                  className={`flex-1 pb-4 text-sm font-semibold transition-all relative ${entryMode === 'voice' ? 'text-[#ff9f43]' : 'text-[#a89d94]'}`}
                >
                  🎙️ Voice AI
                  {entryMode === 'voice' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff9f43]" />}
                </button>
                {/* NEW PHOTO TAB */}
                <button 
                  onClick={() => setEntryMode('photo')}
                  className={`flex-1 pb-4 text-sm font-semibold transition-all relative ${entryMode === 'photo' ? 'text-[#ff9f43]' : 'text-[#a89d94]'}`}
                >
                  📸 AI Photo
                  {entryMode === 'photo' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff9f43]" />}
                </button>
              </div>
            </div>

            <div className="p-8">
              
              {/* === 1. MANUAL FORM === */}
              {entryMode === 'manual' && (
                <form onSubmit={handleSubmitNewOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#a89d94] mb-1">Customer Name</label>
                      <input type="text" name="customerName" required value={newOrder.customerName} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none transition-colors" placeholder="e.g. Rahul" />
                    </div>
                    <div>
                      <label className="block text-sm text-[#a89d94] mb-1">Amount (₹)</label>
                      <input type="number" name="amount" required value={newOrder.amount} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none transition-colors" placeholder="5000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#a89d94] mb-1">Items</label>
                    <textarea name="items" required value={newOrder.items} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none h-20 resize-none" placeholder="Items list..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#a89d94] mb-1">Order Status</label>
                      <select name="status" value={newOrder.status} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none">
                        <option value="Processing">Processing</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#a89d94] mb-1">Payment</label>
                      <select name="paymentStatus" value={newOrder.paymentStatus} onChange={handleInputChange} className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-lg px-4 py-2 text-[#f5f3f0] focus:border-[#ff9f43] outline-none">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Udhaar">Udhaar</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={resetModal} className="flex-1 px-4 py-3 bg-white/5 text-[#a89d94] rounded-xl font-semibold hover:bg-white/10">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold hover:bg-[#ffb366] shadow-[0_0_20px_rgba(255,159,67,0.2)]">Create Order</button>
                  </div>
                </form>
              )}

              {/* === 2. VOICE AI UI === */}
              {entryMode === 'voice' && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                  <div className="relative">
                    {isListening && <div className="absolute inset-0 rounded-full bg-[#ff9f43] opacity-20 animate-ping" />}
                    <button 
                      onClick={toggleListening}
                      className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all shadow-[0_0_30px_rgba(255,159,67,0.2)] ${isListening ? 'bg-[#ff9f43] text-black scale-110' : 'bg-[#0a0808] border-2 border-[#ff9f43] text-[#ff9f43] hover:scale-105'}`}
                    >
                      {isListening ? '⏹' : '🎙'}
                    </button>
                  </div>
                  
                  <div className="max-w-xs mx-auto">
                    <h4 className="text-xl font-bold text-[#f5f3f0] mb-2">{isListening ? 'Listening...' : 'Tap to Speak'}</h4>
                    <p className="text-[#a89d94] text-sm">Try saying: "Rahul ke liye 5000 ka cement likh do, payment pending hai"</p>
                  </div>

                  {voiceTranscript && (
                    <div className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-xl p-4 text-left">
                      <div className="text-xs text-[#ff9f43] font-bold mb-1 uppercase">Live Transcript</div>
                      <div className="text-[#f5f3f0] text-sm italic">"{voiceTranscript}"</div>
                    </div>
                  )}
                </div>
              )}

              {/* === 3. PHOTO AI UI (NEW) === */}
              {entryMode === 'photo' && (
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-6">
                  {isAnalyzing ? (
                    /* SCANNING ANIMATION */
                    <div className="w-full flex flex-col items-center py-8">
                      <div className="relative w-24 h-32 border-2 border-[#ff9f43]/50 rounded-lg overflow-hidden mb-4 bg-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#ff9f43] shadow-[0_0_15px_#ff9f43] animate-pulse" style={{ animation: 'scan 2s linear infinite' }}></div>
                        <style>{`@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">🧾</div>
                      </div>
                      <h4 className="text-xl font-bold gradient-text animate-pulse">Analyzing Receipt...</h4>
                      <p className="text-[#a89d94] text-sm mb-4">Extracting items and prices</p>
                      
                      {/* Fake Progress Bar */}
                      <div className="w-64 h-2 bg-[#0a0808] rounded-full overflow-hidden border border-[#ff9f43]/20">
                        <div className="h-full bg-[#ff9f43] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    /* UPLOAD UI */
                    <>
                      <div className="relative group w-full">
                        <input 
                          type="file" 
                          id="fileUpload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                        <label 
                          htmlFor="fileUpload"
                          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#ff9f43]/40 rounded-3xl bg-[#ff9f43]/5 cursor-pointer hover:bg-[#ff9f43]/10 hover:border-[#ff9f43] transition-all"
                        >
                          <div className="w-16 h-16 bg-[#0a0808] rounded-full flex items-center justify-center text-3xl mb-4 border border-[#ff9f43]/20 shadow-lg group-hover:scale-110 transition-transform">
                            📸
                          </div>
                          <div className="text-lg font-bold text-[#f5f3f0] mb-1">Click to Upload Bill</div>
                          <p className="text-[#a89d94] text-sm">or drag and drop handwritten notes</p>
                        </label>
                      </div>
                      <p className="text-[#a89d94] text-xs">Supported: JPG, PNG, PDF (Max 5MB)</p>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      
      {/* Floating Copilot Trigger */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#ff9f43] rounded-full flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(255,159,67,0.4)] hover:scale-110 transition-all z-40 animate-pulse-glow"
      >
        🧠
      </button>

      {/* Agentic Chat Slide-Over */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0a0808] shadow-[-20px_0_50px_rgba(0,0,0,0.8)] transform transition-transform duration-500 z-50 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <AgenticChat onClose={() => setIsChatOpen(false)} />
      </div>

      {/* Backdrop */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500"
          onClick={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default MerchantDashboard;
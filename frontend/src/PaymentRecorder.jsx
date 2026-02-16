import React, { useState, useEffect } from 'react';
import { Search, CreditCard, User, AlertTriangle, CheckCircle, Save, DollarSign } from 'lucide-react';

const PaymentRecorder = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('UPI');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Debounced search for customers
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length > 2) searchCustomers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const searchCustomers = async () => {
        setLoading(true);
        try {
            // Mock API call - replace with actual endpoint
            const res = await fetch(`/api/customers?search=${searchTerm}`);
            const data = await res.json();
            setCustomers(data || []);
        } catch (err) {
            console.error("Search failed", err);
            // Fallback mock
            setCustomers([
                { phone_number: '919876543210', business_name: 'Rahul Textiles', outstanding_balance: 15000 },
                { phone_number: '919123456789', business_name: 'Priya Boutique', outstanding_balance: 5000 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer || !amount) {
            setError("Please select a customer and enter amount");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/payments/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_phone: selectedCustomer.phone_number,
                    amount: parseFloat(amount),
                    mode: paymentMode,
                    notes: notes
                })
            });

            if (!res.ok) throw new Error("Payment recording failed");

            setSuccess(`Payment of ₹${amount} recorded for ${selectedCustomer.business_name || selectedCustomer.phone_number}`);
            setAmount('');
            setNotes('');
            setSelectedCustomer(null);
            setSearchTerm('');
            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-4 sm:p-6 md:p-10 lg:p-12 pt-8 md:pt-12 font-sans relative overflow-x-hidden">
            <div className="max-w-[1000px] mx-auto relative z-10">

                {/* Header */}
                <div className="mb-10 animate-fadeInUp">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">Record Payment</h1>
                    <p className="text-[#a89d94] text-lg">Log offline or manual payments</p>
                </div>

                {/* Success Toast */}
                {success && (
                    <div className="fixed top-6 right-6 z-50 animate-fadeInUp">
                        <div className="bg-[#4cd964]/20 border border-[#4cd964]/40 rounded-xl px-6 py-4 backdrop-blur-xl flex items-center gap-3 shadow-lg shadow-[#4cd964]/10">
                            <CheckCircle className="w-5 h-5 text-[#4cd964]" />
                            <span className="text-[#4cd964] font-semibold text-sm">{success}</span>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-xl px-6 py-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#ff6b35]" />
                        <span className="text-[#ff6b35] text-sm">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column: Customer Selection */}
                    <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                        <div className="glass-card p-6 rounded-[2rem] border-white/5 h-full">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <User className="text-[#ff9f43]" /> Select Customer
                            </h3>

                            <div className="relative mb-6 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89d94] group-focus-within:text-[#ff9f43] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#ff9f43]/50 transition-all font-mono placeholder:font-sans"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (e.target.value === '') {
                                            setCustomers([]);
                                            setSelectedCustomer(null);
                                        }
                                    }}
                                />
                            </div>

                            {/* Search Results */}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {loading && (
                                    <div className="text-center py-8 text-[#ff9f43] animate-pulse">Searching...</div>
                                )}

                                {!loading && searchTerm.length > 2 && customers.length === 0 && (
                                    <div className="text-center py-8 text-[#a89d94]">No customers found.</div>
                                )}

                                {customers.map(c => (
                                    <div
                                        key={c.phone_number}
                                        onClick={() => setSelectedCustomer(c)}
                                        className={`p-4 rounded-xl cursor-pointer border transition-all flex justify-between items-center ${selectedCustomer?.phone_number === c.phone_number
                                            ? 'bg-[#ff9f43]/20 border-[#ff9f43] shadow-[0_0_15px_rgba(255,159,67,0.1)]'
                                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-sm">{c.business_name || 'Unknown Business'}</div>
                                            <div className="text-xs text-[#a89d94] font-mono">{c.phone_number}</div>
                                        </div>
                                        {selectedCustomer?.phone_number === c.phone_number && <CheckCircle className="w-5 h-5 text-[#ff9f43]" />}
                                    </div>
                                ))}
                            </div>

                            {/* Selected Customer Card (Quick View) */}
                            {selectedCustomer && (
                                <div className="mt-8 p-6 bg-gradient-to-br from-[#ff9f43]/20 to-transparent rounded-2xl border border-[#ff9f43]/30 animate-fadeInUp">
                                    <div className="text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Selected Customer</div>
                                    <div className="text-2xl font-bold mb-1">{selectedCustomer.business_name || 'Unregistered'}</div>
                                    <div className="font-mono text-sm opacity-80 mb-4">{selectedCustomer.phone_number}</div>

                                    <div className="bg-black/30 p-4 rounded-xl flex justify-between items-center">
                                        <span className="text-sm font-medium">Outstanding Balance</span>
                                        <span className={`font-mono font-bold text-lg ${selectedCustomer.outstanding_balance > 0 ? 'text-[#ff6b35]' : 'text-[#4cd964]'}`}>
                                            ₹{(selectedCustomer.outstanding_balance || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Payment Details */}
                    <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                        <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5 h-full flex flex-col">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <CreditCard className="text-[#4cd964]" /> Payment Details
                            </h3>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Amount (₹)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89d94] group-focus-within:text-[#4cd964] transition-colors w-5 h-5" />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#4cd964]/50 transition-all font-mono text-xl font-bold"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['UPI', 'CASH', 'BANK'].map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setPaymentMode(mode)}
                                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${paymentMode === mode
                                                    ? 'bg-[#4cd964]/20 border-[#4cd964] text-[#4cd964]'
                                                    : 'bg-white/5 border-transparent text-[#a89d94] hover:bg-white/10'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[#a89d94] text-xs font-bold uppercase tracking-widest mb-2">Notes (Optional)</label>
                                    <textarea
                                        placeholder="Transaction ID, remarks..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#4cd964]/50 transition-all min-h-[100px] resize-none text-sm"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedCustomer || !amount}
                                className="w-full mt-8 py-4 bg-[#4cd964] text-[#0a0808] rounded-xl font-bold text-lg hover:bg-[#5ce67d] transition-all shadow-[0_0_20px_rgba(76,217,100,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-[#0a0808] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" /> Record Payment
                                    </>
                                )}
                            </button>

                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentRecorder;

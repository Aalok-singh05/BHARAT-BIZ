import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle, AlertTriangle, IndianRupee } from 'lucide-react';

const API_BASE = '/api';

const PaymentRecorder = () => {
    const [phone, setPhone] = useState('');
    const [customer, setCustomer] = useState(null);
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('upi');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Search customer balance
    const searchCustomer = async () => {
        if (!phone || phone.length < 10) return;
        setSearching(true);
        setError(null);
        setCustomer(null);

        try {
            const res = await fetch(`${API_BASE}/customers/${phone}/balance`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Customer not found');
                throw new Error('Failed to fetch customer');
            }
            const data = await res.json();
            setCustomer(data);
        } catch (err) {
            setError(err.message);
            // Demo fallback
            setCustomer({
                customer_phone: phone,
                business_name: 'Demo Customer',
                outstanding_balance: 15000,
                credit_limit: 50000
            });
        } finally {
            setSearching(false);
        }
    };

    // Record payment
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customer || !amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`${API_BASE}/payments/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_phone: customer.customer_phone,
                    amount: parseFloat(amount),
                    mode: mode
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Payment recording failed');
            }

            const data = await res.json();
            setSuccess({
                message: `Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} recorded successfully!`,
                newBalance: data.new_outstanding_balance
            });

            // Update local customer state
            setCustomer(prev => ({
                ...prev,
                outstanding_balance: data.new_outstanding_balance
            }));

            setAmount('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const paymentModes = [
        { value: 'upi', label: 'UPI', icon: '📱' },
        { value: 'cash', label: 'Cash', icon: '💵' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
        { value: 'cheque', label: 'Cheque', icon: '📝' }
    ];

    return (
        <div className="min-h-screen text-[#f5f3f0] relative">

            {/* Header */}
            <div className="mb-8 animate-fadeInUp">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">Record Payment</h1>
                <p className="text-[#a89d94] text-lg">Settle outstanding balances</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1200px]">

                {/* Left: Search + Form */}
                <div className="space-y-6 animate-fadeInUp">

                    {/* Customer Search */}
                    <div className="glass-card rounded-3xl p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5 text-[#ff9f43]" />
                            Find Customer
                        </h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Enter phone number (e.g. 919876543210)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
                                className="flex-1 bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-xl px-4 py-3 text-[#f5f3f0] focus:border-[#ff9f43] outline-none transition-colors placeholder-[#a89d94]/50"
                            />
                            <button
                                onClick={searchCustomer}
                                disabled={searching || phone.length < 10}
                                className="px-6 py-3 bg-[#ff9f43] text-[#0a0808] rounded-xl font-bold text-sm hover:bg-[#ffb366] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {searching ? '...' : 'Search'}
                            </button>
                        </div>
                    </div>

                    {/* Payment Form (Visible only after customer found) */}
                    {customer && (
                        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 md:p-8 animate-fadeInUp">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-[#ff9f43]" />
                                Payment Details
                            </h2>

                            {/* Amount */}
                            <div className="mb-6">
                                <label className="block text-sm text-[#a89d94] mb-2 font-semibold">Amount (₹)</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ff9f43]" />
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        max={customer.outstanding_balance}
                                        min="1"
                                        required
                                        className="w-full bg-[#0a0808]/50 border border-[#ff9f43]/20 rounded-xl pl-12 pr-4 py-4 text-2xl font-bold text-[#f5f3f0] focus:border-[#ff9f43] outline-none transition-colors"
                                    />
                                </div>
                                {amount && parseFloat(amount) > customer.outstanding_balance && (
                                    <p className="text-[#ff6b35] text-xs mt-2 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Amount exceeds outstanding balance of ₹{customer.outstanding_balance.toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>

                            {/* Payment Mode */}
                            <div className="mb-6">
                                <label className="block text-sm text-[#a89d94] mb-2 font-semibold">Payment Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {paymentModes.map((m) => (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => setMode(m.value)}
                                            className={`p-3 rounded-xl border transition-all text-sm font-semibold flex items-center gap-2 ${mode === m.value
                                                    ? 'bg-[#ff9f43]/10 border-[#ff9f43]/40 text-[#ff9f43]'
                                                    : 'border-white/10 text-[#a89d94] hover:border-[#ff9f43]/20'
                                                }`}
                                        >
                                            <span className="text-lg">{m.icon}</span>
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > customer.outstanding_balance}
                                className="w-full px-6 py-4 bg-[#4cd964] text-[#0a0808] rounded-xl font-bold text-sm hover:bg-[#5ce67d] transition-all shadow-[0_0_20px_rgba(76,217,100,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-[#0a0808] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Record Payment
                            </button>
                        </form>
                    )}
                </div>

                {/* Right: Customer Info Card */}
                <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>

                    {/* Error */}
                    {error && (
                        <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-xl px-6 py-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-[#ff6b35]" />
                            <span className="text-[#ff6b35] text-sm">{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="bg-[#4cd964]/10 border border-[#4cd964]/30 rounded-xl px-6 py-4 animate-fadeInUp">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-5 h-5 text-[#4cd964]" />
                                <span className="text-[#4cd964] font-semibold text-sm">{success.message}</span>
                            </div>
                            <div className="text-[#a89d94] text-sm">
                                New Outstanding Balance: <span className="text-[#f5f3f0] font-bold">₹{success.newBalance?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}

                    {/* Customer Card */}
                    {customer ? (
                        <div className="glass-card rounded-3xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6">Customer Profile</h2>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff9f43] to-[#ff6b35] flex items-center justify-center font-bold text-[#0a0808] text-xl">
                                        {(customer.business_name || 'C')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-[#f5f3f0]">
                                            {customer.business_name || 'Unknown Business'}
                                        </div>
                                        <div className="text-sm text-[#a89d94]">📱 {customer.customer_phone}</div>
                                    </div>
                                </div>

                                <div className="h-px bg-[#ff9f43]/10" />

                                {/* Outstanding Balance */}
                                <div className="glass-card rounded-xl p-5">
                                    <div className="text-[#a89d94] text-sm font-semibold mb-1 uppercase tracking-wide">Outstanding Balance</div>
                                    <div className={`text-3xl font-bold ${customer.outstanding_balance > 0 ? 'text-[#ff6b35]' : 'text-[#4cd964]'}`}>
                                        ₹{(customer.outstanding_balance || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>

                                {/* Credit Limit */}
                                <div className="glass-card rounded-xl p-5">
                                    <div className="text-[#a89d94] text-sm font-semibold mb-1 uppercase tracking-wide">Credit Limit</div>
                                    <div className="text-3xl font-bold text-[#f5f3f0]">
                                        ₹{(customer.credit_limit || 0).toLocaleString('en-IN')}
                                    </div>

                                    {/* Usage Bar */}
                                    {customer.credit_limit > 0 && (
                                        <div className="mt-3">
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b35] rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min((customer.outstanding_balance / customer.credit_limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-[#a89d94] mt-1">
                                                {((customer.outstanding_balance / customer.credit_limit) * 100).toFixed(0)}% utilized
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card rounded-3xl p-12 text-center">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold mb-2">Search a Customer</h3>
                            <p className="text-[#a89d94] text-sm">Enter a phone number to view their balance and record a payment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentRecorder;

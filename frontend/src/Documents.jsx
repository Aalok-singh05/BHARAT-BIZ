import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, AlertCircle, Send } from 'lucide-react';

const DocumentVault = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sending, setSending] = useState(false);

  const fetchInvoices = async (search = '') => {
    try {
      setLoading(true);
      const url = search
        ? `http://localhost:8000/invoices?search=${search}`
        : `http://localhost:8000/invoices`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch invoices");

      const data = await res.json();
      setInvoices(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Could not load invoices.");
      setLoading(false);
    }
  };

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInvoices(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleDownload = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(`http://localhost:8000/invoices/${invoiceId}/download`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download PDF. It might not be generated yet.");
    }
  };

  const confirmSendWhatsapp = (invoice) => {
    setSelectedInvoice(invoice);
    setIsConfirmOpen(true);
  };

  const handleSendWhatsapp = async () => {
    if (!selectedInvoice) return;

    setSending(true);
    try {
      const res = await fetch(`http://localhost:8000/invoices/${selectedInvoice.id}/send`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Success: ${data.message}`);
        setIsConfirmOpen(false);
        setSelectedInvoice(null);
      } else {
        alert(`Error: ${data.detail || "Failed to send"}`);
      }
    } catch (err) {
      alert("Network error: Could not send WhatsApp message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] p-6 md:p-12 pt-24 font-sans relative overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Invoice Vault</h1>
            <p className="text-[#a89d94] text-sm mt-1">Secure storage for all your generated invoices.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89d94] group-focus-within:text-[#ff9f43]" size={20} />
          <input
            type="text"
            placeholder="Search by customer or invoice #..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 outline-none focus:border-[#ff9f43]/50 transition-all text-[#f5f3f0] placeholder-[#a89d94]/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-[#a89d94]">Loading invoices...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-400 flex flex-col items-center gap-2">
            <AlertCircle size={32} />
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-[#a89d94] bg-white/5 rounded-[2.5rem] border border-white/5">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            No invoices found.
          </div>
        ) : (
          <div className="grid gap-4 animate-fadeInUp">
            {invoices.map((inv) => (
              <div key={inv.id} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#ff9f43]/30 transition-all group">
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="w-12 h-12 bg-[#ff9f43]/10 text-[#ff9f43] rounded-2xl flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#f5f3f0]">{inv.customer_name}</h3>
                    <div className="flex items-center gap-3 text-xs text-[#a89d94] font-mono mt-1">
                      <span>{inv.invoice_number}</span>
                      <span className="w-1 h-1 bg-[#a89d94] rounded-full" />
                      <span>{inv.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right mr-4">
                    <div className="text-xl font-bold text-[#f5f3f0]">₹{inv.amount.toLocaleString()}</div>
                    <div className="text-[10px] text-[#a89d94] uppercase tracking-wider">Total Amount</div>
                  </div>

                  {/* Action Buttons */}
                  <button
                    onClick={() => confirmSendWhatsapp(inv)}
                    className="p-3 rounded-xl bg-[#4cd964]/10 text-[#4cd964] hover:bg-[#4cd964]/20 transition-all font-bold group/wa relative"
                    title="Resend to WhatsApp"
                  >
                    <Send size={18} className="group-hover/wa:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDownload(inv.id, inv.invoice_number)}
                    disabled={!inv.pdf_generated}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${inv.pdf_generated
                      ? 'bg-[#ff9f43] text-[#0a0808] hover:scale-105 shadow-[0_0_20px_rgba(255,159,67,0.2)]'
                      : 'bg-white/5 text-[#a89d94] cursor-not-allowed opacity-50'
                      }`}
                  >
                    <Download size={18} />
                    <span>{inv.pdf_generated ? 'Download' : 'Pending'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-fadeIn">
          <div className="bg-[#12100e] border border-[#ff9f43]/30 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff9f43] to-[#ff6b35]" />

            <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="text-[#25D366] w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-center mb-2">Resend to WhatsApp?</h3>
            <p className="text-center text-[#a89d94] text-sm mb-8">
              This will send <strong>{selectedInvoice.invoice_number}</strong> again to <br />
              <span className="text-[#f5f3f0] font-mono">{selectedInvoice.customer_phone}</span>
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsapp}
                disabled={sending}
                className="flex-1 py-3 rounded-xl bg-[#25D366] text-black font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2"
              >
                {sending ? 'Sending...' : 'Confirm Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
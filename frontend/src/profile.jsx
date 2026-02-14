import React, { useState } from 'react';
import { Store, Save, X, Edit2, AlertCircle, ShoppingBag, LogOut } from 'lucide-react'; // Added LogOut
import { useAuth } from './context/AuthContext'; // Import Auth

const ProfilePage = () => {
  const { logout } = useAuth(); // Get logout function
  const [user, setUser] = useState({
    shop_name: 'Sharma Textiles',
    email: 'sharma@gmail.com',
    phone: '9876543210',
    role: 'Shop Owner',
    category: 'Textiles & Fabrics'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({});

  // Validation Logic
  const validate = () => {
    let newErrors = {};

    // Shop Name Validation
    if (!formData.shop_name.trim()) {
      newErrors.shop_name = "Business name is required.";
    }

    // Email Validation (Strict suffixes)
    const emailValue = formData.email.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(emailValue)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!emailValue.endsWith('@gmail.com') && !emailValue.endsWith('@outlook.com')) {
      newErrors.email = "Only @gmail.com or @outlook.com allowed.";
    }

    // Phone Validation (10 digits)
    if (formData.phone.length !== 10) {
      newErrors.phone = "Phone number must be 10 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e) => {
    // Feature: Only numbers, max 10 digits
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData({ ...formData, phone: value });
      if (errors.phone) setErrors({ ...errors, phone: null });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSave = () => {
    if (validate()) {
      setUser({ ...formData });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...user });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] flex justify-center p-4 md:p-10 font-sans">
      <div className="w-full max-w-4xl space-y-6">

        {/* Profile Header - Now Editable */}
        <div className="glass-card p-8 rounded-3xl border border-[#ff9f43]/20 flex flex-col md:flex-row items-center gap-6 bg-[#12100e]">
          <div className="w-24 h-24 rounded-full bg-[#ff9f43]/10 border-2 border-[#ff9f43] flex items-center justify-center text-[#ff9f43]">
            <Store size={40} />
          </div>
          <div className="text-center md:text-left flex-1 w-full">
            {isEditing ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ff9f43] uppercase tracking-tighter">Business Name</label>
                <input
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  className={`w-full md:w-2/3 bg-[#1a1714] border ${errors.shop_name ? 'border-red-500' : 'border-[#ff9f43]/30'} rounded-xl p-3 text-xl font-bold outline-none focus:border-[#ff9f43]`}
                />
                {errors.shop_name && <p className="text-red-500 text-xs">{errors.shop_name}</p>}
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{user.shop_name}</h1>
                <p className="text-[#a89d94] flex items-center justify-center md:justify-start gap-2">
                  <ShoppingBag size={14} /> {user.role}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="glass-card p-8 rounded-3xl border border-[#ff9f43]/10 bg-[#12100e]">
          <div className="flex justify-between items-center mb-6 border-b border-[#ff9f43]/10 pb-4">
            <h3 className="text-xl font-bold text-[#ff9f43]">Business Details</h3>
            {!isEditing && (
              <div className="flex gap-3">
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-bold border border-red-500/20">
                  <LogOut size={16} /> Logout
                </button>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-[#ff9f43]/10 text-[#ff9f43] rounded-lg hover:bg-[#ff9f43]/20 transition-all text-sm font-bold">
                  <Edit2 size={16} /> Edit Profile
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Field */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#a89d94] uppercase tracking-wider mb-2">Email (Gmail/Outlook)</label>
              {isEditing ? (
                <>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`bg-[#1a1714] border ${errors.email ? 'border-red-500' : 'border-[#ff9f43]/30'} rounded-lg p-3 outline-none focus:border-[#ff9f43]`}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1 text-red-500 mt-2 text-xs font-medium">
                      <AlertCircle size={14} /> {errors.email}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-lg py-1 border-b border-white/5">{user.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#a89d94] uppercase tracking-wider mb-2">Phone Number</label>
              {isEditing ? (
                <>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89d94] text-sm font-bold border-r border-[#a89d94]/20 pr-2">+91</span>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={`w-full bg-[#1a1714] border ${errors.phone ? 'border-red-500' : 'border-[#ff9f43]/30'} rounded-lg p-3 pl-14 outline-none focus:border-[#ff9f43]`}
                    />
                  </div>
                  {errors.phone && (
                    <div className="flex items-center gap-1 text-red-500 mt-2 text-xs font-medium">
                      <AlertCircle size={14} /> {errors.phone}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-lg py-1 border-b border-white/5">+91 {user.phone}</p>
              )}
            </div>
          </div>

          {/* Action Footer */}
          {isEditing && (
            <div className="mt-12 flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#ff9f43]/10">
              <button onClick={handleSave} className="flex-1 flex justify-center items-center gap-2 px-8 py-3 bg-[#ff9f43] text-[#0a0808] rounded-xl hover:bg-[#ffb366] transition-all font-extrabold uppercase tracking-wide">
                <Save size={20} /> Save Profile
              </button>
              <button onClick={handleCancel} className="flex-1 flex justify-center items-center gap-2 px-8 py-3 border border-white/10 text-[#f5f3f0] rounded-xl hover:bg-white/5 transition-all font-bold">
                <X size={20} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
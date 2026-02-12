import React, { useEffect, useState } from 'react';
import { User, Store, Bell, LogOut, Settings } from 'lucide-react'; // Useful for minimal icons

const ProfilePage = () => {
  const [user, setUser] = useState({ shop_name: 'Sharma Textiles', email: 'sharma@biz.com', role: 'Shop Owner' });

  return (
    <div className="min-h-screen bg-[#0a0808] text-[#f5f3f0] flex justify-center p-4 md:p-10">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Profile Header Section */}
        <div className="glass-card p-8 rounded-3xl border border-[#ff9f43]/20 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#ff9f43]/10 border-2 border-[#ff9f43] flex items-center justify-center text-[#ff9f43]">
            <Store size={40} /> {/* Shop Icon instead of a photo */}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{user.shop_name}</h1>
            <p className="text-[#a89d94]">{user.role}</p>
            
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          

          {/* Details Section (Right Columns) */}
          <div className="md:col-span-3 glass-card p-8 rounded-3xl border border-[#ff9f43]/10">
            <h3 className="text-xl font-bold mb-6 border-b border-[#ff9f43]/10 pb-4">General Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-[#a89d94] uppercase tracking-wider">Email Address</label>
                <p className="text-lg mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-[#a89d94] uppercase tracking-wider">Support Phone</label>
                <p className="text-lg mt-1">+91 98765-43210</p>
              </div>
              <div>
                <label className="text-xs font-bold text-[#a89d94] uppercase tracking-wider">Business Category</label>
                <p className="text-lg mt-1">Textiles & Fabrics</p>
              </div>
            </div>

            <button className="mt-10 px-6 py-2 border border-[#ff9f43] text-[#ff9f43] rounded-xl hover:bg-[#ff9f43] hover:text-[#0a0808] transition-all font-bold">
              Edit Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
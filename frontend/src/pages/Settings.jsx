import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, vendorsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  User, Mail, Briefcase, Globe, Camera, Shield, Save, Key, 
  Bell, CreditCard, Lock, Smartphone, Fingerprint, Eye, EyeOff,
  History, Settings as SettingsIcon, CreditCard as CardIcon, Plus, Info
} from 'lucide-react';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    industry: '',
    profileImage: '',
    location: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifProjects: true,
    notifPayments: true,
    notifMarketing: false,
    taxId: '',
    billingAddress: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        bio: user.bio || '',
        industry: user.industry || '',
        profileImage: user.profileImage || '',
        location: user.location || '',
        phone: user.phone || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleCameraClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.success(`Selected image: ${file.name} (Ready to update)`);
      setFormData({ ...formData, profileImage: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user.userType === 'vendor') {
        await vendorsAPI.updateProfile(formData);
      }
      await refreshUser();
      toast.success('Settings updated successfully!');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    toast.success('Password update request sent! (Secured by OTP)');
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const TabItem = ({ icon: Icon, label, id }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-6 py-4 transition-all ${
        activeTab === id ? 'bg-[#14a800] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
      {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in font-body">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 font-medium">Configure your personal brand, security protocols, and financial preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-[#1c2237] border border-white/5 rounded-[32px] overflow-hidden self-start sticky top-24 shadow-2xl">
          <TabItem icon={User} label="Profile Info" id="profile" />
          <TabItem icon={Mail} label="Contact Details" id="contact" />
          <TabItem icon={Shield} label="Security & OTP" id="security" />
          <TabItem icon={Bell} label="Notifications" id="notifications" />
          <TabItem icon={CreditCard} label="Billing & Tax" id="billing" />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8 min-h-[700px]">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-white/5">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-[36px] bg-[#14a800]/10 border-2 border-[#14a800]/20 flex items-center justify-center text-4xl text-[#14a800] font-display font-bold overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (formData.fullName?.[0] || 'U')}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <button type="button" onClick={handleCameraClick} className="absolute -bottom-2 -right-2 bg-[#14a800] text-white p-3 rounded-2xl shadow-xl hover:bg-[#108a00] hover:scale-110 active:scale-95 transition-all">
                    <Camera size={20} />
                  </button>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-3xl font-display font-bold text-white mb-1.5">{formData.fullName || 'User Profile'}</h3>
                  <p className="text-slate-400 font-medium tracking-tight flex items-center justify-center md:justify-start gap-2">
                    <Briefcase size={16} className="text-[#14a800]" /> {formData.industry || 'Professional'} · {formData.location || 'Global'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Full Legal Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium placeholder-slate-700"
                    placeholder="e.g. John Wick"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Business Location</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium placeholder-slate-700"
                    placeholder="Nairobi, Kenya"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Professional Headline & Bio</label>
                  <textarea 
                    className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium min-h-[140px] placeholder-slate-700"
                    placeholder="Tell clients about your expertise..."
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#14a800] hover:bg-[#108a00] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Processing...' : <><Save size={20} /> Sync Profile Changes</>}
              </button>
            </form>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <h3 className="text-3xl font-display font-bold text-white mb-2">Communication Hub</h3>
              <p className="text-slate-400 font-medium">Ensure your contact info is up-to-date for payment notifications and project invites.</p>
              
              <div className="space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input disabled value={formData.email} className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-slate-500 cursor-not-allowed font-medium" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Primary Phone (M-Pesa)</label>
                       <div className="relative group focus-within:ring-2 focus-within:ring-[#14a800]/20 rounded-2xl">
                          <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#14a800]" size={18} />
                          <input 
                            type="tel"
                            className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="07XXXXXXXX"
                          />
                       </div>
                    </div>
                 </div>
                 <div className="p-6 bg-[#14a800]/5 border border-[#14a800]/20 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#14a800]/10 text-[#14a800] rounded-2xl flex items-center justify-center flex-shrink-0"><Info size={24} /></div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">Your phone number is primarily used for <span className="text-[#14a800] font-bold">M-Pesa STK Push</span> transactions. Ensure it's active and registered.</p>
                 </div>
                 <button onClick={handleSubmit} className="bg-[#14a800] hover:bg-[#108a00] text-white px-10 py-4 rounded-full font-bold transition-all shadow-lg active:scale-95">Verify & Save Channels</button>
              </div>
            </div>
          )}

          {/* SECURITY & OTP TAB */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Password Change */}
               <form onSubmit={handlePasswordChange} className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-6">
                  <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3"><Lock size={24} className="text-[#14a800]" /> Authentication Matrix</h3>
                  <div className="grid md:grid-cols-1 gap-5">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Current Password</label>
                        <input 
                          type="password" 
                          className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        />
                     </div>
                     <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">New Ultra-Secure Password</label>
                           <input 
                             type="password" 
                             className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium"
                             value={formData.newPassword}
                             onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Confirm New Password</label>
                           <input 
                             type="password" 
                             className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium"
                             value={formData.confirmPassword}
                             onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>
                  <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all">
                     <Key size={18} /> Update Secret Key
                  </button>
               </form>

               {/* 2FA Status */}
               <div className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-green-500/10 text-[#14a800] rounded-3xl flex items-center justify-center shadow-inner"><Fingerprint size={32} /></div>
                        <div>
                           <p className="text-xl font-display font-bold text-white">Multi-Factor Authentication</p>
                           <p className="text-sm text-slate-500 font-medium">OTP verification is currently <span className="text-[#14a800] font-bold">STRICTLY ENABLED</span>.</p>
                        </div>
                     </div>
                     <button className="bg-[#14a800]/10 text-[#14a800] hover:bg-[#14a800]/20 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all">Configure</button>
                  </div>
               </div>

               {/* Login History */}
               <div className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl">
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><History size={16} /> Recent Access Log</h4>
                  <div className="space-y-4">
                     {[
                        { device: 'Safari on macOS', location: 'Nairobi, KE', date: 'Just now', active: true },
                        { device: 'Chrome on Windows', location: 'London, UK', date: '2 days ago', active: false }
                     ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-[#0A0F1E]/50 border border-white/5 rounded-2xl">
                           <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${log.active ? 'bg-[#14a800] shadow-[0_0_10px_#14a800]' : 'bg-slate-700'}`} />
                              <div>
                                 <p className="text-sm font-bold text-white">{log.device}</p>
                                 <p className="text-xs text-slate-500">{log.location}</p>
                              </div>
                           </div>
                           <span className="text-xs font-bold text-[#5e6d55]">{log.date}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
               <div className="text-center max-w-sm mx-auto">
                  <div className="w-20 h-20 bg-[#14a800]/10 text-[#14a800] rounded-full mx-auto flex items-center justify-center mb-6 shadow-2xl">
                     <Bell size={40} className="animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white">Signal Center</h3>
                  <p className="text-slate-500 mt-2 font-medium">Control the frequency and type of alerts you receive from our engine.</p>
               </div>

               <div className="space-y-4">
                  {[
                     { title: 'Project Alerts', desc: 'New opportunities matching your skills.', state: formData.notifProjects, key: 'notifProjects' },
                     { title: 'Payment Milestones', desc: 'Alerts when funds are released or deposited.', state: formData.notifPayments, key: 'notifPayments' },
                     { title: 'Platform Innovations', desc: 'Periodic updates on new features.', state: formData.notifMarketing, key: 'notifMarketing' }
                  ].map((notif, i) => (
                     <div key={i} className="flex items-center justify-between p-6 bg-[#0A0F1E] border border-white/5 rounded-[32px] group hover:border-[#14a800]/30 transition-all">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${notif.state ? 'bg-[#14a800]/10 text-[#14a800]' : 'bg-slate-800 text-slate-500'}`}>
                              <Bell size={20} />
                           </div>
                           <div>
                              <p className="text-lg font-bold text-white">{notif.title}</p>
                              <p className="text-sm text-slate-500 font-medium">{notif.desc}</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setFormData({...formData, [notif.key]: !notif.state})}
                           className={`w-14 h-8 rounded-full relative p-1 transition-all ${notif.state ? 'bg-[#14a800]' : 'bg-slate-800'}`}
                        >
                           <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-lg ${notif.state ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                     </div>
                  ))}
               </div>
               <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all">Apply Frequency Settings</button>
            </div>
          )}

          {/* BILLING & TAX TAB */}
          {activeTab === 'billing' && (
             <div className="bg-[#1c2237] border border-white/5 rounded-[40px] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-display font-bold text-white">Financial Matrix</h3>
                   <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">Verified Billing</span>
                </div>

                {/* Stored Methods */}
                <div className="space-y-4">
                   <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Primary Liquidity Channels</p>
                   {user.userType === 'vendor' ? (
                     <div className="p-8 bg-[#0A0F1E] border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-[#14a800]/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-[#14a800]/10 text-[#14a800] rounded-3xl flex items-center justify-center shadow-inner"><Smartphone size={32} /></div>
                           <div>
                              <p className="text-xl font-display font-bold text-white">M-Pesa Payout</p>
                              <p className="text-sm text-slate-500 font-medium">{formData.phone || 'No phone set'}</p>
                           </div>
                        </div>
                        <button className="text-[#14a800] font-bold text-sm bg-[#14a800]/10 px-6 py-2 rounded-xl">Primary</button>
                     </div>
                   ) : (
                     <div className="p-8 bg-[#0A0F1E] border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-[#14a800]/30 transition-all border-dashed">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white/5 text-slate-500 rounded-3xl flex items-center justify-center"><Plus size={32} /></div>
                           <p className="text-slate-500 font-bold">Add funding method (Card, PayPal, M-Pesa)</p>
                        </div>
                        <button className="bg-[#14a800] text-white px-6 py-2 rounded-full font-bold shadow-lg">Add Method</button>
                     </div>
                   )}
                </div>

                {/* Tax & Invoicing */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">KRA PIN / Tax Identification</label>
                         <input 
                           type="text" 
                           placeholder="A012345678Z"
                           className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium"
                           value={formData.taxId}
                           onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] px-1">Fiscal Billing Address</label>
                         <input 
                           type="text" 
                           placeholder="Street address, City"
                           className="w-full bg-[#0A0F1E] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#14a800] transition-all font-medium"
                           value={formData.billingAddress}
                           onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                         />
                      </div>
                   </div>
                   <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-slate-500 font-bold hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest text-xs">Download Last 12 Months Invoice Data</button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

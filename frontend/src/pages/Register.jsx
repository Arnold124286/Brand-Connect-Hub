import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, ArrowRight, User, Briefcase, Lock, CheckCircle, Eye, EyeOff, Phone, FileText, ChevronRight, ChevronLeft, Copy, AlertTriangle } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'brand',
    phoneNumber: '',
    registrationNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'business'
  const [devOtp, setDevOtp] = useState(null); // shown when email is not configured

  const validatePassword = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return {
      isValid: hasUppercase && hasLowercase && hasNumber && hasSpecialChar && isLongEnough,
      missing: {
        uppercase: !hasUppercase,
        lowercase: !hasLowercase,
        number: !hasNumber,
        specialChar: !hasSpecialChar,
        length: !isLongEnough,
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    const passwordCheck = validatePassword(form.password);
    if (!passwordCheck.isValid) {
      const missing = [];
      if (passwordCheck.missing.uppercase) missing.push('uppercase letter');
      if (passwordCheck.missing.lowercase) missing.push('lowercase letter');
      if (passwordCheck.missing.number) missing.push('number');
      if (passwordCheck.missing.specialChar) missing.push('special character (@$!%*?&)');
      if (passwordCheck.missing.length) missing.push('at least 8 characters');
      return toast.error(`Password needs: ${missing.join(', ')}`);
    }

    setLoading(true);
    try {
      const result = await register({ ...form, phone: form.phoneNumber });
      if (result.devOtp) {
        // Dev mode: email not configured, show OTP in UI
        setDevOtp(result.devOtp);
        toast.success('Account created! Copy your OTP below to verify.');
      } else {
        toast.success('Registration successful! Please check your email for the OTP.');
        navigate('/verify-otp', { state: { email: form.email } });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(devOtp);
    toast.success('OTP copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white selection:bg-[#14a800]/20 selection:text-[#14a800]">
      {/* Dev Mode OTP Banner */}
      {devOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#001e00] text-lg">Dev Mode — No Email Configured</h3>
                <p className="text-xs text-gray-500">Your OTP email credentials are not set up yet</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Because email is not yet configured in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code>, your OTP is shown here instead. Copy it and use it on the verification page.
            </p>
            <div className="bg-[#f2f7f2] border-2 border-[#14a800]/30 rounded-2xl p-5 mb-5 text-center">
              <p className="text-xs font-bold text-[#5e6d55] uppercase tracking-widest mb-2">Your OTP Code</p>
              <p className="text-5xl font-bold text-[#001e00] tracking-[0.3em] font-mono">{devOtp}</p>
              <p className="text-xs text-gray-400 mt-2">Expires in 10 minutes</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyOtp}
                className="flex-1 flex items-center justify-center gap-2 bg-[#14a800] hover:bg-[#108a00] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-[#14a800]/20"
              >
                <Copy size={16} /> Copy OTP
              </button>
              <button
                onClick={() => { navigate('/verify-otp', { state: { email: form.email } }); }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl border border-gray-200 transition-all"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">
                💡 <strong>To fix this in production:</strong> Set <code className="bg-blue-100 px-1 rounded">EMAIL_USER</code> and <code className="bg-blue-100 px-1 rounded">EMAIL_PASS</code> (Gmail App Password) in <code className="bg-blue-100 px-1 rounded">backend/.env</code>
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-[500px]">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-[#14a800] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold text-[#001e00]">Brand<span className="text-[#14a800]">Connect</span> Hub</span>
        </Link>

        <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-sm border-b-4 border-[#14a800]/10">
          <h1 className="font-display text-3xl font-bold text-[#001e00] mb-2 text-center tracking-tight">Create your account</h1>
          
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {/* Tab Navigation */}
            <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'basic' 
                    ? 'bg-white text-[#14a800] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <User size={16} /> Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('business')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'business' 
                    ? 'bg-white text-[#14a800] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Briefcase size={16} /> Business Info
              </button>
            </div>

            <div className="transition-all duration-300">
              {activeTab === 'basic' ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { type: 'brand', label: 'I’m a client, hiring pro talent', icon: User },
                      { type: 'vendor', label: 'I’m a freelancer, finding work', icon: Briefcase },
                    ].map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, userType: type })}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 group relative overflow-hidden ${
                          form.userType === type 
                            ? 'border-[#14a800] bg-[#f2f7f2]' 
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          form.userType === type ? 'bg-[#14a800] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-[13px] font-bold leading-tight ${
                          form.userType === type ? 'text-[#001e00]' : 'text-gray-500'
                        }`}>
                          {label}
                        </span>
                        {form.userType === type && <CheckCircle size={14} className="absolute top-3 right-3 text-[#14a800]" />}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                      placeholder="Janardan Singh"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      required={activeTab === 'basic'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                      placeholder="user@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required={activeTab === 'basic'}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1 relative">
                       <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Password</label>
                       <div className="relative">
                         <input
                           type={showPassword ? "text" : "password"}
                           className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium pr-12"
                           placeholder="••••••••"
                           value={form.password}
                           onChange={(e) => setForm({ ...form, password: e.target.value })}
                           required={activeTab === 'basic'}
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                         >
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                       {form.password && (
                         <div className="text-[11px] space-y-1 pt-1">
                           <div className={`flex items-center gap-2 ${validatePassword(form.password).missing.length ? 'text-red-500' : 'text-green-600'}`}>
                             {validatePassword(form.password).missing.length ? '❌' : '✓'} At least 8 characters
                           </div>
                           <div className={`flex items-center gap-2 ${validatePassword(form.password).missing.uppercase ? 'text-red-500' : 'text-green-600'}`}>
                             {validatePassword(form.password).missing.uppercase ? '❌' : '✓'} Uppercase letter
                           </div>
                           <div className={`flex items-center gap-2 ${validatePassword(form.password).missing.lowercase ? 'text-red-500' : 'text-green-600'}`}>
                             {validatePassword(form.password).missing.lowercase ? '❌' : '✓'} Lowercase letter
                           </div>
                           <div className={`flex items-center gap-2 ${validatePassword(form.password).missing.number ? 'text-red-500' : 'text-green-600'}`}>
                             {validatePassword(form.password).missing.number ? '❌' : '✓'} Number
                           </div>
                           <div className={`flex items-center gap-2 ${validatePassword(form.password).missing.specialChar ? 'text-red-500' : 'text-green-600'}`}>
                             {validatePassword(form.password).missing.specialChar ? '❌' : '✓'} Special character (@$!%*?&)
                           </div>
                         </div>
                       )}
                     </div>
                     <div className="space-y-1 relative">
                       <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Repeat Password</label>
                       <div className="relative">
                         <input
                           type={showConfirmPassword ? "text" : "password"}
                           className="w-full px-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium pr-12"
                           placeholder="••••••••"
                           value={form.confirmPassword}
                           onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                           required={activeTab === 'basic'}
                         />
                         <button
                           type="button"
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                         >
                           {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                       {form.confirmPassword && (
                         <div className="text-[11px] pt-1">
                           <div className={`flex items-center gap-2 ${form.password !== form.confirmPassword ? 'text-red-500' : 'text-green-600'}`}>
                             {form.password !== form.confirmPassword ? '❌' : '✓'} Passwords match
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setActiveTab('business')}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-100 transition-all flex items-center justify-center gap-2 group"
                  >
                    Next Step <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                        placeholder="+254 700 000 000"
                        value={form.phoneNumber}
                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        required={activeTab === 'business'}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#5e6d55] uppercase tracking-wider ml-1">Registration Number (Optional)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FileText size={18} />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#f9fdf9] border border-gray-200 rounded-xl text-[#001e00] placeholder-gray-400 focus:outline-none focus:border-[#14a800] transition-all font-medium"
                        placeholder="BN/2024/XYZ..."
                        value={form.registrationNumber}
                        onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#f2f7f2] rounded-2xl border border-[#14a800]/10 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex-shrink-0 flex items-center justify-center text-[#14a800] shadow-sm">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-[#001e00]">Secure Registration</h4>
                      <p className="text-[11px] text-[#5e6d55]">Your data is encrypted and used only for platform verification purposes.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className="px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-100 transition-all flex items-center justify-center gap-2 group"
                    >
                      <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#14a800] hover:bg-[#108a00] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-xl shadow-[#14a800]/20"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Complete Sign Up <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-[#5e6d55] font-medium">
          Already a member?{' '}
          <Link to="/login" className="text-[#14a800] hover:underline font-bold">Log In</Link>
        </p>

        <div className="mt-12 text-center">
          <p className="text-[12px] text-gray-300 font-medium tracking-wide">© 2026 Brand Connect Hub Inc.</p>
        </div>
      </div>
    </div>
  );
}

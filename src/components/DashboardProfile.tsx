import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  UserProfile, AddressDetails 
} from '../types';
import { 
  User, CheckCircle, AlertCircle, Edit, MapPin, Contact, Fingerprint, ShieldAlert, Cpu
} from 'lucide-react';
import { 
  getUsers, saveUsers, validateEmail, validatePhone, validatePINCode 
} from '../utils';

interface DashboardProfileProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
}

export default function DashboardProfile({ user, onUpdate }: DashboardProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [mobile, setMobile] = useState(user.mobile);
  const [email, setEmail] = useState(user.email);
  const [houseNumber, setHouseNumber] = useState(user.address.houseNumber);
  const [street, setStreet] = useState(user.address.street);
  const [city, setCity] = useState(user.address.city);
  const [state, setState] = useState(user.address.state);
  const [pinCode, setPinCode] = useState(user.address.pinCode);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');

    const newErrors: { [key: string]: string } = {};

    if (!mobile || !validatePhone(mobile)) {
      newErrors.mobile = 'Mobile Number must contain exactly 10 digits';
    }
    if (!email || !validateEmail(email)) {
      newErrors.email = 'Please provide a valid email format';
    }
    if (!houseNumber.trim()) {
      newErrors.houseNumber = 'House No is required';
    }
    if (!street.trim()) {
      newErrors.street = 'Street Details are required';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!pinCode || !validatePINCode(pinCode)) {
      newErrors.pinCode = 'PIN Code must contain exactly 6 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Load users, alter current, update localStorage
    const users = getUsers();
    const updatedUser: UserProfile = {
      ...user,
      mobile,
      email,
      address: {
        houseNumber,
        street,
        city,
        state,
        pinCode
      }
    };

    const newUsersList = users.map((u) => (u.customerId === user.customerId ? updatedUser : u));
    saveUsers(newUsersList);
    onUpdate(updatedUser);
    setIsEditing(false);
    setSuccessMsg('Neural identification database updated successfully!');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="glass-panel border border-slate-800 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(6,182,212,0.015)] relative">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 mb-6">
        <div>
          <h3 className="font-display font-medium text-lg text-white flex items-center space-x-2">
            <User className="text-cyan-400 w-5 h-5" />
            <span>Profile Identity Matrix</span>
          </h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
            Identity credentials & address registries
          </p>
        </div>

        {/* Edit Button Toggle */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1 border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-500 text-cyan-400 hover:text-black px-3.5 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all focus:outline-none focus:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 mb-6 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-mono flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isEditing ? (
        // Editable fields
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Contact Details */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-xs text-cyan-400 uppercase tracking-widest border-l-2 border-cyan-400 pl-2">
                Dynamic Contact Parameters
              </h4>
              
              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none font-mono"
                />
                {errors.mobile && <div className="text-red-400 text-[10px] font-mono mt-1 flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>{errors.mobile}</span></div>}
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-wider mb-1">Secure Email Address</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none font-mono"
                />
                {errors.email && <div className="text-red-400 text-[10px] font-mono mt-1 flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>{errors.email}</span></div>}
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-xs text-cyan-400 uppercase tracking-widest border-l-2 border-cyan-400 pl-2">
                Location Address Matrix
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-medium text-slate-500 uppercase mb-1">House No</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                  {errors.houseNumber && <div className="text-red-400 text-[8px] font-mono mt-1">{errors.houseNumber}</div>}
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono font-medium text-slate-500 uppercase mb-1">Street Details</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                  {errors.street && <div className="text-red-400 text-[8px] font-mono mt-1">{errors.street}</div>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono font-medium text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                  {errors.city && <div className="text-red-400 text-[8px] font-mono mt-1">{errors.city}</div>}
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-medium text-slate-500 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                  {errors.state && <div className="text-red-400 text-[8px] font-mono mt-1">{errors.state}</div>}
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-medium text-slate-500 uppercase mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2 px-3 text-xs text-white focus:outline-none font-mono"
                  />
                  {errors.pinCode && <div className="text-red-400 text-[8px] font-mono mt-1">{errors.pinCode}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 justify-end pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setErrors({});
                setMobile(user.mobile);
                setEmail(user.email);
                setHouseNumber(user.address.houseNumber);
                setStreet(user.address.street);
                setCity(user.address.city);
                setState(user.address.state);
                setPinCode(user.address.pinCode);
              }}
              className="px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider text-slate-400 transition-colors focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold rounded-lg text-xs font-mono uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:outline-none"
            >
              Commit Updates
            </button>
          </div>
        </form>
      ) : (
        // Non-editable layout (Highly structured, premium display grid)
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Core Banking Specs */}
            <div className="space-y-1 bg-slate-950/30 p-3 rounded-lg border border-slate-900/60">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Customer ID Code</span>
              <span className="text-cyan-400 font-bold font-mono tracking-wider text-sm">{user.customerId}</span>
            </div>

            <div className="space-y-1 bg-slate-950/30 p-3 rounded-lg border border-slate-900/60">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">SmartBank Account No</span>
              <span className="text-white font-bold font-mono tracking-widest text-sm">{user.accountNumber}</span>
            </div>

            <div className="space-y-1 bg-slate-950/30 p-3 rounded-lg border border-slate-900/60 col-span-2 lg:col-span-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">IFSC Ledger Identity</span>
              <span className="text-purple-400 font-bold font-mono tracking-wider text-sm">{user.ifscCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Identity Column */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-xs text-cyan-400 uppercase tracking-widest border-l-2 border-cyan-400 pl-2 flex items-center space-x-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>Identity Matrix</span>
              </h4>

              <div className="bg-slate-950/50 p-4 border border-slate-900 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">Legal Name</span>
                  <span className="text-white font-medium">{user.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="text-white font-medium">{user.dob}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">Registered Gender</span>
                  <span className="text-white font-medium">{user.gender}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">PAN Card No</span>
                  <span className="text-cyan-400 font-bold tracking-wider uppercase">{user.pan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aadhaar No</span>
                  <span className="text-slate-300 font-medium tracking-wide">•••• •••• {user.aadhaar.slice(-4)}</span>
                </div>
              </div>
            </div>

            {/* Address & Kin columns */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-xs text-purple-400 uppercase tracking-widest border-l-2 border-purple-500 pl-2 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>Physical Registries</span>
              </h4>

              <div className="bg-slate-950/50 p-4 border border-slate-900 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">Contact Number</span>
                  <span className="text-white font-medium">{user.mobile}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">Email Address</span>
                  <span className="text-cyan-300 hover:underline break-all">{user.email}</span>
                </div>
                <div className="border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 block mb-1">Physical Address Registry</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {user.address.houseNumber}, {user.address.street}, {user.address.city}, {user.address.state} - <span className="text-cyan-400 font-bold">{user.address.pinCode}</span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Kin Nominee Details</span>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white font-medium">{user.nominee.name} ({user.nominee.relationship})</span>
                    <span className="text-slate-400">{user.nominee.mobile}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800 text-[10px] text-slate-500 font-mono tracking-wider flex items-center space-x-2 rounded-xl">
            <Cpu className="w-4 h-4 text-cyan-400/80 shrink-0" />
            <span>METRIC MODES SECURE. ALL CORE DATA ENCRYPTED UNDER CRYPTO-CHIP SATELLITE LINKS.</span>
          </div>
        </div>
      )}
    </div>
  );
}

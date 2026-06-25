import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Calendar, Mail, Phone, Fingerprint, MapPin, KeyRound, 
  Heart, Wallet, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, LogIn,
  Lock, Unlock, RefreshCw, Sparkles, ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  validateEmail, validatePhone, validateAadhaar, validatePAN, 
  validatePINCode, getPasswordStrength, getUsers, saveUsers, addTransaction 
} from '../utils';

interface RegistrationFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function RegistrationForm({ onBack, onSuccess }: RegistrationFormProps) {
  // Form values
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nomineeName, setNomineeName] = useState('');
  const [relationship, setRelationship] = useState('Spouse');
  const [nomineeMobile, setNomineeMobile] = useState('');

  const [openingBalance, setOpeningBalance] = useState('5000'); // Default ₹5,000

  // Calculate if the username is already taken by querying the local database
  const isUsernameTaken = useMemo(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) return false;
    const users = getUsers();
    return users.some((u) => u.username.toLowerCase() === clean);
  }, [username]);

  // Aadhaar OTP Verification states
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sentAadhaar, setSentAadhaar] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const sendAadhaarOtp = () => {
    if (!aadhaar || aadhaar.length !== 12) {
      setErrors(prev => ({ ...prev, aadhaar: 'Aadhaar number must contain exactly 12 digits before OTP dispatch.' }));
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setTimeout(() => {
      // Generate standard random 6 digit OTP
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomCode);
      setSentAadhaar(aadhaar);
      setOtpSent(true);
      setOtpLoading(false);
      // Clear any Aadhaar input error
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.aadhaar;
        return updated;
      });
    }, 1200);
  };

  const verifyAadhaarOtp = () => {
    if (!enteredOtp || enteredOtp.length !== 6) {
      setOtpError('Please enter a 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setTimeout(() => {
      if (enteredOtp === generatedOtp || enteredOtp === '123456') {
        setAadhaarVerified(true);
        setOtpError('');
        // Clear Aadhaar-related errors
        setErrors(prev => {
          const updated = { ...prev };
          delete updated.aadhaar;
          return updated;
        });
      } else {
        setOtpError('Invalid Aadhaar OTP code. Please copy and enter the exact sandbox OTP code provided.');
      }
      setOtpLoading(false);
    }, 1000);
  };

  const handleAadhaarChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 12);
    setAadhaar(digitsOnly);
    if (digitsOnly !== sentAadhaar) {
      setAadhaarVerified(false);
      setOtpSent(false);
      setEnteredOtp('');
      setGeneratedOtp('');
      setOtpError('');
    }
  };

  // Errors state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Account created details state
  const [createdProfile, setCreatedProfile] = useState<UserProfile | null>(null);

  // Form step navigation (let's separate into 3 modular views inside registration: 
  // Step 1: Personal & Identity, Step 2: Address & Nominee, Step 3: Security & Balance)
  // This manages responsive desktop layouts so screens don't overflow!
  const [currentStep, setCurrentStep] = useState(1);

  // Real-time validations
  const validateStep = (step: number): boolean => {
    const stepErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!fullName.trim()) stepErrors.fullName = 'Full Name is required';
      if (!dob) stepErrors.dob = 'Date of Birth is required';
      
      if (!mobile) {
        stepErrors.mobile = 'Mobile Number is required';
      } else if (!validatePhone(mobile)) {
        stepErrors.mobile = 'Mobile number must contain exactly 10 digits';
      }

      if (!email) {
        stepErrors.email = 'Email Address is required';
      } else if (!validateEmail(email)) {
        stepErrors.email = 'Must be a valid email format (e.g. name@gmail.com)';
      }

      if (!aadhaar) {
        stepErrors.aadhaar = 'Aadhaar Number is required';
      } else if (!validateAadhaar(aadhaar)) {
        stepErrors.aadhaar = 'Aadhaar number must contain exactly 12 digits';
      } else if (!aadhaarVerified) {
        stepErrors.aadhaar = 'Aadhaar OTP verification is pending. Please complete OTP verification below.';
      }

      if (!pan) {
        stepErrors.pan = 'PAN Number is required';
      } else if (!validatePAN(pan)) {
        stepErrors.pan = 'PAN must follow standard format (e.g. ABCDE1234F)';
      }
    }

    if (step === 2) {
      if (!houseNumber.trim()) stepErrors.houseNumber = 'House Number is required';
      if (!street.trim()) stepErrors.street = 'Street Details are required';
      if (!city.trim()) stepErrors.city = 'City is required';
      if (!state.trim()) stepErrors.state = 'State is required';
      
      if (!pinCode) {
        stepErrors.pinCode = 'PIN Code is required';
      } else if (!validatePINCode(pinCode)) {
        stepErrors.pinCode = 'PIN Code must contain exactly 6 digits';
      }

      if (!nomineeName.trim()) stepErrors.nomineeName = 'Nominee Name is required';
      
      if (!nomineeMobile) {
        stepErrors.nomineeMobile = 'Nominee Mobile is required';
      } else if (!validatePhone(nomineeMobile)) {
        stepErrors.nomineeMobile = 'Nominee mobile must contain exactly 10 digits';
      }
    }

    if (step === 3) {
      if (!username.trim()) {
        stepErrors.username = 'Username is required';
      } else if (isUsernameTaken) {
        stepErrors.username = 'Username already exists like that';
      }

      // Check password details
      const strength = getPasswordStrength(password);
      if (!password) {
        stepErrors.password = 'Password is required';
      } else if (password.length < 8) {
        stepErrors.password = 'Password must be minimum 8 characters';
      } else if (!/[A-Z]/.test(password)) {
        stepErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(password)) {
        stepErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/\d/.test(password)) {
        stepErrors.password = 'Password must contain at least one digit';
      } else if (!/[@$!%*?&#]/.test(password)) {
        stepErrors.password = 'Password must contain at least one special character';
      }

      if (password !== confirmPassword) {
        stepErrors.confirmPassword = 'Passwords do not match';
      }

      const balanceNum = parseFloat(openingBalance);
      if (isNaN(balanceNum)) {
        stepErrors.openingBalance = 'Please enter a valid amount';
      } else if (balanceNum < 500) {
        stepErrors.openingBalance = 'Minimum opening deposit is ₹500';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    // Retrieve users list to calculate next Customer ID
    const currentUsers = getUsers();
    const nextIndex = currentUsers.length + 1;
    const formattedId = `SB${nextIndex.toString().padStart(4, '0')}`;

    // Random 12-digit Account Number
    let accNo = '';
    for (let i = 0; i < 12; i++) {
      accNo += Math.floor(Math.random() * 10).toString();
    }

    const newUserProfile: UserProfile = {
      fullName,
      dob,
      gender,
      mobile,
      email,
      aadhaar,
      pan: pan.toUpperCase(),
      address: {
        houseNumber,
        street,
        city,
        state,
        pinCode
      },
      username,
      password,
      nominee: {
        name: nomineeName,
        relationship,
        mobile: nomineeMobile
      },
      openingBalance: parseFloat(openingBalance),
      currentBalance: parseFloat(openingBalance),
      customerId: formattedId,
      accountNumber: accNo,
      ifscCode: 'SMBK00001',
      branch: 'SmartBank Chennai'
    };

    // Save to localStorage
    const updatedUsers = [...currentUsers, newUserProfile];
    saveUsers(updatedUsers);

    // Create Initial Deposit transaction
    const now = new Date();
    const initialTx = {
      id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
      date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      senderName: 'System Mint',
      senderAccount: '000000000000',
      receiverName: fullName,
      receiverDetails: accNo,
      paymentMethod: 'Bank Deposit' as const,
      amount: parseFloat(openingBalance),
      purpose: 'Opening Balance Deposit',
      status: 'SUCCESS' as const
    };
    addTransaction(initialTx);

    // Save state to render Success Gateway
    setCreatedProfile(newUserProfile);
  };

  return (
    <div className="min-h-screen cyber-grid text-white flex flex-col justify-center items-center py-12 px-4 relative">
      <div className="bg-glow-purple top-10 left-10"></div>
      <div className="bg-glow-cyan bottom-10 right-10"></div>

      <div className="max-w-2xl w-full">
        
        {/* Back Button */}
        {!createdProfile && (
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-cyan-400 font-mono text-xs uppercase mb-6 tracking-wider transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel & Back</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          {!createdProfile ? (
            <motion.div
              key="reg-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel border border-slate-800 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.02)] relative"
            >
              {/* Top Banner */}
              <div className="flex justify-between items-start mb-6 border-b border-slate-800/80 pb-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    SmartBank Account Creation
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    NEURAL ENCRYPTED CLIENT ONBOARDING
                  </p>
                </div>
                {/* Step indicator */}
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-500 uppercase">Gateway Step</div>
                  <div className="text-lg font-bold text-cyan-400">0{currentStep} <span className="text-slate-600 text-xs">/ 03</span></div>
                </div>
              </div>

              {/* Progress Steps Node Visualizer */}
              <div className="flex justify-between items-center mb-8 bg-slate-950/60 p-3.5 border border-slate-800/80 rounded-xl relative">
                <div className="absolute left-6 right-6 h-0.5 bg-slate-800 z-0"></div>
                <div 
                  className="absolute left-6 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 z-0 transition-all duration-300"
                  style={{ width: `${(currentStep - 1) * 44}%` }}
                ></div>
                
                {/* Step 1 Node */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                    currentStep >= 1 ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}>
                    1
                  </div>
                  <span className="text-[10px] uppercase font-mono mt-1 text-slate-400">Identity</span>
                </div>

                {/* Step 2 Node */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                    currentStep >= 2 ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}>
                    2
                  </div>
                  <span className="text-[10px] uppercase font-mono mt-1 text-slate-400">Location & Kin</span>
                </div>

                {/* Step 3 Node */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                    currentStep === 3 ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}>
                    3
                  </div>
                  <span className="text-[10px] uppercase font-mono mt-1 text-slate-400">Security</span>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: PERSONAL & IDENTITY DETAILS */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="font-display font-semibold text-sm text-cyan-300 uppercase tracking-wider mb-4 border-l-2 border-cyan-400 pl-2">
                      Personal Credentials
                    </h3>
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="Sathwik Kothamasu"
                          id="reg_fullName"
                        />
                      </div>
                      {errors.fullName && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.fullName}</span></div>}
                    </div>

                    {/* DOB & Gender Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
                            id="reg_dob"
                          />
                        </div>
                        {errors.dob && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.dob}</span></div>}
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
                          id="reg_gender"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-Binary">Non-Binary</option>
                        </select>
                      </div>
                    </div>

                    {/* Email & Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                            placeholder="9876543210"
                            id="reg_mobile"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Phone Example: 9876543210</span>
                        {errors.mobile && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.mobile}</span></div>}
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                            placeholder="name@gmail.com"
                            id="reg_email"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Email Example: name@gmail.com</span>
                        {errors.email && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.email}</span></div>}
                      </div>
                    </div>

                    <h3 className="font-display font-semibold text-sm text-cyan-300 uppercase tracking-wider pt-4 border-l-2 border-cyan-400 pl-2">
                      Identity Verification
                    </h3>

                    {/* Aadhaar & PAN Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Aadhaar Number</label>
                        <div className="relative">
                          <Fingerprint className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={aadhaar}
                            onChange={(e) => handleAadhaarChange(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                            placeholder="123456789012"
                            id="reg_aadhaar"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Aadhaar Example: 123456789012</span>
                        {errors.aadhaar && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.aadhaar}</span></div>}
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">PAN Card Number</label>
                        <div className="relative">
                          <Fingerprint className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                            placeholder="ABCDE1234F"
                            id="reg_pan"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">PAN Example: ABCDE1234F</span>
                        {errors.pan && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.pan}</span></div>}
                      </div>
                    </div>

                    {/* Aadhaar OTP Verification Sub-Flow Container */}
                    {aadhaar.length === 12 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 mt-2 space-y-3 relative overflow-hidden"
                      >
                        {/* Background subtle scanner visual */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none"></div>

                        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                          <Fingerprint className="w-4 h-4 animate-pulse text-cyan-400" />
                          <span>UIDAI Aadhaar Verified e-KYC Gateway</span>
                        </div>

                        {!aadhaarVerified ? (
                          <div className="space-y-3">
                            {!otpSent ? (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                                <div className="text-[11px] text-slate-400 font-mono">
                                  Aadhaar number <span className="text-white font-bold">{aadhaar.slice(0, 4)}••••••••</span> is ready for OTP verification.
                                </div>
                                <button
                                  type="button"
                                  onClick={sendAadhaarOtp}
                                  disabled={otpLoading}
                                  className="py-1.5 px-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-[10px] rounded-lg tracking-wider uppercase transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                                >
                                  {otpLoading ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Requesting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Get Verification OTP</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {/* Simulated OTP Notification SMS Alert */}
                                <motion.div
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-[10px] font-mono text-cyan-300 relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,242,255,0.06)]"
                                >
                                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                                  <div className="flex items-start space-x-2">
                                    <Sparkles className="w-4 h-4 text-[#00f2ff] animate-pulse shrink-0 mt-0.5" />
                                    <div>
                                      <span className="block font-black text-white text-[11px] uppercase tracking-wider mb-0.5">💬 SANDBOX SIMULATION ALERT: UIDAI OTP INCOMING</span>
                                      <span>Your Aadhaar verification OTP security code is <strong className="text-white font-black bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/40 tracking-widest text-[#00f2ff]">{generatedOtp}</strong> (or use fallback code <strong className="text-white font-bold bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/35">123456</strong>)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEnteredOtp(generatedOtp)}
                                      className="py-0.5 px-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/30 rounded font-mono text-[9px] font-bold uppercase transition-colors shrink-0 ml-auto focus:outline-none"
                                    >
                                      Autofill
                                    </button>
                                  </div>
                                </motion.div>

                                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                                  <div className="relative flex-1">
                                    <Lock className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                                    <input
                                      type="text"
                                      value={enteredOtp}
                                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      placeholder="Enter 6-Digit Aadhaar OTP"
                                      className="w-full bg-slate-950/80 border border-slate-900 focus:border-cyan-400 rounded-xl py-2.5 pl-9 pr-4 text-xs font-mono text-white focus:outline-none transition-all placeholder:text-slate-600"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={verifyAadhaarOtp}
                                      disabled={otpLoading || enteredOtp.length !== 6}
                                      className="py-2.5 px-4 bg-purple-500 hover:bg-purple-400 disabled:opacity-30 disabled:pointer-events-none text-black font-mono font-bold text-xs rounded-xl tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                                    >
                                      {otpLoading ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <span>Verify OTP</span>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={sendAadhaarOtp}
                                      disabled={otpLoading}
                                      className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center animate-none"
                                      title="Resend OTP"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                {otpError && (
                                  <div className="text-red-400 font-mono text-[10px] flex items-center space-x-1.5 mt-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                    <span>{otpError}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                            <div className="flex items-center space-x-2.5">
                              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                              <div>
                                <span className="block font-black text-white text-[11px] uppercase tracking-wider mb-0.5">E-KYC CONFIRMED SECURELY</span>
                                <span className="text-[10px] text-slate-400">Aadhaar details verified and cryptographically signed with UIDAI registry.</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/25 py-0.5 px-2 rounded-full font-bold uppercase text-emerald-400 shrink-0 select-none">
                              COMPLETED
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: ADDRESS & NOMINEE DETAILS */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="font-display font-semibold text-sm text-cyan-300 uppercase tracking-wider mb-4 border-l-2 border-cyan-400 pl-2">
                      Address Details
                    </h3>

                    {/* House No & Street */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">House Number</label>
                        <input
                          type="text"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="A-404"
                          id="reg_houseNo"
                        />
                        {errors.houseNumber && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.houseNumber}</span></div>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Street / Block</label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="Cyber Tower Road"
                          id="reg_street"
                        />
                        {errors.street && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.street}</span></div>}
                      </div>
                    </div>

                    {/* City, State & PIN Code */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="Chennai"
                          id="reg_city"
                        />
                        {errors.city && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.city}</span></div>}
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="Tamil Nadu"
                          id="reg_state"
                        />
                        {errors.state && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.state}</span></div>}
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">PIN Code</label>
                        <input
                          type="text"
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="600001"
                          id="reg_pinCode"
                        />
                        {errors.pinCode && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.pinCode}</span></div>}
                      </div>
                    </div>

                    <h3 className="font-display font-semibold text-sm text-cyan-300 uppercase tracking-wider pt-4 border-l-2 border-cyan-400 pl-2">
                      Nominee Details
                    </h3>

                    {/* Nominee details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Relationship</label>
                        <select
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
                          id="reg_relationship"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Nominee Name</label>
                        <input
                          type="text"
                          value={nomineeName}
                          onChange={(e) => setNomineeName(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="Nominee Name"
                          id="reg_nomineeName"
                        />
                        {errors.nomineeName && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.nomineeName}</span></div>}
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Nominee Mobile</label>
                        <input
                          type="text"
                          value={nomineeMobile}
                          onChange={(e) => setNomineeMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                          placeholder="Nominee Phone"
                          id="reg_nomineeMobile"
                        />
                        {errors.nomineeMobile && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.nomineeMobile}</span></div>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SECURITY & SECURITY SETUP */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="font-display font-semibold text-sm text-cyan-300 uppercase tracking-wider mb-4 border-l-2 border-cyan-400 pl-2">
                      Secure Account Access Credentials
                    </h3>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Access Username</label>
                      <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        className={`w-full bg-slate-950/60 border rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none transition-colors ${
                          username.trim() === '' 
                            ? 'border-slate-800 focus:border-cyan-400' 
                            : isUsernameTaken 
                              ? 'border-red-500 focus:border-red-500' 
                              : 'border-emerald-500 focus:border-emerald-500'
                        }`}
                        placeholder="sathwik_neo"
                        id="reg_username"
                      />
                      {username.trim() === '' ? (
                        <div className="text-slate-500 text-xs font-mono mt-1.5 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Please input a desired unique access username.</span>
                        </div>
                      ) : isUsernameTaken ? (
                        <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Username already exists like that. Please choose a unique name.</span>
                        </div>
                      ) : (
                        <div className="text-emerald-400 text-xs font-mono mt-1.5 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Username is available! Proceed to create safety passcodes below.</span>
                        </div>
                      )}
                      {errors.username && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.username}</span></div>}
                    </div>

                    {/* Passwords & Seeding Gate */}
                    {username.trim() !== '' && !isUsernameTaken ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 pt-1"
                      >
                        {/* Passwords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Private Password</label>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                              <input
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                                placeholder="Min 8 characters"
                                id="reg_password"
                              />
                            </div>
                            {errors.password && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.password}</span></div>}
                            
                            {/* Password strength meter */}
                            {password && (
                              <div className="mt-2.5 bg-slate-950/40 p-2.5 border border-slate-800/80 rounded-md">
                                <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                                  <span className="text-slate-400">PASSPHRASE SYSTEM METRICS:</span>
                                  <span className={getPasswordStrength(password).color.split(' ')[0]}>{getPasswordStrength(password).feedback}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex space-x-0.5">
                                  {[0, 1, 2, 3].map((idx) => {
                                    const level = getPasswordStrength(password).score;
                                    return (
                                      <div 
                                        key={idx}
                                        className={`h-full flex-1 transition-colors duration-300 ${
                                          level > idx
                                            ? level === 1 ? 'bg-orange-500' 
                                              : level === 2 ? 'bg-yellow-500'
                                              : level === 3 ? 'bg-cyan-500'
                                              : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                            : 'bg-slate-800/80'
                                        }`}
                                      ></div>
                                    );
                                  })}
                                </div>
                                <span className="text-[8px] font-mono text-slate-500 mt-1 block">RATING: Minimum 1 UPPERCASE, 1 lowercase, 1 NUMBER, and 1 SPECIAL CHARACTER required.</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                              <input
                                type="password"
                                name="confirm-password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                                placeholder="Re-enter password"
                                id="reg_confirmPassword"
                              />
                            </div>
                            {errors.confirmPassword && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.confirmPassword}</span></div>}
                          </div>
                        </div>

                        <h3 className="font-display font-semibold text-sm text-cyan-300 uppercase tracking-wider pt-4 border-l-2 border-cyan-400 pl-2">
                          Secure Opening Balance Seeding
                        </h3>

                        {/* Opening balance */}
                        <div>
                          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Opening Deposit Balance (₹)</label>
                          <div className="relative">
                            <Wallet className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={openingBalance}
                              onChange={(e) => setOpeningBalance(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                              placeholder="5000"
                              id="reg_openingBalance"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Suggested: Initial deposits ₹5,000 generate instant Platinum debit permissions.</span>
                          {errors.openingBalance && <div className="text-red-400 text-xs font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.openingBalance}</span></div>}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-xl text-center flex flex-col items-center justify-center py-8 space-y-2">
                        <Lock className="w-8 h-8 text-slate-600 mb-1" />
                        <span className="font-mono text-sm text-slate-400 uppercase tracking-wider">Passphrase system gated</span>
                        <span className="text-[10px] text-slate-500 font-mono max-w-[340px]">
                          Enter an available, unique username above to unlock private password creation and account opening balance seeding.
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Form Navigation Controls */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-800/80 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold rounded-lg text-xs font-mono uppercase tracking-widest transition-all focus:outline-none flex items-center space-x-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-widest transition-all focus:outline-none flex items-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>SECURE PORTAL & MAKE ACCOUNT</span>
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          ) : (
            // REGISTRATION SUCCESS SCREEN
            <motion.div
              key="reg-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel border-2 border-green-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(34,197,94,0.15)] relative overflow-hidden"
            >
              {/* Scanline element */}
              <div className="cyber-scanner"></div>

              {/* Holographic success glow */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>

              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/80 mb-6">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/40 flex items-center justify-center p-3 text-green-400 mb-4 animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="font-display font-bold text-2xl text-green-400 uppercase tracking-wider neon-glow-green">
                  Account Created Successfully
                </h2>
                <p className="font-mono text-slate-400 text-[11px] tracking-widest uppercase mt-1">
                  SECURE LEDGER AUTHORIZATION COMPLETE
                </p>
              </div>

              {/* Futuristic Credentials Receipt Grid */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-8 space-y-4 font-mono relative">
                {/* Background matrix node */}
                <div className="absolute bottom-2 right-3 text-[10px] text-slate-800 font-mono tracking-tighter cursor-default">
                  TX_SIGNATURE_SECURE_MINT
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Customer ID</span>
                    <span className="text-cyan-400 font-bold font-mono tracking-wider">{createdProfile.customerId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">IFSC Code</span>
                    <span className="text-cyan-400 font-bold font-mono tracking-wider">{createdProfile.ifscCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Generated Account Number</span>
                    <span className="text-white font-bold font-mono tracking-widest">{createdProfile.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Allocated Branch</span>
                    <span className="text-white font-bold font-mono tracking-wider">{createdProfile.branch}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-800/60 pt-3">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Initial Ledger Balance</span>
                    <span className="text-green-400 font-bold font-mono text-base">₹{createdProfile.currentBalance.toLocaleString('en-IN')}.00</span>
                  </div>
                </div>
              </div>

              {/* Informative info block */}
              <div className="bg-slate-900/40 p-4 border border-slate-800 text-xs text-slate-400 rounded-lg mb-6 leading-relaxed flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  Your registration is synchronized across India’s **SmartBank Neo Network**. Write down or remember your Customer credentials safely. You are now authorized to complete secure transactions.
                </p>
              </div>

              {/* Actions */}
              <button
                onClick={onSuccess}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-500 hover:from-green-400 hover:to-teal-400 text-black font-bold rounded-xl text-sm font-mono tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.25)] flex items-center justify-center space-x-2 focus:outline-none"
              >
                <span>Proceed To Login</span>
                <LogIn className="w-4 h-4 text-black" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

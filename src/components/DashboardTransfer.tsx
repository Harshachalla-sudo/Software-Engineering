import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, Transaction, QuickContact 
} from '../types';
import { 
  Send, ArrowDownLeft, ShieldAlert, Cpu, CheckCircle, AlertCircle, Smartphone, Key, HelpCircle 
} from 'lucide-react';
import { 
  getUsers, saveUsers, addTransaction 
} from '../utils';

interface DashboardTransferProps {
  user: UserProfile;
  contacts: QuickContact[];
  onBalanceChange: (newBalance: number) => void;
  onNewTransaction: () => void;
  onAddContact: (name: string, details: string) => void;
  prefillReceiver?: string; // Pre-fill with a quick contact
  prefillMethod?: 'send' | 'request';
  currency?: 'USD' | 'EUR' | 'GBP' | 'INR';
  formatAmount?: (amount: number) => string;
}

export default function DashboardTransfer({ 
  user, 
  contacts, 
  onBalanceChange, 
  onNewTransaction, 
  onAddContact,
  prefillReceiver = '',
  prefillMethod = 'send',
  currency = 'INR',
  formatAmount
}: DashboardTransferProps) {

  const displayAmount = (amt: number) => {
    if (formatAmount) {
      return formatAmount(amt);
    }
    return `₹${amt.toLocaleString()}`;
  };
  
  const [activeTab, setActiveTab] = useState<'send' | 'request'>(prefillMethod);
  const [txCurrency, setTxCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'INR'>(currency);
  const [reqCurrency, setReqCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'INR'>(currency);

  useEffect(() => {
    setTxCurrency(currency);
    setReqCurrency(currency);
  }, [currency]);

  // Send Money Fields
  const [receiver, setReceiver] = useState(prefillReceiver);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('Dynamic Transfer');
  const [method, setMethod] = useState<'UPI' | 'IMPS' | 'NEFT' | 'RTGS'>('UPI');

  // Request Money Fields
  const [requestFrom, setRequestFrom] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('Payment Request');

  // Transaction errors / notifications
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // OTP Simulation States
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [userInputOtp, setUserInputOtp] = useState('');
  const [otpAlertVisible, setOtpAlertVisible] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Main success flow states
  const [transferSuccess, setTransferSuccess] = useState<Transaction | null>(null);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Overwrite local values when pre-fill changes
  useEffect(() => {
    if (prefillReceiver) {
      setReceiver(prefillReceiver);
      setActiveTab(prefillMethod);
    }
  }, [prefillReceiver, prefillMethod]);

  const handleSendSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setTransferSuccess(null);

    const isLocked = localStorage.getItem('smb_neo_card_locked_' + user.accountNumber) === 'true';
    if (isLocked) {
      setErrors({ receiver: '🚨 SECURITY BLOCK: Your physical debit card is locked! Please disable card freeze in Console Configurations to initiate transfers.' });
      return;
    }

    const validationErrors: { [key: string]: string } = {};
    const transferAmt = parseFloat(amount);

    const rates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      INR: 1.0,
    };
    const activeCurrency = txCurrency || 'INR';
    const rate = rates[activeCurrency];
    const transferAmtInINR = transferAmt / rate;

    if (!receiver.trim()) {
      validationErrors.receiver = 'Specify a receiver (Username, Mobile, or Account #)';
    }

    if (isNaN(transferAmt) || transferAmt <= 0) {
      validationErrors.amount = 'Please enter a valid amount';
    } else if (transferAmtInINR > user.currentBalance) {
      validationErrors.amount = `Insufficient ledger reserves. Available: ${displayAmount(user.currentBalance)}`;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Generate random OTP (6-digits)
    let generatedCode = '';
    for (let i = 0; i < 6; i++) {
      generatedCode += Math.floor(Math.random() * 10).toString();
    }

    setSimulatedOtp(generatedCode);
    setShowOtpPopup(true);
    setUserInputOtp('');
    setOtpError('');
    
    // Simulate mobile alert timing delay
    setTimeout(() => {
      setOtpAlertVisible(true);
    }, 400);
  };

  const verifyOtp = () => {
    if (userInputOtp !== simulatedOtp) {
      setOtpError('Invalid OTP password code. Verification failing.');
      return;
    }

    // Process Ledger updates
    const rates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      INR: 1.0,
    };
    const activeCurrency = txCurrency || 'INR';
    const rate = rates[activeCurrency];
    const amountInINR = parseFloat(amount) / rate;

    const updatedBalance = user.currentBalance - amountInINR;
    
    // Search for receivers inside users registry to update active values
    const users = getUsers();
    let receiverFinalName = receiver;

    // Check if receiver points to an existing user
    const matchedIdx = users.findIndex(
      (u) => 
        u.username.toLowerCase() === receiver.toLowerCase().trim() ||
        u.mobile === receiver.trim() ||
        u.accountNumber === receiver.trim()
    );

    if (matchedIdx !== -1) {
      const rec = users[matchedIdx];
      rec.currentBalance += amountInINR;
      receiverFinalName = rec.fullName;
      
      // Update receivers account balance
      users[matchedIdx] = rec;
    }

    // Update senders balance
    const senderIdx = users.findIndex((u) => u.customerId === user.customerId);
    if (senderIdx !== -1) {
      users[senderIdx].currentBalance = updatedBalance;
    }

    saveUsers(users);

    // Save transaction
    const now = new Date();
    const newTx: Transaction = {
      id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
      date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      senderName: user.fullName,
      senderAccount: user.accountNumber,
      receiverName: receiverFinalName,
      receiverDetails: receiver,
      paymentMethod: method,
      amount: amountInINR,
      purpose: purpose || 'Digital Fund Transfer',
      status: 'SUCCESS'
    };

    addTransaction(newTx);
    onBalanceChange(updatedBalance);
    onNewTransaction();

    // If destination doesn't exist in quick contacts list, register them!
    const names = contacts.map(c => c.name.toLowerCase());
    if (!names.includes(receiverFinalName.toLowerCase())) {
      onAddContact(receiverFinalName, receiver);
    }

    setTransferSuccess(newTx);
    setShowOtpPopup(false);
    setOtpAlertVisible(false);

    // Clear inputs
    setReceiver('');
    setAmount('');
    setPurpose('Dynamic Transfer');
  };

  // Request Money simulation (Auto-approves in 2 seconds)
  const handleRequestSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setRequestSuccessMsg('');

    const validationErrors: { [key: string]: string } = {};
    const reqAmt = parseFloat(requestAmount);

    if (!requestFrom.trim()) {
      validationErrors.requestFrom = 'Specify payee credentials (Username or Mobile)';
    }

    if (isNaN(reqAmt) || reqAmt <= 0) {
      validationErrors.requestAmount = 'Please enter a valid request amount';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Trigger request processing simulation
    setRequestSuccessMsg('REQUEST SUBMITTED. WAITING FOR SECURE PAYEE AUTHORIZATION...');

    const rates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      INR: 1.0,
    };
    const activeCurrency = reqCurrency || 'INR';
    const rate = rates[activeCurrency];
    const reqAmtInINR = reqAmt / rate;

    setTimeout(() => {
      // Auto approve deposit scenario
      const updatedBalance = user.currentBalance + reqAmtInINR;
      const users = getUsers();
      const senderIdx = users.findIndex((u) => u.customerId === user.customerId);
      if (senderIdx !== -1) {
        users[senderIdx].currentBalance = updatedBalance;
        saveUsers(users);
      }

      // Record transaction
      const now = new Date();
      const newTx: Transaction = {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        senderName: requestFrom,
        senderAccount: '987654321011', // simulated source
        receiverName: user.fullName,
        receiverDetails: user.accountNumber,
        paymentMethod: 'UPI',
        amount: reqAmtInINR,
        purpose: `Requested Payee Reimbursement: ${requestNote}`,
        status: 'SUCCESS'
      };

      addTransaction(newTx);
      onBalanceChange(updatedBalance);
      onNewTransaction();

      // Register contact
      const names = contacts.map(c => c.name.toLowerCase());
      if (!names.includes(requestFrom.toLowerCase())) {
        onAddContact(requestFrom, requestFrom);
      }

      setRequestSuccessMsg(`APPROVE NOTIFICATION CONFIRMED: Credited ${displayAmount(reqAmtInINR)} successfully from ${requestFrom}!`);
      setRequestFrom('');
      setRequestAmount('');
      setRequestNote('Payment Request');

      setTimeout(() => {
        setRequestSuccessMsg('');
      }, 5000);

    }, 2000);
  };

  return (
    <div className="glass-panel border border-slate-800 rounded-2xl p-5 md:p-6 shadow-[0_0_25px_rgba(6,182,212,0.01)] relative">
      
      {/* Header Selector */}
      <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-5">
        <h3 className="font-display font-medium text-base text-white flex items-center space-x-2">
          <Send className="text-cyan-400 w-4.5 h-4.5 animate-pulse" />
          <span>Capital Transmission Hub</span>
        </h3>

        {/* Tab Controls */}
        <div className="flex space-x-1 p-0.5 bg-slate-950/80 border border-slate-800 rounded-lg font-mono text-[9px] uppercase tracking-wider">
          <button
            onClick={() => { setActiveTab('send'); setTransferSuccess(null); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors focus:outline-none flex items-center space-x-1 ${
              activeTab === 'send' 
                ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3 h-3" />
            <span>Send Money</span>
          </button>
          <button
            onClick={() => { setActiveTab('request'); setTransferSuccess(null); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors focus:outline-none flex items-center space-x-1 ${
              activeTab === 'request' 
                ? 'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3 h-3" />
            <span>Request</span>
          </button>
        </div>
      </div>

      {activeTab === 'send' ? (
        // SEND MONEY FORM & SUCCESS MODULE
        <div>
          {transferSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-950/40 border border-emerald-500/20 p-5 rounded-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/40 p-2 text-green-400 mx-auto flex items-center justify-center animate-pulse">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-display font-medium text-lg text-green-400 uppercase tracking-wider neon-glow-green">Transfer Successful</h4>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">TRANSACTION SIGNED & COMMITTED</p>
              </div>

              <div className="bg-slate-950/90 border border-slate-900 rounded-xl p-4 text-left font-mono text-xs space-y-2 mb-2">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="text-cyan-400 font-bold">{transferSuccess.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Beneficiary Name</span>
                  <span className="text-white font-medium">{transferSuccess.receiverName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="text-purple-400 font-bold tracking-wider">{transferSuccess.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Transferred Sum</span>
                  <span className="text-green-400 font-bold">{displayAmount(transferSuccess.amount)}</span>
                </div>
              </div>

              <button
                onClick={() => setTransferSuccess(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors focus:outline-none"
              >
                Close Receipt / New Transfer
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSendSubmit} className="space-y-4">
              
              {/* Receiver */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Receiver Beneficiary</label>
                <div className="relative">
                  <input
                    type="text"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-xs text-white focus:outline-none font-mono"
                    placeholder="Enter Username, phone, or Account Number"
                    id="tx_receiver"
                  />
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Compatible keys: sathwik (Demo user), or some custom phone numbers.</span>
                {errors.receiver && <div className="text-red-400 text-[10px] font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.receiver}</span></div>}
              </div>

              {/* Amount, Currency & Protocol Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Transfer Balance Sum ({txCurrency})</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-xs text-white font-mono focus:outline-none font-bold"
                    placeholder="0.00"
                    id="tx_amount"
                  />
                  {errors.amount && <div className="text-red-400 text-[10px] font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.amount}</span></div>}
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Transfer Currency</label>
                  <select
                    value={txCurrency}
                    onChange={(e) => setTxCurrency(e.target.value as any)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-xs text-[#00f2ff] font-bold focus:outline-none [color-scheme:dark] font-mono"
                    id="tx_currency"
                  >
                    <option value="INR" className="bg-[#050508]">INR (₹)</option>
                    <option value="USD" className="bg-[#050508]">USD ($)</option>
                    <option value="EUR" className="bg-[#050508]">EUR (€)</option>
                    <option value="GBP" className="bg-[#050508]">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-xs text-white focus:outline-none [color-scheme:dark] font-mono"
                    id="tx_method"
                  >
                    <option value="UPI">UPI (Instant Limit {displayAmount(100000)})</option>
                    <option value="IMPS">IMPS Core (Immediate {displayAmount(500000)})</option>
                    <option value="NEFT">NEFT Batch (Secure {displayAmount(1000000)})</option>
                    <option value="RTGS">RTGS High-Value (Min {displayAmount(200000)})</option>
                  </select>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Purpose Note</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-400 rounded-lg py-2.5 px-4 text-xs text-white focus:outline-none"
                  placeholder="Dinner payment, node purchase, rental..."
                  id="tx_purpose"
                />
              </div>

              {/* Transfer request submit button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-xl text-xs font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] focus:outline-none flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5 text-black" />
                <span>ENGAGE SECURE TRANSFER CODE</span>
              </button>
            </form>
          )}
        </div>
      ) : (
        // REQUEST MONEY FORM & SIMULATION
        <div>
          {requestSuccessMsg ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border text-center font-mono text-xs space-y-2 mb-2 ${
                requestSuccessMsg.includes('WAITING') 
                  ? 'bg-purple-950/20 border-purple-500/20 text-purple-300' 
                  : 'bg-green-950/20 border-green-500/20 text-green-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-950 border border-slate-800 mx-auto text-purple-400 animate-pulse">
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="leading-relaxed whitespace-pre-line">{requestSuccessMsg}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Payee username or phone to request from */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Payee Source</label>
                <input
                  type="text"
                  value={requestFrom}
                  onChange={(e) => setRequestFrom(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-400 rounded-lg py-2.5 px-4 text-xs text-white focus:outline-none font-mono"
                  placeholder="Enter Payee Username or Phone"
                  id="tx_req_from"
                />
                {errors.requestFrom && <div className="text-red-400 text-[10px] font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.requestFrom}</span></div>}
              </div>

              {/* Amount and Request Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Request Sum ({reqCurrency})</label>
                  <input
                    type="text"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-400 rounded-lg py-2.5 px-4 text-xs text-white focus:outline-none font-bold font-mono"
                    placeholder="0.00"
                    id="tx_req_amount"
                  />
                  {errors.requestAmount && <div className="text-red-400 text-[10px] font-mono mt-1.5 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{errors.requestAmount}</span></div>}
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Request Currency</label>
                  <select
                    value={reqCurrency}
                    onChange={(e) => setReqCurrency(e.target.value as any)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-400 rounded-lg py-2.5 px-4 text-xs text-[#d946ef] font-bold focus:outline-none [color-scheme:dark] font-mono"
                    id="tx_req_currency"
                  >
                    <option value="INR" className="bg-[#050508]">INR (₹)</option>
                    <option value="USD" className="bg-[#050508]">USD ($)</option>
                    <option value="EUR" className="bg-[#050508]">EUR (€)</option>
                    <option value="GBP" className="bg-[#050508]">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">Request Description Note</label>
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-400 rounded-lg py-2.5 px-4 text-xs text-white focus:outline-none"
                  placeholder="Reimbursement, Dinner splits..."
                  id="tx_req_note"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)] focus:outline-none flex items-center justify-center space-x-2"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
                <span>DISPATCH REQUEST MESSAGE</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* SECURE POPUP MODAL FOR ENTERING OTP */}
      <AnimatePresence>
        {showOtpPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-950 border border-cyan-400/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white relative overflow-hidden"
            >
              {/* Scanline pattern */}
              <div className="cyber-scanner"></div>

              {/* Title Header */}
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span className="font-display font-bold text-sm uppercase tracking-wider">ENTER SECURITY OTP</span>
                </div>
                <button
                  onClick={() => { setShowOtpPopup(false); setOtpAlertVisible(false); }}
                  className="text-slate-500 hover:text-white text-xs font-mono focus:outline-none"
                >
                  ✖
                </button>
              </div>

              <p className="text-slate-400 text-xs text-center mb-4 leading-relaxed font-mono">
                Enter the simulated 6-digit transaction authorization key sent to your mobile device registry.
              </p>

              {/* OTP Code Alert Broadcast Simulator */}
              {otpAlertVisible && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-cyan-950/30 border-2 border-cyan-400/40 rounded-xl p-3 mb-4 text-center select-all relative group"
                >
                  <span className="text-[8px] font-mono text-slate-500 block mb-1">SYSTEM MOBILE SMS NOTIFICATION</span>
                  <span className="font-mono text-xs text-slate-200">
                    Your OTP verification code for SmartBank is: <strong className="text-cyan-400 tracking-wider text-sm font-extrabold">{simulatedOtp}</strong>
                  </span>
                  <span className="text-[7.5px] font-mono text-slate-500 block mt-1 hover:underline cursor-pointer" onClick={() => setUserInputOtp(simulatedOtp)}>
                    [Click to auto-fill code]
                  </span>
                </motion.div>
              )}

              {/* Error messages overlay */}
              {otpError && (
                <div className="p-2 mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-center rounded-lg flex items-center justify-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* User OTP Input field */}
              <div className="mb-4">
                <input
                  type="text"
                  maxLength={6}
                  value={userInputOtp}
                  onChange={(e) => setUserInputOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg py-3 text-center text-lg tracking-[0.5em] font-bold text-white focus:outline-none pl-3"
                  placeholder="••••••"
                  id="tx_otp_input"
                />
              </div>

              {/* Buttons controls */}
              <div className="flex space-x-2">
                <button
                  onClick={() => { setShowOtpPopup(false); setOtpAlertVisible(false); }}
                  className="flex-1 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-mono uppercase text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyOtp}
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
                >
                  Verify Core
                </button>
              </div>

              <div className="mt-4 border-t border-slate-900 pt-3 text-center">
                <span className="text-[8px] text-slate-600 font-mono flex justify-center items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-cyan-400/40" />
                  <span>AES-256 HASH VERIFICATION CHANNELS ACTIVE</span>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

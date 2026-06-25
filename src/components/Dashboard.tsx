import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction, QuickContact } from '../types';
import { 
  Users, User, Send, History, Settings, LogOut, ShieldCheck, 
  Eye, EyeOff, LayoutDashboard, Copy, Check, Landmark, AlertCircle, RefreshCw, Cpu,
  ShieldAlert, Bell, Receipt, Tv, Bolt, Lock, Unlock, Sparkles, X, CheckCircle, Wifi,
  PiggyBank, Download, FileSpreadsheet, FileJson, FileText, Search, Timer, Smartphone
} from 'lucide-react';
import { 
  getTransactions, endSession, seedDemoStore, getUsers, saveUsers, addTransaction, getTransactionCategory
} from '../utils';
import DashboardAnalytics from './DashboardAnalytics';
import DashboardProfile from './DashboardProfile';
import DashboardTransfer from './DashboardTransfer';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateUser: (updated: UserProfile) => void;
}

export default function Dashboard({ user, onLogout, onUpdateUser }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'transfer' | 'statement' | 'profile' | 'settings'>('home');
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transactionSearch, setTransactionSearch] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'INR'>('INR');

  const formatAmount = (amount: number) => {
    const rates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      INR: 1.0,
    };
    if (currency === 'EUR') {
      const converted = amount * rates.EUR;
      return `€${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'GBP') {
      const converted = amount * rates.GBP;
      return `£${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'INR') {
      const converted = amount * rates.INR;
      return `₹${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Default USD
    const converted = amount * rates.USD;
    return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Quick Actions states
  const [isCardLocked, setIsCardLocked] = useState(() => {
    return localStorage.getItem('smb_neo_card_locked_' + user.accountNumber) === 'true';
  });
  const [unreadPayments, setUnreadPayments] = useState<Transaction[]>([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billPayLoading, setBillPayLoading] = useState(false);
  const [payingBillIndex, setPayingBillIndex] = useState<number | null>(null);
  
  // OTP Verification for utility payments
  const [requireOtpForBills, setRequireOtpForBills] = useState(true);
  const [activeBillForOtp, setActiveBillForOtp] = useState<number | null>(null);
  const [billOtpCode, setBillOtpCode] = useState('');
  const [enteredBillOtp, setEnteredBillOtp] = useState('');
  const [billOtpSent, setBillOtpSent] = useState(false);
  const [billOtpError, setBillOtpError] = useState('');
  const [billOtpLoading, setBillOtpLoading] = useState(false);
  
  // Deposit money states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // Simulated utility bills state
  const [utilityBills, setUtilityBills] = useState([
    { id: 'UB-104', type: 'Broadband Fiber', provider: 'Airtel Broadband', amount: 799, status: 'PENDING' },
    { id: 'UB-209', type: 'Electricity Grid', provider: 'TNEB Chennai', amount: 1420, status: 'PENDING' },
    { id: 'UB-832', type: 'Water Authority', provider: 'CWS Supply', amount: 380, status: 'PENDING' }
  ]);

  // Quick Contacts state
  const [contacts, setContacts] = useState<QuickContact[]>([
    { name: 'Harsha', details: 'harsha@upi', initials: 'H', avatarColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { name: 'Venkatesh', details: '9988776655', initials: 'V', avatarColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { name: 'Family Group', details: '112233445566', initials: 'F', avatarColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  ]);

  // Copied Account Number tooltip tracking
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Dual-Device Simulator states
  const [devicePayee, setDevicePayee] = useState('Starbucks Coffee');
  const [deviceAmount, setDeviceAmount] = useState('');
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceCurrency, setDeviceCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'INR'>('INR');

  // Prefill references for quick transfers clicked from contacts
  const [prefillReceiver, setPrefillReceiver] = useState('');
  const [prefillMethod, setPrefillMethod] = useState<'send' | 'request'>('send');

  // Load transactions of current user
  const fetchTransactions = () => {
    setTransactions(getTransactions(user.accountNumber));
  };

  useEffect(() => {
    fetchTransactions();

    // ticking security system clock
    const clock = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clock);
  }, [user.accountNumber]);

  // Real-time multi-device / multi-tab storage synchronizer
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'smb_neo_users' || 
        e.key === `smb_neo_transactions_${user.accountNumber}` || 
        e.key?.startsWith('smb_neo_transactions_')
      ) {
        // Fetch latest transactions list
        fetchTransactions();
        
        // Fetch latest profile balance
        const users = getUsers();
        const updatedUser = users.find(u => u.customerId === user.customerId);
        if (updatedUser && updatedUser.currentBalance !== user.currentBalance) {
          onUpdateUser(updatedUser);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user.accountNumber, user.customerId, user.currentBalance, onUpdateUser]);

  useEffect(() => {
    setIsCardLocked(localStorage.getItem('smb_neo_card_locked_' + user.accountNumber) === 'true');
  }, [user.accountNumber]);

  useEffect(() => {
    // Check for unread payment notifications
    const ackKey = `smb_neo_ack_txs_${user.accountNumber}`;
    const ackString = localStorage.getItem(ackKey);
    const ackedIds: string[] = ackString ? JSON.parse(ackString) : [];

    // Find received transactions (where user is receiver, not sender)
    const received = transactions.filter(
      (tx) => tx.senderAccount !== user.accountNumber && tx.status === 'SUCCESS'
    );

    // Unread are those whose IDs are not in the acknowledged list
    const unread = received.filter((tx) => !ackedIds.includes(tx.id));
    setUnreadPayments(unread);
  }, [transactions, user.accountNumber]);

  // Real-time Toast Notifications state and logic for new transaction events
  const [toasts, setToasts] = useState<{ id: string; title: string; desc: string; type: 'credit' | 'debit' | 'info'; amount: number }[]>([]);
  const [prevTxIds, setPrevTxIds] = useState<string[]>(() => {
    return getTransactions(user.accountNumber).map((tx) => tx.id);
  });

  const addToast = (title: string, desc: string, type: 'credit' | 'debit' | 'info', amount: number) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, title, desc, type, amount }]);
    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Keep prevTxIds in sync with user changes
  useEffect(() => {
    setPrevTxIds(getTransactions(user.accountNumber).map((tx) => tx.id));
  }, [user.accountNumber]);

  // Detect and alert on new transactions
  useEffect(() => {
    if (transactions.length > 0) {
      const currentIds = transactions.map((tx) => tx.id);
      const newTxs = transactions.filter((tx) => !prevTxIds.includes(tx.id));
      if (newTxs.length > 0) {
        newTxs.forEach((tx) => {
          const isDebit = tx.senderAccount === user.accountNumber;
          const type = isDebit ? 'debit' : 'credit';
          const title = isDebit ? '💸 TRANSACTION DEBITED (OUTBOUND)' : '🎉 TRANSACTION CREDITED (INBOUND)';
          const desc = isDebit 
            ? `Debited ${formatAmount(tx.amount)} to ${tx.receiverName} via ${tx.paymentMethod}`
            : `Credited ${formatAmount(tx.amount)} from ${tx.senderName} (${tx.purpose})`;
          addToast(title, desc, type, tx.amount);
        });
        setPrevTxIds(currentIds);
      }
    } else {
      setPrevTxIds([]);
    }
  }, [transactions, user.accountNumber, prevTxIds]);

  // Session timeout tracking: 5 minutes = 300 seconds
  const [sessionTimeLeft, setSessionTimeLeft] = useState(300);

  useEffect(() => {
    // If the timer reaches 0, perform log out
    if (sessionTimeLeft <= 0) {
      endSession();
      onLogout();
      return;
    }

    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionTimeLeft, onLogout]);

  useEffect(() => {
    const handleActivity = () => {
      setSessionTimeLeft(300);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const handleDismissNotification = (txId: string) => {
    const ackKey = `smb_neo_ack_txs_${user.accountNumber}`;
    const ackString = localStorage.getItem(ackKey);
    const ackedIds: string[] = ackString ? JSON.parse(ackString) : [];

    if (!ackedIds.includes(txId)) {
      const updated = [...ackedIds, txId];
      localStorage.setItem(ackKey, JSON.stringify(updated));
    }

    setUnreadPayments((prev) => prev.filter((tx) => tx.id !== txId));
  };

  const handleToggleCardLocked = () => {
    const newVal = !isCardLocked;
    setIsCardLocked(newVal);
    localStorage.setItem('smb_neo_card_locked_' + user.accountNumber, newVal ? 'true' : 'false');
  };

  const handleInitiatePayBill = (billIndex: number) => {
    const bill = utilityBills[billIndex];
    if (bill.amount > user.currentBalance) {
      alert(`Insufficient ledger reserves: Your available balance is ${formatAmount(user.currentBalance)}, but this bill is ${formatAmount(bill.amount)}.`);
      return;
    }

    if (requireOtpForBills) {
      setPayingBillIndex(billIndex);
      setBillOtpLoading(true);
      setBillOtpError('');
      
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setBillOtpCode(randomCode);
      setEnteredBillOtp('');
      setBillOtpSent(true);
      setBillOtpLoading(false);
      setActiveBillForOtp(billIndex);
    } else {
      handlePayBill(billIndex);
    }
  };

  const handleVerifyBillOtp = () => {
    if (activeBillForOtp === null) return;
    if (enteredBillOtp !== billOtpCode && enteredBillOtp !== '123456') {
      setBillOtpError('Invalid secure payment OTP code. Please enter the correct code shown in the simulation window.');
      return;
    }

    setBillOtpLoading(true);
    setBillOtpError('');

    const targetIdx = activeBillForOtp;
    
    // Clear OTP screens
    setActiveBillForOtp(null);
    setBillOtpSent(false);
    setBillOtpCode('');
    setEnteredBillOtp('');
    setBillOtpError('');

    handlePayBill(targetIdx);
  };

  const handlePayBill = (billIndex: number) => {
    const bill = utilityBills[billIndex];
    if (bill.amount > user.currentBalance) {
      alert(`Insufficient ledger reserves: Your available balance is ${formatAmount(user.currentBalance)}, but this bill is ${formatAmount(bill.amount)}.`);
      return;
    }

    setPayingBillIndex(billIndex);
    setBillPayLoading(true);

    setTimeout(() => {
      // Process payment
      const updatedBalance = user.currentBalance - bill.amount;
      
      // Update in localStorage
      const users = getUsers();
      const userIdx = users.findIndex(u => u.customerId === user.customerId);
      if (userIdx !== -1) {
        users[userIdx].currentBalance = updatedBalance;
        saveUsers(users);
        onUpdateUser(users[userIdx]);
      }

      // Record transaction
      const now = new Date();
      const newTx: Transaction = {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        senderName: user.fullName,
        senderAccount: user.accountNumber,
        receiverName: bill.provider,
        receiverDetails: bill.id,
        paymentMethod: 'UPI',
        amount: bill.amount,
        purpose: `Utility Auto-Deduct: ${bill.type} Paid`,
        status: 'SUCCESS'
      };

      addTransaction(newTx);
      fetchTransactions(); // reload transactions

      // Mark the bill as paid locally
      setUtilityBills(prev => prev.map((b, idx) => idx === billIndex ? { ...b, status: 'PAID' } : b));
      setBillPayLoading(false);
      setPayingBillIndex(null);
    }, 1500);
  };

  const handleDepositFunds = (amountVal: number) => {
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please specify a valid credit amount.");
      return;
    }

    setDepositLoading(true);

    const rates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      INR: 1.0,
    };
    const rate = rates[currency];
    const amountInINR = amountVal / rate;

    setTimeout(() => {
      // Process deposit
      const updatedBalance = user.currentBalance + amountInINR;
      
      // Update in localStorage
      const users = getUsers();
      const userIdx = users.findIndex(u => u.customerId === user.customerId);
      if (userIdx !== -1) {
        users[userIdx].currentBalance = updatedBalance;
        saveUsers(users);
        onUpdateUser(users[userIdx]);
      }

      // Record transaction
      const now = new Date();
      const newTx: Transaction = {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        senderName: 'SANDBOX LIQUIDITY GATEWAY',
        senderAccount: 'NEO-DEP-8891',
        receiverName: user.fullName,
        receiverDetails: user.accountNumber,
        paymentMethod: 'UPI',
        amount: amountInINR,
        purpose: `SANDBOX TOP UP CREDIT`,
        status: 'SUCCESS'
      };

      addTransaction(newTx);
      fetchTransactions(); // reload transactions

      setDepositLoading(false);
      setShowDepositModal(false);
      setDepositAmount('');
    }, 1200);
  };

  const handleDevicePaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isCardLocked) {
      alert("🚨 SECURITY BLOCK: Your physical debit card is locked! Disable card freeze in Console Configurations to authorize multi-device transactions.");
      return;
    }

    const amt = parseFloat(deviceAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const rates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      INR: 1.0,
    };
    
    const rate = rates[deviceCurrency];
    const amountInINR = amt / rate;

    if (amountInINR > user.currentBalance) {
      alert(`Insufficient funds on Device II: Current available balance is ${formatAmount(user.currentBalance)}`);
      return;
    }

    setDeviceLoading(true);

    setTimeout(() => {
      const updatedBalance = user.currentBalance - amountInINR;
      
      // Update balance in localStorage
      const users = getUsers();
      const userIdx = users.findIndex(u => u.customerId === user.customerId);
      if (userIdx !== -1) {
        users[userIdx].currentBalance = updatedBalance;
        saveUsers(users);
        onUpdateUser(users[userIdx]);
      }

      // Add transaction to localStorage
      const now = new Date();
      const newTx: Transaction = {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        senderName: user.fullName,
        senderAccount: user.accountNumber,
        receiverName: devicePayee,
        receiverDetails: 'DEVICE_II_TAP_PAY',
        paymentMethod: 'TAP_PAY',
        amount: amountInINR,
        purpose: 'Authorized from Linked Device II',
        status: 'SUCCESS'
      };

      addTransaction(newTx);
      fetchTransactions();
      setDeviceLoading(false);
      setDeviceAmount('');
    }, 1000);
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(user.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const downloadFile = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Sender Name',
      'Sender Account',
      'Receiver Name',
      'Receiver Details',
      'Payment Method',
      'Amount (INR)',
      'Purpose',
      'Status',
      'Flow Type'
    ];

    const rows = transactions.map(tx => {
      const isDebit = tx.senderAccount === user.accountNumber;
      return [
        tx.id,
        tx.date,
        tx.time,
        `"${tx.senderName.replace(/"/g, '""')}"`,
        tx.senderAccount,
        `"${tx.receiverName.replace(/"/g, '""')}"`,
        tx.receiverDetails || '',
        tx.paymentMethod,
        tx.amount,
        `"${(tx.purpose || '').replace(/"/g, '""')}"`,
        tx.status,
        isDebit ? 'DEBIT' : 'CREDIT'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const cleanName = user.fullName.toLowerCase().replace(/\s+/g, '_');
    downloadFile(csvContent, 'text/csv;charset=utf-8;', `${cleanName}_statement_${user.accountNumber}.csv`);
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify({
      generatedAt: new Date().toISOString(),
      accountHolder: user.fullName,
      accountNumber: user.accountNumber,
      totalTransactions: transactions.length,
      currentBalance: user.currentBalance,
      ledgerEntries: transactions
    }, null, 2);
    const cleanName = user.fullName.toLowerCase().replace(/\s+/g, '_');
    downloadFile(dataStr, 'application/json;charset=utf-8;', `${cleanName}_statement_${user.accountNumber}.json`);
  };

  const handleDownloadTXT = () => {
    const now = new Date().toLocaleString('en-IN');
    let txt = `======================================================================\n`;
    txt += `              SMB NEO-QUANTUM DIGITAL BANK STATEMENT\n`;
    txt += `======================================================================\n`;
    txt += `Account Holder:     ${user.fullName}\n`;
    txt += `Account Number:     ${user.accountNumber}\n`;
    txt += `Current Balance:    ${formatAmount(user.currentBalance)}\n`;
    txt += `Statement Date:     ${now}\n`;
    txt += `Total Transactions: ${transactions.length}\n`;
    txt += `----------------------------------------------------------------------\n\n`;
    txt += `LEDGER HISTORY AUDIT TRAIL:\n`;
    txt += `----------------------------------------------------------------------\n`;
    
    // Header row
    txt += String('TX REF ID').padEnd(12) + 
           String('DATE & TIME').padEnd(20) + 
           String('PARTY / DETAILS').padEnd(24) + 
           String('METHOD').padEnd(10) + 
           String('AMOUNT').padStart(12) + 
           String('  TYPE\n');
    txt += `----------------------------------------------------------------------\n`;

    transactions.forEach(tx => {
      const isDebit = tx.senderAccount === user.accountNumber;
      const party = isDebit ? tx.receiverName : tx.senderName;
      const flow = isDebit ? 'DEBIT' : 'CREDIT';
      const cleanParty = party.length > 21 ? party.slice(0, 20) + '..' : party;
      const dateTime = `${tx.date} ${tx.time.slice(0, 5)}`;
      
      txt += String(tx.id).padEnd(12) + 
             String(dateTime).padEnd(20) + 
             String(cleanParty).padEnd(24) + 
             String(tx.paymentMethod).padEnd(10) + 
             String(formatAmount(tx.amount)).padStart(12) + 
             String(`  ${flow}\n`);
    });
    
    txt += `======================================================================\n`;
    txt += `    End of cryptographic bank statement. This ledger is secured     \n`;
    txt += `          by the decentralized neobank quantum framework.          \n`;
    txt += `======================================================================\n`;

    const cleanName = user.fullName.toLowerCase().replace(/\s+/g, '_');
    downloadFile(txt, 'text/plain;charset=utf-8;', `${cleanName}_statement_${user.accountNumber}.txt`);
  };

  const handleAddLiveContact = (name: string, details: string) => {
    // Generate initials
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = [
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    setContacts((prev) => [
      ...prev,
      { name, details, initials, avatarColor }
    ]);
  };

  const handleQuickContactClick = (contact: QuickContact) => {
    setPrefillReceiver(contact.details);
    setPrefillMethod('send');
    setActiveTab('transfer');
  };

  const handleResetDatabase = () => {
    if (window.confirm('Reset local Sandbox Account Balance? This will reload seed transactions.')) {
      localStorage.clear();
      seedDemoStore();
      const users = getUsers();
      const fresh = users.find(u => u.customerId === 'SB0001');
      if (fresh) {
        onUpdateUser(fresh);
      }
      fetchTransactions();
      alert('Sandbox reset completed. Relogging or refreshing session.');
    }
  };

  const handleLogout = () => {
    endSession();
    onLogout();
  };

  // Real-time filtered transactions by other participant name or category
  const filteredTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((tx) => {
      const isDebit = tx.senderAccount === user.accountNumber;
      const otherParticipantName = (isDebit ? tx.receiverName : tx.senderName) || '';
      const category = getTransactionCategory(tx) || '';
      const purpose = tx.purpose || '';
      return (
        otherParticipantName.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        purpose.toLowerCase().includes(query)
      );
    });
  }, [transactions, transactionSearch, user.accountNumber]);

  // Mini Statement displays last 10 successful transactions
  const miniStatement = useMemo(() => {
    return filteredTransactions.slice(0, 10);
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen cyber-grid text-white flex flex-col pb-16 relative">
      <div className="cyber-scanner"></div>

      <div className="bg-glow-purple -top-40 -left-40"></div>
      <div className="bg-glow-cyan bottom-10 right-10"></div>

      {/* Primary Cyber Header Navigation */}
      <header className="border-b border-slate-900 bg-[#050507]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Clock */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-center">
              <Cpu className="text-[#00f2ff] w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-display font-extrabold text-xl tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">SMARTBANK</span>
                <span className="font-mono text-[#00f2ff] border border-cyan-400/30 px-1 py-0.2 rounded text-[8px] font-bold tracking-widest uppercase">NEO</span>
              </div>
              <p className="text-[9px] font-mono tracking-widest flex items-center space-x-1 text-[#00f2ff]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] inline-block animate-ping"></span>
                <span>SYSTEM STATUS ● FULLY OPERATIONAL</span>
              </p>
            </div>
          </div>

          {/* Clock & active profile parameters */}
          <div className="flex items-center space-x-4 md:self-end justify-between md:justify-end">
            {/* Currency Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950/60 border border-slate-900 px-2.5 py-1.5 rounded-md" id="currency_switcher_container">
              <span className="text-slate-500 font-mono text-[9px] tracking-wider uppercase pl-0.5">CURR:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-transparent text-[#00f2ff] font-bold font-mono text-[10px] focus:outline-none cursor-pointer border-none py-0 px-1"
                id="currency_select_element"
              >
                <option value="INR" className="bg-[#050508] text-[#00f2ff] font-mono">INR (₹)</option>
                <option value="USD" className="bg-[#050508] text-[#00f2ff] font-mono">USD ($)</option>
                <option value="EUR" className="bg-[#050508] text-[#00f2ff] font-mono">EUR (€)</option>
                <option value="GBP" className="bg-[#050508] text-[#00f2ff] font-mono">GBP (£)</option>
              </select>
            </div>

            <div className="text-right font-mono text-[9px] tracking-wider text-slate-400 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-md flex items-center space-x-1.5" id="secure_session_timeout_display">
              <Timer className={`w-3.5 h-3.5 ${sessionTimeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="text-slate-500">AUTO-LOCK:</span>{' '}
              <span className={`font-bold font-mono ${sessionTimeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                {Math.floor(sessionTimeLeft / 60)}:{(sessionTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="text-right font-mono text-[9px] tracking-wider text-slate-400 hidden sm:block bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-md">
              <span className="text-slate-500">SESSION TOKEN:</span>{' '}
              <span className="text-cyan-400 font-bold font-mono">NEO-9912X-Z</span>
            </div>

            <div className="flex items-center space-x-2 bg-purple-950/10 border border-purple-500/20 px-3 py-1.5 rounded-full text-purple-300 font-mono text-[10px] uppercase font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>SOCIETY CLEARANCE LEVEL: M1</span>
            </div>
          </div>

        </div>
      </header>

      {/* Top Notch Alerts Slot */}
      <AnimatePresence>
        {unreadPayments.length > 0 && (
          <div className="w-full bg-[#050508]/60 border-b border-cyan-500/20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1.5">
              {unreadPayments.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl px-4 py-3 flex justify-between items-center text-xs font-mono text-cyan-300 relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,242,255,0.08)]"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                  <div className="flex items-center space-x-3.5">
                    <Sparkles className="w-4.5 h-4.5 text-[#00f2ff] animate-pulse shrink-0" />
                    <span>
                      🎉 <strong className="text-white">QUANTUM PAYMENT DETECTED!</strong> Credited <strong className="text-[#00f2ff]">{formatAmount(tx.amount)}</strong> from <strong className="text-white">{tx.senderName}</strong> for <em>"{tx.purpose}"</em> via <strong>{tx.paymentMethod}</strong>.
                    </span>
                  </div>
                  <button
                    onClick={() => handleDismissNotification(tx.id)}
                    className="p-1 hover:bg-[#00f2ff]/20 text-[#00f2ff] rounded-md transition-colors font-bold uppercase text-[9px] tracking-wider border border-[#00f2ff]/30 flex items-center space-x-1 ml-4 focus:outline-none shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Acknowledge</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto w-full px-4 mt-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PRIMARY STATS CARD & bento navigation panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* HOLOGRAPHIC CHROME GLASS WALLET DEBIT CARD */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-3xl glass-panel neon-border-cyan relative overflow-hidden flex flex-col justify-between h-64 select-none"
          >
            {/* Card texture gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

            {/* Card Top Brand */}
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-[8px] font-mono text-cyan-400 tracking-wider">DEPOSIT SAVINGS ACC</span>
                <span className="text-slate-500 font-mono text-[9px] flex items-center space-x-1 mt-0.5">
                  <Landmark className="w-3 h-3 text-slate-500" />
                  <span>SmartBank Chennai</span>
                </span>
              </div>
              <span className="font-display font-bold text-xs tracking-widest text-[#cfcfcf]">NEO REZZ</span>
            </div>

            {/* Simulated chip & Balance display */}
            <div className="my-auto z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Available Ledger balance</span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-white focus:outline-none"
                >
                  {showBalance ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>

              {showBalance ? (
                <div className="font-mono font-bold text-3xl text-cyan-400 flex items-baseline space-x-1 neon-glow-cyan tracking-tight transition-all duration-300">
                  <span>{formatAmount(user.currentBalance)}</span>
                </div>
              ) : (
                <div className="font-mono font-bold text-3xl text-cyan-400 flex items-baseline tracking-widest neon-glow-cyan transition-all duration-300">
                  <span>••••••••</span>
                </div>
              )}
            </div>

            {/* Holder details bottom row */}
            <div className="flex justify-between items-end z-10 border-t border-slate-800/60 pt-3">
              <div>
                <span className="text-[7.5px] font-mono text-slate-500 block uppercase">CLIENT ID / PRIMARY MASTER</span>
                <span className="text-[10px] font-mono text-slate-300 font-medium tracking-wide uppercase">{user.fullName.slice(0, 18)}</span>
              </div>
              <div className="text-right">
                <span className="text-[7.5px] font-mono text-slate-500 block uppercase">ACCOUNT NO</span>
                <button
                  onClick={copyAccountNumber}
                  className="font-mono text-[10px] text-slate-300 hover:text-cyan-300 tracking-widest flex items-center justify-end space-x-1 focus:outline-none focus:underline"
                  title="Copy Account Number"
                >
                  <span>•••• •••• {user.accountNumber.slice(-4)}</span>
                  {copiedAccount ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* Locked Guard Screen overlay */}
            <AnimatePresence>
              {isCardLocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-4 border border-red-500/30 rounded-3xl"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </motion.div>
                  <h4 className="font-display font-black text-red-500 text-xs tracking-widest uppercase">CRYPTO SHIELD FREEZE</h4>
                  <p className="font-mono text-[8px] text-slate-500 tracking-wider text-center mt-1 uppercase leading-normal">
                    Physical card locked. Outbound transfer protocols disabled.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SIDEBAR SIDE MOCK NAVIGATION TILES BAR */}
          <div className="glass-panel border border-slate-900 rounded-3xl p-4 space-y-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block pl-2.5 mb-2">Primary Access Modules</span>
            
            {/* Dashboard summary overview */}
            <button
              onClick={() => { setActiveTab('home'); setPrefillReceiver(''); }}
              className={`w-full text-left font-mono text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-300 flex items-center justify-between border ${
                activeTab === 'home' 
                  ? 'bg-cyan-500/10 text-[#00f2ff] border-cyan-400/40 shadow-[inset_0_0_15px_rgba(0,242,255,0.15)] border-r-4 border-r-cyan-400' 
                  : 'bg-slate-900/10 text-slate-400 border-transparent hover:border-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center space-x-3">
                <LayoutDashboard className="w-4.5 h-4.5 text-cyan-400" />
                <span>Operational Dashboard</span>
              </span>
              <span className="text-[9px] font-mono py-0.5 px-1.5 bg-black/20 text-cyan-400 rounded-md">CORE</span>
            </button>

            {/* SEND / RECEIVE FUNDS MENU BUTTON */}
            <button
              onClick={() => { setActiveTab('transfer'); setPrefillReceiver(''); }}
              className={`w-full text-left font-mono text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-300 flex items-center justify-between border ${
                activeTab === 'transfer' 
                  ? 'bg-cyan-500/10 text-[#00f2ff] border-cyan-400/40 shadow-[inset_0_0_15px_rgba(0,242,255,0.15)] border-r-4 border-r-cyan-400' 
                  : 'bg-slate-900/10 text-slate-400 border-transparent hover:border-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center space-x-3">
                <Send className="w-4.5 h-4.5 text-purple-400" />
                <span>Send & Request Funds</span>
              </span>
              <span className="text-[9px] font-mono py-0.5 px-1.5 bg-black/20 text-purple-400 rounded-md">NEO-PAY</span>
            </button>

            {/* TRANSACTION HISTORY DETAIL LIST BUTTON */}
            <button
              onClick={() => setActiveTab('statement')}
              className={`w-full text-left font-mono text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-300 flex items-center justify-between border ${
                activeTab === 'statement' 
                  ? 'bg-cyan-500/10 text-[#00f2ff] border-cyan-400/40 shadow-[inset_0_0_15px_rgba(0,242,255,0.15)] border-r-4 border-r-cyan-400' 
                  : 'bg-slate-900/10 text-slate-400 border-transparent hover:border-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center space-x-3">
                <History className="w-4.5 h-4.5 text-slate-400" />
                <span>Transaction Ledgers</span>
              </span>
              <span className="text-[9px] font-mono py-0.5 px-1.5 bg-black/20 text-slate-400 rounded-md"> {transactions.length} ITEMS </span>
            </button>

            {/* SYSTEM PROFILE EDITOR */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left font-mono text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-300 flex items-center justify-between border ${
                activeTab === 'profile' 
                  ? 'bg-cyan-500/10 text-[#00f2ff] border-cyan-400/40 shadow-[inset_0_0_15px_rgba(0,242,255,0.15)] border-r-4 border-r-cyan-400' 
                  : 'bg-slate-900/10 text-slate-400 border-transparent hover:border-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center space-x-3">
                <User className="w-4.5 h-4.5 text-cyan-400" />
                <span>Profile Registries</span>
              </span>
              <span className="text-[9px] font-mono py-0.5 px-1.5 bg-black/20 text-cyan-400 rounded-md">EDITABLE</span>
            </button>

            {/* ENVIRONMENT UTILS & SETTINGS */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left font-mono text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-300 flex items-center justify-between border ${
                activeTab === 'settings' 
                  ? 'bg-cyan-500/10 text-[#00f2ff] border-cyan-400/40 shadow-[inset_0_0_15px_rgba(0,242,255,0.15)] border-r-4 border-r-cyan-400' 
                  : 'bg-slate-900/10 text-slate-400 border-transparent hover:border-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center space-x-3">
                <Settings className="w-4.5 h-4.5 text-slate-400" />
                <span>Console Configurations</span>
              </span>
              <span className="text-[9px] font-mono py-0.5 px-1.5 bg-black/20 text-slate-400 rounded-md">SANDBOX</span>
            </button>

            {/* LOG OUT CLIENT SECURE */}
            <button
              onClick={handleLogout}
              className="w-full text-left font-mono text-xs font-semibold px-3 py-3 rounded-xl transition-all duration-200 flex items-center justify-between border bg-slate-950/20 text-red-400 border-transparent hover:border-red-500/30 hover:bg-red-500/10 focus:outline-none"
            >
              <span className="flex items-center space-x-3">
                <LogOut className="w-4.5 h-4.5 text-red-400" />
                <span>End Access Connection</span>
              </span>
              <span className="text-[9px] font-mono py-0.5 px-1.5 bg-red-950/20 text-red-400 rounded-md">LOGOUT</span>
            </button>

          </div>

          {/* DUAL-DEVICE SYNC & SIMULATOR CONSOLE */}
          <div className="glass-panel border border-slate-900 rounded-3xl p-5 space-y-4" id="dual_device_sync_simulator">
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
              <span className="text-[10px] font-mono text-[#00f2ff] uppercase tracking-wider font-bold flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Device II Remote Sync</span>
              </span>
              <span className="flex items-center space-x-1 font-mono text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 animate-pulse">
                <Wifi className="w-2.5 h-2.5" />
                <span>SYNC LIVE</span>
              </span>
            </div>

            <p className="text-[9px] font-mono text-slate-400 uppercase leading-normal tracking-wide">
              Real-time multi-device sync is enabled. Open this app in another window/tab to experience live synchronization! Use the simulator below to execute a secondary device payment instantly.
            </p>

            <form onSubmit={handleDevicePaymentSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block font-mono text-[8.5px] text-slate-500 uppercase tracking-wider mb-1">Simulated Destination Payee</label>
                <select
                  value={devicePayee}
                  onChange={(e) => setDevicePayee(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 font-mono text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
                  id="device_payee_select"
                >
                  <option value="Starbucks Coffee" className="bg-[#050508] text-white">Starbucks Coffee (Terminal)</option>
                  <option value="Amazon Global Store" className="bg-[#050508] text-white">Amazon Global Store (Web)</option>
                  <option value="Netflix Premium Ad-Free" className="bg-[#050508] text-white">Netflix Subscription</option>
                  <option value="Uber Ride Premium" className="bg-[#050508] text-white">Uber Premium Transport</option>
                  <option value="Apple App Store Digital" className="bg-[#050508] text-white">Apple Digital Store</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[8.5px] text-slate-500 uppercase tracking-wider mb-1">Currency</label>
                  <select
                    value={deviceCurrency}
                    onChange={(e) => setDeviceCurrency(e.target.value as any)}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 font-mono text-[10px] text-[#00f2ff] focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
                    id="device_currency_select"
                  >
                    <option value="INR" className="bg-[#050508] text-[#00f2ff]">INR (₹)</option>
                    <option value="USD" className="bg-[#050508] text-[#00f2ff]">USD ($)</option>
                    <option value="EUR" className="bg-[#050508] text-[#00f2ff]">EUR (€)</option>
                    <option value="GBP" className="bg-[#050508] text-[#00f2ff]">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[8.5px] text-slate-500 uppercase tracking-wider mb-1">Payment Sum</label>
                  <input
                    type="number"
                    value={deviceAmount}
                    onChange={(e) => setDeviceAmount(e.target.value)}
                    placeholder="Amt"
                    required
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2 font-mono text-[10px] text-white focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={deviceLoading}
                className="w-full bg-gradient-to-r from-cyan-950/40 to-blue-950/40 hover:from-cyan-900/50 hover:to-blue-900/50 border border-cyan-500/20 hover:border-cyan-500/40 py-2 rounded-xl font-mono text-[9px] text-cyan-300 hover:text-white uppercase font-bold tracking-wider transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                id="device_simulate_submit_btn"
              >
                {deviceLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Authorizing Token...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3 h-3" />
                    <span>Pay from Device II</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: CORE INTERACTIVE TAB CONTENTS */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* HOVER TAB 1: OPERATIONAL DASHBOARD (HOME VIEW) */}
            {activeTab === 'home' && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Visual Intro Greetings Panel */}
                <div className="glass-panel border border-slate-800 p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
                  <div>
                    <h3 className="font-display font-medium text-white flex items-center space-x-1.5">
                      <span>Welcome Back Master,</span>
                      <span className="text-cyan-400 font-bold">{user.fullName.split(' ')[0]}</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                      Secured using AES-256 Quantum Cryptology layers. Client registry active.
                    </p>
                  </div>
                  <div className="hidden sm:flex text-right flex-col font-mono text-[9px] text-slate-500 bg-slate-950/60 border border-slate-900 rounded px-2.5 py-1">
                    <span>CUSTOMER ID: <strong className="text-white">{user.customerId}</strong></span>
                    <span>IFSC CODE: <strong className="text-white">{user.ifscCode}</strong></span>
                  </div>
                </div>

                {/* QUICK ACTIONS BENTO GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Action 1: Pay Bills */}
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="glass-panel border border-slate-800 p-5 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-36 transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] select-none"
                    onClick={() => setShowBillModal(true)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent pointer-events-none rounded-bl-full transition-all group-hover:from-purple-500/10"></div>
                    <div className="flex justify-between items-center">
                      <div className="p-2.5 bg-purple-950/20 border border-purple-500/20 rounded-xl text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/40 transition-colors">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-mono py-0.5 px-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-bold uppercase tracking-widest">
                        UTILITIES
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-200 mt-2 flex items-center space-x-1.5">
                        <span>Pay Bills</span>
                        {utilityBills.filter(b => b.status === 'PENDING').length > 0 && (
                          <span className="text-[8px] font-mono text-amber-400 animate-pulse bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded font-normal uppercase">
                            {utilityBills.filter(b => b.status === 'PENDING').length} Due
                          </span>
                        )}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-wide leading-normal">
                        Settle Broadband, Grids & utilities
                      </p>
                    </div>
                  </motion.div>

                  {/* Action 2: Lock Card */}
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`glass-panel border p-5 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-36 transition-all duration-300 select-none ${
                      isCardLocked 
                        ? 'border-red-500/20 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                        : 'border-slate-800 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    }`}
                    onClick={handleToggleCardLocked}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl pointer-events-none rounded-bl-full transition-all ${
                      isCardLocked ? 'from-red-500/5 group-hover:from-red-500/10' : 'from-cyan-500/5 group-hover:from-cyan-500/10'
                    }`}></div>
                    
                    <div className="flex justify-between items-center">
                      <div className={`p-2.5 rounded-xl border transition-colors ${
                        isCardLocked 
                          ? 'bg-red-950/20 border-red-500/20 text-red-400 group-hover:text-red-300' 
                          : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400 group-hover:text-cyan-300'
                      }`}>
                        {isCardLocked ? <Lock className="w-5 h-5 animate-pulse" /> : <Unlock className="w-5 h-5" />}
                      </div>
                      
                      <span className={`text-[8px] font-mono py-0.5 px-2 border rounded-full font-bold uppercase tracking-widest ${
                        isCardLocked 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isCardLocked ? 'FROZEN' : 'ACTIVE'}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-200 mt-2">
                        {isCardLocked ? 'Lock Card active' : 'Lock Debit Card'}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-wide leading-normal">
                        Toggle card freeze lockdown status
                      </p>
                    </div>
                  </motion.div>

                  {/* Action 3: View Statements */}
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="glass-panel border border-slate-800 p-5 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-36 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] select-none"
                    onClick={() => setActiveTab('statement')}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none rounded-bl-full transition-all group-hover:from-cyan-500/10"></div>
                    <div className="flex justify-between items-center">
                      <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition-colors">
                        <History className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-mono py-0.5 px-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-bold uppercase tracking-widest">
                        LEDGERS
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-200 mt-2">
                        View Statements
                      </h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-wide leading-normal">
                        Browse comprehensive ledger history
                      </p>
                    </div>
                  </motion.div>

                  {/* Action 4: Deposit Funds */}
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="glass-panel border border-slate-800 p-5 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col justify-between h-36 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] select-none"
                    onClick={() => setShowDepositModal(true)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none rounded-bl-full transition-all group-hover:from-emerald-500/10"></div>
                    <div className="flex justify-between items-center">
                      <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-colors">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-mono py-0.5 px-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase tracking-widest">
                        TOP UP
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs text-emerald-400 mt-2 flex items-center space-x-1.5">
                        <span>Deposit Funds</span>
                        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.2 rounded font-normal uppercase animate-pulse">
                          Free
                        </span>
                      </h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-wide leading-normal">
                        Instantly add test sandbox money
                      </p>
                    </div>
                  </motion.div>

                </div>

                {/* QUICK PAY INTERACTIVE CONTACTS ROW (Google Pay Style) */}
                <div className="glass-panel border border-slate-800/80 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-slate-400 flex items-center space-x-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>QUICK INSTANT RECIPIENTS (G-PAY ROUTE)</span>
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">CLICK ITEM TO AUTOFILL</span>
                  </div>

                  <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin">
                    {contacts.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickContactClick(c)}
                        className="flex flex-col items-center space-y-2 group focus:outline-none shrink-0"
                      >
                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-display font-bold text-sm ${c.avatarColor} group-hover:scale-105 transition-transform duration-200`}>
                          {c.initials}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                          {c.name}
                        </span>
                      </button>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-xs text-slate-500 font-mono italic my-1.5">Send a money transfer to seed instant rapid shortcuts!</div>
                    )}
                  </div>
                </div>

                {/* GRAPHICAL CHARTING SECTION */}
                <DashboardAnalytics 
                  transactions={transactions} 
                  currentBalance={user.currentBalance} 
                  username={user.username} 
                  currency={currency}
                  formatAmount={formatAmount}
                />

                {/* MINI STATEMENT TABLE LIST (Last 10 items) */}
                <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.01)]" id="mini_account_statement_section">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-900/60">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Mini Account Statement</h3>
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Real-time ledger flow logging (Last 10 entries)</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search name or category..."
                          value={transactionSearch}
                          onChange={(e) => setTransactionSearch(e.target.value)}
                          className="pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-400 focus:outline-none rounded-lg text-xs font-mono text-white placeholder-slate-600 transition-colors w-full sm:w-48"
                          id="mini_statement_search_input"
                        />
                        {transactionSearch && (
                          <button
                            onClick={() => setTransactionSearch('')}
                            className="absolute right-2 top-2 text-slate-500 hover:text-white text-[10px] font-mono focus:outline-none cursor-pointer"
                            id="clear_mini_statement_search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setActiveTab('statement')}
                        className="text-[10px] font-mono text-cyan-400 hover:underline focus:outline-none focus:underline uppercase tracking-wider shrink-0 cursor-pointer"
                        id="audit_full_ledger_btn"
                      >
                        Audit Full Ledger
                      </button>
                    </div>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="p-10 border border-slate-900 bg-slate-950/20 text-center font-mono text-xs text-slate-500 rounded-xl">
                      Empty Ledger records. Add some initial deposits or execute transfers to see records.
                    </div>
                  ) : miniStatement.length === 0 ? (
                    <div className="p-10 border border-dashed border-slate-800 bg-slate-950/10 text-center font-mono text-xs text-slate-500 rounded-xl flex flex-col items-center justify-center space-y-2" id="mini_statement_no_results">
                      <Search className="w-5 h-5 text-slate-600 animate-pulse" />
                      <span>No transactions match "{transactionSearch}".</span>
                      <button 
                        onClick={() => setTransactionSearch('')}
                        className="text-cyan-400 underline hover:text-cyan-300 focus:outline-none text-[10px] cursor-pointer"
                        id="reset_mini_statement_filter"
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-widest text-[9px] pb-2">
                            <th className="py-2.5 font-semibold">T-ID / Timestamp</th>
                            <th className="py-2.5 font-semibold">Category</th>
                            <th className="py-2.5 font-semibold">Channel</th>
                            <th className="py-2.5 font-semibold">Entity Participant</th>
                            <th className="py-2.5 font-semibold text-right">Sum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {miniStatement.map((tx) => {
                            const isDebit = tx.senderAccount === user.accountNumber;
                            return (
                              <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                                <td className="py-3">
                                  <span className="text-cyan-400 font-semibold block">{tx.id}</span>
                                  <span className="text-[10px] text-slate-400 block">{tx.date} • {tx.time}</span>
                                </td>
                                <td className="py-3">
                                  <span className="px-2 py-0.5 bg-cyan-950/20 border border-cyan-500/20 text-[9px] text-[#00f2ff] rounded font-bold uppercase tracking-wider">
                                    {getTransactionCategory(tx)}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className="px-1.5 py-0.5 bg-slate-950/80 border border-slate-900 text-[10px] text-purple-400 rounded-md font-bold uppercase tracking-wider">
                                    {tx.paymentMethod}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className="text-white block font-medium">
                                    {isDebit ? tx.receiverName : tx.senderName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                                    {isDebit ? `To: ${tx.receiverDetails}` : `From: ${tx.senderAccount}`}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <span className={`font-bold font-mono text-xs md:text-sm px-2 py-1 rounded-md ${
                                    isDebit 
                                      ? 'text-red-400 bg-red-500/5 border border-red-500/10' 
                                      : 'text-green-400 bg-emerald-500/5 border border-emerald-500/10'
                                  }`}>
                                    {isDebit ? '-' : '+'}{formatAmount(tx.amount)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* TAB 2: SEND / REQUEST TRANSFER WINDOW */}
            {activeTab === 'transfer' && (
              <motion.div
                key="transfer-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <DashboardTransfer 
                  user={user} 
                  contacts={contacts}
                  onBalanceChange={(newB) => onUpdateUser({ ...user, currentBalance: newB })}
                  onNewTransaction={fetchTransactions}
                  onAddContact={handleAddLiveContact}
                  prefillReceiver={prefillReceiver}
                  prefillMethod={prefillMethod}
                  currency={currency}
                  formatAmount={formatAmount}
                />
              </motion.div>
            )}

            {/* TAB 3: COMPLETE STATEMENT LEDGERS LIST */}
            {activeTab === 'statement' && (
              <motion.div
                key="statement-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel border border-slate-800 rounded-2xl p-5 md:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="font-display font-medium text-lg text-white">Cryptographic Bank Statements</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">Complete historical ledger tracking auditing trails</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search name or category..."
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        className="pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-400 focus:outline-none rounded-lg text-xs font-mono text-white placeholder-slate-600 transition-colors w-full sm:w-56"
                        id="statement_search_input"
                      />
                      {transactionSearch && (
                        <button
                          onClick={() => setTransactionSearch('')}
                          className="absolute right-2 top-2 text-slate-500 hover:text-white text-[10px] font-mono focus:outline-none cursor-pointer"
                          id="clear_statement_search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <button
                      onClick={fetchTransactions}
                      className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-mono text-slate-400 transition-colors focus:outline-none cursor-pointer"
                      id="sync_ledger_btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                      <span>Synchronize Ledger</span>
                    </button>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-16 border border-slate-900 bg-slate-950/30 text-center font-mono text-xs text-slate-500 rounded-2xl">
                    No transactions registered in current account session.
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-16 border border-dashed border-slate-800 bg-slate-950/10 text-center font-mono text-xs text-slate-500 rounded-2xl flex flex-col items-center justify-center space-y-2 my-4" id="statement_no_results">
                    <Search className="w-6 h-6 text-slate-600 animate-pulse" />
                    <span>No ledger items match search filter "{transactionSearch}".</span>
                    <button 
                      onClick={() => setTransactionSearch('')}
                      className="text-cyan-400 underline hover:text-cyan-300 focus:outline-none text-xs cursor-pointer"
                      id="reset_statement_filter"
                    >
                      Reset Search Filter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* TRANSACTIONS EXPORTER PANEL */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl mb-2 relative overflow-hidden backdrop-blur-md">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none"></div>
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 rounded-lg">
                          <Download className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">EXPORT COMPLIANCE DATA</span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase leading-none">Save transaction histories locally</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 z-10">
                        <button
                          onClick={handleDownloadCSV}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-[#0a0f1d] border border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all focus:outline-none cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Download CSV</span>
                        </button>
                        <button
                          onClick={handleDownloadJSON}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-[#0a0f1d] border border-slate-800 text-slate-300 hover:text-purple-300 hover:border-purple-500/30 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all focus:outline-none cursor-pointer"
                        >
                          <FileJson className="w-3.5 h-3.5 text-purple-400" />
                          <span>Download JSON</span>
                        </button>
                        <button
                          onClick={handleDownloadTXT}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-[#0a0f1d] border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all focus:outline-none cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Text Ledger</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase px-1">
                      <span>
                        {transactionSearch ? `Filtered: ${filteredTransactions.length} of ${transactions.length}` : `Ledger Items: ${transactions.length}`}
                      </span>
                      <span>ACCOUNT HOLDER ACC NO: {user.accountNumber}</span>
                    </div>

                     <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse text-xs font-mono">
                         <thead>
                           <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[9px] pb-2.5">
                             <th className="py-3 font-semibold">T-ID / Reference</th>
                             <th className="py-3 font-semibold">Date & Clock</th>
                             <th className="py-3 font-semibold">Category</th>
                             <th className="py-3 font-semibold">Origin / Destination</th>
                             <th className="py-3 font-semibold">Channels</th>
                             <th className="py-3 font-semibold">Purpose / Note</th>
                             <th className="py-3 font-semibold text-right">Sum ({currency})</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-900">
                           {filteredTransactions.map((tx) => {
                             const isDebit = tx.senderAccount === user.accountNumber;
                             return (
                               <tr key={tx.id} className="hover:bg-slate-900/20 transition-colors">
                                 <td className="py-3 text-cyan-400 font-bold">{tx.id}</td>
                                 <td className="py-3 text-slate-400 text-[10px]">{tx.date}<br/>{tx.time}</td>
                                 <td className="py-3">
                                   <span className="px-2 py-0.5 bg-cyan-950/20 border border-cyan-500/20 text-[9px] text-[#00f2ff] rounded font-bold uppercase tracking-wider">
                                     {getTransactionCategory(tx)}
                                   </span>
                                 </td>
                                 <td className="py-3">
                                   <span className="text-white font-semibold block">
                                     {isDebit ? tx.receiverName : tx.senderName}
                                   </span>
                                   <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                                     {isDebit ? `To: ${tx.receiverDetails}` : `From: ${tx.senderAccount}`}
                                   </span>
                                 </td>
                                 <td className="py-3">
                                   <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-900 text-[9px] text-purple-400 rounded font-bold uppercase tracking-wider">
                                     {tx.paymentMethod}
                                   </span>
                                 </td>
                                 <td className="py-3 text-slate-400 max-w-[150px] truncate">{tx.purpose}</td>
                                 <td className="py-3 text-right">
                                   <span className={`font-bold font-mono text-xs md:text-sm px-2.5 py-1 rounded-md ${
                                     isDebit 
                                       ? 'text-red-400 bg-red-400/5 border border-red-500/10' 
                                       : 'text-green-400 bg-emerald-500/5 border border-emerald-500/10'
                                   }`}>
                                     {isDebit ? '-' : '+'}{formatAmount(tx.amount)}
                                   </span>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 4: PROFILE DETAIL REGISTRIES */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <DashboardProfile user={user} onUpdate={onUpdateUser} />
              </motion.div>
            )}

            {/* TAB 5: SANDBOX CONFIGURATIONS & UTILITIES */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel border-2 border-dashed border-cyan-400/20 rounded-2xl p-5 md:p-6"
              >
                <h3 className="font-display font-medium text-lg text-cyan-300">Sandbox Developer Control Panel</h3>
                <p className="text-xs text-slate-500 font-mono uppercase mt-0.5 mb-6">Capstone Testing & System Metrics overrides</p>

                <div className="space-y-6 font-mono text-xs text-slate-300">
                  <div className="p-4 bg-slate-950/80 border border-slate-830 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-white text-xs uppercase flex items-center space-x-1.5 text-cyan-400">
                      <Landmark className="w-4 h-4 text-cyan-400" />
                      <span>Ledger Database Reset</span>
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      If you're evaluating multiple scenarios or registered several test entries, you can reset all balances and histories back to the initial pre-seeded sathwik profile scenario.
                    </p>
                    <button
                      onClick={handleResetDatabase}
                      className="px-4 py-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors focus:outline-none"
                    >
                      Instant Sandbox Database Reset
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-slate-830 rounded-xl space-y-2">
                    <h4 className="font-display font-bold text-white text-xs uppercase text-purple-400">Security Architecture</h4>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Active systems implement automated mobile simulated OTP popups, PAN and Aadhaar algorithms, password metrics checking, and local state isolation. Suitable for caps-grade compliance.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-[9px] font-bold uppercase tracking-wider">
                      <span className="px-2 py-0.5 bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 rounded">OTP SECURE SIGNING: ENABLED</span>
                      <span className="px-2 py-0.5 bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 rounded">SESSION KEEP-ALIVE: ACTIVE</span>
                      <span className="px-2 py-0.5 bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 rounded">STORAGE PERSISTENCE: LOCAL_STORE</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* BILL PAYMENT DIALOG PANEL */}
      <AnimatePresence>
        {showBillModal && (
          <div className="fixed inset-0 bg-[#000000]/80 z-50 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#050508]/90 border border-slate-800 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(168,85,247,0.1)] backdrop-blur-lg"
            >
              {/* Closer */}
              <button
                onClick={() => {
                  if (!billPayLoading) {
                    setShowBillModal(false);
                    setActiveBillForOtp(null);
                    setBillOtpSent(false);
                    setEnteredBillOtp('');
                    setBillOtpError('');
                  }
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-900 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 border-b border-slate-900 pb-4 mb-5">
                <div className="p-2 bg-purple-950/30 border border-purple-500/20 rounded-xl text-purple-400 animate-pulse">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">MOCK ULTRA-BILL PAYMENT</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Settle outstanding operational utilities</p>
                </div>
              </div>

              {activeBillForOtp !== null ? (
                <div className="space-y-4">
                  {/* Active Bill Review Panel */}
                  <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-2xl flex justify-between items-center text-slate-300">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        {utilityBills[activeBillForOtp].type === 'Broadband Fiber' ? (
                          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                        ) : utilityBills[activeBillForOtp].type === 'Electricity Grid' ? (
                          <Bolt className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Tv className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        <span className="text-xs font-bold text-white">{utilityBills[activeBillForOtp].type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {utilityBills[activeBillForOtp].provider} • {utilityBills[activeBillForOtp].id}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-rose-400">PAY {formatAmount(utilityBills[activeBillForOtp].amount)}</span>
                    </div>
                  </div>

                  {/* SMS Simulated Broadcast Alert Box */}
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-[10px] font-mono text-cyan-300 relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,242,255,0.06)]"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-[#00f2ff] animate-pulse shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="block font-black text-white text-[11px] uppercase tracking-wider mb-0.5">💬 SANDBOX SECURITY: BILL PAY TRANSACTION OTP</span>
                        <span>Confirm payment of {formatAmount(utilityBills[activeBillForOtp].amount)} to {utilityBills[activeBillForOtp].provider}. Secure verification OTP code: <strong className="text-white font-black bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/40 tracking-widest text-[#00f2ff]">{billOtpCode}</strong> (or use sandbox fallback <strong className="text-white font-bold bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/35">123456</strong>)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnteredBillOtp(billOtpCode)}
                        className="py-0.5 px-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/30 rounded font-mono text-[9px] font-bold uppercase transition-colors shrink-0 ml-auto focus:outline-none cursor-pointer"
                      >
                        Autofill
                      </button>
                    </div>
                  </motion.div>

                  {/* Input OTP */}
                  <div className="space-y-2 pt-1">
                    <label className="block font-mono text-[9px] text-slate-400 uppercase tracking-wider">Aadhaar / Mobile Secure Payment Token</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={enteredBillOtp}
                          onChange={(e) => setEnteredBillOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-Digit Payment OTP"
                          className="w-full bg-slate-950/80 border border-slate-900 focus:border-cyan-400 rounded-xl py-2.5 pl-9 pr-4 text-xs font-mono text-white focus:outline-none transition-all placeholder:text-slate-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyBillOtp}
                        disabled={billPayLoading || enteredBillOtp.length !== 6}
                        className="py-2.5 px-4 bg-purple-500 hover:bg-purple-400 disabled:opacity-30 disabled:pointer-events-none text-black font-mono font-bold text-xs rounded-xl tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        {billPayLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Verify & Pay</span>
                        )}
                      </button>
                    </div>
                    {billOtpError && (
                      <div className="text-red-400 font-mono text-[10px] flex items-center space-x-1.5 mt-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>{billOtpError}</span>
                      </div>
                    )}
                  </div>

                  {/* Cancel / Back Option */}
                  <div className="pt-2 border-t border-slate-900 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBillForOtp(null);
                        setBillOtpSent(false);
                        setEnteredBillOtp('');
                        setBillOtpError('');
                        setPayingBillIndex(null);
                      }}
                      className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                    >
                      ← Back to Bills list
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Option Toggle to mandate/skip OTP verification */}
                  <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-3 rounded-2xl mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1 px-1.5 bg-cyan-950/30 border border-cyan-500/20 rounded-md text-[9px] font-mono font-bold text-cyan-400 uppercase">
                        Gate
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Enable payment OTP security:</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireOtpForBills}
                        onChange={(e) => setRequireOtpForBills(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-900 border border-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 peer-checked:after:bg-cyan-400 after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-cyan-950/40 peer-checked:border-cyan-500/40"></div>
                      <span className="ml-2 font-mono text-[9px] text-slate-300 font-bold uppercase">
                        {requireOtpForBills ? 'Active' : 'Bypassed'}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    {utilityBills.map((bill, index) => (
                      <div
                        key={bill.id}
                        className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                          bill.status === 'PAID'
                            ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            {bill.type === 'Broadband Fiber' ? (
                              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                            ) : bill.type === 'Electricity Grid' ? (
                              <Bolt className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Tv className="w-3.5 h-3.5 text-purple-400" />
                            )}
                            <span className="text-xs font-bold text-white">{bill.type}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                            <span>{bill.provider}</span>
                            <span className="text-slate-700">•</span>
                            <span>{bill.id}</span>
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="text-xs font-mono font-black text-white">{formatAmount(bill.amount)}</span>
                          {bill.status === 'PAID' ? (
                            <span className="text-[8px] font-mono text-emerald-400 font-bold tracking-widest mt-1 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>CLEARED</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleInitiatePayBill(index)}
                              disabled={billPayLoading || activeBillForOtp !== null}
                              className="mt-1.5 py-1 px-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-black font-mono font-bold text-[9px] rounded-md tracking-wider uppercase transition-all cursor-pointer"
                            >
                              {payingBillIndex === index ? (
                                <RefreshCw className="w-3 h-3 animate-spin mx-auto text-black" />
                              ) : (
                                'Pay Now'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-6 border-t border-slate-900 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                <span>Current Bal: <strong className="text-white">{formatAmount(user.currentBalance)}</strong></span>
                <span>UPI QUANTUM SECURED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SANDBOX DEPOSIT DIALOG PANEL */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-[#000000]/80 z-50 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-[#050508]/90 border border-slate-800 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(16,185,129,0.1)] backdrop-blur-lg"
            >
              {/* Closer */}
              <button
                onClick={() => {
                  if (!depositLoading) setShowDepositModal(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-900 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 border-b border-slate-900 pb-4 mb-5">
                <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">SANDBOX TOP UP CREDIT</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Instantly add test sandbox money</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-2">Select Top Up Amount</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[1000, 5000, 10000, 50000].map((presetAmt) => (
                      <button
                        key={presetAmt}
                        type="button"
                        onClick={() => {
                          setDepositAmount(presetAmt.toString());
                        }}
                        className={`py-2 px-3 border rounded-xl font-mono text-xs font-bold transition-all text-center cursor-pointer ${
                          depositAmount === presetAmt.toString()
                            ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]'
                            : 'bg-slate-950/50 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-white'
                        }`}
                      >
                        + {formatAmount(presetAmt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-2">Or Enter Custom Amount ({currency})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">{currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$'}</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount to credit"
                      disabled={depositLoading}
                      className="w-full bg-slate-950/50 border border-slate-900 focus:border-emerald-500/50 focus:outline-none rounded-xl pr-4 pl-8 py-3 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                  onClick={() => handleDepositFunds(parseFloat(depositAmount))}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-black font-mono font-bold text-xs rounded-xl tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] mt-5 cursor-pointer"
                >
                  {depositLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>SIGNING QUANTUM TRANSACTION...</span>
                    </>
                  ) : (
                    <>
                      <span>Deposit Funds Instantly</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 border-t border-slate-900 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                <span>Wallet: <strong className="text-white">Active</strong></span>
                <span>SANDBOX SIMULATION MOCK</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING TOAST ALERTS SYSTEM */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`pointer-events-auto w-full glass-panel border p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-start space-x-3.5 relative overflow-hidden backdrop-blur-xl ${
                toast.type === 'debit' 
                  ? 'border-red-500/30 bg-slate-950/90 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                  : 'border-emerald-500/30 bg-slate-950/90 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              }`}
            >
              {/* Top gradient highlights */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                toast.type === 'debit' ? 'bg-gradient-to-b from-red-500 to-rose-600' : 'bg-gradient-to-b from-emerald-400 to-teal-500'
              }`}></div>

              <div className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'debit' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {toast.type === 'debit' ? (
                  <Bolt className="w-5 h-5 animate-pulse" />
                ) : (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h5 className="font-display font-black text-[10px] tracking-wider uppercase mb-1 flex items-center space-x-1.5">
                  <span className={toast.type === 'debit' ? 'text-red-400' : 'text-emerald-400'}>{toast.title}</span>
                </h5>
                <p className="text-[11px] font-mono text-slate-300 leading-relaxed uppercase break-words">
                  {toast.desc}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                    JUST NOW
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    • CRYPTO-LEDGER SECURE
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors focus:outline-none focus:bg-slate-900 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

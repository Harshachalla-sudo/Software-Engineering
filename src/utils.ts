import { UserProfile, Transaction } from './types';

// Real-time validations
export const validateEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};

export const validateAadhaar = (aadhaar: string): boolean => {
  return /^\d{12}$/.test(aadhaar);
};

export const validatePAN = (pan: string): boolean => {
  return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan.toUpperCase());
};

export const validatePINCode = (pin: string): boolean => {
  return /^\d{6}$/.test(pin);
};

export interface PasswordStrength {
  score: number; // 0 to 4
  feedback: string;
  color: string;
}

export const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password) return { score: 0, feedback: 'Enter password', color: 'bg-red-500/20 text-red-400 border-red-500/30' };

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&#]/.test(password)) score += 1;

  // Since maximum is 5 criteria, scale score from 0-4
  const adjustedScore = Math.min(4, Math.floor(score * 0.8) + (score >= 4 ? 1 : 0));

  let feedback = 'Very Weak';
  let color = 'text-red-500 bg-red-500/10 border-red-500/20';

  if (adjustedScore === 1) {
    feedback = 'Weak (Needs numbers/symbols)';
    color = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
  } else if (adjustedScore === 2) {
    feedback = 'Moderate';
    color = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  } else if (adjustedScore === 3) {
    feedback = 'Strong';
    color = 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
  } else if (adjustedScore === 4) {
    feedback = 'Cyber Security Level';
    color = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  }

  return { score: adjustedScore, feedback, color };
};

// LocalStorage helpers
const USERS_KEY = 'smb_neo_users';
const TRANSACTIONS_KEY = 'smb_neo_transactions';
const CURRENT_USER_SESSION_KEY = 'smb_neo_session';

export const getUsers = (): UserProfile[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

export const saveUsers = (users: UserProfile[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getTransactions = (accountNumber: string): Transaction[] => {
  const txJson = localStorage.getItem(TRANSACTIONS_KEY);
  const allTx: Transaction[] = txJson ? JSON.parse(txJson) : [];
  const users = getUsers();
  const user = users.find(u => u.accountNumber === accountNumber);
  if (!user) {
    return allTx.filter(tx => tx.senderAccount === accountNumber || tx.receiverDetails === accountNumber);
  }
  return allTx.filter(tx => 
    tx.senderAccount === accountNumber || 
    tx.receiverDetails === accountNumber ||
    tx.receiverDetails.toLowerCase().trim() === user.username.toLowerCase().trim() ||
    tx.receiverDetails.trim() === user.mobile.trim()
  );
};

export const getAllTransactions = (): Transaction[] => {
  const txJson = localStorage.getItem(TRANSACTIONS_KEY);
  return txJson ? JSON.parse(txJson) : [];
};

export const addTransaction = (tx: Transaction) => {
  const txJson = localStorage.getItem(TRANSACTIONS_KEY);
  const allTx: Transaction[] = txJson ? JSON.parse(txJson) : [];
  allTx.unshift(tx); // Add to the top
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTx));
};

export const getCurrentSession = (): UserProfile | null => {
  const sessionJson = localStorage.getItem(CURRENT_USER_SESSION_KEY);
  if (!sessionJson) return null;
  // Get freshest user data from store
  const parsed = JSON.parse(sessionJson) as UserProfile;
  const users = getUsers();
  const fresh = users.find(u => u.customerId === parsed.customerId);
  return fresh || parsed;
};

export const startSession = (user: UserProfile) => {
  localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(user));
};

export const endSession = () => {
  localStorage.removeItem(CURRENT_USER_SESSION_KEY);
};

// Pre-seed Demo Data for Testing
export const seedDemoStore = () => {
  const users = getUsers();
  if (users.length === 0) {
    // Creating default seed user: sathwik / Password@123
    const demoUser: UserProfile = {
      fullName: 'Sathwik Kothamasu',
      dob: '2001-10-15',
      gender: 'Male',
      mobile: '9876543210',
      email: 'sathwikkothamasu@gmail.com',
      aadhaar: '123456789012',
      pan: 'ABCDE1234F',
      address: {
        houseNumber: 'A-404',
        street: 'Cyber Tower Boulevard',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pinCode: '600001'
      },
      username: 'sathwik',
      password: 'Password@123', // Matches strong criteria
      nominee: {
        name: 'K. Venkatesh',
        relationship: 'Father',
        mobile: '9988776655'
      },
      openingBalance: 50000,
      currentBalance: 50000,
      customerId: 'SB0001',
      accountNumber: '123456789012',
      ifscCode: 'SMBK00001',
      branch: 'SmartBank Chennai'
    };

    const usersList = [demoUser];
    saveUsers(usersList);

    // Seed default transactions
    const now = new Date();
    const formatTime = (offsetMinutes: number) => {
      const d = new Date(now.getTime() - offsetMinutes * 60000);
      return {
        date: d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    };

    const tx1 = formatTime(15);
    const tx2 = formatTime(120);
    const tx3 = formatTime(2880); // 2 days ago
    const tx4 = formatTime(7200); // 5 days ago

    const demoTransactions: Transaction[] = [
      {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: tx1.date,
        time: tx1.time,
        senderName: 'Sathwik Kothamasu',
        senderAccount: '123456789012',
        receiverName: 'Venkatesh',
        receiverDetails: '9988776655',
        paymentMethod: 'UPI',
        amount: 3500,
        purpose: 'Dinner & Tech Gear',
        status: 'SUCCESS'
      },
      {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: tx2.date,
        time: tx2.time,
        senderName: 'Harsha',
        senderAccount: '987654321011',
        receiverName: 'Sathwik Kothamasu',
        receiverDetails: '123456789012',
        paymentMethod: 'IMPS',
        amount: 15000,
        purpose: 'Project Reimbursement',
        status: 'SUCCESS'
      },
      {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: tx3.date,
        time: tx3.time,
        senderName: 'Sathwik Kothamasu',
        senderAccount: '123456789012',
        receiverName: 'Matrix Services',
        receiverDetails: 'matrix@upi',
        paymentMethod: 'RTGS',
        amount: 12000,
        purpose: 'Cyber Glass Display Unit',
        status: 'SUCCESS'
      },
      {
        id: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
        date: tx4.date,
        time: tx4.time,
        senderName: 'System Mint',
        senderAccount: '000000000000',
        receiverName: 'Sathwik Kothamasu',
        receiverDetails: '123456789012',
        paymentMethod: 'Bank Deposit',
        amount: 50000,
        purpose: 'Opening Deposit Seeding',
        status: 'SUCCESS'
      }
    ];

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(demoTransactions));
  }
};

export const getTransactionCategory = (tx: Transaction): string => {
  if (tx.category) return tx.category; // if already pre-filled
  
  const purpose = (tx.purpose || '').toLowerCase();
  const receiver = (tx.receiverName || '').toLowerCase();
  const method = (tx.paymentMethod || '').toLowerCase();
  
  if (purpose.includes('opening') || purpose.includes('seed') || purpose.includes('deposit') || method.includes('deposit')) {
    return 'Deposit';
  }
  if (purpose.includes('dinner') || purpose.includes('food') || purpose.includes('restaurant') || purpose.includes('lunch') || purpose.includes('cafe') || purpose.includes('meal')) {
    return 'Food & Dining';
  }
  if (purpose.includes('reimbursement') || purpose.includes('salary') || purpose.includes('work') || purpose.includes('project') || purpose.includes('consulting')) {
    return 'Professional/Business';
  }
  if (purpose.includes('glass') || purpose.includes('display') || purpose.includes('tech') || purpose.includes('gear') || purpose.includes('gadget') || purpose.includes('amazon') || purpose.includes('shopping')) {
    return 'Shopping & Tech';
  }
  if (purpose.includes('rent') || purpose.includes('house') || purpose.includes('electricity') || purpose.includes('bill') || purpose.includes('recharge')) {
    return 'Bills & Rent';
  }
  
  return 'General Transfer';
};


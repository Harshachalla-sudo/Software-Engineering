/**
 * Types and interfaces for SmartBank Neo
 */

export interface AddressDetails {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface NomineeDetails {
  name: string;
  relationship: string;
  mobile: string;
}

export interface UserProfile {
  fullName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  aadhaar: string;
  pan: string;
  address: AddressDetails;
  username: string;
  password?: string; // Stored securely in localStorage, optional in UI views
  nominee: NomineeDetails;
  openingBalance: number;
  customerId: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  currentBalance: number;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  senderName: string;
  senderAccount: string;
  receiverName: string;
  receiverDetails: string; // can be username, mobile, or account number
  paymentMethod: 'UPI' | 'IMPS' | 'NEFT' | 'RTGS' | 'Bank Deposit' | 'TAP_PAY';
  amount: number;
  purpose: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  category?: string;
}

export interface QuickContact {
  name: string;
  details: string;
  initials: string;
  avatarColor: string;
}

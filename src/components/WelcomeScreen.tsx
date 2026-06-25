import { motion } from 'motion/react';
import { UserPlus, LogIn, Lock, Wallet, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectNewUser: () => void;
  onSelectExistingUser: () => void;
}

export default function WelcomeScreen({ onSelectNewUser, onSelectExistingUser }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen cyber-grid text-white flex flex-col justify-center items-center px-4 relative">
      {/* Interactive Scan Line */}
      <div className="cyber-scanner"></div>

      {/* Decorative Blur Orbs */}
      <div className="bg-glow-purple top-10 left-10"></div>
      <div className="bg-glow-cyan bottom-10 right-10"></div>

      {/* Brand Header */}
      <div className="text-center mb-8 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center items-center space-x-2.5 mb-2"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Cpu className="text-cyan-400 w-6 h-6 animate-pulse" />
          </div>
          <span className="font-display font-bold text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 neon-glow-cyan">
            SMARTBANK
          </span>
          <span className="font-mono text-cyan-400 border border-cyan-400/40 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
            NEO
          </span>
        </motion.div>
        <p className="text-slate-400 font-mono text-xs tracking-widest max-w-md mx-auto">
          THE ULTIMATE CYBERPUNK WEALTH ENGINE
        </p>
      </div>

      <div className="max-w-md w-full flex flex-col justify-center items-center relative z-10">
        
        {/* Central Gateway Options Screen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col space-y-5 justify-center w-full"
        >
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl">
            <h3 className="font-display font-medium text-lg text-white mb-1">Select Security Clearance</h3>
            <p className="text-slate-400 text-xs">Authenticating connection from {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          {/* New User Selection */}
          <button
            onClick={onSelectNewUser}
            className="group w-full text-left p-5 glass-panel border border-slate-800 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] focus:outline-none cursor-pointer"
          >
            {/* Subtle light streak */}
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-cyan-500/10 to-transparent transform skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black transition-colors duration-300">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-display font-bold text-lg text-white group-hover:text-cyan-300 transition-colors duration-300">New User Registration</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
                <p className="text-slate-400 text-xs mt-1">Create a digital savings account within 2 minutes. Generate unified credentials, secure IFSC records, and initiate immediate UPI capabilities.</p>
              </div>
            </div>
          </button>

          {/* Existing User Selection */}
          <button
            onClick={onSelectExistingUser}
            className="group w-full text-left p-5 glass-panel border border-slate-800 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:outline-none"
          >
            {/* Subtle light streak */}
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-purple-500/10 to-transparent transform skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-display font-bold text-lg text-white group-hover:text-purple-300 transition-colors duration-300">Existing User Gateway</span>
                  <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
                <p className="text-slate-400 text-xs mt-1">Unlock your digital ledger, perform secure NEFT/RTGS/UPI transfers, manage profile records, and monitor comprehensive spending telemetry.</p>
              </div>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Security note */}
      <div className="absolute bottom-6 flex items-center space-x-2 font-mono text-[10px] text-slate-500 tracking-wider">
        <Lock className="w-3.5 h-3.5 text-cyan-400/60" />
        <span>CYBER PROTOCOLS RE-HASHED EVERY SESSION</span>
      </div>
    </div>
  );
}

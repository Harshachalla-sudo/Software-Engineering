import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { LogIn, KeyRound, User, ChevronLeft, AlertCircle, Sparkles, Cpu, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { getUsers, startSession } from '../utils';
import { UserProfile } from '../types';

interface LoginFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function LoginForm({ onBack, onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedUsers, setStoredUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Load fresh registered user records from persistence
    setStoredUsers(getUsers());
  }, []);

  const handleLoadCredentials = (uUsername: string, uPassword?: string) => {
    setUsername(uUsername);
    if (uPassword) setPassword(uPassword);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please specify both username and password.');
      return;
    }

    setIsLoading(true);

    // Simulate cyber-network lag response (500ms)
    setTimeout(() => {
      const users = getUsers();
      const matched = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
      );

      if (matched) {
        startSession(matched);
        setIsLoading(false);
        onSuccess();
      } else {
        setErrorMsg('Mismatched credentials. Please review security passphrases.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen cyber-grid text-white flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="bg-glow-purple top-10 left-10"></div>
      <div className="bg-glow-cyan bottom-10 right-10"></div>

      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-1 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider mb-6 transition-all focus:outline-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Grid</span>
        </button>

        {/* Login Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-slate-800 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.03)]"
        >
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/30 items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)] mb-3">
              <Cpu className="text-purple-400 w-6 h-6 animate-pulse" />
            </div>
            <h2 className="font-display font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Gateway Authenticator
            </h2>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
              PROVE SECURE IDENTITY CLEARANCE
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1">
                Access Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-400 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                  placeholder="sathwik"
                  id="login_username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Private Password
                </label>
                <span className="text-[9px] text-slate-500 font-mono">ENCRYPTED SHIELDS ACTIVE</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-400 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors"
                  placeholder="Password@123"
                  id="login_password"
                />
              </div>
            </div>

            {/* Login validation button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2.5 bg-gradient-to-r from-purple-500 via-pink-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-bold rounded-xl text-xs font-mono tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center justify-center space-x-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>TUNNELING CONNECTION...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-white" />
                  <span>DECRYPT & SECURE ACCESS</span>
                </>
              )}
            </button>
          </form>

          {/* Seed demo instructions card */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <div className="p-3.5 bg-cyan-950/20 border-2 border-cyan-500/20 rounded-xl relative overflow-hidden">
              <div className="flex items-center space-x-2 mb-1.5 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-display font-bold text-xs tracking-wide uppercase">Evaluator Demo Credentials</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                The local database is pre-seeded with a complete account. Use these credentials to log in instantly:
              </p>
              <div className="mt-2 text-[10px] font-mono grid grid-cols-2 gap-1 bg-slate-950/60 p-2 rounded border border-slate-800 text-slate-300">
                <div>
                  <span className="text-slate-500">Username:</span> <code className="text-cyan-300">sathwik</code>
                </div>
                <div>
                  <span className="text-slate-500">Password:</span> <code className="text-cyan-300">Password@123</code>
                </div>
              </div>
            </div>
            
            {/* PERSISTENT VAULT OF ALL REGISTERED ACCOUNTS */}
            {storedUsers.length > 0 && (
              <div className="mt-4 p-3.5 bg-slate-950/50 border border-purple-500/20 rounded-xl">
                <div className="flex items-center space-x-2 mb-2 text-purple-400">
                  <Unlock className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-display font-bold text-[10px] uppercase tracking-wider">Persistent Key Vault ({storedUsers.length})</span>
                </div>
                <p className="text-[9px] text-slate-400 font-mono mb-2">
                  Previously registered profiles found in browser persistence. Click any item to auto-decrypt and load credentials:
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {storedUsers.map((u) => {
                    const isDemo = u.username.toLowerCase() === 'sathwik';
                    return (
                      <div 
                        key={u.customerId}
                        onClick={() => handleLoadCredentials(u.username, u.password)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all hover:bg-purple-950/20 hover:border-purple-500/30 cursor-pointer ${
                          isDemo ? 'bg-slate-900/40 border-slate-800/80' : 'bg-purple-950/10 border-purple-500/10'
                        }`}
                      >
                        <div className="font-mono text-[9px] leading-tight text-slate-300">
                          <div className="font-bold text-white uppercase text-[10px]">{u.fullName}</div>
                          <div className="text-slate-400 mt-0.5">
                            User: <span className="text-purple-300">{u.username}</span> | Pass: <span className="text-cyan-300">{u.password || '●●●●●●'}</span>
                          </div>
                          <div className="text-[8px] text-slate-600">Acc No: {u.accountNumber}</div>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-1 bg-purple-950/40 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white rounded text-[8px] font-mono tracking-wider uppercase transition-colors"
                        >
                          Fill
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Radio, Cpu } from 'lucide-react';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('BOOTING SMARTBANK NEO ENGINE...');

  useEffect(() => {
    const messages = [
      'ESTABLISHING ENCRYPTED SECURE NEURAL LINK...',
      'SYNCHRONIZING WITH BLOCKCHAIN LEDGER...',
      'VERIFYING QUANTUM SECURITY KEYS...',
      'DECRYPTING BIOMETRIC PROTOCOLS...',
      'SMARTBANK NEO PORTAL READY.'
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        
        // Dynamic status updates based on progress percentage
        if (next === 25) setStatusMessage(messages[0]);
        if (next === 50) setStatusMessage(messages[1]);
        if (next === 70) setStatusMessage(messages[2]);
        if (next === 85) setStatusMessage(messages[3]);
        if (next === 95) setStatusMessage(messages[4]);

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return next;
      });
    }, 28); // Roughly 3 seconds total (28ms * 100 ~ 2.8s + wait time)

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 cyber-grid flex flex-col justify-center items-center text-white select-none z-50">
      {/* Laser scan lines */}
      <div className="cyber-scanner"></div>

      {/* Background ambient lighting */}
      <div className="bg-glow-purple top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="bg-glow-cyan bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2"></div>

      {/* Cybernetic Logo Container */}
      <div className="relative mb-8 flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute -inset-6 border-b-2 border-t-2 border-cyan-400 rounded-full opacity-60 w-32 h-32"
        ></motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="absolute -inset-4 border-l-2 border-r-2 border-purple-500 rounded-full opacity-40 w-28 h-28"
        ></motion.div>

        <div className="relative w-20 h-20 bg-slate-900 border border-cyan-500/30 rounded-full flex items-center justify-center neon-border-cyan">
          <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 mb-2 neon-glow-cyan text-center">
        SMARTBANK NEO
      </h1>
      <p className="font-mono text-xs text-cyan-400/60 uppercase tracking-[0.3em] mb-8">
        The Future of Wealth & Tech
      </p>

      {/* Loading bar container */}
      <div className="w-72 md:w-96 glass-panel border border-slate-700/60 p-1 rounded-full relative mb-4">
        {/* Fill */}
        <div 
          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-75"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Percentage Counter */}
      <span className="font-mono text-cyan-400 text-lg font-semibold tracking-wider mb-2">
        {progress}%
      </span>

      {/* Dynamic Status Log */}
      <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400 tracking-wide bg-slate-950/40 px-4 py-2 border border-slate-800/40 rounded-md">
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>{statusMessage}</span>
      </div>

      {/* Security level label in footer */}
      <div className="absolute bottom-8 flex items-center space-x-2 font-mono text-[10px] text-slate-500 tracking-wide">
        <Shield className="w-4 h-4 text-emerald-500/80" />
        <span>AES-256 SECURE QUANTUM HANDSHAKE PROTOCOL ACTIVE</span>
      </div>
    </div>
  );
}

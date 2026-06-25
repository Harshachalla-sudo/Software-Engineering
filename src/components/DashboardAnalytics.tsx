import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { BarChart3, TrendingUp, Activity, PieChart } from 'lucide-react';

interface DashboardAnalyticsProps {
  transactions: Transaction[];
  currentBalance: number;
  username?: string;
  currency?: 'USD' | 'EUR' | 'GBP' | 'INR';
  formatAmount?: (amount: number) => string;
}

export default function DashboardAnalytics({ 
  transactions, 
  currentBalance, 
  username,
  currency = 'INR',
  formatAmount
}: DashboardAnalyticsProps) {
  const [activeMetric, setActiveMetric] = useState<'spending' | 'deposits' | 'density'>('spending');

  const displayAmount = (amt: number) => {
    if (formatAmount) {
      return formatAmount(amt);
    }
    return `₹${amt.toLocaleString()}`;
  };

  // Memoized analytic calculations based on local transactions history
  const chartData = useMemo(() => {
    // Standard mock list for 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const isNewUser = !username || username.toLowerCase() !== 'sathwik';
    
    // Set spending and deposits to zero for new users so we don't display unrequested high spending mock numbers
    const spendingByMonth = isNewUser ? [0, 0, 0, 0, 0, 0] : [8000, 12500, 18200, 9300, 14200, 5000];
    const depositsByMonth = isNewUser ? [0, 0, 0, 0, 0, 0] : [15000, 20000, 25000, 18000, 30000, 22000];

    // Attempt to aggregate real user transactions from LocalStorage
    transactions.forEach((tx) => {
      // Find matches for some categories
      if (tx.status === 'SUCCESS') {
        const isDeposit = tx.paymentMethod === 'Bank Deposit' || tx.purpose.toLowerCase().includes('deposit') || tx.senderAccount === '000000000000';
        if (isDeposit) {
          // Add to deposits of latest month (June)
          depositsByMonth[5] += tx.amount;
        } else {
          // Add to spending
          spendingByMonth[5] += tx.amount;
        }
      }
    });

    // Limit extreme heights
    const maxSpending = Math.max(...spendingByMonth, 1000);
    const maxDeposits = Math.max(...depositsByMonth, 1000);

    return {
      months,
      spending: spendingByMonth,
      deposits: depositsByMonth,
      maxSpending,
      maxDeposits,
      totalCount: transactions.length
    };
  }, [transactions, username]);

  // UPI, IMPS, RTGS, NEFT, Bank Deposit counts
  const methodStats = useMemo(() => {
    const counts: { [key: string]: number } = { UPI: 0, IMPS: 0, NEFT: 0, RTGS: 0, 'Bank Deposit': 0 };
    transactions.forEach((tx) => {
      if (tx.status === 'SUCCESS' && counts[tx.paymentMethod] !== undefined) {
        counts[tx.paymentMethod] += 1;
      }
    });
    // Add base counts if empty and is demo user
    if (transactions.length === 0 && username?.toLowerCase() === 'sathwik') {
      counts.UPI = 3;
      counts.IMPS = 1;
      counts.NEFT = 2;
    }
    return counts;
  }, [transactions, username]);

  return (
    <div className="glass-panel border border-slate-800 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(6,182,212,0.01)]">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/60 pb-4 mb-6">
        <div>
          <h3 className="font-display font-medium text-lg text-white flex items-center space-x-2">
            <TrendingUp className="text-cyan-400 w-5 h-5 animate-pulse" />
            <span>Cybernetic Telemetry Analytics</span>
          </h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
            Real-time spending & deposits data grids
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex space-x-1 p-0.5 bg-slate-950/80 border border-slate-800 rounded-lg mt-3 md:mt-0 font-mono text-[9px] uppercase tracking-wider">
          <button
            onClick={() => setActiveMetric('spending')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors focus:outline-none ${
              activeMetric === 'spending' 
                ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spending
          </button>
          <button
            onClick={() => setActiveMetric('deposits')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors focus:outline-none ${
              activeMetric === 'deposits' 
                ? 'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setActiveMetric('density')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors focus:outline-none ${
              activeMetric === 'density' 
                ? 'bg-slate-800 text-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Protocol Share
          </button>
        </div>
      </div>

      {activeMetric === 'spending' && (
        <div>
          {/* Monthly Spending - SVG Bar Chart */}
          <div className="mb-4 flex justify-between items-center bg-slate-950/20 p-3 rounded-lg border border-slate-800/50">
            <span className="font-mono text-xs text-slate-400 flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>MONTHLY DEBIT SPENDING</span>
            </span>
            <span className="font-mono text-sm font-bold text-cyan-400">
              {displayAmount(chartData.spending.reduce((a, b) => a + b, 0))}
            </span>
          </div>

          <div className="relative h-48 w-full flex items-end justify-between px-4 pt-6 pb-2 bg-slate-950/40 border border-slate-900 rounded-xl overflow-hidden">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-20">
              <div className="border-b border-cyan-400 w-full"></div>
              <div className="border-b border-cyan-400 w-full"></div>
              <div className="border-b border-cyan-400 w-full"></div>
            </div>

            {chartData.spending.map((val, idx) => {
              const heightPercent = Math.max(10, Math.min(90, (val / chartData.maxSpending) * 80));
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-1 bg-slate-900 border border-cyan-400/40 text-cyan-300 font-mono text-[9px] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-opacity duration-200 pointer-events-none transform -translate-y-full">
                    {displayAmount(val)}
                  </div>
                  
                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-8 md:w-10 rounded-t bg-gradient-to-t from-blue-950/40 via-cyan-500/50 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:from-blue-900 group-hover:to-cyan-300 transition-all duration-300 relative border-l border-r border-t border-cyan-400/30"
                  >
                    {/* Glowing head of the bar */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-cyan-200 shadow-[0_0_8px_cyan]"></div>
                  </div>

                  {/* Label */}
                  <span className="font-mono text-[9px] text-slate-500 mt-2 tracking-wide uppercase">
                    {chartData.months[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeMetric === 'deposits' && (
        <div>
          {/* Monthly Spending - SVG Line Chart */}
          <div className="mb-4 flex justify-between items-center bg-slate-950/20 p-3 rounded-lg border border-slate-800/50">
            <span className="font-mono text-xs text-slate-400 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>TOTAL CREDIT INFLOW DEPOSITS</span>
            </span>
            <span className="font-mono text-sm font-bold text-purple-400">
              {displayAmount(chartData.deposits.reduce((a, b) => a + b, 0))}
            </span>
          </div>

          <div className="relative h-48 w-full p-2 bg-slate-950/40 border border-slate-900 rounded-xl overflow-hidden flex items-end">
            {/* SVG line path drawing */}
            <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="0.5" />

              {/* Shaded Area under path */}
              <path
                d={`M 0 100 
                  L 0 ${100 - (chartData.deposits[0] / chartData.maxDeposits) * 80} 
                  L 20 ${100 - (chartData.deposits[1] / chartData.maxDeposits) * 80} 
                  L 40 ${100 - (chartData.deposits[2] / chartData.maxDeposits) * 80} 
                  L 60 ${100 - (chartData.deposits[3] / chartData.maxDeposits) * 80} 
                  L 80 ${100 - (chartData.deposits[4] / chartData.maxDeposits) * 80} 
                  L 100 ${100 - (chartData.deposits[5] / chartData.maxDeposits) * 80} 
                  L 100 100 Z`}
                fill="url(#purpleGlowArea)"
                opacity="0.15"
              />

              {/* Path line */}
              <path
                d={`M 0 ${100 - (chartData.deposits[0] / chartData.maxDeposits) * 80} 
                  L 20 ${100 - (chartData.deposits[1] / chartData.maxDeposits) * 80} 
                  L 40 ${100 - (chartData.deposits[2] / chartData.maxDeposits) * 80} 
                  L 60 ${100 - (chartData.deposits[3] / chartData.maxDeposits) * 80} 
                  L 80 ${100 - (chartData.deposits[4] / chartData.maxDeposits) * 80} 
                  L 100 ${100 - (chartData.deposits[5] / chartData.maxDeposits) * 80}`}
                fill="none"
                stroke="url(#purpleLineGrad)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Gradients declaration */}
              <defs>
                <linearGradient id="purpleLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="purpleGlowArea" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Dynamic Dot points overlay */}
            <div className="absolute inset-x-0 bottom-4 top-4 flex justify-between px-4 z-10 pointer-events-none">
              {chartData.deposits.map((val, idx) => {
                const bottomPercent = (val / chartData.maxDeposits) * 80;
                return (
                  <div key={idx} className="relative flex flex-col justify-end items-center flex-1">
                    <div 
                      className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white absolute pointer-events-auto cursor-pointer"
                      style={{ bottom: `${bottomPercent}%`, marginBottom: '-6px' }}
                      title={displayAmount(val)}
                    >
                      <div className="absolute -inset-2 rounded-full border border-purple-400 bg-purple-500/30 animate-ping"></div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500 tracking-wide uppercase select-none">
                      {chartData.months[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeMetric === 'density' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Circular Protocol stats */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex justify-center items-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular gauge */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="55" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                <circle cx="72" cy="72" r="55" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray="345" strokeDashoffset="100" strokeLinecap="round" />
                <circle cx="72" cy="72" r="55" fill="none" stroke="#06b6d4" strokeWidth="8" strokeDasharray="345" strokeDashoffset="220" strokeLinecap="round" />
                <circle cx="72" cy="72" r="55" fill="none" stroke="#a855f7" strokeWidth="8" strokeDasharray="345" strokeDashoffset="310" strokeLinecap="round" />
              </svg>
              <div className="absolute text-center flex flex-col">
                <span className="font-mono text-2xl font-bold text-white">{chartData.totalCount}</span>
                <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">ledger item count</span>
              </div>
            </div>
          </div>

          {/* Protocols List details */}
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span><span>UPI Instant</span></span>
                <span className="text-cyan-400 font-bold">{methodStats.UPI} transactions</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${chartData.totalCount > 0 ? (methodStats.UPI / chartData.totalCount) * 100 : 50}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span>IMPS Instant Core</span></span>
                <span className="text-purple-400 font-bold">{methodStats.IMPS} transactions</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${chartData.totalCount > 0 ? (methodStats.IMPS / chartData.totalCount) * 100 : 25}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span><span>NEFT Standard Batch</span></span>
                <span className="text-green-500 font-bold">{methodStats.NEFT} transactions</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${chartData.totalCount > 0 ? (methodStats.NEFT / chartData.totalCount) * 100 : 25}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span>RTGS Corporate Core</span></span>
                <span className="text-indigo-400 font-bold">{methodStats.RTGS} transactions</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${chartData.totalCount > 0 ? (methodStats.RTGS / chartData.totalCount) * 100 : 0}%` }}></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

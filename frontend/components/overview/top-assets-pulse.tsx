 'use client';
 
 import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
 import type { BenchmarkHistoryMap } from '@/lib/types';
 import { DASHBOARD_BENCHMARK_TICKERS } from '@/lib/benchmark-tickers';
 
 const LABELS: Partial<Record<(typeof DASHBOARD_BENCHMARK_TICKERS)[number], string>> = {
   SPY: 'S&P 500',
   QQQ: 'Nasdaq 100',
   IWM: 'Russell 2000',
   EEM: 'Emerging Mkts',
   TLT: '20Y Treasuries',
   GLD: 'Gold',
   IBIT: 'Bitcoin',
 };
 
 function fmt(v: number | null | undefined): string {
   if (v == null || Number.isNaN(v)) return '—';
   return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
 }
 
 export default function TopAssetsPulse({ benchmarks }: { benchmarks: BenchmarkHistoryMap }) {
   const items = DASHBOARD_BENCHMARK_TICKERS.flatMap((t) => {
     const b = benchmarks[t];
     if (!b?.history?.length || b.history.length < 2) return [];
     return [{ ticker: t, history: b.history }];
   });
 
   if (items.length === 0) return null;
 
   return (
     <div className="glass-card px-5 py-5">
       <p className="text-[10px] text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
         <span className="inline-block w-1.5 h-1.5 rounded-full bg-fin-blue animate-pulse" />
         Top assets
       </p>
 
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
         {items.map(({ ticker, history }) => {
           const latest = history[history.length - 1]?.price ?? null;
           const prev = history[history.length - 2]?.price ?? null;
           const delta = latest != null && prev != null ? latest - prev : null;
           const pct = latest != null && prev != null && prev !== 0 ? ((latest / prev) - 1) * 100 : null;
           const up = delta != null && delta >= 0;
           const changeColor =
             delta == null ? 'text-text-muted' : up ? 'text-fin-green' : 'text-fin-red';
           const lineColor = delta == null ? '#60a5fa' : up ? '#10b981' : '#ef4444';
           const data = history.map((p) => ({ x: p.date, y: p.price }));
 
           return (
             <div key={ticker} className="min-w-0">
               <div className="flex items-baseline justify-between gap-2 mb-1">
                 <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider truncate">
                   {LABELS[ticker] ?? ticker}
                 </p>
                 <div className="flex items-baseline gap-1.5 shrink-0">
                   <span className="text-sm font-bold font-mono tabular-nums text-text-primary">
                     {fmt(latest)}
                   </span>
                   {pct != null && (
                     <span className={`text-[10px] font-mono tabular-nums ${changeColor}`}>
                       {pct > 0 ? '+' : ''}
                       {pct.toFixed(2)}%
                     </span>
                   )}
                 </div>
               </div>
 
               <div className="h-16 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                     <YAxis domain={['auto', 'auto']} hide width={0} />
                     <Line
                       type="monotone"
                       dataKey="y"
                       stroke={lineColor}
                       dot={false}
                       strokeWidth={1.5}
                       isAnimationActive={false}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             </div>
           );
         })}
       </div>
     </div>
   );
 }


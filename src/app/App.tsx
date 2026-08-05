import { useState, useEffect, useRef, useCallback } from "react";
import { RouterProvider, createBrowserRouter, Outlet, useNavigate, useLocation, useOutletContext, useParams, Link } from "react-router";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  TrendingUp, BarChart2, Target, Search, Activity,
  ChevronDown, ArrowRight, CheckCircle, Menu, X,
  DollarSign, Percent, BookOpen, Mail, MapPin, Phone,
  Layers, Settings, BarChart, Lightbulb, Shield, Users, Repeat,
  ChevronLeft, ChevronRight, AlertCircle, Loader, Send, Building,
  MessageSquare, Clock, Sparkles
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart as ReBarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend
} from "recharts";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoSrc from "@/imports/ChatGPT_Image_Jul_5__2026__08_55_18_PM.png";


// ─── Helpers ────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section ref={ref} id={id} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.section>
  );
}

// ─── Shared Tool UI Components ───────────────────────────────────────────────

function SemiGauge({ value, max = 100, color = "#6366f1" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const r = 52; const cx = 70; const cy = 65;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (a: number) => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) });
  const start = pt(180); const trackEnd = pt(360); const activeEnd = pt(180 + pct * 180);
  return (
    <svg viewBox="0 0 140 80" className="w-36 mx-auto">
      <path d={`M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 0 1 ${trackEnd.x.toFixed(1)} ${trackEnd.y.toFixed(1)}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
      {pct > 0.01 && <path d={`M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 0 1 ${activeEnd.x.toFixed(1)} ${activeEnd.y.toFixed(1)}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="17" fontWeight="600">{value % 1 === 0 ? Math.round(value) : value.toFixed(1)}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">/ {max}</text>
    </svg>
  );
}

function KPICard({ label, value, sub, color = "text-indigo-400" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-white/4 border border-white/6 p-4">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/35 mt-1">{sub}</p>}
    </div>
  );
}

function RecommendationBox({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-3">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Business Insights</p>
      {items.map((r, i) => (
        <div key={i} className="flex gap-3 text-sm text-white/60 leading-relaxed">
          <Lightbulb size={14} className="text-indigo-400 shrink-0 mt-0.5" />
          <p>{r}</p>
        </div>
      ))}
    </div>
  );
}

function ToolLoading({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      <p className="text-white/50 text-sm">{message}</p>
    </div>
  );
}

function DiscussButton({ toolName, summary }: { toolName: string; summary: string }) {
  const msg = encodeURIComponent(`Hi, I used the PY Growth ${toolName} and here are my results:\n\n${summary}\n\nI'd like to discuss what this means for my business.`);
  return (
    <a href={`https://wa.me/919709119012?text=${msg}`} target="_blank" rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30">
      Discuss These Results <ArrowRight size={16} />
    </a>
  );
}

function InputField({ label, value, onChange, min = 0, max, placeholder = "0", prefix }: {
  label: string; value: string; onChange: (v: string) => void;
  min?: number; max?: number; placeholder?: string; prefix?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">{label}</label>
      <div className="flex items-center rounded-xl border border-white/10 bg-white/4 focus-within:border-indigo-500/50 transition-colors">
        {prefix && <span className="pl-3 text-white/30 text-sm">{prefix}</span>}
        <input
          type="number" min={min} max={max} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20"
        />
      </div>
    </div>
  );
}

// ─── Tool Modal Wrapper ──────────────────────────────────────────────────────

function ToolModal({ tool, onClose }: { tool: { id: number; title: string }; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const components: Record<number, React.ReactNode> = {
    1: <ProfitCalc />,
    2: <DiscountCalc />,
    3: <ROASCalc />,
    4: <ReadinessAssess />,
    5: <RevenuePlanner />,
    6: <GrowthDiagnosis />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
        style={{ background: "rgba(4,6,16,0.85)", backdropFilter: "blur(8px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[24px] border border-white/8 bg-[#0a0f1e] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-white/6 shrink-0">
            <div>
              <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mb-0.5">Growth Tool</p>
              <h3 className="text-base font-semibold text-white">{tool.title}</h3>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 flex items-center justify-center transition-colors text-white/50 hover:text-white">
              <X size={16} />
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-7">
            {components[tool.id]}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Tool 1: Marketplace Profit Calculator ───────────────────────────────────

function ProfitCalc() {
  const [inputs, setInputs] = useState({ mrp: "1000", discount: "20", cogs: "350", commission: "18", shipping: "60", packaging: "20", returnRate: "5", returnCost: "150", adSpend: "80", gst: "12" });
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [results, setResults] = useState<any>(null);

  const set = (k: string) => (v: string) => setInputs(p => ({ ...p, [k]: v }));

  const analyze = () => {
    setPhase("loading");
    setTimeout(() => {
      const mrp = +inputs.mrp; const disc = +inputs.discount / 100;
      const cogs = +inputs.cogs; const commPct = +inputs.commission / 100;
      const ship = +inputs.shipping; const pack = +inputs.packaging;
      const retRate = +inputs.returnRate / 100; const retCost = +inputs.returnCost;
      const ad = +inputs.adSpend; const gstPct = +inputs.gst / 100;
      const sellingPrice = mrp * (1 - disc);
      const commission = sellingPrice * commPct;
      const gst = sellingPrice * gstPct;
      const expectedReturnCost = retRate * retCost;
      const totalCost = cogs + commission + ship + pack + ad + gst + expectedReturnCost;
      const netProfit = sellingPrice - totalCost;
      const margin = (netProfit / sellingPrice) * 100;
      setResults({ sellingPrice, commission, gst, expectedReturnCost, totalCost, netProfit, margin, cogs, ship, pack, ad });
      setPhase("result");
    }, 1100);
  };

  const getRecs = (r: any) => {
    const recs = [];
    if (r.margin < 10) recs.push("Your profit margin is critically low. Focus on reducing your highest cost component before running promotions.");
    else if (r.margin < 20) recs.push("Your margins are moderate. There is meaningful room to improve profitability through cost optimisation.");
    else recs.push("Your margin structure is healthy. Focus on scaling volume while maintaining cost discipline.");
    if (r.commission > r.sellingPrice * 0.22) recs.push("Marketplace commission is taking a large share of revenue. Review your product category and consider premium positioning to offset this.");
    if (r.ad > r.sellingPrice * 0.12) recs.push("Advertising spend as a percentage of selling price is high. Improve organic ranking to reduce dependence on paid traffic.");
    if (r.expectedReturnCost > 30) recs.push("Expected return costs are meaningful. Improving product descriptions and packaging quality can reduce return rates significantly.");
    return recs;
  };

  const getHealth = (m: number) => {
    if (m >= 30) return { label: "Excellent", color: "#34d399", gauge: "#34d399" };
    if (m >= 20) return { label: "Healthy", color: "#6366f1", gauge: "#6366f1" };
    if (m >= 10) return { label: "Moderate", color: "#f59e0b", gauge: "#f59e0b" };
    return { label: "Critical", color: "#ef4444", gauge: "#ef4444" };
  };

  const PIE_COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#34d399", "#ec4899", "#06b6d4", "#f97316"];

  if (phase === "loading") return <ToolLoading message="Calculating Marketplace Profitability..." />;

  if (phase === "result" && results) {
    const h = getHealth(results.margin);
    const pieData = [
      { name: "COGS", value: results.cogs },
      { name: "Commission", value: results.commission },
      { name: "Shipping", value: results.ship },
      { name: "Packaging", value: results.pack },
      { name: "Advertising", value: results.ad },
      { name: "GST", value: results.gst },
      { name: "Returns", value: results.expectedReturnCost },
    ].filter(d => d.value > 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Selling Price" value={`₹${results.sellingPrice.toFixed(0)}`} color="text-white" />
          <KPICard label="Total Cost" value={`₹${results.totalCost.toFixed(0)}`} color="text-amber-400" />
          <KPICard label="Net Profit" value={`₹${results.netProfit.toFixed(0)}`} color={results.netProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
          <KPICard label="Profit Margin" value={`${results.margin.toFixed(1)}%`} color={h.color.includes("34d") ? "text-emerald-400" : h.color.includes("6366") ? "text-indigo-400" : h.color.includes("f59") ? "text-amber-400" : "text-red-400"} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white/3 border border-white/6 p-5">
            <p className="text-xs text-white/40 mb-4">Margin Health</p>
            <SemiGauge value={Math.max(0, results.margin)} max={50} color={h.gauge} />
            <p className="text-center text-sm font-semibold mt-2" style={{ color: h.gauge }}>{h.label}</p>
          </div>
          <div className="rounded-xl bg-white/3 border border-white/6 p-5">
            <p className="text-xs text-white/40 mb-3">Cost Breakdown</p>
            <ResponsiveContainer width="100%" height={140}>
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${Number(v).toFixed(0)}`, ""]} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/40">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <RecommendationBox items={getRecs(results)} />
        <DiscussButton toolName="Marketplace Profit Calculator" summary={`Selling Price: ₹${results.sellingPrice.toFixed(0)}, Net Profit: ₹${results.netProfit.toFixed(0)}, Margin: ${results.margin.toFixed(1)}% (${h.label})`} />
        <button onClick={() => setPhase("input")} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">← Recalculate</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Enter your product economics to calculate true marketplace profitability.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Product MRP (₹)" value={inputs.mrp} onChange={set("mrp")} prefix="₹" />
        <InputField label="Average Selling Discount (%)" value={inputs.discount} onChange={set("discount")} prefix="%" />
        <InputField label="Production Cost / COGS (₹)" value={inputs.cogs} onChange={set("cogs")} prefix="₹" />
        <InputField label="Marketplace Commission (%)" value={inputs.commission} onChange={set("commission")} prefix="%" />
        <InputField label="Shipping Cost (₹)" value={inputs.shipping} onChange={set("shipping")} prefix="₹" />
        <InputField label="Packaging Cost (₹)" value={inputs.packaging} onChange={set("packaging")} prefix="₹" />
        <InputField label="Return Rate (%)" value={inputs.returnRate} onChange={set("returnRate")} prefix="%" />
        <InputField label="Return Cost per Order (₹)" value={inputs.returnCost} onChange={set("returnCost")} prefix="₹" />
        <InputField label="Advertising Spend per Order (₹)" value={inputs.adSpend} onChange={set("adSpend")} prefix="₹" />
        <InputField label="GST Rate (%)" value={inputs.gst} onChange={set("gst")} prefix="%" />
      </div>
      <button onClick={analyze} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
        Analyze Profitability <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Tool 2: Discount Impact Analyzer ────────────────────────────────────────

function DiscountCalc() {
  const [inputs, setInputs] = useState({ mrp: "1000", currentDiscount: "15", newDiscount: "30", cogs: "350", commission: "18", adPct: "8", shipping: "60", packaging: "20" });
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [results, setResults] = useState<any>(null);
  const set = (k: string) => (v: string) => setInputs(p => ({ ...p, [k]: v }));

  const calcProfit = (discPct: number) => {
    const sp = +inputs.mrp * (1 - discPct / 100);
    const comm = sp * (+inputs.commission / 100);
    const ad = sp * (+inputs.adPct / 100);
    const total = +inputs.cogs + comm + ad + +inputs.shipping + +inputs.packaging;
    return { sp, profit: sp - total, margin: ((sp - total) / sp) * 100 };
  };

  const analyze = () => {
    setPhase("loading");
    setTimeout(() => {
      const before = calcProfit(+inputs.currentDiscount);
      const after = calcProfit(+inputs.newDiscount);
      const profitLost = before.profit - after.profit;
      const requiredOrders = after.profit > 0 ? before.profit / after.profit : 0;
      setResults({ before, after, profitLost, requiredOrders });
      setPhase("result");
    }, 1100);
  };

  const getRecs = (r: any) => {
    const recs = [];
    if (r.after.profit <= 0) recs.push("At the proposed discount level, your business operates at a loss per order. This discount is not financially viable without significant volume increases.");
    else if (r.requiredOrders > 2.5) recs.push(`You need ${r.requiredOrders.toFixed(1)}x more orders to maintain the same profit. This level of volume growth from discounting alone is rarely sustainable.`);
    else recs.push("The discount impact is manageable if you can achieve the required order volume increase. Monitor margin carefully.");
    if (r.profitLost > 0) recs.push(`Each order loses ₹${r.profitLost.toFixed(0)} in profit compared to your current pricing. Calculate how many additional monthly orders you realistically expect.`);
    recs.push("Consider improving organic visibility and catalog quality as margin-neutral alternatives to discounting.");
    return recs;
  };

  if (phase === "loading") return <ToolLoading message="Analyzing Discount Impact on Profitability..." />;

  if (phase === "result" && results) {
    const barData = [
      { name: "Current", profit: +results.before.profit.toFixed(0), margin: +results.before.margin.toFixed(1) },
      { name: "After Discount", profit: +results.after.profit.toFixed(0), margin: +results.after.margin.toFixed(1) },
    ];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Current Profit/Order" value={`₹${results.before.profit.toFixed(0)}`} color="text-emerald-400" />
          <KPICard label="Post-Discount Profit" value={`₹${results.after.profit.toFixed(0)}`} color={results.after.profit >= 0 ? "text-indigo-400" : "text-red-400"} />
          <KPICard label="Profit Lost/Order" value={`₹${results.profitLost.toFixed(0)}`} color="text-amber-400" />
          <KPICard label="Required Orders Increase" value={results.after.profit > 0 ? `${results.requiredOrders.toFixed(1)}x` : "∞"} color="text-violet-400" sub="to maintain same profit" />
        </div>
        <div className="rounded-xl bg-white/3 border border-white/6 p-5">
          <p className="text-xs text-white/40 mb-4">Profit Comparison</p>
          <ResponsiveContainer width="100%" height={160}>
            <ReBarChart data={barData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: "#ffffff40", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="profit" radius={6}>
                <Cell fill="#6366f1" />
                <Cell fill={results.after.profit >= 0 ? "#8b5cf6" : "#ef4444"} />
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/3 border border-white/6 p-4">
            <p className="text-xs text-white/40 mb-1">Current Margin</p>
            <p className="text-xl font-semibold text-emerald-400">{results.before.margin.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl bg-white/3 border border-white/6 p-4">
            <p className="text-xs text-white/40 mb-1">Post-Discount Margin</p>
            <p className={`text-xl font-semibold ${results.after.margin >= 10 ? "text-amber-400" : "text-red-400"}`}>{results.after.margin.toFixed(1)}%</p>
          </div>
        </div>
        <RecommendationBox items={getRecs(results)} />
        <DiscussButton toolName="Discount Impact Analyzer" summary={`Current Profit: ₹${results.before.profit.toFixed(0)} (${results.before.margin.toFixed(1)}%), Post-Discount: ₹${results.after.profit.toFixed(0)} (${results.after.margin.toFixed(1)}%), Orders needed: ${results.requiredOrders.toFixed(1)}x`} />
        <button onClick={() => setPhase("input")} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">← Recalculate</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Compare profitability before and after a discount to understand the true business impact.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Product MRP (₹)" value={inputs.mrp} onChange={set("mrp")} prefix="₹" />
        <InputField label="Production Cost / COGS (₹)" value={inputs.cogs} onChange={set("cogs")} prefix="₹" />
        <InputField label="Current Discount (%)" value={inputs.currentDiscount} onChange={set("currentDiscount")} prefix="%" />
        <InputField label="New Proposed Discount (%)" value={inputs.newDiscount} onChange={set("newDiscount")} prefix="%" />
        <InputField label="Marketplace Commission (%)" value={inputs.commission} onChange={set("commission")} prefix="%" />
        <InputField label="Advertising as % of Revenue" value={inputs.adPct} onChange={set("adPct")} prefix="%" />
        <InputField label="Shipping Cost (₹)" value={inputs.shipping} onChange={set("shipping")} prefix="₹" />
        <InputField label="Packaging Cost (₹)" value={inputs.packaging} onChange={set("packaging")} prefix="₹" />
      </div>
      <button onClick={analyze} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
        Analyze Discount Impact <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Tool 3: ROAS Calculator ──────────────────────────────────────────────────

function ROASCalc() {
  const [inputs, setInputs] = useState({ spend: "15000", revenue: "60000", orders: "80", aov: "750", grossMargin: "35" });
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [results, setResults] = useState<any>(null);
  const set = (k: string) => (v: string) => setInputs(p => ({ ...p, [k]: v }));

  const analyze = () => {
    setPhase("loading");
    setTimeout(() => {
      const spend = +inputs.spend; const revenue = +inputs.revenue;
      const orders = +inputs.orders; const gm = +inputs.grossMargin / 100;
      const roas = revenue / spend;
      const cpa = spend / orders;
      const adCostPct = (spend / revenue) * 100;
      const grossProfit = revenue * gm;
      const netProfitAfterAds = grossProfit - spend;
      setResults({ roas, cpa, adCostPct, grossProfit, netProfitAfterAds });
      setPhase("result");
    }, 1100);
  };

  const getRating = (roas: number) => {
    if (roas >= 5) return { label: "Excellent", color: "#34d399" };
    if (roas >= 3) return { label: "Healthy", color: "#6366f1" };
    if (roas >= 2) return { label: "Moderate", color: "#f59e0b" };
    return { label: "Poor", color: "#ef4444" };
  };

  const getRecs = (r: any) => {
    const recs = [];
    if (r.roas < 2) recs.push("Your ROAS is below the break-even threshold for most categories. Pause or significantly restructure your campaigns before increasing spend.");
    else if (r.roas < 3) recs.push("Your ROAS is moderate. Focus on improving product listings, images, and reviews to increase conversion rates before scaling ad spend.");
    else recs.push("Your ROAS indicates healthy advertising performance. Focus on scaling winning campaigns and improving overall account health.");
    if (r.netProfitAfterAds < 0) recs.push("Advertising is currently consuming more than your gross profit. Gross margin improvement or ad efficiency optimisation is essential.");
    if (r.cpa > +inputs.aov * 0.3) recs.push(`Your cost per acquisition (₹${r.cpa.toFixed(0)}) is high relative to order value. Improve audience targeting and ad creative quality.`);
    return recs;
  };

  if (phase === "loading") return <ToolLoading message="Evaluating Advertising Performance..." />;

  if (phase === "result" && results) {
    const rating = getRating(results.roas);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KPICard label="ROAS" value={`${results.roas.toFixed(2)}x`} color="text-indigo-400" sub={rating.label} />
          <KPICard label="Cost per Acquisition" value={`₹${results.cpa.toFixed(0)}`} color="text-amber-400" />
          <KPICard label="Ad Cost %" value={`${results.adCostPct.toFixed(1)}%`} color="text-violet-400" sub="of revenue" />
          <KPICard label="Gross Profit" value={`₹${results.grossProfit.toFixed(0)}`} color="text-white" />
          <KPICard label="Profit After Ads" value={`₹${results.netProfitAfterAds.toFixed(0)}`} color={results.netProfitAfterAds >= 0 ? "text-emerald-400" : "text-red-400"} />
        </div>
        <div className="rounded-xl bg-white/3 border border-white/6 p-5 flex flex-col items-center">
          <p className="text-xs text-white/40 mb-3">ROAS Performance</p>
          <SemiGauge value={Math.min(results.roas, 8)} max={8} color={rating.color} />
          <p className="text-sm font-semibold mt-1" style={{ color: rating.color }}>{rating.label} ROAS</p>
          <p className="text-xs text-white/30 mt-1">Target: 4×+ for healthy profitability</p>
        </div>
        <RecommendationBox items={getRecs(results)} />
        <DiscussButton toolName="ROAS Calculator" summary={`ROAS: ${results.roas.toFixed(2)}x (${rating.label}), CPA: ₹${results.cpa.toFixed(0)}, Profit After Ads: ₹${results.netProfitAfterAds.toFixed(0)}`} />
        <button onClick={() => setPhase("input")} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">← Recalculate</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Calculate your true advertising efficiency and profitability after ad costs.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Advertising Spend (₹)" value={inputs.spend} onChange={set("spend")} prefix="₹" />
        <InputField label="Revenue Generated (₹)" value={inputs.revenue} onChange={set("revenue")} prefix="₹" />
        <InputField label="Number of Orders" value={inputs.orders} onChange={set("orders")} />
        <InputField label="Average Order Value (₹)" value={inputs.aov} onChange={set("aov")} prefix="₹" />
        <InputField label="Gross Margin (%)" value={inputs.grossMargin} onChange={set("grossMargin")} prefix="%" />
      </div>
      <button onClick={analyze} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
        Evaluate Advertising Performance <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Tool 4: Marketplace Readiness Assessment ────────────────────────────────

const READINESS_QUESTIONS = [
  { cat: "Business Foundation", q: "How clearly defined is your target customer segment?" },
  { cat: "Business Foundation", q: "How well-documented are your business processes?" },
  { cat: "Business Foundation", q: "How clearly defined are your growth objectives for the next 12 months?" },
  { cat: "Business Foundation", q: "How mature is your financial tracking and reporting?" },
  { cat: "Catalog Quality", q: "How optimized are your product titles for marketplace search?" },
  { cat: "Catalog Quality", q: "How comprehensive and benefit-focused are your product descriptions?" },
  { cat: "Catalog Quality", q: "How professional is your product photography?" },
  { cat: "Catalog Quality", q: "How complete is your product attribute and specification data?" },
  { cat: "Pricing", q: "How structured and strategic is your pricing approach?" },
  { cat: "Pricing", q: "How regularly do you monitor and respond to competitor pricing?" },
  { cat: "Pricing", q: "How clearly do you track the relationship between pricing and margin?" },
  { cat: "Inventory", q: "How accurately do you forecast inventory requirements by SKU?" },
  { cat: "Inventory", q: "How well do you manage stockout situations?" },
  { cat: "Inventory", q: "How efficiently do you handle slow-moving or dead inventory?" },
  { cat: "Inventory", q: "How organized is your supplier relationship management?" },
  { cat: "Advertising", q: "How strategic is your advertising campaign structure?" },
  { cat: "Advertising", q: "How regularly do you review and optimize active campaigns?" },
  { cat: "Advertising", q: "How clearly do you track advertising ROI beyond ROAS?" },
  { cat: "Advertising", q: "How well-distributed is your advertising budget across campaigns?" },
  { cat: "Operations", q: "How efficient and reliable is your order fulfillment process?" },
  { cat: "Operations", q: "How systematically do you manage returns and refunds?" },
  { cat: "Operations", q: "How proactively do you handle customer queries and complaints?" },
  { cat: "Brand Identity", q: "How consistent is your brand presentation across all marketplace listings?" },
  { cat: "Brand Identity", q: "How clearly differentiated is your brand from direct competitors?" },
  { cat: "Brand Identity", q: "How compelling and consistent is your brand story?" },
  { cat: "Customer Experience", q: "How high is your average customer satisfaction rating?" },
  { cat: "Customer Experience", q: "How proactively do you collect and respond to customer reviews?" },
  { cat: "Customer Experience", q: "How effectively do you resolve negative feedback?" },
  { cat: "Customer Experience", q: "How structured are your repeat purchase and retention strategies?" },
  { cat: "Analytics", q: "How regularly do you analyze marketplace performance data?" },
  { cat: "Analytics", q: "How clearly defined are your key business metrics and targets?" },
  { cat: "Analytics", q: "How data-driven are your primary business decisions?" },
  { cat: "Compliance", q: "How consistently do you maintain marketplace policy compliance?" },
  { cat: "Compliance", q: "How current is your knowledge of marketplace algorithm and policy changes?" },
  { cat: "Compliance", q: "How systematically do you monitor your account health metrics?" },
];

const OPTIONS = [
  { label: "Not Started", score: 0 },
  { label: "Basic", score: 2 },
  { label: "Developing", score: 3 },
  { label: "Advanced", score: 5 },
];

const CATEGORIES = ["Business Foundation", "Catalog Quality", "Pricing", "Inventory", "Advertising", "Operations", "Brand Identity", "Customer Experience", "Analytics", "Compliance"];

function ReadinessAssess() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [results, setResults] = useState<any>(null);

  const answered = Object.keys(answers).length;
  const total = READINESS_QUESTIONS.length;

  const analyze = () => {
    setPhase("loading");
    setTimeout(() => {
      const catScores: Record<string, { obtained: number; max: number }> = {};
      CATEGORIES.forEach(c => { catScores[c] = { obtained: 0, max: 0 }; });
      READINESS_QUESTIONS.forEach((q, i) => {
        const score = answers[i] ?? 0;
        catScores[q.cat].obtained += score;
        catScores[q.cat].max += 5;
      });
      const totalObtained = Object.values(catScores).reduce((s, c) => s + c.obtained, 0);
      const totalMax = Object.values(catScores).reduce((s, c) => s + c.max, 0);
      const overallScore = Math.round((totalObtained / totalMax) * 100);
      const catPcts = Object.entries(catScores).map(([name, v]) => ({ name, pct: Math.round((v.obtained / v.max) * 100), obtained: v.obtained, max: v.max }));
      const sorted = [...catPcts].sort((a, b) => b.pct - a.pct);
      setResults({ overallScore, catPcts, strengths: sorted.slice(0, 3), weaknesses: sorted.reverse().slice(0, 3) });
      setPhase("result");
    }, 1200);
  };

  const getGrade = (s: number) => {
    if (s >= 90) return { grade: "Marketplace Leader", color: "#34d399" };
    if (s >= 75) return { grade: "Ready to Scale", color: "#6366f1" };
    if (s >= 60) return { grade: "Needs Optimisation", color: "#f59e0b" };
    return { grade: "Foundation Required", color: "#ef4444" };
  };

  if (phase === "loading") return <ToolLoading message="Evaluating Business Health..." />;

  if (phase === "result" && results) {
    const g = getGrade(results.overallScore);
    const radarData = results.catPcts.map((c: any) => ({ subject: c.name.split(" ")[0], A: c.pct, fullMark: 100 }));
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white/3 border border-white/6 p-5 flex flex-col items-center">
            <p className="text-xs text-white/40 mb-3">Overall Readiness Score</p>
            <SemiGauge value={results.overallScore} max={100} color={g.color} />
            <p className="text-sm font-semibold mt-2" style={{ color: g.color }}>{g.grade}</p>
          </div>
          <div className="rounded-xl bg-white/3 border border-white/6 p-5">
            <p className="text-xs text-white/40 mb-3">Category Breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={55}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff40", fontSize: 9 }} />
                <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-3">Strengths</p>
            {results.strengths.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/60">{c.name}</span>
                <span className="text-xs font-semibold text-emerald-400">{c.pct}%</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
            <p className="text-xs font-semibold text-amber-400 mb-3">Priority Improvements</p>
            {results.weaknesses.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/60">{c.name}</span>
                <span className="text-xs font-semibold text-amber-400">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <RecommendationBox items={[
          `Your overall readiness score of ${results.overallScore}/100 indicates ${g.grade} status. Prioritise improvements in your lowest-scoring categories first.`,
          `Focus on ${results.weaknesses[0]?.name} as your primary improvement area — structured progress here will have the highest impact on your overall marketplace performance.`,
          "Reassess your readiness score every 90 days to track systematic improvement across all business dimensions.",
        ]} />
        <DiscussButton toolName="Marketplace Readiness Assessment" summary={`Overall Score: ${results.overallScore}/100 — ${g.grade}. Top strengths: ${results.strengths.map((c: any) => c.name).join(", ")}`} />
        <button onClick={() => setPhase("input")} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">← Reassess</button>
      </div>
    );
  }

  // Group questions by category for display
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    questions: READINESS_QUESTIONS.map((q, i) => ({ ...q, i })).filter(q => q.cat === cat),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">Rate your business across 10 dimensions to receive a personalised readiness report.</p>
        <span className="text-xs text-indigo-400 font-semibold shrink-0">{answered}/{total} answered</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/6">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${(answered / total) * 100}%` }} />
      </div>
      <div className="space-y-8">
        {byCategory.map(({ cat, questions }) => (
          <div key={cat}>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">{cat}</p>
            <div className="space-y-5">
              {questions.map(({ q, i }) => (
                <div key={i}>
                  <p className="text-sm text-white/70 mb-2.5">{q}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {OPTIONS.map(opt => (
                      <button
                        key={opt.score}
                        onClick={() => setAnswers(p => ({ ...p, [i]: opt.score }))}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all duration-150 ${
                          answers[i] === opt.score
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-white/3 border-white/8 text-white/50 hover:border-indigo-500/40 hover:text-white/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={analyze}
        disabled={answered < total}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        {answered < total ? `Answer ${total - answered} more question${total - answered > 1 ? "s" : ""} to continue` : <>Generate Readiness Report <ArrowRight size={16} /></>}
      </button>
    </div>
  );
}

// ─── Tool 5: Revenue Projection Planner ──────────────────────────────────────

function RevenuePlanner() {
  const [inputs, setInputs] = useState({ visitors: "10000", currentCvr: "1.5", targetCvr: "2.5", aov: "850", repeatRate: "15", growthPct: "5", period: "12" });
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [results, setResults] = useState<any>(null);
  const set = (k: string) => (v: string) => setInputs(p => ({ ...p, [k]: v }));

  const analyze = () => {
    setPhase("loading");
    setTimeout(() => {
      const months = +inputs.period;
      const growth = +inputs.growthPct / 100;
      const aov = +inputs.aov;
      const repeat = +inputs.repeatRate / 100;
      let visitors = +inputs.visitors;
      const currentMonthly = visitors * (+inputs.currentCvr / 100) * aov;
      const projections = Array.from({ length: months }, (_, m) => {
        const v = visitors * Math.pow(1 + growth, m);
        const orders = v * (+inputs.targetCvr / 100);
        const revenue = orders * aov * (1 + repeat);
        return { month: `M${m + 1}`, revenue: Math.round(revenue), orders: Math.round(orders) };
      });
      const finalRevenue = projections[projections.length - 1].revenue;
      const totalRevenue = projections.reduce((s, p) => s + p.revenue, 0);
      const additionalOrders = projections[projections.length - 1].orders;
      const growth_pct = ((finalRevenue - currentMonthly) / currentMonthly) * 100;
      setResults({ projections, finalRevenue, totalRevenue, additionalOrders, currentMonthly, growth_pct });
      setPhase("result");
    }, 1100);
  };

  if (phase === "loading") return <ToolLoading message="Generating Revenue Projections..." />;

  if (phase === "result" && results) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Projected Monthly Revenue" value={`₹${(results.finalRevenue / 1000).toFixed(0)}K`} color="text-emerald-400" sub={`Month ${inputs.period}`} />
          <KPICard label="Revenue Increase" value={`+${results.growth_pct.toFixed(0)}%`} color="text-indigo-400" />
          <KPICard label="Projected Monthly Orders" value={results.additionalOrders.toLocaleString()} color="text-violet-400" />
          <KPICard label="Total Projected Revenue" value={`₹${(results.totalRevenue / 100000).toFixed(1)}L`} color="text-amber-400" sub={`over ${inputs.period} months`} />
        </div>
        <div className="rounded-xl bg-white/3 border border-white/6 p-5">
          <p className="text-xs text-white/40 mb-4">Revenue Projection — {inputs.period} Months</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={results.projections}>
              <defs>
                <linearGradient id="revLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(+inputs.period / 6)} />
              <YAxis tick={{ fill: "#ffffff25", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-400 font-semibold mb-1">Important Disclaimer</p>
          <p className="text-xs text-white/45 leading-relaxed">These projections are estimates based on your stated assumptions and should not be interpreted as guaranteed business outcomes. Actual results will vary based on marketplace conditions, competition, and execution quality.</p>
        </div>
        <RecommendationBox items={[
          `Improving your conversion rate from ${inputs.currentCvr}% to ${inputs.targetCvr}% is the single highest-impact lever in this projection. Focus on catalog quality, reviews, and pricing before increasing traffic.`,
          "Month-on-month growth of " + inputs.growthPct + "% requires consistent investment in both organic and paid visibility. Ensure your operations and inventory can scale proportionally.",
          "Monitor actual vs projected revenue monthly. If actuals lag projections by more than 20%, diagnose the primary cause before adjusting strategy.",
        ]} />
        <DiscussButton toolName="Revenue Projection Planner" summary={`Current Monthly Revenue: ₹${(results.currentMonthly / 1000).toFixed(0)}K → Projected: ₹${(results.finalRevenue / 1000).toFixed(0)}K (+${results.growth_pct.toFixed(0)}%) over ${inputs.period} months`} />
        <button onClick={() => setPhase("input")} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">← Recalculate</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Model revenue growth scenarios based on traffic, conversion, and order value improvements.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Monthly Visitors" value={inputs.visitors} onChange={set("visitors")} />
        <InputField label="Current Conversion Rate (%)" value={inputs.currentCvr} onChange={set("currentCvr")} prefix="%" />
        <InputField label="Target Conversion Rate (%)" value={inputs.targetCvr} onChange={set("targetCvr")} prefix="%" />
        <InputField label="Average Order Value (₹)" value={inputs.aov} onChange={set("aov")} prefix="₹" />
        <InputField label="Repeat Purchase Rate (%)" value={inputs.repeatRate} onChange={set("repeatRate")} prefix="%" />
        <InputField label="Monthly Traffic Growth (%)" value={inputs.growthPct} onChange={set("growthPct")} prefix="%" />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-2">Projection Period</label>
        <div className="flex gap-3">
          {["3", "6", "12"].map(p => (
            <button key={p} onClick={() => set("period")(p)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${inputs.period === p ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/3 border-white/8 text-white/50 hover:border-indigo-500/40"}`}>
              {p} Months
            </button>
          ))}
        </div>
      </div>
      <button onClick={analyze} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
        Generate Revenue Projection <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Tool 6: Growth Diagnosis ─────────────────────────────────────────────────

const DIAGNOSIS_QUESTIONS = [
  { q: "Which marketplaces are you currently active on?", opts: ["Amazon only", "Amazon + Flipkart", "3–4 platforms", "5+ platforms"], scores: { "Marketplace Expansion": [1, 2, 3, 5] } },
  { q: "What is your current monthly revenue range?", opts: ["Below ₹1L", "₹1L – ₹5L", "₹5L – ₹20L", "Above ₹20L"], scores: { "Business Systems": [0, 1, 3, 5] } },
  { q: "What is your biggest business challenge right now?", opts: ["Getting discovered", "Low profitability", "Poor ad performance", "Scaling operations"], scores: { "Marketplace Visibility": [5, 0, 0, 0], "Profitability": [0, 5, 0, 0], "Advertising Performance": [0, 0, 5, 0], "Business Systems": [0, 0, 0, 5] } },
  { q: "How would you rate your product visibility on your primary marketplace?", opts: ["Very Poor", "Below Average", "Average", "Good to Excellent"], scores: { "Marketplace Visibility": [5, 3, 1, 0] } },
  { q: "What is your current average profit margin after all costs?", opts: ["Negative / break-even", "0–10%", "10–25%", "Above 25%"], scores: { "Profitability": [5, 4, 2, 0] } },
  { q: "How would you rate the effectiveness of your current advertising?", opts: ["Not advertising", "Poor / high spend, low return", "Moderate", "Efficient and profitable"], scores: { "Advertising Performance": [2, 5, 3, 0] } },
  { q: "How often do you face stockout situations on top products?", opts: ["Very frequently", "Monthly", "Occasionally", "Rarely / never"], scores: { "Business Systems": [5, 3, 2, 0] } },
  { q: "What is your approximate return rate?", opts: ["Above 15%", "10–15%", "5–10%", "Below 5%"], scores: { "Catalog Optimization": [5, 3, 2, 0] } },
  { q: "How would you describe your catalog quality?", opts: ["Basic / minimal info", "Moderate effort", "Well-optimized", "Professional / comprehensive"], scores: { "Catalog Optimization": [5, 3, 1, 0] } },
  { q: "How do you primarily acquire new customers?", opts: ["Mainly paid ads", "Organic only", "Mix of both", "Referrals and repeat"], scores: { "Advertising Performance": [3, 0, 0, 0], "Marketplace Visibility": [0, 4, 2, 0] } },
  { q: "How satisfied are you with your current growth rate?", opts: ["Very unsatisfied", "Somewhat unsatisfied", "Neutral", "Satisfied"], scores: { "Business Systems": [5, 3, 2, 0] } },
  { q: "What is your advertising spend as a percentage of revenue?", opts: ["Above 25%", "15–25%", "8–15%", "Below 8%"], scores: { "Advertising Performance": [5, 3, 2, 0] } },
  { q: "How would you describe your brand positioning?", opts: ["No clear positioning", "Price-based", "Feature-based", "Value / differentiated"], scores: { "Catalog Optimization": [5, 3, 2, 0] } },
  { q: "Are you planning to expand to new marketplaces in 12 months?", opts: ["Yes, immediately", "Yes, after stabilising", "Considering it", "Not currently"], scores: { "Marketplace Expansion": [4, 2, 3, 0] } },
  { q: "How regularly do you review your business performance data?", opts: ["Rarely", "Monthly", "Weekly", "Daily / real-time"], scores: { "Business Systems": [5, 3, 2, 0] } },
  { q: "What is your biggest pricing challenge?", opts: ["Cannot compete on price", "Margins too thin", "Frequent pressure to discount", "No major challenge"], scores: { "Profitability": [4, 5, 3, 0] } },
  { q: "How strong is your customer retention rate?", opts: ["Below 10%", "10–25%", "25–40%", "Above 40%"], scores: { "Business Systems": [5, 3, 2, 0] } },
  { q: "How well-documented and repeatable are your operational processes?", opts: ["Ad-hoc", "Partially documented", "Mostly documented", "Fully systematized"], scores: { "Business Systems": [5, 3, 2, 0] } },
  { q: "What type of growth support would be most valuable?", opts: ["Improve visibility", "Fix profitability", "Scale advertising", "Build better systems"], scores: { "Marketplace Visibility": [5, 0, 0, 0], "Profitability": [0, 5, 0, 0], "Advertising Performance": [0, 0, 5, 0], "Business Systems": [0, 0, 0, 5] } },
  { q: "How confident are you in the quality of your marketplace decision-making?", opts: ["Not confident", "Somewhat unsure", "Reasonably confident", "Very confident"], scores: { "Business Systems": [5, 3, 2, 0] } },
];

const DIAGNOSIS_CATS = ["Marketplace Visibility", "Profitability", "Advertising Performance", "Catalog Optimization", "Business Systems", "Marketplace Expansion"];
const OS_PHASES: Record<string, string> = {
  "Marketplace Visibility": "Scan → Diagnose → Strategize (Catalog & Search focus)",
  "Profitability": "Scan → Diagnose → Optimize (Margin & Cost focus)",
  "Advertising Performance": "Diagnose → Strategize → Measure (Campaign focus)",
  "Catalog Optimization": "Scan → Implement → Measure (Catalog & Content focus)",
  "Business Systems": "Scan → Diagnose → Implement (Operational focus)",
  "Marketplace Expansion": "Strategize → Implement → Scale (Expansion focus)",
};

function GrowthDiagnosis() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"quiz" | "loading" | "result">("quiz");
  const [results, setResults] = useState<any>(null);

  const current = DIAGNOSIS_QUESTIONS[step];
  const total = DIAGNOSIS_QUESTIONS.length;

  const selectAnswer = (optIdx: number) => {
    const newAnswers = { ...answers, [step]: optIdx };
    setAnswers(newAnswers);
    if (step < total - 1) {
      setTimeout(() => setStep(s => s + 1), 300);
    } else {
      setPhase("loading");
      setTimeout(() => {
        const catScores: Record<string, number> = {};
        DIAGNOSIS_CATS.forEach(c => { catScores[c] = 0; });
        DIAGNOSIS_QUESTIONS.forEach((q, i) => {
          const ans = newAnswers[i] ?? 0;
          Object.entries(q.scores).forEach(([cat, arr]) => {
            catScores[cat] = (catScores[cat] || 0) + arr[ans];
          });
        });
        const sorted = Object.entries(catScores).sort((a, b) => b[1] - a[1]);
        const maxPossible = 100;
        const totalScore = Object.values(catScores).reduce((s, v) => s + v, 0);
        const maxTotal = sorted.length * maxPossible;
        const healthScore = Math.max(0, Math.round(100 - (totalScore / (DIAGNOSIS_QUESTIONS.length * 5)) * 100));
        setResults({ catScores, primary: sorted[0][0], secondary: sorted[1][0], healthScore, sorted });
        setPhase("result");
      }, 1200);
    }
  };

  const getRecs = (primary: string, secondary: string) => ({
    "Marketplace Visibility": ["Conduct a full catalog audit focusing on search keyword alignment, title structure, and image quality.", "Build an organic ranking strategy before increasing advertising spend.", "Ensure your product attributes are 100% complete — incomplete listings rank significantly lower."],
    "Profitability": ["Map every cost component per SKU including all hidden fees, returns, and operational expenses.", "Identify your 3 highest-margin products and prioritise them in your growth strategy.", "Evaluate whether your current pricing reflects true marketplace costs or was set before understanding the full cost structure."],
    "Advertising Performance": ["Audit your current campaigns for budget allocation, keyword targeting, and bid strategy.", "Calculate true profitability after advertising costs — ROAS alone is an incomplete metric.", "Separate campaign objectives: brand awareness vs. conversion campaigns require different strategies."],
    "Catalog Optimization": ["Rewrite product titles using marketplace search behaviour data, not internal product naming.", "Invest in professional photography — catalog quality is consistently the highest-ROI improvement.", "Ensure every SKU has complete specifications, benefits-focused descriptions, and all relevant attributes."],
    "Business Systems": ["Document your top 5 operational processes. Repeatability creates predictable growth.", "Establish a weekly performance review rhythm covering revenue, margin, returns, and advertising.", "Build a simple decision framework for common scenarios: pricing pressure, stockouts, advertising budget changes."],
    "Marketplace Expansion": ["Complete a marketplace readiness assessment before committing to expansion.", "Ensure existing operations are profitable and stable before adding platform complexity.", "Map the specific compliance, logistics, and catalog requirements of your target marketplace before investing."],
  }[primary] || []);

  if (phase === "loading") return <ToolLoading message="Generating Growth Insights..." />;

  if (phase === "result" && results) {
    const barData = DIAGNOSIS_CATS.map(c => ({ name: c.split(" ")[0], score: results.catScores[c] })).sort((a, b) => b.score - a.score);
    const recs = getRecs(results.primary, results.secondary);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-5">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-3">Primary Diagnosis</p>
            <p className="text-lg font-semibold text-white">{results.primary}</p>
            <p className="text-sm text-white/50 mt-1">This is your highest-priority growth constraint right now.</p>
          </div>
          <div className="rounded-xl bg-white/4 border border-white/6 p-5">
            <p className="text-xs text-white/40 mb-1">Secondary Challenge</p>
            <p className="text-sm font-semibold text-white">{results.secondary}</p>
            <p className="text-xs text-white/35 mt-3">Business Health</p>
            <p className="text-2xl font-semibold text-indigo-400 mt-0.5">{results.healthScore}<span className="text-sm text-white/30">/100</span></p>
          </div>
        </div>
        <div className="rounded-xl bg-white/3 border border-white/6 p-5">
          <p className="text-xs text-white/40 mb-4">Challenge Priority Map</p>
          <ResponsiveContainer width="100%" height={130}>
            <ReBarChart data={barData} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fill: "#ffffff25", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#ffffff50", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="score" radius={4} fill="#6366f1" />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white/3 border border-white/6 p-4">
          <p className="text-xs text-white/40 mb-2">Suggested Growth OS Phase</p>
          <p className="text-sm text-indigo-400 font-medium">{OS_PHASES[results.primary]}</p>
        </div>
        <RecommendationBox items={recs} />
        <DiscussButton toolName="Growth Diagnosis" summary={`Primary Diagnosis: ${results.primary}, Secondary: ${results.secondary}, Business Health Score: ${results.healthScore}/100`} />
        <button onClick={() => { setStep(0); setAnswers({}); setPhase("quiz"); }} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">← Restart Diagnosis</button>
      </div>
    );
  }

  // Quiz mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>Question {step + 1} of {total}</span>
        <span className="text-indigo-400 font-semibold">{Math.round(((step) / total) * 100)}% complete</span>
      </div>
      <div className="h-1 rounded-full bg-white/6">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-400" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          <p className="text-base font-medium text-white leading-relaxed">{current.q}</p>
          <div className="space-y-3">
            {current.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm transition-all duration-150 ${
                  answers[step] === i
                    ? "bg-indigo-600/80 border-indigo-500 text-white"
                    : "bg-white/3 border-white/8 text-white/60 hover:bg-white/6 hover:border-indigo-500/40 hover:text-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors disabled:opacity-20"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        {answers[step] !== undefined && step < total - 1 && (
          <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Consultation Modal ───────────────────────────────────────────────────────

const CHALLENGES = [
  "Low Marketplace Visibility", "Poor Profit Margins", "High Ad Spend / Low ROAS",
  "Slow Product Growth", "Expansion to New Platforms", "Catalog Quality Issues",
  "High Return Rate", "Inventory Management", "Pricing Strategy", "Other",
];

const MARKETPLACES = ["Amazon", "Flipkart", "Myntra", "AJIO", "Nykaa", "Meesho", "Shopify", "Multiple Platforms", "Not yet selling"];
const REVENUE_RANGES = ["Below ₹1L/month", "₹1L – ₹5L/month", "₹5L – ₹20L/month", "₹20L – ₹50L/month", "Above ₹50L/month"];
const BUDGETS = ["Below ₹10K/month", "₹10K – ₹30K/month", "₹30K – ₹1L/month", "Above ₹1L/month", "Not sure yet"];
const TIMELINES = ["Immediately", "Within 1 month", "Within 3 months", "Just exploring"];

type ConsultStep = 1 | 2 | 3;

function SelectChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 ${
        selected ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/3 border-white/8 text-white/50 hover:border-indigo-500/40 hover:text-white/80"
      }`}>
      {label}
    </button>
  );
}

function ConsultFormInput({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">{label}{required && <span className="text-indigo-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/4 border border-white/10 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors" />
    </div>
  );
}

function ConsultationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ConsultStep>(1);
  const [form, setForm] = useState({
    businessName: "", businessType: "", website: "",
    revenue: "", marketplace: "", challenges: [] as string[],
    goal: "", budget: "", timeline: "",
    contactName: "", contactEmail: "", contactPhone: "", preferredContact: "Email", message: "",
  });

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const toggleChallenge = (c: string) => setForm(p => ({
    ...p, challenges: p.challenges.includes(c) ? p.challenges.filter(x => x !== c) : [...p.challenges, c],
  }));

  const canNext1 = form.businessName && form.revenue && form.marketplace;
  const canNext2 = form.challenges.length > 0 && form.goal;
  const canSend = form.contactName && (form.contactEmail || form.contactPhone);

  // Build the structured message body
  const buildMessage = () => [
    `Growth Consultation Request — PY Growth`,
    ``,
    `BUSINESS INFORMATION`,
    `Business Name: ${form.businessName}`,
    `Business Type: ${form.businessType || "Not specified"}`,
    `Website: ${form.website || "Not provided"}`,
    `Monthly Revenue: ${form.revenue}`,
    `Primary Marketplace: ${form.marketplace}`,
    ``,
    `CHALLENGES & GOALS`,
    `Current Challenges: ${form.challenges.join(", ")}`,
    `Primary Growth Goal: ${form.goal}`,
    `Marketing Budget: ${form.budget || "Not specified"}`,
    `Preferred Timeline: ${form.timeline || "Not specified"}`,
    ``,
    `CONTACT DETAILS`,
    `Name: ${form.contactName}`,
    `Email: ${form.contactEmail || "Not provided"}`,
    `Phone / WhatsApp: ${form.contactPhone || "Not provided"}`,
    `Preferred Contact: ${form.preferredContact}`,
    ``,
    `Additional Message:`,
    form.message || "No additional message.",
  ].join("\n");

  const openWhatsApp = () => {
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/919709119012?text=${msg}`, "_blank");
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`Growth Consultation Request — ${form.businessName}`);
    const body = encodeURIComponent(buildMessage());
    window.open(`mailto:ay904548@gmail.com?subject=${subject}&body=${body}`, "_blank");
  };

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
        style={{ background: "rgba(4,6,16,0.9)", backdropFilter: "blur(10px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-[24px] border border-white/8 bg-[#0a0f1e] overflow-hidden">

          {/* Header */}
          <div className="px-7 pt-7 pb-5 border-b border-white/6 shrink-0">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-1">Growth Consultation</p>
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Let's Understand Your Business
                </h3>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/35">
                <span>Step {step} of 3</span>
                <span className="text-indigo-400">{progressPct}% complete</span>
              </div>
              <div className="h-1 rounded-full bg-white/6">
                <motion.div className="h-full rounded-full bg-indigo-500" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
              </div>
              <div className="flex gap-4 pt-1">
                {[{ n: 1, label: "Business" }, { n: 2, label: "Challenges" }, { n: 3, label: "Contact" }].map(s => (
                  <div key={s.n} className={`flex items-center gap-1.5 text-xs transition-colors ${step === s.n ? "text-indigo-400 font-medium" : step > s.n ? "text-emerald-400" : "text-white/25"}`}>
                    {step > s.n ? <CheckCircle size={11} /> : <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">{s.n}</span>}
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-7 py-6">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Business Info ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <p className="text-sm text-white/45 mb-5">Tell us about your business so we can prepare a meaningful consultation.</p>
                  <ConsultFormInput label="Business Name" value={form.businessName} onChange={set("businessName")} placeholder="e.g. Artisan Craft Co." required />
                  <ConsultFormInput label="Business Type / Category" value={form.businessType} onChange={set("businessType")} placeholder="e.g. Fashion, Electronics, Home Decor" />
                  <ConsultFormInput label="Website (optional)" value={form.website} onChange={set("website")} placeholder="e.g. www.yourbrand.com" />
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Monthly Revenue Range <span className="text-indigo-400">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {REVENUE_RANGES.map(r => <SelectChip key={r} label={r} selected={form.revenue === r} onClick={() => set("revenue")(r)} />)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Primary Marketplace <span className="text-indigo-400">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {MARKETPLACES.map(m => <SelectChip key={m} label={m} selected={form.marketplace === m} onClick={() => set("marketplace")(m)} />)}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Challenges ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <p className="text-sm text-white/45 mb-5">Help us understand your current situation and goals.</p>
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Current Business Challenges <span className="text-indigo-400">*</span> <span className="text-white/25">(select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {CHALLENGES.map(c => <SelectChip key={c} label={c} selected={form.challenges.includes(c)} onClick={() => toggleChallenge(c)} />)}
                    </div>
                  </div>
                  <ConsultFormInput label="Primary Growth Goal" value={form.goal} onChange={set("goal")} placeholder="e.g. Improve profitability while scaling to ₹20L/month" required />
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Monthly Marketing Budget</label>
                    <div className="flex flex-wrap gap-2">
                      {BUDGETS.map(b => <SelectChip key={b} label={b} selected={form.budget === b} onClick={() => set("budget")(b)} />)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Preferred Timeline to Start</label>
                    <div className="flex flex-wrap gap-2">
                      {TIMELINES.map(t => <SelectChip key={t} label={t} selected={form.timeline === t} onClick={() => set("timeline")(t)} />)}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Contact + Send ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <p className="text-sm text-white/45 mb-5">Add your contact details, then choose how to send your consultation request.</p>
                  <ConsultFormInput label="Your Name" value={form.contactName} onChange={set("contactName")} placeholder="Your full name" required />
                  <ConsultFormInput label="Email Address" value={form.contactEmail} onChange={set("contactEmail")} placeholder="you@example.com" type="email" />
                  <ConsultFormInput label="Phone / WhatsApp Number" value={form.contactPhone} onChange={set("contactPhone")} placeholder="+91 98765 43210" />
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Additional Message (optional)</label>
                    <textarea value={form.message} onChange={e => set("message")(e.target.value)} rows={3}
                      placeholder="Any specific context or questions you'd like us to know..."
                      className="w-full bg-white/4 border border-white/10 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors resize-none" />
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-white/3 border border-white/6 p-4">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Request Summary</p>
                    <div className="space-y-2">
                      {[
                        ["Business", form.businessName],
                        ["Revenue", form.revenue],
                        ["Marketplace", form.marketplace],
                        ["Challenges", form.challenges.slice(0, 3).join(", ") + (form.challenges.length > 3 ? ` +${form.challenges.length - 3} more` : "")],
                        ["Goal", form.goal.length > 50 ? form.goal.slice(0, 50) + "…" : form.goal],
                      ].map(([k, v]) => v && (
                        <div key={k} className="flex items-start justify-between gap-4 text-xs">
                          <span className="text-white/35 shrink-0">{k}</span>
                          <span className="text-white/65 text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Send buttons */}
                  {canSend && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-1">
                      <p className="text-xs text-white/35 text-center">Choose how to send your consultation request</p>
                      <button onClick={openWhatsApp}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5">
                        <MessageSquare size={16} /> Send via WhatsApp
                      </button>
                      <button onClick={openEmail}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5">
                        <Mail size={16} /> Send via Email
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="px-7 py-5 border-t border-white/6 shrink-0 flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as ConsultStep)}
                className="px-5 py-3 border border-white/10 text-white/50 hover:text-white text-sm font-medium rounded-2xl transition-all duration-200 flex items-center gap-2">
                <ChevronLeft size={14} /> Back
              </button>
            )}
            {step < 3 && (
              <button onClick={() => setStep(s => (s + 1) as ConsultStep)}
                disabled={step === 1 ? !canNext1 : !canNext2}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-sm font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
                Continue <ChevronRight size={14} />
              </button>
            )}
            {step === 3 && !canSend && (
              <div className="flex-1 py-3 text-center text-xs text-white/30 flex items-center justify-center">
                Add your name and email or phone to continue
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Revenue Chart Data ────────────────────────────────────────────────────

const revenueData = [
  { m: "Jan", rev: 42, profit: 18 }, { m: "Feb", rev: 48, profit: 21 },
  { m: "Mar", rev: 45, profit: 19 }, { m: "Apr", rev: 55, profit: 26 },
  { m: "May", rev: 63, profit: 30 }, { m: "Jun", rev: 72, profit: 36 },
  { m: "Jul", rev: 68, profit: 34 }, { m: "Aug", rev: 81, profit: 42 },
  { m: "Sep", rev: 89, profit: 47 }, { m: "Oct", rev: 95, profit: 52 },
  { m: "Nov", rev: 104, profit: 58 }, { m: "Dec", rev: 118, profit: 67 },
];
const roasData = [{ m: "Q1", roas: 2.4 }, { m: "Q2", roas: 3.1 }, { m: "Q3", roas: 3.8 }, { m: "Q4", roas: 4.6 }];

// ─── Hero Dashboard ────────────────────────────────────────────────────────

function HeroDashboard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const revenue = useCountUp(118, 2200, inView);
  const roas = useCountUp(46, 2000, inView);
  const margin = useCountUp(34, 1800, inView);
  const visibility = useCountUp(87, 2100, inView);
  return (
    <div ref={ref} className="relative w-full">
      <div className="rounded-2xl border border-white/8 bg-[#0c1221] overflow-hidden shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-[#080e1c]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs text-white/30 font-mono">Sample Illustrative Example</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Revenue", value: `₹${revenue}L`, change: "+23%", icon: TrendingUp, color: "text-indigo-400" },
              { label: "ROAS", value: `${(roas / 10).toFixed(1)}x`, change: "+18%", icon: Target, color: "text-violet-400" },
              { label: "Net Margin", value: `${margin}%`, change: "+6pp", icon: Percent, color: "text-emerald-400" },
              { label: "Visibility", value: `${visibility}%`, change: "+12%", icon: Activity, color: "text-blue-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/4 border border-white/6 p-3 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 truncate pr-1">{kpi.label}</span>
                  <kpi.icon size={12} className={`${kpi.color} shrink-0`} />
                </div>
                <p className={`text-lg font-semibold ${kpi.color} truncate`}>{kpi.value}</p>
                <p className="text-xs text-emerald-400 mt-0.5">{kpi.change}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/3 border border-white/6 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/60">Revenue vs Profit</span>
              <span className="text-xs text-indigo-400">12 months</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={revenueData}>
                <defs key="hero-defs">
                  <linearGradient id="heroRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop key="s1" offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop key="s2" offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="heroProfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop key="s3" offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop key="s4" offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area key="area-rev" name="Revenue" type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={1.5} fill="url(#heroRevGrad)" dot={false} />
                <Area key="area-profit" name="Profit" type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={1.5} fill="url(#heroProfGrad)" dot={false} />
                <XAxis key="hero-xaxis" dataKey="m" tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <Tooltip key="hero-tooltip" contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/3 border border-white/6 p-3">
              <p className="text-xs text-white/40 mb-1">Health Score</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-semibold text-emerald-400">82</span>
                <span className="text-xs text-white/40 mb-0.5">/100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/8">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: "82%" }} />
              </div>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/6 p-3">
              <p className="text-xs text-white/40 mb-1">Ad Efficiency</p>
              <ResponsiveContainer width="100%" height={40}>
                <ReBarChart data={roasData}>
                  <Bar key="hero-bar-roas" name="ROAS" dataKey="roas" fill="#6366f1" radius={2} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/6 p-3 min-w-0">
              <p className="text-xs text-white/40 mb-2">Marketplace Mix</p>
              <div className="space-y-1">
                {[["Amazon", "48%", "#6366f1"], ["Flipkart", "31%", "#8b5cf6"], ["Others", "21%", "#34d399"]].map(([name, pct, color]) => (
                  <div key={name} className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-white/50 flex-1 truncate">{name}</span>
                    <span className="text-xs font-medium text-white/70 shrink-0">{pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation ────────────────────────────────────────────────────────────

const navLinks = ["Solutions", "Growth OS", "Insights", "Payment Portal", "Contact"];

function navPath(link: string) {
  if (link === "Home") return "/";
  return "/" + link.toLowerCase().replace(/\s/g, "-");
}

function Navbar({ onConsult }: { onConsult: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (link: string) => {
    const path = navPath(link);
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const goTo = (link: string) => {
    navigate(navPath(link));
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          height: 80,
          background: scrolled ? "rgba(8,12,20,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <ImageWithFallback src={logoSrc} alt="PY Growth logo" className="w-16 h-16 object-contain" style={{ filter: "invert(1)", mixBlendMode: "screen", transform: "scale(2.0)", transformOrigin: "center center" }} />
            <span className="text-white font-semibold tracking-wide text-sm">PY GROWTH</span>
          </button>
          <nav className="hidden md:flex items-center gap-8">
            {["Home", ...navLinks].map((link) => (
              <button key={link} onClick={() => goTo(link)} className={`text-sm transition-colors duration-200 relative group ${isActive(link) ? "text-white" : "text-white/50 hover:text-white/80"}`}>
                {link}
                <span className={`absolute -bottom-0.5 left-0 h-px bg-indigo-400 transition-all duration-300 ${isActive(link) ? "w-full" : "w-0 group-hover:w-full"}`} />
              </button>
            ))}
          </nav>
          <div className="hidden md:flex">
            <button onClick={onConsult} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/25 hover:-translate-y-0.5">
              Book Growth Consultation
            </button>
          </div>
          <button className="md:hidden text-white/70 z-[60] relative" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu — blurred overlay + sliding panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55]"
              style={{ background: "rgba(4,8,18,0.75)", backdropFilter: "blur(12px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[60] w-[80%] max-w-xs flex flex-col pt-24 px-7 pb-8"
              style={{ background: "rgba(10,15,30,0.98)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-6">Navigation</p>
              {["Home", ...navLinks].map((link) => (
                <button
                  key={link}
                  onClick={() => goTo(link)}
                  className="py-4 text-left text-base text-white/70 hover:text-white border-b border-white/6 transition-colors flex items-center justify-between group"
                >
                  {link}
                  <ArrowRight size={14} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
              <button
                onClick={() => { onConsult(); setMobileOpen(false); }}
                className="mt-8 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                Book Growth Consultation <ArrowRight size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────

function HeroSection({ onConsult }: { onConsult: () => void }) {
  return (
    <section id="home" className="min-h-screen flex items-center pt-20 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl" />
      </div>
      <div className="max-w-[1200px] mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-16 items-center">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={fadeUp}><span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Marketplace Growth Intelligence</span></motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl xl:text-[56px] font-semibold leading-[1.15] text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Build a Marketplace Business That Grows Profitably.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base md:text-lg text-white/50 leading-relaxed max-w-[520px]">
              Replace guesswork with structured marketplace strategy. PY Growth helps ecommerce businesses diagnose growth bottlenecks, improve profitability, and scale confidently across marketplaces.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <button onClick={onConsult} className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 flex items-center gap-2">
                Book Growth Consultation <ArrowRight size={16} />
              </button>
              <button onClick={() => document.getElementById("growth-os")?.scrollIntoView({ behavior: "smooth" })} className="px-7 py-3.5 border border-white/12 hover:border-indigo-500/50 text-white/70 hover:text-white font-medium rounded-2xl transition-all duration-200 flex items-center gap-2">
                Explore Growth OS <ArrowRight size={16} />
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-6">
              {["Structured Growth Framework", "Marketplace Specialists", "Business-First Strategy"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-white/50">
                  <CheckCircle size={14} className="text-emerald-400 shrink-0" /> {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <HeroDashboard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Complexity Section ────────────────────────────────────────────────────

const problems = [
  { icon: Search, title: "Visibility", insights: ["Products remain buried in search results", "Poor catalog structure limits organic reach", "Competitor listings outperform on keywords"] },
  { icon: DollarSign, title: "Profitability", insights: ["Revenue grows while margins compress", "Hidden fees erode profitability invisibly", "Discounting creates revenue without profit"] },
  { icon: BarChart2, title: "Decision Making", insights: ["Incomplete data leads to reactive choices", "Businesses optimise symptoms not causes", "Strategy built on assumptions not intelligence"] },
];

function ComplexitySection() {
  return (
    <Section id="solutions" className="py-32 relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-16 space-y-5">
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Marketplace Growth Has Become More Complex Than Ever.</h2>
          <p className="text-white/45 max-w-2xl mx-auto text-base leading-relaxed">Founders struggle because marketplaces, advertising, pricing, inventory, competition, and customer behavior constantly change — faster than most businesses can respond.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <motion.div key={p.title} variants={fadeUp} whileHover={{ y: -6, borderColor: "rgba(99,102,241,0.4)" }} transition={{ duration: 0.25 }} className="rounded-[20px] border border-white/7 bg-[#0c1221] p-8 cursor-default">
              <div className="w-11 h-11 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center mb-6"><p.icon size={20} className="text-indigo-400" /></div>
              <h3 className="text-lg font-semibold text-white mb-4">{p.title}</h3>
              <ul className="space-y-2.5">{p.insights.map((ins) => <li key={ins} className="text-sm text-white/45 flex items-start gap-2.5"><span className="w-1 h-1 rounded-full bg-indigo-400/60 mt-2 shrink-0" />{ins}</li>)}</ul>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Growth OS Section ─────────────────────────────────────────────────────

const osSteps = [
  { n: "01", title: "Scan", desc: "Understand the business before making recommendations. Build a complete marketplace overview.", icon: Search },
  { n: "02", title: "Diagnose", desc: "Identify root causes instead of symptoms. Generate a structured health report.", icon: Activity },
  { n: "03", title: "Strategize", desc: "Create a structured action plan aligned with business goals and constraints.", icon: Lightbulb },
  { n: "04", title: "Implement", desc: "Execute recommendations systematically with clear ownership and timelines.", icon: Settings },
  { n: "05", title: "Measure", desc: "Track business metrics that actually matter to profitability and growth.", icon: BarChart },
  { n: "06", title: "Optimize", desc: "Continuously improve based on data rather than assumptions.", icon: Repeat },
  { n: "07", title: "Scale", desc: "Expand intelligently when the business is operationally ready.", icon: TrendingUp },
];

function GrowthOSSection({ onConsult }: { onConsult: () => void }) {
  const [active, setActive] = useState(0);
  return (
    <Section id="growth-os" className="py-32 bg-[#080e1c] relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-20 space-y-5">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Proprietary Methodology</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Every Recommendation Starts With Understanding.</h2>
          <p className="text-white/45 max-w-xl mx-auto text-base">The PY Growth OS transforms complex marketplace operations into a structured decision-making framework.</p>
        </motion.div>
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute top-8 left-8 right-8 h-px bg-white/8" />
            <div className="grid grid-cols-7 gap-2">
              {osSteps.map((step, i) => (
                <motion.div key={step.title} variants={fadeUp} whileHover={{ scale: 1.02 }} onClick={() => setActive(i)} className={`cursor-pointer text-center group transition-all duration-200 ${active === i ? "scale-105" : ""}`}>
                  <div className={`w-16 h-16 rounded-full border mx-auto flex items-center justify-center mb-4 transition-all duration-200 relative z-10 ${active === i ? "border-indigo-500 bg-indigo-600 shadow-lg shadow-indigo-600/40" : "border-white/12 bg-[#0c1221] group-hover:border-indigo-500/50"}`}>
                    <step.icon size={18} className={active === i ? "text-white" : "text-white/40 group-hover:text-indigo-400"} />
                  </div>
                  <p className={`text-xs font-semibold mb-1 transition-colors ${active === i ? "text-indigo-400" : "text-white/30 group-hover:text-white/60"}`}>{step.n}</p>
                  <p className={`text-sm font-medium transition-colors ${active === i ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>{step.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-10 rounded-[20px] border border-indigo-500/20 bg-indigo-500/5 p-8 max-w-2xl mx-auto text-center">
            <h4 className="text-lg font-semibold text-white mb-2">{osSteps[active].title}</h4>
            <p className="text-white/50 text-sm leading-relaxed">{osSteps[active].desc}</p>
          </motion.div>
        </div>
        <div className="lg:hidden space-y-4">
          {osSteps.map((step) => (
            <motion.div key={step.title} variants={fadeUp} className="rounded-[16px] border border-white/7 bg-[#0c1221] p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full border border-indigo-500/30 bg-indigo-600/20 flex items-center justify-center shrink-0"><step.icon size={16} className="text-indigo-400" /></div>
              <div><p className="text-xs text-indigo-400 font-semibold mb-0.5">{step.n} — {step.title}</p><p className="text-sm text-white/50 leading-relaxed">{step.desc}</p></div>
            </motion.div>
          ))}
        </div>
        <motion.div variants={fadeUp} className="text-center mt-12">
          <button onClick={onConsult} className="px-7 py-3.5 border border-white/12 hover:border-indigo-500/50 text-white/70 hover:text-white font-medium rounded-2xl transition-all duration-200 flex items-center gap-2 mx-auto">
            Start Growth Consultation <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Why Founders Section ──────────────────────────────────────────────────

const values = [
  { icon: Shield, title: "Diagnosis Before Strategy", desc: "We understand your business before recommending anything. No assumptions." },
  { icon: DollarSign, title: "Profit Before Growth", desc: "Revenue without margin is not growth. Every recommendation is tested against profitability." },
  { icon: Layers, title: "Systems Before Shortcuts", desc: "We build frameworks that create compounding improvements over time." },
  { icon: Users, title: "Long-Term Partnership", desc: "We measure our success by your marketplace performance, not activity reports." },
];

function WhyFoundersSection() {
  return (
    <Section className="py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp} className="rounded-[24px] border border-white/7 bg-[#0c1221] p-10">
            <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mb-8">Business Operating System</p>
            <div className="space-y-4">
              {["Business Understanding", "Growth Diagnosis", "Structured Strategy", "Systematic Execution", "Continuous Optimisation"].map((item, i) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-400 shrink-0">{i + 1}</div>
                  <div className="flex-1 h-px bg-indigo-500/20 relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400/40" /></div>
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-white/6 flex gap-6">
              {[["Confidence", "82%"], ["Efficiency", "91%"], ["Decisions", "3x"]].map(([label, val]) => (
                <div key={label}><p className="text-xl font-semibold text-indigo-400">{val}</p><p className="text-xs text-white/40 mt-1">{label}</p></div>
              ))}
            </div>
          </motion.div>
          <div className="space-y-6">
            <motion.div variants={fadeUp}><span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Why Founders Choose Structured Thinking</span></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>The Difference Is How We Think, Not What We Do.</motion.h2>
            <div className="space-y-5 mt-8">
              {values.map((v) => (
                <motion.div key={v.title} variants={fadeUp} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl border border-indigo-500/20 bg-indigo-500/8 flex items-center justify-center shrink-0"><v.icon size={18} className="text-indigo-400" /></div>
                  <div><h4 className="text-sm font-semibold text-white mb-1">{v.title}</h4><p className="text-sm text-white/45 leading-relaxed">{v.desc}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Growth Tools Section ─────────────────────────────────────────────────

const toolDefs = [
  { id: 1, icon: DollarSign, title: "Marketplace Profit Calculator", desc: "Calculate net profit after all marketplace fees, shipping, and returns." },
  { id: 2, icon: Percent, title: "Discount Impact Analyzer", desc: "Understand how discounting affects margins and required order volumes." },
  { id: 3, icon: Target, title: "ROAS Calculator", desc: "Measure advertising efficiency and true profitability after ad spend." },
  { id: 4, icon: CheckCircle, title: "Marketplace Readiness Assessment", desc: "Score your business readiness before expanding to new platforms." },
  { id: 5, icon: TrendingUp, title: "Revenue Projection Planner", desc: "Model growth scenarios using traffic, conversion, and AOV improvements." },
  { id: 6, icon: Activity, title: "Growth Diagnosis", desc: "Identify your primary growth bottleneck with a structured diagnostic." },
];

function GrowthToolsSection() {
  const [openTool, setOpenTool] = useState<{ id: number; title: string } | null>(null);
  return (
    <Section className="py-32 bg-[#080e1c]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Growth Tools</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Interactive Growth Tools</h2>
          <p className="text-white/45 max-w-xl mx-auto text-base">Practical tools designed to help founders make smarter marketplace decisions.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {toolDefs.map((t) => (
            <motion.div key={t.id} variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.22 }} className="rounded-[20px] border border-white/7 bg-[#0c1221] p-7 group hover:border-indigo-500/25 transition-colors duration-200 flex flex-col">
              <div className="w-11 h-11 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors duration-200"><t.icon size={20} className="text-indigo-400" /></div>
              <h4 className="text-sm font-semibold text-white mb-2">{t.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed mb-5 flex-1">{t.desc}</p>
              <button onClick={() => setOpenTool({ id: t.id, title: t.title })} className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 group-hover:gap-3 transition-all duration-200">
                Launch Tool <ArrowRight size={12} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
      {openTool && <ToolModal tool={openTool} onClose={() => setOpenTool(null)} />}
    </Section>
  );
}

// ─── Solutions Section ─────────────────────────────────────────────────────

const solutions = [
  { label: "Marketplace Visibility", heading: "Make Your Products Easier To Discover.", problem: "Products remain invisible despite quality catalog investments and consistent advertising spend.", approach: ["Catalog optimization", "Search strategy", "Marketplace positioning", "Content improvement"], outcome: "Higher discoverability, better organic traffic, improved product performance." },
  { label: "Profitability", heading: "Growth Means Nothing Without Healthy Margins.", problem: "Sales increase while profits quietly decline, eroding the business from the inside.", approach: ["Margin analysis", "Pricing strategy", "Commission optimization", "Operational efficiency"], outcome: "Healthier margins, sustainable growth, smarter pricing decisions." },
  { label: "Advertising Performance", heading: "Every Advertising Decision Should Generate Business Value.", problem: "Businesses optimize for ROAS while ignoring overall profitability after all marketplace costs.", approach: ["Campaign strategy", "Budget allocation", "Audience analysis", "Creative optimization"], outcome: "Lower acquisition costs, better efficiency, more profitable advertising." },
];

function SolutionsSection() {
  return (
    <Section className="py-32">
      <div className="max-w-[1200px] mx-auto px-6 space-y-24">
        <motion.div variants={fadeUp} className="text-center space-y-4">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Solutions</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Solutions Built Around Business Outcomes.</h2>
        </motion.div>
        {solutions.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} className={`grid grid-cols-1 lg:grid-cols-2 gap-14 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
            <div className={`space-y-6 ${i % 2 === 1 ? "lg:col-start-2" : ""}`}>
              <span className="text-xs font-semibold tracking-widest uppercase text-indigo-400">{s.label}</span>
              <h3 className="text-2xl md:text-3xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{s.heading}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{s.problem}</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Our Approach</p>
                {s.approach.map((a) => <div key={a} className="flex items-center gap-2.5 text-sm text-white/60"><CheckCircle size={13} className="text-indigo-400 shrink-0" /> {a}</div>)}
              </div>
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <p className="text-xs text-indigo-400 font-semibold mb-1.5">Business Outcome</p>
                <p className="text-sm text-white/60">{s.outcome}</p>
              </div>
            </div>
            <div className={`rounded-[20px] border border-white/7 bg-[#0c1221] p-6 ${i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-xs text-white/40">{s.label} Overview</span><span className="text-xs text-emerald-400 font-medium">↑ Improving</span></div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={revenueData.slice(0, 8)}>
                    <defs key={`sol-defs-${i}`}>
                      <linearGradient id={`solGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop key={`sg1-${i}`} offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop key={`sg2-${i}`} offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area key={`sol-area-${i}`} name={`Revenue-${i}`} type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={1.5} fill={`url(#solGrad${i})`} dot={false} />
                    <XAxis key={`sol-xaxis-${i}`} dataKey="m" tick={{ fill: "#ffffff20", fontSize: 8 }} axisLine={false} tickLine={false} />
                    <Tooltip key={`sol-tooltip-${i}`} contentStyle={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3">
                  {[["Score", "84"], ["Trend", "+21%"], ["Health", "A"]].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white/4 border border-white/5 p-3"><p className="text-xs text-white/35 mb-1">{k}</p><p className="text-base font-semibold text-indigo-400">{v}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ─── Insights Section ──────────────────────────────────────────────────────

const articles = [
  {
    slug: "organic-visibility-vs-paid-traffic",
    cat: "Marketplace Strategy",
    title: "Why Organic Visibility Is More Valuable Than Paid Traffic on Marketplaces",
    time: "5 min read",
    desc: "Paid traffic disappears when budgets stop. Organic visibility compounds over time and builds lasting marketplace authority.",
    body: [
      { type: "p", text: "Every marketplace seller dreams of seeing their products on the first page. The common reaction is to increase advertising budgets. While paid ads can generate immediate traffic, they disappear the moment you stop spending. Organic visibility works differently — it compounds over time." },
      { type: "p", text: "Think about brands like The Souled Store. In its early years, the company certainly invested in marketing, but much of its long-term marketplace success came from continuously improving listings, product quality, customer reviews, fulfillment performance, and inventory availability. Those improvements helped products rank naturally for relevant searches, reducing dependence on advertising." },
      { type: "h3", text: "What Marketplaces Actually Reward" },
      { type: "p", text: "Marketplaces such as Myntra, Amazon, and Flipkart reward products that consistently perform well. High click-through rates, strong conversion rates, low return percentages, positive customer ratings, and reliable stock availability all improve search rankings. These signals tell the marketplace that customers trust the product, making the platform more likely to recommend it organically." },
      { type: "h3", text: "The Paid-Only Trap" },
      { type: "p", text: "Businesses that rely only on paid advertising often enter a difficult cycle. As advertising costs rise and competition increases, maintaining profitability becomes harder. On the other hand, businesses with strong organic visibility continue receiving traffic even during periods of lower advertising spend. Paid campaigns should accelerate growth — not replace a healthy marketplace foundation." },
      { type: "h3", text: "A Practical Approach" },
      { type: "p", text: "Treat advertising as an investment in learning. Use campaigns to understand which products, keywords, and audiences perform best. Then improve product listings, images, descriptions, pricing, and customer experience so those products begin attracting traffic naturally." },
      { type: "p", text: "The strongest marketplace businesses don't win because they spend the most. They win because they build products and listings that marketplaces naturally want to recommend." },
    ],
  },
  {
    slug: "hidden-margin-killers",
    cat: "Profitability",
    title: "The Hidden Margin Killers Every Marketplace Seller Ignores",
    time: "4 min read",
    desc: "Understanding true profitability requires accounting for fees, returns, and discounting costs most sellers never calculate correctly.",
    body: [
      { type: "p", text: "Many founders believe revenue growth automatically means business growth. Unfortunately, marketplace businesses often discover that sales have increased while profits remain disappointingly low." },
      { type: "h3", text: "The ₹1,499 Shirt Problem" },
      { type: "p", text: "Imagine selling a shirt for ₹1,499 on Myntra. At first glance, it appears profitable. But after subtracting marketplace commissions, campaign discounts, shipping, packaging, returns, GST, advertising costs, and payment fees, the actual profit may be only ₹120 — or sometimes even negative." },
      { type: "p", text: "This is why several growing D2C brands shifted their focus from pure revenue to contribution margins. Brands such as Snitch and XYXX have frequently spoken about balancing aggressive growth with profitability rather than chasing vanity metrics. Sustainable businesses understand every rupee that enters and leaves the system." },
      { type: "h3", text: "The True Cost of Returns" },
      { type: "p", text: "One of the biggest hidden expenses is returns. A 20% return rate doesn't simply reduce sales — it increases reverse logistics costs, damages inventory, and consumes operational resources. Poor product images, inaccurate sizing, misleading descriptions, and inconsistent quality often become expensive marketing problems disguised as operational issues." },
      { type: "h3", text: "The Discounting Trap" },
      { type: "p", text: "Another overlooked factor is discounting. Participating in every marketplace sale may boost order volume, but heavy discounts combined with advertising often eliminate margins completely. Selling more units only accelerates losses if the contribution margin is already weak." },
      { type: "h3", text: "Three Numbers Every Founder Must Know" },
      { type: "p", text: "Before increasing advertising budgets or expanding to new marketplaces, every founder should know three numbers: actual net profit per order, contribution margin after advertising, and customer acquisition cost. These metrics reveal whether growth is creating value or simply creating more work." },
      { type: "p", text: "Marketplace success isn't measured by revenue screenshots. It's measured by profitable, repeatable growth." },
    ],
  },
  {
    slug: "growth-operating-system",
    cat: "Growth Frameworks",
    title: "How to Build a Growth Operating System for Your Marketplace Business",
    time: "5 min read",
    desc: "A structured framework for building compounding marketplace growth through systematic decision-making, not reactive tactics.",
    body: [
      { type: "p", text: "Most marketplace businesses operate reactively. Sales decline, so advertising increases. Returns rise, so discounts become deeper. Competition grows, so prices fall. Decisions become reactions instead of strategy." },
      { type: "p", text: "A better approach is to build a structured operating system for decision-making." },
      { type: "h3", text: "How Scaled Brands Think Differently" },
      { type: "p", text: "Companies like Mamaearth and Boat didn't scale simply because they ran more advertisements. As they matured, they invested heavily in understanding customers, improving operations, monitoring data, refining products, and continuously optimizing marketplace performance. Every decision became part of a larger system rather than an isolated action." },
      { type: "p", text: "At PY Growth, we believe marketplace businesses should follow a structured framework." },
      { type: "h3", text: "Step 1: Understand the Business" },
      { type: "p", text: "Before suggesting improvements, analyze current revenue, profitability, customer behavior, inventory health, and marketplace performance. Recommendations without diagnosis are simply educated guesses." },
      { type: "h3", text: "Step 2: Identify the Bottleneck" },
      { type: "p", text: "Sometimes poor growth is caused by weak advertising. Sometimes it's poor catalog quality, pricing, operations, or customer experience. Solving the wrong problem wastes both time and money." },
      { type: "h3", text: "Step 3: Execute with Measurable Objectives" },
      { type: "p", text: "Once the root cause is clear, strategy becomes much easier. Businesses can prioritize improvements based on expected impact instead of assumptions. Execution then becomes measurable because every recommendation has a defined objective and success metric." },
      { type: "h3", text: "Step 4: Optimize Continuously" },
      { type: "p", text: "Marketplace algorithms, customer preferences, and competition constantly evolve. Businesses that review performance regularly and adapt quickly continue growing long after competitors plateau." },
      { type: "p", text: "Growth should never depend on luck or occasional marketing campaigns. It should be driven by repeatable systems, disciplined decisions, and continuous improvement. That is the difference between businesses that grow temporarily and businesses that build lasting marketplace leadership." },
    ],
  },
];


function GrowthLabSection() {
  return (
    <Section id="insights" className="py-32 bg-[#080e1c]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between mb-14 flex-wrap gap-4">
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Insights</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Latest Marketplace Insights</h2>
          </div>
          <Link to="/insights" className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group">Explore Insights <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></Link>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link key={a.title} to={`/insights/${a.slug}`} className="block">
              <motion.div variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.22 }} className="rounded-[20px] border border-white/7 bg-[#0c1221] overflow-hidden group cursor-pointer hover:border-indigo-500/25 transition-colors duration-200 h-full">
                <div className="h-40 bg-gradient-to-br from-indigo-600/15 to-violet-600/10 flex items-center justify-center border-b border-white/6">
                  <BookOpen size={32} className="text-indigo-400/40 group-hover:text-indigo-400/70 transition-colors" />
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">{a.cat}</span>
                    <span className="text-xs text-white/30">{a.time}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-snug">{a.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{a.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 group-hover:gap-3 transition-all duration-200 pt-1">Read Article <ArrowRight size={12} /></div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── About Section ─────────────────────────────────────────────────────────

const principles = [
  { icon: Search, title: "Diagnose Before We Prescribe", desc: "Every engagement begins with understanding." },
  { icon: DollarSign, title: "Profit Before Growth", desc: "Revenue without margin is not progress." },
  { icon: BarChart2, title: "Data Before Opinions", desc: "Decisions should be informed, not assumed." },
  { icon: Layers, title: "Systems Before Shortcuts", desc: "Sustainable results require repeatable frameworks." },
  { icon: Users, title: "Partnership Before Transactions", desc: "We succeed when your business succeeds." },
];

function AboutSection() {
  return (
    <Section id="about" className="py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-16 space-y-5 max-w-2xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">About PY Growth</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Built Around Better Marketplace Decisions.</h2>
          <p className="text-white/45 text-base leading-relaxed">PY Growth exists to help founders make confident marketplace decisions through structured thinking, diagnosis, and continuous optimisation. We simplify what the marketplace economy makes complex.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {principles.map((p) => (
            <motion.div key={p.title} variants={fadeUp} whileHover={{ y: -4 }} className="rounded-[20px] border border-white/7 bg-[#0c1221] p-7 cursor-default hover:border-indigo-500/25 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center mb-5"><p.icon size={18} className="text-indigo-400" /></div>
              <h4 className="text-sm font-semibold text-white mb-2">{p.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-white/35 text-sm">
          <MapPin size={14} className="text-indigo-400" /> Ranchi, Jharkhand, India — Remote Consulting Across India
        </motion.div>
      </div>
    </Section>
  );
}

// ─── FAQ Section ───────────────────────────────────────────────────────────

const faqs = [
  { q: "How are you different from traditional agencies?", a: "We begin with diagnosis before recommendations. Traditional agencies start with services. We start with understanding your specific business context, marketplace positioning, and growth constraints before suggesting any approach." },
  { q: "Which marketplaces do you support?", a: "We work with Amazon, Flipkart, Myntra, AJIO, Nykaa, Meesho, and Shopify. Our frameworks apply across all modern marketplace platforms because they are built around business fundamentals rather than platform-specific tactics." },
  { q: "Do you work with startups?", a: "Yes. Our approach scales from early-stage sellers building their first profitable product to established brands managing multi-crore annual revenue across multiple platforms." },
  { q: "How does the consultation process work?", a: "The consultation begins with a structured business assessment. We understand your current marketplace situation, diagnose your primary growth constraints, and create a strategic recommendation tailored to your business context." },
  { q: "Why isn't pricing listed?", a: "Every business has different complexity, scale, and requirements. Listing fixed pricing would create misaligned expectations. The consultation helps us understand your situation and propose the right engagement structure." },
  { q: "Can you help if we're already selling online?", a: "Absolutely. The majority of our work involves businesses that are already selling but want to improve profitability, efficiency, or scale more intelligently across marketplace platforms." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Section className="py-32 bg-[#080e1c]">
      <div className="max-w-[760px] mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-14 space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Frequently Asked Questions</h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-[16px] border border-white/7 bg-[#0c1221] overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/2 transition-colors duration-200">
                <span className="text-sm font-medium text-white/80 pr-4">{faq.q}</span>
                <ChevronDown size={16} className={`text-white/40 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
              </button>
              <motion.div initial={false} animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <p className="px-6 pb-6 text-sm text-white/45 leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Consultation Section ──────────────────────────────────────────────────

function ConsultationSection({ onConsult }: { onConsult: () => void }) {
  return (
    <Section id="contact" className="py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div variants={fadeUp} className="rounded-[24px] border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-violet-600/5 p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-indigo-600/10 rounded-full blur-3xl" /></div>
          <div className="relative space-y-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Start Your Consultation</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Let's Understand Your Business Before We Talk.</h2>
            <p className="text-white/50 max-w-xl mx-auto text-base leading-relaxed">Complete a short business assessment so the consultation focuses on solutions instead of introductions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button onClick={onConsult} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 flex items-center gap-2 justify-center">
                Start Growth Consultation <ArrowRight size={16} />
              </button>
              <button onClick={() => document.getElementById("growth-os")?.scrollIntoView({ behavior: "smooth" })} className="px-8 py-4 border border-white/12 hover:border-indigo-500/50 text-white/70 hover:text-white font-medium rounded-2xl transition-all duration-200 flex items-center gap-2 justify-center">
                Explore Growth OS <ArrowRight size={16} />
              </button>
            </div>
            <div className="mt-12 pt-8 border-t border-white/8">
              {/* Mobile: vertical stacked list */}
              <div className="flex flex-col gap-3 sm:hidden">
                {[{ n: "01", label: "Share Your Business" }, { n: "02", label: "Receive Initial Assessment" }, { n: "03", label: "Book Your Consultation" }].map((step) => (
                  <div key={step.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center text-xs font-semibold text-indigo-400 shrink-0 mt-0.5">{step.n}</div>
                    <span className="text-sm text-white/50 text-left">{step.label}</span>
                  </div>
                ))}
              </div>
              {/* Desktop: horizontal row */}
              <div className="hidden sm:flex items-center justify-center gap-8">
                {[{ n: "01", label: "Share Your Business" }, { n: "02", label: "Receive Initial Assessment" }, { n: "03", label: "Book Your Consultation" }].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center text-xs font-semibold text-indigo-400 shrink-0">{step.n}</div>
                      <span className="text-sm text-white/50">{step.label}</span>
                    </div>
                    {i < 2 && <ArrowRight size={14} className="text-white/20 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#060912] border-t border-white/6 py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <ImageWithFallback src={logoSrc} alt="PY Growth" className="w-16 h-16 object-contain" style={{ filter: "invert(1)", mixBlendMode: "screen", transform: "scale(2.0)", transformOrigin: "center center" }} />
              <span className="text-white font-semibold tracking-wide text-sm">PY GROWTH</span>
            </div>
            <p className="text-sm text-white/35 leading-relaxed max-w-[240px]">A premium marketplace growth intelligence platform helping ecommerce businesses scale profitably.</p>
            <div className="space-y-2.5">
              <a href="https://wa.me/919709119012" className="flex items-center gap-2.5 text-sm text-white/40 hover:text-white/70 transition-colors"><Phone size={13} className="text-indigo-400" /> +91 97091 19012</a>
              <a href="mailto:ay904548@gmail.com" className="flex items-center gap-2.5 text-sm text-white/40 hover:text-white/70 transition-colors"><Mail size={13} className="text-indigo-400" /> ay904548@gmail.com</a>
              <div className="flex items-center gap-2.5 text-sm text-white/40"><MapPin size={13} className="text-indigo-400" /> Ranchi, Jharkhand, India</div>
            </div>
          </div>
          {[
            { heading: "Company", links: ["Growth OS", "Solutions", "Payment", "Contact"] },
            { heading: "Solutions", links: ["Visibility", "Profitability", "Advertising", "Expansion", "Intelligence"] },
            { heading: "Growth Tools", links: ["Profit Calculator", "ROAS Calculator", "Discount Analyzer", "Readiness Assessment", "Revenue Planner"] },
          ].map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">{col.heading}</p>
              <ul className="space-y-3">{col.links.map((link) => <li key={link}><button className="text-sm text-white/40 hover:text-white/70 transition-colors text-left">{link}</button></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">© 2025 PY Growth. All rights reserved.</p>
          <p className="text-xs text-white/20">Marketplace Growth Intelligence Platform</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page components ───────────────────────────────────────────────────────

function HomePage() {
  const onConsult = useOutletContext<() => void>();
  return (
    <>
      <HeroSection onConsult={onConsult} />
      <ComplexitySection />
      <GrowthOSSection onConsult={onConsult} />
      <WhyFoundersSection />
      <GrowthToolsSection />
      <SolutionsSection />
      <GrowthLabSection />
      <AboutSection />
      <FAQSection />
      <ConsultationSection onConsult={onConsult} />
    </>
  );
}

function SolutionsPage() {
  return <div className="pt-20"><SolutionsSection /></div>;
}

function GrowthOSPage() {
  const onConsult = useOutletContext<() => void>();
  return <div className="pt-20"><GrowthOSSection onConsult={onConsult} /></div>;
}

function InsightsPage() {
  return (
    <div className="pt-20 min-h-screen">
      <GrowthLabSection />
    </div>
  );
}

function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = articles.find((a) => a.slug === slug);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-6">
        <p className="text-white/40 text-sm mb-4">Article not found.</p>
        <button onClick={() => navigate("/insights")} className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-2">
          <ChevronLeft size={14} /> Back to Insights
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: "#080c14" }}>
      <div className="max-w-2xl mx-auto px-6">
        {/* Back */}
        <button
          onClick={() => navigate("/insights")}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-10 group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Insights
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">{article.cat}</span>
            <span className="text-xs text-white/30">{article.time}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white leading-snug mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {article.title}
          </h1>
          <p className="text-white/45 text-base leading-relaxed">{article.desc}</p>
          <div className="mt-6 h-px bg-white/7" />
        </motion.div>

        {/* Body */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-6">
          {article.body.map((block, i) =>
            block.type === "h3" ? (
              <h3 key={i} className="text-lg font-semibold text-white pt-4" style={{ fontFamily: "'Playfair Display', serif" }}>{block.text}</h3>
            ) : (
              <p key={i} className="text-white/55 leading-relaxed text-[15px]">{block.text}</p>
            )
          )}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-14 rounded-[20px] border border-indigo-500/20 bg-indigo-500/5 p-8">
          <p className="text-sm font-semibold text-white mb-2">Ready to apply these insights?</p>
          <p className="text-sm text-white/40 mb-5 leading-relaxed">Book a growth consultation and we'll diagnose your specific marketplace challenges.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("openConsult"))}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/25 flex items-center gap-2"
          >
            Book a Growth Consultation <ArrowRight size={14} />
          </button>
        </motion.div>

        {/* More articles */}
        <div className="mt-14">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">More Articles</p>
          <div className="space-y-4">
            {articles.filter((a) => a.slug !== slug).map((a) => (
              <Link key={a.slug} to={`/insights/${a.slug}`} className="flex items-start gap-4 p-4 rounded-[14px] border border-white/6 bg-white/2 hover:border-indigo-500/25 hover:bg-white/4 transition-all duration-200 group">
                <BookOpen size={16} className="text-indigo-400/50 shrink-0 mt-0.5 group-hover:text-indigo-400 transition-colors" />
                <div>
                  <span className="text-xs text-indigo-400/70 mb-1 block">{a.cat}</span>
                  <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-snug">{a.title}</p>
                </div>
                <ArrowRight size={13} className="text-white/20 group-hover:text-indigo-400 shrink-0 mt-1 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Portal ────────────────────────────────────────────────────────

const individualServices = [
  {
    id: "catalog",
    name: "Product Catalog Creation",
    desc: "Professional product listings with SEO-optimized titles, descriptions, attributes and images.",
    price: "₹30 per SKU",
    hasQty: true,
  },
  {
    id: "advertising",
    name: "Advertising & Campaign Management",
    desc: "Campaign setup, keyword research, bid optimization and reporting.",
    price: "₹7,000 / month",
    hasQty: false,
  },
  {
    id: "pricing",
    name: "Pricing & Inventory Management",
    desc: "Inventory planning, pricing optimization and sales analysis.",
    price: "₹3,000 / month",
    hasQty: false,
  },
  {
    id: "brand",
    name: "Brand & Marketplace Approvals",
    desc: "Brand registration, listing approvals and marketplace compliance.",
    price: "Starting ₹5,000",
    hasQty: false,
  },
];

const managementPlans = [
  { id: "plan-1m", duration: "1 Month", price: "₹15,000", desc: "Complete catalog, inventory, pricing, ads, sales strategy, and account monitoring." },
  { id: "plan-2m", duration: "2 Months", price: "₹20,000", desc: "External strategic oversight, performance optimization, business reports, and analytics." },
  { id: "plan-3m", duration: "3 Months", price: "₹25,000", desc: "Long term brand scaling, dedicated brand growth consultation, and total marketplace management." },
];

function ServiceCard({
  name, desc, price, hasQty, selected, qty, onToggle, onQtyChange,
}: {
  name: string; desc: string; price: string;
  hasQty?: boolean; selected: boolean; qty: number;
  onToggle: () => void; onQtyChange: (q: number) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      onClick={onToggle}
      className="relative rounded-[18px] border p-6 cursor-pointer transition-all duration-200 flex flex-col gap-4"
      style={{
        background: selected ? "rgba(99,102,241,0.06)" : "#0c1221",
        borderColor: selected ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="absolute top-4 right-4 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150"
        style={{
          background: selected ? "#6366f1" : "transparent",
          borderColor: selected ? "#6366f1" : "rgba(255,255,255,0.2)",
        }}
      >
        {selected && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
      </div>

      <div className="space-y-2 pr-6">
        <p className="text-sm font-semibold text-white leading-snug">{name}</p>
        <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
      </div>

      <div className="mt-auto space-y-3">
        <p className="text-sm font-semibold text-indigo-400">{price}</p>
        <AnimatePresence>
          {hasQty && selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs text-white/40">SKU Qty:</label>
                <button
                  onClick={() => onQtyChange(Math.max(1, qty - 1))}
                  className="w-6 h-6 rounded-md bg-white/8 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center text-sm transition-colors"
                >−</button>
                <span className="w-8 text-center text-sm text-white font-medium">{qty}</span>
                <button
                  onClick={() => onQtyChange(qty + 1)}
                  className="w-6 h-6 rounded-md bg-white/8 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center text-sm transition-colors"
                >+</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PlanCard({
  id, duration, price, desc, selected, onSelect,
}: {
  id: string; duration: string; price: string; desc: string; selected: boolean; onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      onClick={onSelect}
      className="relative rounded-[18px] border p-6 cursor-pointer transition-all duration-200 flex flex-col gap-3 h-full"
      style={{
        background: selected ? "rgba(99,102,241,0.06)" : "#0c1221",
        borderColor: selected ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150"
        style={{
          background: selected ? "#6366f1" : "transparent",
          borderColor: selected ? "#6366f1" : "rgba(255,255,255,0.2)",
        }}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <p className="text-sm font-semibold text-white pr-6">{duration}</p>
      <p className="text-xl font-semibold text-indigo-400">{price}</p>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Numeric base prices for calculation
const serviceBasePrice: Record<string, number> = {
  catalog: 30,       // per SKU × qty
  advertising: 7000,
  pricing: 3000,
  brand: 5000,
};
const planBasePrice: Record<string, number> = {
  "plan-1m": 15000,
  "plan-2m": 20000,
  "plan-3m": 25000,
};

function fmt(n: number) {
  return "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ── Razorpay Key ID (public — safe in frontend) ───────────────────────────────
// To update: change only this constant. The Secret Key lives in Supabase Secrets.
const RAZORPAY_KEY_ID = "rzp_live_TIEDxqua3lfAOc";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4d3Rlc3J2dmxhbW1ycHRhYmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTIzMjksImV4cCI6MjEwMTQyODMyOX0.UAAeuvHktJJYNuB1Nkgw_vYPbpX4U5UOxcZFBVi5xCs";
const SUPABASE_FUNCTION_BASE =
  "https://pxwtesrvvlammrptabep.supabase.co/functions/v1/make-server-3ba67fd8";
const CREATE_ORDER_URL  = `${SUPABASE_FUNCTION_BASE}/create-razorpay-order`;
const VERIFY_URL        = `${SUPABASE_FUNCTION_BASE}/verify-razorpay-payment`;

// ── Razorpay global type ──────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

interface PaymentResult {
  paymentId:   string;
  orderId:     string;
  customerName: string;
  amount:      number;
  paidAt:      Date;
  services:    string[];
}

function PaymentPage() {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [skuQty, setSkuQty] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Load Razorpay checkout script once
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id  = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Compute subtotal — unchanged from existing logic
  const subtotal = (() => {
    let total = 0;
    selectedServices.forEach((id) => {
      total += id === "catalog" ? serviceBasePrice.catalog * skuQty : (serviceBasePrice[id] ?? 0);
    });
    if (selectedPlan) total += planBasePrice[selectedPlan] ?? 0;
    return total;
  })();
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;
  const hasSelection = selectedServices.size > 0 || selectedPlan !== null;

  const handleProceed = async () => {
    setOrderError(null);

    // Field validation
    if (!form.name.trim()) { setOrderError("Please enter your full name."); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setOrderError("Please enter a valid email address."); return;
    }
    if (!form.phone.trim()) { setOrderError("Please enter your phone number."); return; }
    if (!hasSelection) { setOrderError("Please select at least one service."); return; }

    // Build human-readable service list for notes + success screen
    const serviceLabels: string[] = [];
    selectedServices.forEach((id) => {
      const svc = individualServices.find((s) => s.id === id);
      if (svc) serviceLabels.push(id === "catalog" ? `${svc.name} (×${skuQty} SKUs)` : svc.name);
    });
    if (selectedPlan) {
      const plan = managementPlans.find((p) => p.id === selectedPlan);
      if (plan) serviceLabels.push(`Complete Marketplace Management — ${plan.duration}`);
    }

    setOrdering(true);
    try {
      // Step 1: create Razorpay order on the server (Secret Key never leaves backend)
      const orderRes = await fetch(CREATE_ORDER_URL, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customerName:     form.name.trim(),
          email:            form.email.trim(),
          phone:            form.phone.trim(),
          companyName:      form.company.trim(),
          selectedServices: serviceLabels,
          grandTotal,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setOrderError(orderData.message ?? "Failed to create payment order. Please try again.");
        return;
      }

      // Step 2: open Razorpay checkout popup
      const rzp = new window.Razorpay({
        key:         RAZORPAY_KEY_ID,
        amount:      orderData.amount,    // paise from server
        currency:    orderData.currency,
        name:        "PY Growth",
        image:       logoSrc,
        order_id:    orderData.order_id,
        prefill: {
          name:    form.name.trim(),
          email:   form.email.trim(),
          contact: form.phone.trim(),
        },
        theme: { color: "#6366f1" },

        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          // Step 3: verify signature on server before showing success
          try {
            const verifyRes = await fetch(VERIFY_URL, {
              method: "POST",
              headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                order_id:   response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature:  response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              setPaymentResult({
                paymentId:    response.razorpay_payment_id,
                orderId:      response.razorpay_order_id,
                customerName: form.name.trim(),
                amount:       grandTotal,
                paidAt:       new Date(),
                services:     serviceLabels,
              });
            } else {
              setOrderError("Payment received but verification failed. Please contact support with your Payment ID: " + response.razorpay_payment_id);
            }
          } catch {
            setOrderError("Payment received but could not be verified. Please contact support.");
          }
          setOrdering(false);
        },

        modal: {
          ondismiss: () => {
            setOrdering(false);
            setOrderError("Payment was cancelled. Your selections are saved — you can try again.");
          },
        },
      });

      rzp.open();
      // Note: setOrdering(false) is called inside handler/ondismiss, not here,
      // because the checkout popup is async and runs after this function returns.

    } catch (err) {
      console.error("handleProceed error:", err);
      setOrderError("Network error. Please check your connection and try again.");
      setOrdering(false);
    }
  };

  // ── Payment Success Screen ────────────────────────────────────────────────
  if (paymentResult) {
    const { paymentId, orderId, customerName, amount, paidAt, services } = paymentResult;
    const dateStr = paidAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = paidAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return (
      <div className="min-h-screen pt-24 pb-24 bg-[#080c14]">
        <div className="max-w-[680px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10 space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={26} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Payment Successful
            </h1>
            <p className="text-white/40 text-sm">
              Thank you, {customerName}. Your payment has been received and verified.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[20px] border border-white/8 bg-[#0c1221] p-7 space-y-6"
          >
            {/* Amount */}
            <div className="text-center border-b border-white/6 pb-6">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Amount Paid</p>
              <p className="text-4xl font-semibold text-indigo-400" style={{ fontFamily: "'Playfair Display', serif" }}>
                {fmt(amount)}
              </p>
            </div>

            {/* Details grid */}
            <div className="space-y-4">
              {[
                { label: "Payment ID",  value: paymentId },
                { label: "Order ID",    value: orderId },
                { label: "Customer",    value: customerName },
                { label: "Date & Time", value: `${dateStr} at ${timeStr}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs text-white/35 shrink-0">{label}</span>
                  <span className="text-sm text-white/70 sm:text-right font-mono break-all">{value}</span>
                </div>
              ))}
            </div>

            {/* Services */}
            <div className="border-t border-white/6 pt-5">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Services Purchased</p>
              <div className="space-y-2">
                {services.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <CheckCircle size={13} className="text-emerald-500/60 shrink-0 mt-0.5" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-center text-xs text-white/25 mt-8"
          >
            A confirmation will be sent to your registered email. For any queries, contact us at{" "}
            <span className="text-white/40">info@pygrowth.in</span>
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 bg-[#080c14]">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 space-y-4"
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Secure Payment Portal
          </h1>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
            Review your selected services and complete your payment securely.
          </p>
        </motion.div>

        {/* ── Services ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Choose Your Services
            </h2>
            <p className="text-xs text-white/35">Select one or more services below. You may also choose a management plan.</p>
          </div>

          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Individual Services</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {individualServices.map((s) => (
              <ServiceCard
                key={s.id}
                {...s}
                selected={selectedServices.has(s.id)}
                qty={skuQty}
                onToggle={() => toggleService(s.id)}
                onQtyChange={setSkuQty}
              />
            ))}
          </div>

          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Complete Marketplace Management Plans</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            {managementPlans.map((p) => (
              <PlanCard
                key={p.id}
                {...p}
                selected={selectedPlan === p.id}
                onSelect={() => setSelectedPlan(selectedPlan === p.id ? null : p.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Payment Summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="rounded-[20px] border border-white/8 bg-[#0c1221] p-7">
            <h3 className="text-base font-semibold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Payment Summary
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Selected Services</p>
                <AnimatePresence initial={false}>
                  {!hasSelection ? (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-white/25 italic"
                    >
                      No services selected.
                    </motion.p>
                  ) : (
                    <>
                      {[...selectedServices].map((id) => {
                        const svc = individualServices.find((s) => s.id === id);
                        if (!svc) return null;
                        const linePrice = id === "catalog"
                          ? serviceBasePrice.catalog * skuQty
                          : serviceBasePrice[id];
                        return (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start justify-between text-sm gap-4"
                          >
                            <div>
                              <span className="text-white/60">{svc.name}</span>
                              {id === "catalog" && (
                                <span className="text-white/30 text-xs ml-2">× {skuQty} SKU</span>
                              )}
                            </div>
                            <span className="text-white/60 shrink-0">{fmt(linePrice)}</span>
                          </motion.div>
                        );
                      })}
                      <AnimatePresence>
                        {selectedPlan && (() => {
                          const plan = managementPlans.find((p) => p.id === selectedPlan);
                          return plan ? (
                            <motion.div
                              key={selectedPlan}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-white/60">Management Plan — {plan.duration}</span>
                              <span className="text-white/60">{fmt(planBasePrice[plan.id])}</span>
                            </motion.div>
                          ) : null;
                        })()}
                      </AnimatePresence>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="border-t border-white/6 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Subtotal</span>
                  <motion.span
                    key={subtotal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-white/60"
                  >
                    {hasSelection ? fmt(subtotal) : "—"}
                  </motion.span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">GST (18%)</span>
                  <motion.span
                    key={gst}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-white/60"
                  >
                    {hasSelection ? fmt(gst) : "—"}
                  </motion.span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-white/6 pt-3">
                  <span className="text-white font-semibold">Total Payable</span>
                  <motion.span
                    key={grandTotal}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-indigo-400 font-semibold text-base"
                  >
                    {hasSelection ? fmt(grandTotal) : "—"}
                  </motion.span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Step 2: Client Details ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Client Details
            </h2>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-[#0c1221] p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { key: "name", label: "Full Name", placeholder: "Your full name", type: "text" },
                { key: "email", label: "Email Address", placeholder: "you@company.com", type: "email" },
                { key: "phone", label: "Phone Number", placeholder: "+91 98765 43210", type: "tel" },
                { key: "company", label: "Company / Brand Name", placeholder: "Your brand or company", type: "text" },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-white/50">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className="rounded-xl border border-white/10 bg-[#131928] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Proceed Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 space-y-3"
        >
          {/* Error feedback */}
          <AnimatePresence>
            {orderError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-xs text-red-400 flex items-center gap-2"
              >
                <AlertCircle size={13} className="shrink-0" />
                {orderError}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={!hasSelection || ordering}
            onClick={handleProceed}
            className="w-full py-4 text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none bg-indigo-600 enabled:hover:bg-indigo-500 enabled:hover:shadow-lg enabled:hover:shadow-indigo-600/25 enabled:hover:-translate-y-0.5"
          >
            {ordering ? (
              <>
                <Loader size={15} className="animate-spin" />
                Opening Payment…
              </>
            ) : (
              <>
                Proceed to Secure Payment <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>

        {/* ── Trust badges ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-2"
        >
          {[
            "Payments Powered by Razorpay",
            "SSL Secured",
            "256-bit Encryption",
          ].map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-xs text-white/30">
              <CheckCircle size={12} className="text-emerald-500/60 shrink-0" />
              {badge}
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}

function ContactPage() {
  const onConsult = useOutletContext<() => void>();
  return (
    <div className="pt-20">
      <AboutSection />
      <ConsultationSection onConsult={onConsult} />
    </div>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-white/20 text-7xl font-bold mb-4">404</p>
      <p className="text-white/50 text-base mb-6">Page not found.</p>
      <button onClick={() => navigate("/")} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
        Back to Home
      </button>
    </div>
  );
}

// ─── Root layout ───────────────────────────────────────────────────────────

function Root() {
  const [consultOpen, setConsultOpen] = useState(false);
  const openConsult = useCallback(() => setConsultOpen(true), []);

  useEffect(() => {
    const handler = () => setConsultOpen(true);
    window.addEventListener("openConsult", handler);
    return () => window.removeEventListener("openConsult", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar onConsult={openConsult} />
      <Outlet context={openConsult} />
      <Footer />
      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </div>
  );
}

// ─── Router & App ──────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "solutions", Component: SolutionsPage },
      { path: "growth-os", Component: GrowthOSPage },
      { path: "insights", Component: InsightsPage },
      { path: "insights/:slug", Component: ArticlePage },
      { path: "payment-portal", Component: PaymentPage },
      { path: "contact", Component: ContactPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

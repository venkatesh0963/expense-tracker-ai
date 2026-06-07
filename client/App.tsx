import React, { useState, useEffect, useRef } from "react";
import {
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  Trash2,
  BrainCircuit,
  IndianRupee,
  Send,
  Loader2,
  Search,
  Bot,
  Sun,
  Moon
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Transaction,
  ParsedTransaction
} from "./types";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  parseTransaction,
  streamFinancialAdvice
} from "./services/api";

const FloatingStickers = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-10 dark:opacity-5">
      <div className="absolute top-[10%] left-[5%] animate-float-1 text-sky-500">
        <IndianRupee size={64} />
      </div>
      <div className="absolute top-[20%] right-[10%] animate-float-2 text-indigo-500">
        <Bot size={80} />
      </div>
      <div className="absolute bottom-[15%] left-[15%] animate-float-2 text-rose-500">
        <PieChartIcon size={72} />
      </div>
      <div className="absolute bottom-[20%] right-[5%] animate-float-1 text-emerald-500">
        <Wallet size={96} />
      </div>
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 animate-float-1 text-purple-500 opacity-50">
        <Sparkles size={120} />
      </div>
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiInput, setAiInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  
  const [adviceActive, setAdviceActive] = useState(false);
  const [adviceContent, setAdviceContent] = useState("");
  const [isAdvising, setIsAdvising] = useState(false);
  
  const adviceEndRef = useRef<HTMLDivElement>(null);

  const [manualForm, setManualForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (adviceEndRef.current) {
      adviceEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adviceContent]);

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    
    setIsParsing(true);
    try {
      const parsed = await parseTransaction(aiInput);
      setManualForm(prev => ({
        ...prev,
        type: parsed.type || 'expense',
        amount: parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, '') : '',
        category: parsed.category || 'General',
        description: parsed.description || aiInput,
      }));
      setAiInput("");
    } catch (err) {
      console.error("AI parse error:", err);
      alert("Failed to parse transaction. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.amount || !manualForm.category || !manualForm.description || !manualForm.date) return;
    
    try {
      const newTx = await addTransaction({
        type: manualForm.type,
        amount: parseFloat(manualForm.amount),
        category: manualForm.category,
        description: manualForm.description,
        date: new Date(manualForm.date).getTime()
      });
      setTransactions(prev => [newTx, ...prev].sort((a,b) => b.date - a.date));
      setManualForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add transaction");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const loadDummyData = async () => {
    const dummyTransactions = [
      { type: 'income', amount: 5200, category: 'Salary', description: 'Monthly Tech Salary', date: Date.now() - 86400000 * 10 },
      { type: 'expense', amount: 1500, category: 'Rent', description: 'Downtown Apartment', date: Date.now() - 86400000 * 9 },
      { type: 'expense', amount: 125.5, category: 'Food', description: 'Whole Foods Groceries', date: Date.now() - 86400000 * 7 },
      { type: 'expense', amount: 45.0, category: 'Entertainment', description: 'Movie Tickets', date: Date.now() - 86400000 * 5 },
      { type: 'expense', amount: 18.0, category: 'Transport', description: 'Uber Ride', date: Date.now() - 86400000 * 4 },
      { type: 'expense', amount: 120.0, category: 'Utilities', description: 'Electric Bill', date: Date.now() - 86400000 * 3 },
      { type: 'expense', amount: 4.5, category: 'Food', description: 'Morning Coffee', date: Date.now() - 86400000 * 1 },
      { type: 'income', amount: 450, category: 'Freelance', description: 'UI Design Gig', date: Date.now() }
    ];
    
    setLoading(true);
    try {
      for (const t of dummyTransactions) {
        await addTransaction(t as any);
      }
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to load dummy data");
    }
  };

  const generateAdvice = async () => {
    if (transactions.length === 0) {
      alert("Add some transactions first!");
      return;
    }
    setAdviceActive(true);
    setIsAdvising(true);
    setAdviceContent("");
    try {
      const stream = streamFinancialAdvice(transactions);
      for await (const chunk of stream) {
        setAdviceContent(prev => prev + chunk);
      }
    } catch (err) {
      console.error(err);
      setAdviceContent("Failed to generate advice. Please try again.");
    } finally {
      setIsAdvising(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-sky-500/30 transition-colors duration-300 relative z-0">
      <FloatingStickers />
      <nav className="border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl shadow-lg shadow-sky-500/20">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
               AI EXPENSE TRACKER
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg transition-all focus:ring-2 focus:ring-sky-500/50"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-sky-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
            <button 
              onClick={loadDummyData}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg transition-all text-sm font-medium focus:ring-2 focus:ring-emerald-500/50"
            >
              Load Dummy Data
            </button>
            <button 
              onClick={generateAdvice}
              disabled={isAdvising}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg transition-all text-sm font-medium focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50 shadow-sm dark:shadow-none"
            >
              {isAdvising ? <Loader2 className="w-4 h-4 animate-spin text-sky-500 dark:text-sky-400" /> : <Bot className="w-4 h-4 text-sky-500 dark:text-sky-400" />}
              AI Advisor
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Dashboard & Forms */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-500/10 dark:to-sky-500/10 border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Net Balance</h3>
                  <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">₹{netBalance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="flex gap-2 items-center text-emerald-600 dark:text-emerald-400 mb-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Income</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="flex gap-2 items-center text-rose-600 dark:text-rose-400 mb-2">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Expenses</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">₹{totalExpense.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* AI Quick Add */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-lg dark:shadow-xl relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-sky-500 dark:text-sky-400" />
              Magic Add
            </h3>
            <form onSubmit={handleAiParse} className="relative">
              <input
                type="text"
                placeholder="e.g. Bought a coffee for ₹4.50"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={isParsing}
              />
              <button 
                type="submit" 
                disabled={isParsing || !aiInput.trim()}
                className="absolute right-2 top-2 p-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition-colors disabled:opacity-50"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Manual Form */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none transition-colors duration-300">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
              <Plus className="w-5 h-5" />
              Add Detail
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-black/40 rounded-lg">
                <button
                  type="button"
                  onClick={() => setManualForm(f => ({ ...f, type: 'expense' }))}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    manualForm.type === 'expense' 
                      ? 'bg-white dark:bg-white/10 text-rose-600 dark:text-rose-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setManualForm(f => ({ ...f, type: 'income' }))}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    manualForm.type === 'income' 
                      ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Income
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                  <input required type="number" step="0.01" value={manualForm.amount} onChange={e => setManualForm(f => ({...f, amount: e.target.value}))} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input required type="date" value={manualForm.date} onChange={e => setManualForm(f => ({...f, date: e.target.value}))} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-3 text-sm flex-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors dark:[color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <input required type="text" value={manualForm.category} onChange={e => setManualForm(f => ({...f, category: e.target.value}))} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="Groceries, Salary, etc." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input required type="text" value={manualForm.description} onChange={e => setManualForm(f => ({...f, description: e.target.value}))} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="More details..." />
              </div>

              <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors text-sm mt-2">
                Save Transaction
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: List & AI Advice */}
        <div className="lg:col-span-8 space-y-6 flex flex-col min-h-0 h-full">
          
          {adviceActive && (
            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-500/30 rounded-2xl p-6 shadow-xl shadow-sky-900/5 dark:shadow-sky-900/20 relative overflow-hidden flex-shrink-0 animate-in fade-in slide-in-from-top-4 transition-colors duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
              <div className="flex items-center gap-3 mb-4 text-sky-600 dark:text-sky-400 border-b border-slate-100 dark:border-white/5 pb-4">
                <BrainCircuit className="w-6 h-6" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Financial Insights</h2>
                {isAdvising && <span className="ml-auto flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>}
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 prose prose-slate dark:prose-invert max-w-none 
                  prose-h3:text-sky-600 dark:prose-h3:text-sky-300 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed text-sm
                  prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white
                  max-h-[300px] overflow-y-auto pr-4 custom-scrollbar"
                >
                  {adviceContent ? (
                    <ReactMarkdown>{adviceContent}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-500 animate-pulse">Analyzing your financial patterns...</p>
                  )}
                  <div ref={adviceEndRef} />
                </div>
                
                {pieData.length > 0 && (
                  <div className="w-full lg:w-64 h-64 flex-shrink-0 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/5 pt-4 lg:pt-0 lg:pl-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Expenses by Category</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `₹${value.toFixed(2)}`}
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                            borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 rounded-2xl flex-1 flex flex-col overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <PieChartIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Recent History
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-10">
                  <Search className="w-10 h-10 opacity-20" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{tx.category}</span>
                            <span>•</span>
                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;

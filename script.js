import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Bell, Plus, Trash2 } from "lucide-react";

const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4","#a855f7"];

export default function ExpenseApp() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("all");
  const [budgets, setBudgets] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("expenses");
    const savedBudgets = localStorage.getItem("budgets");
    if (saved) setExpenses(JSON.parse(saved));
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
  }, []);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  const addExpense = () => {
    if (!amount || !category) return;
    const newExpense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString()
    };
    setExpenses([newExpense, ...expenses]);

    if (budgets[category] && budgets[category] < (newExpense.amount + getCategoryTotal(category))) {
      alert("⚠️ Превышен бюджет: " + category);
    }

    setAmount("");
    setCategory("");
  };

  const getCategoryTotal = (cat) => {
    return expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (filter === "day") return d.toDateString() === now.toDateString();
      if (filter === "week") {
        const w = new Date(); w.setDate(now.getDate() - 7);
        return d >= w;
      }
      if (filter === "month") return d.getMonth() === now.getMonth();
      return true;
    });
  }, [expenses, filter]);

  const stats = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.keys(map).map(key => ({ name: key, value: map[key] }));
  }, [filteredExpenses]);

  const lineData = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(e => {
      const d = new Date(e.date).toLocaleDateString();
      map[d] = (map[d] || 0) + e.amount;
    });
    return Object.keys(map).map(date => ({ date, value: map[date] }));
  }, [filteredExpenses]);

  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-4 font-sans">
      <h1 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
        💸 Finance Pro
      </h1>

      <Card className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 mb-4 rounded-2xl shadow-2xl">
        <CardContent className="p-3 flex gap-2">
          <Input className="bg-zinc-800 border-none" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input className="bg-zinc-800 border-none" placeholder="Категория" value={category} onChange={e => setCategory(e.target.value)} />
          <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={addExpense}><Plus size={16} /></Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-4">
        {["all","day","week","month"].map(f => (
          <Button
            key={f}
            className={`rounded-xl ${filter===f ? "bg-indigo-500" : "bg-zinc-800"}`}
            onClick={()=>setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl shadow-xl">
          <CardContent className="p-3">
            <h2 className="mb-2 text-sm text-zinc-400">Категории</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats} dataKey="value" outerRadius={70}>
                  {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl shadow-xl">
          <CardContent className="p-3">
            <h2 className="mb-2 text-sm text-zinc-400">Динамика</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 text-lg font-semibold">Итого: <span className="text-indigo-400">{total} ₽</span></div>

      <Card className="bg-zinc-900/80 backdrop-blur mt-4 border border-zinc-800 rounded-2xl">
        <CardContent className="p-3">
          <h2 className="mb-2 flex items-center gap-2 text-sm text-zinc-400"><Bell size={16}/> Бюджеты</h2>
          {Object.keys(budgets).map(cat => (
            <div key={cat} className="flex justify-between text-sm text-zinc-300">
              <span>{cat}</span>
              <span>{getCategoryTotal(cat)} / {budgets[cat]} ₽</span>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Input className="bg-zinc-800 border-none" placeholder="Категория" onChange={e=>setCategory(e.target.value)} />
            <Input className="bg-zinc-800 border-none" placeholder="Лимит" onChange={e=>setAmount(e.target.value)} />
            <Button className="bg-green-500" onClick={()=>setBudgets({...budgets, [category]: parseFloat(amount)})}>OK</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-2 max-h-64 overflow-auto">
        {filteredExpenses.map(e => (
          <motion.div key={e.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            className="flex justify-between items-center bg-zinc-800/80 backdrop-blur p-3 rounded-xl shadow-md hover:scale-[1.02] transition">
            <span className="text-sm">{e.category}</span>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-semibold">{e.amount} ₽</span>
              <Trash2 size={14} className="cursor-pointer text-red-400" onClick={()=>setExpenses(expenses.filter(x=>x.id!==e.id))} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

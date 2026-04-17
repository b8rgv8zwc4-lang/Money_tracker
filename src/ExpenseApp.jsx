import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { motion } from 'framer-motion'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Bell, Plus, Trash2 } from 'lucide-react'

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
if (tg) tg.expand()

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7']

export default function ExpenseApp() {
    const [expenses, setExpenses] = useState([])
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [filter, setFilter] = useState('all')
    const [budgets, setBudgets] = useState({})

    useEffect(() => {
        const saved = localStorage.getItem('expenses')
        const savedBudgets = localStorage.getItem('budgets')
        if (saved) setExpenses(JSON.parse(saved))
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets))
    }, [])

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses))
    }, [expenses])

    useEffect(() => {
        localStorage.setItem('budgets', JSON.stringify(budgets))
    }, [budgets])

    const addExpense = () => {
        if (!amount || !category) return
        const newExpense = {
            id: Date.now(),
            amount: parseFloat(amount),
            category,
            date: new Date().toISOString()
        }
        setExpenses([newExpense, ...expenses])

        if (budgets[category] && budgets[category] < (newExpense.amount + getCategoryTotal(category))) {
            alert('⚠️ Превышен бюджет: ' + category)
        }

        setAmount('')
        setCategory('')
    }

    const getCategoryTotal = (cat) => {
        return expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
    }

    const filteredExpenses = useMemo(() => {
        const now = new Date()
        return expenses.filter(e => {
            const d = new Date(e.date)
            if (filter === 'day') return d.toDateString() === now.toDateString()
            if (filter === 'week') {
                const w = new Date(); w.setDate(now.getDate() - 7)
                return d >= w
            }
            if (filter === 'month') return d.getMonth() === now.getMonth()
            return true
        })
    }, [expenses, filter])

    const stats = useMemo(() => {
        const map = {}
        filteredExpenses.forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount
        })
        return Object.keys(map).map(key => ({ name: key, value: map[key] }))
    }, [filteredExpenses])

    const lineData = useMemo(() => {
        const map = {}
        filteredExpenses.forEach(e => {
            const d = new Date(e.date).toLocaleDateString()
            map[d] = (map[d] || 0) + e.amount
        })
        return Object.keys(map).map(date => ({ date, value: map[date] }))
    }, [filteredExpenses])

    const total = filteredExpenses.reduce((s, e) => s + e.amount, 0)

    return (
        <div className="app-container">
            <h1 className="title">💸 Finance Pro</h1>

            <Card className="card">
                <CardContent className="card-content">
                    <Input placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} />
                    <Input placeholder="Категория" value={category} onChange={e => setCategory(e.target.value)} />
                    <Button onClick={addExpense}><Plus size={16} /></Button>
                </CardContent>
            </Card>

            <div className="filters">
                {["all", "day", "week", "month"].map(f => (
                    <Button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</Button>
                ))}
            </div>

            <div className="grid">
                <Card className="card">
                    <CardContent>
                        <h2>Категории</h2>
                        <div style={{ width: '100%', height: 200 }}>
                            <PieChart width={300} height={200}>
                                <Pie data={stats} dataKey="value" outerRadius={70}>
                                    {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card">
                    <CardContent>
                        <h2>Динамика</h2>
                        <div style={{ width: '100%', height: 200 }}>
                            <LineChart data={lineData} width={400} height={200}>
                                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                                <XAxis dataKey="date" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} />
                            </LineChart>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="total">Итого: <span>{total} ₽</span></div>

            <Card className="card">
                <CardContent>
                    <h2><Bell size={16} /> Бюджеты</h2>
                    {Object.keys(budgets).map(cat => (
                        <div key={cat} className="budget-row">
                            <span>{cat}</span>
                            <span>{getCategoryTotal(cat)} / {budgets[cat]} ₽</span>
                        </div>
                    ))}
                    <div className="budget-form">
                        <Input placeholder="Категория" onChange={e => setCategory(e.target.value)} />
                        <Input placeholder="Лимит" onChange={e => setAmount(e.target.value)} />
                        <Button onClick={() => setBudgets({ ...budgets, [category]: parseFloat(amount) })}>OK</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="list">
                {filteredExpenses.map(e => (
                    <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="list-item">
                        <span>{e.category}</span>
                        <div className="row-actions">
                            <span className="amount">{e.amount} ₽</span>
                            <Trash2 size={14} className="trash" onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    fetch(`${BACKEND}/me`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setUser(d.user))
      .catch(() => { setUser(null) })
  }, [token])

  const login = (t) => { localStorage.setItem('token', t); setToken(t) }
  const logout = () => { localStorage.removeItem('token'); setToken(null); setUser(null) }

  return { token, user, login, logout }
}

function AuthView({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const url = mode === 'login' ? `${BACKEND}/auth/login` : `${BACKEND}/auth/register`
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Error')
      const data = await res.json()
      onAuth(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600/90 shadow-lg shadow-sky-600/30" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">FinWise</span>
        </div>
        <ThemeToggle />
      </nav>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Tu dinero, claro y bajo control</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-prose">Gestiona ingresos y gastos, define metas, analiza tendencias y mejora tus finanzas con una experiencia tipo banca digital.</p>
          <form onSubmit={submit} className="mt-6 p-4 rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm dark:bg-slate-800/60 dark:border-slate-700">
            {mode === 'register' && (
              <div className="mb-3">
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" required />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" required />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" required />
            </div>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <div className="flex items-center gap-3">
              <button disabled={loading} className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:opacity-95 disabled:opacity-60">{loading? 'Procesando…' : (mode==='login'?'Entrar':'Crear cuenta')}</button>
              <button type="button" onClick={()=>setMode(mode==='login'?'register':'login')} className="text-sky-700 dark:text-sky-400 hover:underline">
                {mode==='login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </button>
            </div>
          </form>
          <div className="mt-3 text-xs text-slate-500">Tip: usa el botón de tema arriba para activar modo oscuro.</div>
        </div>
        <div className="order-1 md:order-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
          <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" />
        </div>
      </div>
    </div>
  )
}

function ThemeToggle(){
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(()=>{ document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark?'dark':'light') },[dark])
  return (
    <button onClick={()=>setDark(!dark)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
      {dark ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  )
}

function Dashboard({ token, onLogout }){
  const headers = useMemo(()=>({ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }),[token])
  const [summary, setSummary] = useState({ income:0, expenses:0, savings:0, monthly:[], by_category:[] })
  const [txs, setTxs] = useState([])
  const [form, setForm] = useState({ type:'expense', amount:'', category:'General', date: new Date().toISOString().slice(0,10), note:''})
  const [goals, setGoals] = useState([])

  const loadAll = async ()=>{
    const [s, t, g] = await Promise.all([
      fetch(`${BACKEND}/stats/summary`, { headers }).then(r=>r.json()),
      fetch(`${BACKEND}/transactions`, { headers }).then(r=>r.json()),
      fetch(`${BACKEND}/goals`, { headers }).then(r=>r.json()),
    ])
    setSummary(s); setTxs(t); setGoals(g)
  }

  useEffect(()=>{ loadAll() },[])

  const addTx = async (e)=>{
    e.preventDefault()
    const body = { ...form, amount: Number(form.amount), date: new Date(form.date).toISOString() }
    const res = await fetch(`${BACKEND}/transactions`, { method:'POST', headers, body: JSON.stringify(body) })
    if (res.ok){ setForm({ ...form, amount:'', note:'' }); await loadAll() }
  }

  const addGoal = async (e)=>{
    e.preventDefault()
    const body = { name: e.target.name.value, target_amount: Number(e.target.target_amount.value), current_amount: Number(e.target.current_amount.value||0), deadline: e.target.deadline.value? new Date(e.target.deadline.value).toISOString(): null }
    const res = await fetch(`${BACKEND}/goals`, { method:'POST', headers, body: JSON.stringify(body) })
    if(res.ok) await loadAll()
  }

  const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6']

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-400">Resumen de tus finanzas</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={onLogout} className="px-3 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-700">Salir</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Ingresos" value={`$ ${summary.income.toFixed?.(2) || 0}`}/>
          <StatCard title="Gastos" value={`$ ${summary.expenses.toFixed?.(2) || 0}`}/>
          <StatCard title="Ahorro neto" value={`$ ${summary.savings.toFixed?.(2) || 0}`}/>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 rounded-2xl p-4 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Evolución (6 meses)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={summary.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" /><YAxis /><Tooltip />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#c1)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#c2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Gasto por categoría</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={summary.by_category} dataKey="total" nameKey="category" innerRadius={50} outerRadius={80}>
                    {summary.by_category.map((_, i) => <Cell key={i} fill={colors[i%colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-4 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Transacciones</h3>
            <form onSubmit={addTx} className="grid sm:grid-cols-5 gap-2 mb-4">
              <select className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" value={form.type} onChange={e=>setForm(f=>({...f, type:e.target.value}))}>
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </select>
              <input type="number" step="0.01" placeholder="Monto" className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} required />
              <input placeholder="Categoría" className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
              <input type="date" className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
              <button className="px-3 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-700">Agregar</button>
            </form>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2">Fecha</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-100">
                  {txs.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2">{new Date(t.date).toLocaleDateString()}</td>
                      <td className={t.type==='income'? 'text-emerald-600':'text-rose-500'}>{t.type}</td>
                      <td>{t.category}</td>
                      <td>${Number(t.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Metas</h3>
            <form onSubmit={addGoal} className="space-y-2 mb-4">
              <input name="name" placeholder="Nombre de la meta" className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" required />
              <div className="grid grid-cols-2 gap-2">
                <input name="target_amount" type="number" step="0.01" placeholder="Objetivo" className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" required />
                <input name="current_amount" type="number" step="0.01" placeholder="Actual (opcional)" className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" />
              </div>
              <input name="deadline" type="date" className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700" />
              <button className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-700">Crear meta</button>
            </form>
            <ul className="space-y-3">
              {goals.map(g => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
                return (
                  <li key={g.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{g.name}</p>
                        <p className="text-xs text-slate-500">${g.current_amount.toFixed(2)} / ${g.target_amount.toFixed(2)}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{pct}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }){
  return (
    <div className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function App(){
  const { token, user, login, logout } = useAuth()
  if (!token) return <AuthView onAuth={login} />
  return <Dashboard token={token} onLogout={logout} />
}

export default App

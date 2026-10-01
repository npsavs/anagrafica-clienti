import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const item = ({ isActive }: { isActive: boolean }) =>
  'px-2 py-1 rounded text-sm ' + (isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600')

export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <nav className="flex flex-wrap gap-3">
            <NavLink to="/" end className={item}>Panoramica</NavLink>
            <NavLink to="/clienti" className={item}>Clienti</NavLink>
            <NavLink to="/fornitori" className={item}>Fornitori</NavLink>
            <NavLink to="/nuovo?kind=cliente" className={item}>+ Cliente</NavLink>
            <NavLink to="/nuovo?kind=fornitore" className={item}>+ Fornitore</NavLink>
          </nav>
          <button type="button" onClick={async () => { await supabase.auth.signOut(); navigate('/login') }} className="text-sm text-slate-600">Esci</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
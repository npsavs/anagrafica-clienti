import { Outlet, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">Anagrafica Clienti</Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            navigate('/login')
          }}
          className="text-sm text-slate-600 hover:text-red-600"
        >
          Esci
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
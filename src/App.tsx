import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Home from './pages/Home'
import Lista from './pages/Lista'
import Dettaglio from './pages/Dettaglio'
import Nuovo from './pages/Nuovo'
import Modifica from './pages/Modifica'
import Importa from './pages/Importa'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="p-10 text-center">Caricamento...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          <Route path="clienti" element={<Lista />} />
          <Route path="fornitori" element={<Lista />} />
          <Route path="nuovo" element={<Nuovo />} />
          <Route path="cliente/:id" element={<Dettaglio />} />
          <Route path="cliente/:id/modifica" element={<Modifica />} />
<Route path="importa" element={<Importa />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
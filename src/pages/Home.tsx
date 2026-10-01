import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    supabase.from('clients').select('id, kind, pec, codice_sdi, cf_piva, city').then(({ data }) => setRows(data || []))
  }, [])
  const clienti = rows.filter(r => (r.kind || 'cliente') !== 'fornitore')
  const fornitori = rows.filter(r => r.kind === 'fornitore')
  const senzaSdi = clienti.filter(r => !r.codice_sdi && !r.pec).length
  const senzaPiva = rows.filter(r => !r.cf_piva).length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Anagrafica</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/clienti" className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-slate-500">Clienti</p>
          <p className="text-xl font-bold">{clienti.length}</p>
        </Link>
        <Link to="/fornitori" className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-slate-500">Fornitori</p>
          <p className="text-xl font-bold">{fornitori.length}</p>
        </Link>
        <Link to="/clienti" className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-amber-700">Clienti senza SDI/PEC</p>
          <p className="text-xl font-bold">{senzaSdi}</p>
        </Link>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-slate-500">Senza P.IVA / CF</p>
          <p className="text-xl font-bold">{senzaPiva}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600">Prima dello SDI ogni cliente deve avere Codice SDI oppure PEC, piu P.IVA o CF.</p>
    </div>
  )
}
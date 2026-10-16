import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Svuota() {
  const navigate = useNavigate()
  const [log, setLog] = useState('')
  const [busy, setBusy] = useState(false)

  async function svuota() {
    if (!confirm('Cancellare TUTTE le anagrafiche? Non si annulla.')) return
    if (!confirm('Secondo conferma: cancello clienti e fornitori.')) return
    setBusy(true)
    setLog('Conto...')
    const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true })
    setLog('Trovate ' + (count || 0) + '. Cancello...')
    let tolti = 0
    while (true) {
      const { data } = await supabase.from('clients').select('id').limit(200)
      if (!data || data.length === 0) break
      const { error } = await supabase.from('clients').delete().in('id', data.map(r => r.id))
      if (error) { setBusy(false); return setLog('Errore: ' + error.message) }
      tolti += data.length
      setLog('Cancellati ' + tolti)
    }
    setBusy(false)
    setLog('Finito. Anagrafiche cancellate: ' + tolti)
    setTimeout(() => navigate('/importa'), 800)
  }

  return (
    <div className="space-y-4 max-w-xl">
      <Link to="/clienti" className="text-sm text-blue-600">Torna ai clienti</Link>
      <h1 className="text-2xl font-bold">Svuota anagrafiche</h1>
      <p className="text-sm text-slate-600">Cancella tutti i clienti e i fornitori. Le fatture e i preventivi restano, ma senza nome cliente.</p>
      <button type="button" disabled={busy} onClick={svuota} className="bg-red-600 text-white px-4 py-2 rounded-lg">Cancella tutte le anagrafiche</button>
      {log ? <p className="font-semibold">{log}</p> : null}
    </div>
  )
}

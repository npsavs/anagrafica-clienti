import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Svuota() {
  const navigate = useNavigate()
  const [log, setLog] = useState('')
  const [busy, setBusy] = useState(false)

  async function stacca(tabella: string) {
    setLog('Tolgo i collegamenti da ' + tabella + '...')
    while (true) {
      const { data } = await supabase.from(tabella).select('id').not('client_id', 'is', null).limit(200)
      if (!data || data.length === 0) break
      const { error } = await supabase.from(tabella).update({ client_id: null }).in('id', data.map((r: any) => r.id))
      if (error) throw error
    }
  }

  async function svuota() {
    if (!confirm('Cancellare TUTTE le anagrafiche? Non si annulla.')) return
    if (!confirm('Secondo conferma: cancello clienti e fornitori.')) return
    setBusy(true)
    try {
      for (const t of ['invoices', 'subscriptions', 'interventions', 'quotes']) {
        await stacca(t)
      }
      setLog('Collegamenti tolti. Cancello le anagrafiche...')
      let tolti = 0
      while (true) {
        const { data } = await supabase.from('clients').select('id').limit(200)
        if (!data || data.length === 0) break
        const { error } = await supabase.from('clients').delete().in('id', data.map(r => r.id))
        if (error) throw error
        tolti += data.length
        setLog('Cancellati ' + tolti)
      }
      setBusy(false)
      setLog('Finito. Anagrafiche cancellate: ' + tolti)
      setTimeout(() => navigate('/importa'), 800)
    } catch (e: any) {
      setBusy(false)
      setLog('Errore: ' + (e.message || e))
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <Link to="/clienti" className="text-sm text-blue-600">Torna ai clienti</Link>
      <h1 className="text-2xl font-bold">Svuota anagrafiche</h1>
      <p className="text-sm text-slate-600">Prima stacca fatture, abbonamenti, interventi e preventivi. Poi cancella tutti i clienti e i fornitori. I documenti restano, senza nome.</p>
      <button type="button" disabled={busy} onClick={svuota} className="bg-red-600 text-white px-4 py-2 rounded-lg">Cancella tutte le anagrafiche</button>
      {log ? <p className="font-semibold">{log}</p> : null}
    </div>
  )
}

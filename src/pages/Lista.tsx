import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export default function Lista() {
  const location = useLocation()
  const kind = location.pathname.indexOf('fornitori') >= 0 ? 'fornitore' : 'cliente'
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [citta, setCitta] = useState('')
  const [dato, setDato] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data || [])
    setLoading(false)
  }

  function chiave(c: Client) {
    return (c.name || '').trim().toLowerCase().replace(/\s+/g, ' ')
  }

  async function controllaDoppioni() {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) return alert(error.message)
    const lista = data || []
    const gruppi: Record<string, Client[]> = {}
    for (const c of lista) {
      const k = chiave(c)
      if (!k) continue
      if (!gruppi[k]) gruppi[k] = []
      gruppi[k].push(c)
    }
    const doppi = Object.values(gruppi).filter(g => g.length > 1)
    if (doppi.length === 0) return alert('Nessun doppione con lo stesso nome')
    for (const g of doppi) {
      const tieni = g[0]
      const ok = confirm(g.length + ' schede con nome ' + tieni.name + '. Unirle? Resta la prima.')
      if (!ok) continue
      for (const doppio of g.slice(1)) {
        const a = await supabase.from('invoices').update({ client_id: tieni.id }).eq('client_id', doppio.id)
        const b = await supabase.from('subscriptions').update({ client_id: tieni.id }).eq('client_id', doppio.id)
        const c1 = await supabase.from('interventions').update({ client_id: tieni.id }).eq('client_id', doppio.id)
        const d = await supabase.from('quotes').update({ client_id: tieni.id }).eq('client_id', doppio.id)
        const e = await supabase.from('clients').delete().eq('id', doppio.id)
        const err = a.error || b.error || c1.error || d.error || e.error
        if (err) alert(err.message)
      }
    }
    const dopo = await supabase.from('clients').select('*').order('name')
    setClients(dopo.data || [])
    alert('Controllo finito')
  }

  const famiglia = clients.filter(c => (c.kind || 'cliente') === kind)
  const cittaList = Array.from(new Set(famiglia.map(c => (c.city || '').trim()).filter(Boolean))).sort()

  const filtered = famiglia.filter(c => {
    const q = search.toLowerCase()
    const match =
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.cf_piva || '').toLowerCase().includes(q)
    if (!match) return false
    if (citta && (c.city || '') !== citta) return false
    if (dato === 'manca_sdi' && (c.codice_sdi || c.pec)) return false
    if (dato === 'manca_piva' && c.cf_piva) return false
    if (dato === 'completi' && (!c.cf_piva || (!c.codice_sdi && !c.pec))) return false
    return true
  })

  const nCitta = (name: string) => famiglia.filter(c => (c.city || '') === name).length
  const nMancaSdi = famiglia.filter(c => !c.codice_sdi && !c.pec).length
  const nMancaPiva = famiglia.filter(c => !c.cf_piva).length
  const nCompleti = famiglia.filter(c => c.cf_piva && (c.codice_sdi || c.pec)).length

  if (loading) return <div className="text-center py-10">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{kind === 'fornitore' ? 'Fornitori' : 'Clienti'}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={controllaDoppioni} className="border px-4 py-2 rounded-lg">Cerca doppioni</button>
          <Link to={'/nuovo?kind=' + kind} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            {kind === 'fornitore' ? '+ Nuovo fornitore' : '+ Nuovo cliente'}
          </Link>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link to="/clienti" className={'px-4 py-2 rounded-lg ' + (kind === 'cliente' ? 'bg-blue-600 text-white' : 'bg-white border')}>Clienti</Link>
        <Link to="/fornitori" className={'px-4 py-2 rounded-lg ' + (kind === 'fornitore' ? 'bg-blue-600 text-white' : 'bg-white border')}>Fornitori</Link>
      </div>
      <input type="text" placeholder="Cerca nome, telefono, email, citta, P.IVA..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded-lg px-4 py-2" />
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setDato('')} className={'px-3 py-1.5 rounded-full text-sm ' + (!dato ? 'bg-slate-900 text-white' : 'bg-white border')}>Tutti ({famiglia.length})</button>
        <button type="button" onClick={() => setDato('completi')} className={'px-3 py-1.5 rounded-full text-sm ' + (dato === 'completi' ? 'bg-green-700 text-white' : 'bg-white border')}>Completi SDI ({nCompleti})</button>
        <button type="button" onClick={() => setDato('manca_sdi')} className={'px-3 py-1.5 rounded-full text-sm ' + (dato === 'manca_sdi' ? 'bg-amber-600 text-white' : 'bg-white border')}>Manca SDI/PEC ({nMancaSdi})</button>
        <button type="button" onClick={() => setDato('manca_piva')} className={'px-3 py-1.5 rounded-full text-sm ' + (dato === 'manca_piva' ? 'bg-red-600 text-white' : 'bg-white border')}>Manca P.IVA/CF ({nMancaPiva})</button>
        <button type="button" onClick={() => setCitta('')} className={'px-3 py-1.5 rounded-full text-sm ' + (!citta ? 'bg-slate-700 text-white' : 'bg-white border')}>Tutte le citta</button>
        {cittaList.map(name => (
          <button key={name} type="button" onClick={() => setCitta(name)} className={'px-3 py-1.5 rounded-full text-sm ' + (citta === name ? 'bg-slate-700 text-white' : 'bg-white border')}>{name} ({nCitta(name)})</button>
        ))}
      </div>
      <p className="text-sm text-slate-500">Risultati: {filtered.length}</p>
      <div className="bg-white rounded-xl shadow divide-y">
        {filtered.length === 0 ? <p className="p-6 text-center text-slate-500">Nessun risultato</p> : null}
        {filtered.map(c => (
          <Link key={c.id} to={'/cliente/' + c.id} className="block px-4 py-3 hover:bg-slate-50">
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-slate-500">
              {c.phone || 'Nessun telefono'}
              {c.city ? ' · ' + c.city : ''}
              {c.cf_piva ? ' · ' + c.cf_piva : ''}
              {c.codice_sdi ? ' · SDI ' + c.codice_sdi : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
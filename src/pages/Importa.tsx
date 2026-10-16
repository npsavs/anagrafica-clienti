import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Riga = {
  name: string
  kind: 'cliente' | 'fornitore'
  cf_piva: string
  codice_sdi: string
  phone: string
  email: string
  pec: string
  address: string
  zip: string
  city: string
  province: string
  notes: string
  doppioneId?: string
  doppioneNome?: string
  doppioneTel?: string
  azione?: 'unisci' | 'modifica' | 'nuovo'
}

function v(row: any[], i: number) {
  return String(row[i] ?? '').replace(/\s+/g, ' ').trim()
}

async function caricaExcel() {
  const w = window as any
  if (w.XLSX) return w.XLSX
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    s.onload = () => resolve(null)
    s.onerror = () => reject(new Error('Excel non caricato'))
    document.body.appendChild(s)
  })
  return w.XLSX
}

async function tuttiClienti() {
  const out: any[] = []
  let da = 0
  while (true) {
    const { data, error } = await supabase.from('clients').select('id, name, cf_piva, phone').range(da, da + 999)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < 1000) break
    da += 1000
  }
  return out
}

export default function Importa() {
  const [righe, setRighe] = useState<Riga[]>([])
  const [log, setLog] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setLog('Lettura di ' + file.name + '...')
    try {
      const XLSX = await caricaExcel()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      const gia = await tuttiClienti()
      const out: Riga[] = []
      for (const row of rows.slice(1)) {
        const ragione = v(row, 2)
        const persona = (v(row, 4) + ' ' + v(row, 5)).trim()
        const name = ragione || persona
        if (!name || name === '.') continue
        const tipo = v(row, 1).toUpperCase()
        const piva = v(row, 8)
        const cf = v(row, 7)
        const cfPiva = (piva && piva !== '.' ? piva : cf).replace(/^\./, '')
        const tel = v(row, 11) || v(row, 10)
        const trovato = gia.find(c =>
          (cfPiva && String(c.cf_piva || '').replace(/\s/g, '') === cfPiva.replace(/\s/g, '')) ||
          String(c.name || '').trim().toLowerCase() === name.trim().toLowerCase()
        )
        out.push({
          name,
          kind: tipo.indexOf('FORN') >= 0 ? 'fornitore' : 'cliente',
          cf_piva: cfPiva,
          codice_sdi: v(row, 9),
          phone: tel,
          email: v(row, 13) || v(row, 15),
          pec: v(row, 14),
          address: v(row, 17),
          zip: v(row, 18),
          city: v(row, 19),
          province: v(row, 20),
          notes: v(row, 26),
          doppioneId: trovato?.id,
          doppioneNome: trovato?.name,
          doppioneTel: trovato?.phone || '',
          azione: trovato ? undefined : 'nuovo',
        })
      }
      setRighe(out)
      const nDoppi = out.filter(r => r.doppioneId).length
      setLog('Lette ' + out.length + '. Doppioni da decidere: ' + nDoppi + '. Nuovi: ' + (out.length - nDoppi))
    } catch (err: any) {
      setLog('Errore lettura: ' + (err.message || err))
    }
  }

  function setAzione(i: number, azione: 'unisci' | 'modifica' | 'nuovo') {
    setRighe(prev => prev.map((r, n) => n === i ? { ...r, azione } : r))
  }
  function togli(i: number) {
    setRighe(prev => prev.filter((_, n) => n !== i))
  }
  function unisciTutti() {
    setRighe(prev => prev.map(r => r.doppioneId ? { ...r, azione: 'unisci' } : r))
  }

  async function importa() {
    const indecisi = righe.filter(r => r.doppioneId && !r.azione)
    if (indecisi.length) return alert('Sui doppioni scegli Unisci o Modifica. Oppure premi Unisci tutti.')
    setBusy(true)
    let nuovi = 0
    let uniti = 0
    const daInserire = righe.filter(r => r.azione !== 'unisci' && r.azione !== 'modifica')
    for (let i = 0; i < daInserire.length; i += 200) {
      const blocco = daInserire.slice(i, i + 200).map(r => ({
        name: r.name,
        kind: r.kind,
        cf_piva: r.cf_piva || null,
        codice_sdi: r.codice_sdi || null,
        phone: r.phone || null,
        email: r.email || null,
        pec: r.pec || null,
        address: r.address || null,
        zip: r.zip || null,
        city: r.city || null,
        province: r.province || null,
        notes: r.notes || null,
      }))
      const { error } = await supabase.from('clients').insert(blocco)
      if (error) { setBusy(false); return setLog('Errore al blocco ' + (i + 1) + ': ' + error.message) }
      nuovi += blocco.length
      setLog('Inseriti ' + nuovi + ' di ' + daInserire.length)
    }
    for (const r of righe.filter(x => x.azione === 'unisci' && x.doppioneId)) {
      const { error } = await supabase.from('clients').update({
        phone: r.phone || null,
        email: r.email || null,
        pec: r.pec || null,
        address: r.address || null,
        zip: r.zip || null,
        city: r.city || null,
        province: r.province || null,
        cf_piva: r.cf_piva || null,
        codice_sdi: r.codice_sdi || null,
      }).eq('id', r.doppioneId)
      if (error) { setBusy(false); return setLog(error.message) }
      uniti++
    }
    setBusy(false)
    setLog('Finito. Nuovi ' + nuovi + '. Uniti ' + uniti + '.')
    setRighe([])
  }

  const doppioni = righe.filter(r => r.doppioneId)
  const nuovi = righe.filter(r => !r.doppioneId)

  return (
    <div className="space-y-4">
      <Link to="/clienti" className="text-sm text-blue-600">Torna ai clienti</Link>
      <h1 className="text-2xl font-bold">Importa anagrafica</h1>
      <input type="file" accept=".xlsx,.xls" onChange={onFile} />
      {log ? <p className="text-base font-semibold">{log}</p> : null}
      {righe.length ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={importa} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Importa {righe.length} schede</button>
          {doppioni.length ? <button type="button" onClick={unisciTutti} className="border px-4 py-2 rounded-lg">Unisci tutti i doppioni</button> : null}
        </div>
      ) : null}
      {doppioni.length ? (
        <div className="space-y-2">
          <p className="font-semibold">Doppioni da decidere ({doppioni.length})</p>
          {doppioni.map((r, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2">
              <p className="text-lg font-bold break-words">{r.name}</p>
              <p className="text-sm">{r.phone || 'Nessun telefono'} · {r.kind === 'fornitore' ? 'Fornitore' : 'Cliente'}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold">Gia presente: {r.doppioneNome}</p>
                <p className="text-sm">Telefono in anagrafica: {r.doppioneTel || 'nessuno'}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setAzione(righe.indexOf(r), 'unisci')} className={'px-3 py-1 rounded ' + (r.azione === 'unisci' ? 'bg-blue-600 text-white' : 'border')}>Unisci</button>
                  <button type="button" onClick={() => setAzione(righe.indexOf(r), 'nuovo')} className={'px-3 py-1 rounded ' + (r.azione === 'nuovo' ? 'bg-blue-600 text-white' : 'border')}>Importa lo stesso</button>
                </div>
              </div>
              <button type="button" onClick={() => togli(righe.indexOf(r))} className="text-sm text-red-600">Togli da questo import</button>
            </div>
          ))}
        </div>
      ) : null}
      {nuovi.length ? <p className="text-sm text-slate-500">Nuovi da inserire: {nuovi.length}. Non li elenco tutti per non appesantire la pagina.</p> : null}
    </div>
  )
}
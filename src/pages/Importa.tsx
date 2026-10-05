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
}

function pulisci(v: string) {
  return String(v || '').replace(/^"|"$/g, '').trim()
}

function split(line: string) {
  return line.split(line.indexOf(';') >= 0 ? ';' : ',')
}

export default function Importa() {
  const [righe, setRighe] = useState<Riga[]>([])
  const [log, setLog] = useState('')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const lines = text.split(/\r?\n/).filter(Boolean)
      const head = split(lines[0]).map(h => pulisci(h).toUpperCase())
      const idx = (nome: string) => head.indexOf(nome)
      const out: Riga[] = []
      for (const line of lines.slice(1)) {
        const c = split(line).map(pulisci)
        const ragione = c[idx('RAGIONE_SOCIALE')] || ''
        const nome = (c[idx('NOME')] + ' ' + c[idx('COGNOME')]).trim()
        const name = ragione && ragione !== 'NUOVO CLIENTE' ? ragione : nome
        if (!name || name === '.' ) continue
        const tipo = (c[idx('TIPO')] || '').toUpperCase()
        const piva = c[idx('PARTITA_IVA')] || ''
        const cf = c[idx('CODICE_FISCALE')] || ''
        out.push({
          name,
          kind: tipo.indexOf('FORN') >= 0 ? 'fornitore' : 'cliente',
          cf_piva: (piva && piva !== '.' ? piva : cf).replace(/^\./, ''),
          codice_sdi: c[idx('COD_DEST')] || '',
          phone: c[idx('CELLULARE')] || c[idx('TELEFONO')] || '',
          email: c[idx('EMAIL')] || c[idx('EMAIL_ADMIN')] || '',
          pec: c[idx('EMAIL_PEC')] || '',
          address: c[idx('INDIRIZZO')] || '',
          zip: c[idx('CAP')] || '',
          city: c[idx('CITTA')] || '',
          province: c[idx('PROVINCIA_SIGLA')] || '',
          notes: [c[idx('NOTE')], c[idx('SETTORE')], c[idx('FAX')] ? 'Fax ' + c[idx('FAX')] : ''].filter(Boolean).join(' · '),
        })
      }
      setRighe(out)
      setLog(out.length + ' righe lette. Controlla cliente o fornitore, poi importa.')
    }
    reader.readAsText(file, 'windows-1252')
  }

  function setKind(i: number, kind: 'cliente' | 'fornitore') {
    setRighe(prev => prev.map((r, n) => n === i ? { ...r, kind } : r))
  }

  async function importa() {
    const { data: esistenti } = await supabase.from('clients').select('id, name, cf_piva')
    const gia = esistenti || []
    let nuovi = 0
    let saltati = 0
    for (const r of righe) {
      const piva = r.cf_piva.replace(/\s/g, '')
      const trovato = gia.find(c =>
        (piva && String(c.cf_piva || '').replace(/\s/g, '') === piva) ||
        String(c.name || '').trim().toLowerCase() === r.name.trim().toLowerCase()
      )
      if (trovato) { saltati++; continue }
      const { error } = await supabase.from('clients').insert({
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
      })
      if (error) return setLog(error.message)
      nuovi++
    }
    setLog('Importati ' + nuovi + '. Gia presenti ' + saltati + '.')
  }

  return (
    <div className="space-y-4">
      <Link to="/clienti" className="text-sm text-blue-600">Torna ai clienti</Link>
      <h1 className="text-2xl font-bold">Importa anagrafica</h1>
      <p className="text-sm text-slate-600">Dal file Excel fai Salva con nome, CSV separato da punto e virgola. Su ogni riga confermi se e cliente o fornitore.</p>
      <input type="file" accept=".csv,text/csv" onChange={onFile} />
      {log ? <p className="text-sm">{log}</p> : null}
      {righe.length ? <button type="button" onClick={importa} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Importa {righe.length} schede</button> : null}
      <div className="bg-white rounded-xl shadow divide-y">
        {righe.map((r, i) => (
          <div key={i} className="px-4 py-3 flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[180px]">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-slate-500">{r.cf_piva || 'senza P.IVA'} · {r.city} · {r.phone}</p>
            </div>
            <select value={r.kind} onChange={e => setKind(i, e.target.value as 'cliente' | 'fornitore')} className="border rounded-lg px-2 py-1">
              <option value="cliente">Cliente</option>
              <option value="fornitore">Fornitore</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
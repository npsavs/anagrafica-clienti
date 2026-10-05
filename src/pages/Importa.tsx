import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

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

function v(row: any[], i: number) {
  return String(row[i] ?? '').trim()
}

export default function Importa() {
  const [righe, setRighe] = useState<Riga[]>([])
  const [log, setLog] = useState('')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const wb = XLSX.read(reader.result, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      const out: Riga[] = []
      for (const row of rows.slice(1)) {
        const name = v(row, 2) || (v(row, 4) + ' ' + v(row, 5)).trim()
        if (!name || name === '.') continue
        const tipo = v(row, 1).toUpperCase()
        const cf = v(row, 7)
        const piva = v(row, 8)
        out.push({
          name,
          kind: tipo.indexOf('FORN') >= 0 ? 'fornitore' : 'cliente',
          cf_piva: (piva && piva !== '.' ? piva : cf).replace(/^\./, ''),
          codice_sdi: v(row, 9),
          phone: v(row, 11) || v(row, 10),
          email: v(row, 13) || v(row, 15),
          pec: v(row, 14),
          address: v(row, 17),
          zip: v(row, 18),
          city: v(row, 19),
          province: v(row, 20),
          notes: [v(row, 26), v(row, 23)].filter(Boolean).join(' · '),
        })
      }
      setRighe(out)
      setLog('Lette ' + out.length + ' schede. Il nome e nella prima colonna della tabella.')
    }
    reader.readAsArrayBuffer(file)
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
      gia.push({ id: '', name: r.name, cf_piva: r.cf_piva })
    }
    setLog('Importati ' + nuovi + '. Gia presenti ' + saltati + '.')
  }

  return (
    <div className="space-y-4">
      <Link to="/clienti" className="text-sm text-blue-600">Torna ai clienti</Link>
      <h1 className="text-2xl font-bold">Importa anagrafica</h1>
      <input type="file" accept=".xlsx,.xls" onChange={onFile} />
      {log ? <p className="text-sm font-medium">{log}</p> : null}
      {righe.length ? <button type="button" onClick={importa} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Importa {righe.length} schede</button> : null}
            <div className="space-y-2">
        {righe.map((r, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2">
            <p className="text-xl font-bold break-words">{r.name || 'NOME VUOTO'}</p>
            <p className="text-sm text-slate-500">{r.city || 'senza citta'} · {r.cf_piva || 'senza P.IVA'}</p>
            <select value={r.kind} onChange={e => setKind(i, e.target.value as 'cliente' | 'fornitore')} className="border rounded-lg px-2 py-2 w-full">
              <option value="cliente">Cliente</option>
              <option value="fornitore">Fornitore</option>
            </select>
          </div>
        ))}
      </div></div>
  )
}
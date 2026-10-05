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

function norm(row: any) {
  const out: Record<string, string> = {}
  for (const k of Object.keys(row)) out[String(k).trim().toUpperCase()] = String(row[k] ?? '').trim()
  return out
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
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[]
      const out: Riga[] = []
      for (const raw of rows) {
        const row = norm(raw)
        const ragione = row.RAGIONE_SOCIALE || ''
        const nome = ((row.NOME || '') + ' ' + (row.COGNOME || '')).trim()
        const name = (ragione || nome).replace(/\s+/g, ' ').trim()
        if (!name || name === '.') continue
        const tipo = (row.TIPO || '').toUpperCase()
        const piva = row.PARTITA_IVA || ''
        const cf = row.CODICE_FISCALE || ''
        out.push({
          name,
          kind: tipo.indexOf('FORN') >= 0 ? 'fornitore' : 'cliente',
          cf_piva: (piva && piva !== '.' ? piva : cf).replace(/^\./, ''),
          codice_sdi: row.COD_DEST || '',
          phone: row.CELLULARE || row.TELEFONO || '',
          email: row.EMAIL || row.EMAIL_ADMIN || '',
          pec: row.EMAIL_PEC || '',
          address: row.INDIRIZZO || '',
          zip: row.CAP || '',
          city: row.CITTA || '',
          province: row.PROVINCIA_SIGLA || '',
          notes: [row.NOTE, row.SETTORE, row.FAX ? 'Fax ' + row.FAX : ''].filter(Boolean).join(' · '),
        })
      }
      setRighe(out)
      setLog(out.length + ' schede. Leggi il nome, scegli cliente o fornitore, poi importa.')
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
      {log ? <p className="text-sm">{log}</p> : null}
      {righe.length ? <button type="button" onClick={importa} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Importa {righe.length} schede</button> : null}
      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Nome</th>
              <th className="p-3">P.IVA / CF</th>
              <th className="p-3">Citta</th>
              <th className="p-3">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.cf_piva || '-'}</td>
                <td className="p-3">{r.city || '-'}</td>
                <td className="p-3">
                  <select value={r.kind} onChange={e => setKind(i, e.target.value as 'cliente' | 'fornitore')} className="border rounded-lg px-2 py-1">
                    <option value="cliente">Cliente</option>
                    <option value="fornitore">Fornitore</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
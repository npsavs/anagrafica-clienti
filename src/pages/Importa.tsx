import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

type Riga = {
  name: string
  kind: 'cliente' | 'fornitore'
  privato: boolean
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
  if (i < 0) return ''
  return String(row[i] ?? '').replace(/\s+/g, ' ').trim()
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
      const head = (rows[0] || []).map(x => String(x || '').trim().toUpperCase())
      const col = (nome: string) => head.indexOf(nome)
      const out: Riga[] = []
      for (const row of rows.slice(1)) {
        const ragione = v(row, col('RAGIONE_SOCIALE'))
        const nome = v(row, col('NOME'))
        const cognome = v(row, col('COGNOME'))
        const privato = v(row, col('PRIVATO')) === '1'
        const persona = (nome + ' ' + cognome).trim()
        const name = (privato ? persona : (ragione || persona)).replace(/^\./, '').trim()
        if (!name || name === '.') continue
        const tipo = v(row, col('TIPO')).toUpperCase()
        const piva = v(row, col('PARTITA_IVA'))
        const cf = v(row, col('CODICE_FISCALE'))
        out.push({
          name,
          privato,
          kind: tipo.indexOf('FORN') >= 0 ? 'fornitore' : 'cliente',
          cf_piva: (piva && piva !== '.' ? piva : cf).replace(/^\./, ''),
          codice_sdi: v(row, col('COD_DEST')),
          phone: v(row, col('CELLULARE')) || v(row, col('TELEFONO')),
          email: v(row, col('EMAIL')) || v(row, col('EMAIL_ADMIN')),
          pec: v(row, col('EMAIL_PEC')),
          address: v(row, col('INDIRIZZO')),
          zip: v(row, col('CAP')),
          city: v(row, col('CITTA')),
          province: v(row, col('PROVINCIA_SIGLA')),
          notes: [v(row, col('NOTE')), v(row, col('SETTORE')), privato ? 'Privato' : ''].filter(Boolean).join(' · '),
        })
      }
      setRighe(out)
      setLog(out.length ? ('Prima scheda: ' + out[0].name) : 'Nessun nome letto')
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
      {log ? <p className="text-base font-semibold">{log}</p> : null}
      {righe.length ? <button type="button" onClick={importa} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Importa {righe.length} schede</button> : null}
      <div className="space-y-2">
        {righe.map((r, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2">
            <p className="text-xl font-bold break-words">{r.name}</p>
            <p className="text-sm text-slate-500">{r.privato ? 'Privato' : 'Azienda'} · {r.city || 'senza citta'} · {r.cf_piva || 'senza P.IVA'}</p>
            <select value={r.kind} onChange={e => setKind(i, e.target.value as 'cliente' | 'fornitore')} className="border rounded-lg px-2 py-2 w-full">
              <option value="cliente">Cliente</option>
              <option value="fornitore">Fornitore</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
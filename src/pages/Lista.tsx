import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

type Kind = 'cliente' | 'fornitore'

export default function Lista() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<Kind>('cliente')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('clients')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setClients(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = clients.filter(c => {
    const famiglia = (c.kind || 'cliente') === kind
    const q = search.toLowerCase()
    const match =
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    return famiglia && match
  })

  if (loading) return <div className="text-center py-10">Caricamento...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Anagrafica</h1>
        <Link to={`/nuovo?kind=${kind}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          {kind === 'fornitore' ? '+ Nuovo Fornitore' : '+ Nuovo Cliente'}
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setKind('cliente')}
          className={`px-4 py-2 rounded-lg ${kind === 'cliente' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Clienti
        </button>
        <button
          type="button"
          onClick={() => setKind('fornitore')}
          className={`px-4 py-2 rounded-lg ${kind === 'fornitore' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Fornitori
        </button>
      </div>

      <input
        type="text"
        placeholder="Cerca nome, telefono, email, città..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-6"
      />

      <div className="bg-white rounded-xl shadow divide-y">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-slate-500">
            Nessun {kind === 'fornitore' ? 'fornitore' : 'cliente'}
          </p>
        )}
        {filtered.map(c => (
          <Link key={c.id} to={`/cliente/${c.id}`} className="block px-4 py-3 hover:bg-slate-50">
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-slate-500">
              {c.phone || 'Nessun telefono'}
              {c.city ? ` · ${c.city}` : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
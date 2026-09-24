import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export default function Lista() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
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
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    )
  })

  if (loading) return <div className="text-center py-10">Caricamento...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Anagrafica</h1>
        <Link to="/nuovo" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          + Nuovo Cliente
        </Link>
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
          <p className="p-6 text-center text-slate-500">Nessun cliente</p>
        )}
        {filtered.map(c => (
          <Link
            key={c.id}
            to={`/cliente/${c.id}`}
            className="block px-4 py-3 hover:bg-slate-50"
          >
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
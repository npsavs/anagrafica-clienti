import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

const GESTIONE_URL = 'https://gestione-clienti-sepia.vercel.app'
const PREVENTIVI_URL = 'https://preventivi-ashen.vercel.app'

export default function Dettaglio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setClient(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="text-center py-10">Caricamento...</div>
  if (!client) return <div className="text-center py-10">Cliente non trovato</div>

  const cleanPhone = (client.phone || '').replace(/\D/g, '').replace(/^39/, '')
  const fullAddress = [client.address, client.zip, client.city, client.province].filter(Boolean).join(' ')
  const whatsappLink = cleanPhone
    ? `https://wa.me/39${cleanPhone}?text=${encodeURIComponent(`Ciao ${client.name}, `)}`
    : null

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-blue-600 text-sm hover:underline">← Torna alla lista</Link>
        <Link to={`/cliente/${client.id}/modifica`} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
          Modifica
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <p className="text-slate-600">{client.email || 'Nessuna email'}</p>
        <p className="text-slate-600">{client.phone || 'Nessun telefono'}</p>
        <p className="text-slate-600">{fullAddress || 'Nessun indirizzo'}</p>
        {client.notes && <p className="text-slate-700 whitespace-pre-wrap">{client.notes}</p>}
      </div>

      <div className="grid gap-3">
        {cleanPhone && (
          <a href={`tel:+39${cleanPhone}`} className="block text-center bg-blue-600 text-white py-3 rounded-xl font-medium">
            Chiama
          </a>
        )}

        {whatsappLink && (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block text-center bg-green-500 text-white py-3 rounded-xl font-medium">
            Scrivi su WhatsApp
          </a>
        )}

        {fullAddress && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-amber-500 text-white py-3 rounded-xl font-medium"
          >
            Apri in Google Maps
          </a>
        )}

        <a
          href={`${PREVENTIVI_URL}/nuovo?cliente=${client.id}`}
          className="block text-center bg-violet-700 text-white py-3 rounded-xl font-medium"
        >
          Crea Preventivo
        </a>

        <a
          href={`${GESTIONE_URL}/client/${client.id}`}
          className="block text-center bg-emerald-600 text-white py-3 rounded-xl font-medium"
        >
          Apri in Gestione Clienti
        </a>
      </div>

      <button
        onClick={async () => {
          if (!confirm('Eliminare questo cliente? Verrà rimosso anche dalle altre app.')) return
          const { error } = await supabase.from('clients').delete().eq('id', client.id)
          if (error) alert(error.message)
          else navigate('/')
        }}
        className="w-full bg-red-100 text-red-700 py-3 rounded-xl text-sm"
      >
        Elimina cliente
      </button>
    </div>
  )
}
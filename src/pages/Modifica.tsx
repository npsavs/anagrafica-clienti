import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Modifica() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    zip: '',
    city: '',
    province: '',
    notes: '',
  })

  useEffect(() => {
    if (!id) return
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            zip: data.zip || '',
            city: data.city || '',
            province: data.province || '',
            notes: data.notes || '',
          })
        }
        setLoading(false)
      })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('clients')
      .update({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        zip: form.zip || null,
        city: form.city || null,
        province: form.province || null,
        notes: form.notes || null,
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      alert('Errore: ' + error.message)
      return
    }

    navigate(`/cliente/${id}`)
  }

  if (loading) return <div className="text-center py-10">Caricamento...</div>

  return (
    <div className="max-w-xl mx-auto">
      <Link to={`/cliente/${id}`} className="text-blue-600 text-sm hover:underline">
        ← Torna al cliente
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Modifica Cliente</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        <input name="name" required placeholder="Nome *" value={form.name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="phone" placeholder="Telefono" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="address" placeholder="Indirizzo" value={form.address} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <div className="grid grid-cols-3 gap-3">
          <input name="zip" placeholder="CAP" value={form.zip} onChange={handleChange} className="border rounded-lg px-3 py-2" />
          <input name="city" placeholder="Città" value={form.city} onChange={handleChange} className="border rounded-lg px-3 py-2" />
          <input name="province" placeholder="Prov." value={form.province} onChange={handleChange} className="border rounded-lg px-3 py-2" />
        </div>
        <textarea name="notes" placeholder="Note" value={form.notes} onChange={handleChange} rows={3} className="w-full border rounded-lg px-3 py-2" />
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button type="button" onClick={() => navigate(`/cliente/${id}`)} className="border px-6 py-2 rounded-lg">
            Annulla
          </button>
        </div>
      </form>
    </div>
  )
}
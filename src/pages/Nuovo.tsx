import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Nuovo() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        zip: form.zip || null,
        city: form.city || null,
        province: form.province || null,
        notes: form.notes || null,
      })
      .select()
      .single()

    setLoading(false)

    if (error || !data) {
      alert('Errore: ' + error?.message)
      return
    }

    navigate(`/cliente/${data.id}`)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuovo Cliente</h1>
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
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">
            {loading ? 'Salvataggio...' : 'Salva'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="border px-6 py-2 rounded-lg">
            Annulla
          </button>
        </div>
      </form>
    </div>
  )
}
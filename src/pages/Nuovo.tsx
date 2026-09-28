import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Nuovo() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    pec: '',
    codice_sdi: '',
    cf_piva: '',
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
    setSaving(true)
    const { error } = await supabase.from('clients').insert({
      name: form.name,
      email: form.email || null,
      pec: form.pec || null,
      codice_sdi: form.codice_sdi || null,
      cf_piva: form.cf_piva || null,
      phone: form.phone || null,
      address: form.address || null,
      zip: form.zip || null,
      city: form.city || null,
      province: form.province || null,
      notes: form.notes || null,
    })
    setSaving(false)
    if (error) alert('Errore: ' + error.message)
    else navigate('/')
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/" className="text-blue-600 text-sm hover:underline">← Torna alla lista</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Nuovo Cliente</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        <input name="name" required placeholder="Nome *" value={form.name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="phone" placeholder="Telefono" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="pec" type="email" placeholder="PEC" value={form.pec} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
        <input name="codice_sdi" placeholder="Codice univoco SDI" value={form.codice_sdi} onChange={handleChange} maxLength={7} className="w-full border rounded-lg px-3 py-2" />
        <input name="cf_piva" placeholder="Codice fiscale o Partita IVA" value={form.cf_piva} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
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
          <button type="button" onClick={() => navigate('/')} className="border px-6 py-2 rounded-lg">Annulla</button>
        </div>
      </form>
    </div>
  )
}
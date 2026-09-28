export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  zip: string | null
  province: string | null
  notes: string | null
  pec: string | null
  codice_sdi: string | null
  cf_piva: string | null
  created_at?: string
}
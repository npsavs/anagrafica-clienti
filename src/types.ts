export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  address: string | null
  city: string | null
  zip: string | null
  province: string | null
  created_at: string
}

export interface SupplierResponseDTO {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export interface CreateSupplierDTO {
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export interface UpdateSupplierDTO {
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

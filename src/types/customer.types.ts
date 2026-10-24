
export type CustomerStatus = "active" | "inactive"

export interface CustomerResponseDTO {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  status?: CustomerStatus
  company?: string | null
  createdAt?: string | null
}

export interface CreateCustomerDTO {
  name: string
  phone: string | null
  email: string | null
  address: string | null
  status?: CustomerStatus
  company?: string | null
  createdAt?: string | null
}

export interface UpdateCustomerDTO {
  name: string
  phone: string | null
  email: string | null
  address: string | null
  status?: CustomerStatus
  company?: string | null
  createdAt?: string | null
}

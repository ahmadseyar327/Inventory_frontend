
import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerResponseDTO,
} from "../../types/customer.types"

import { api } from "../../services/api"

export const customerService = {
  // Create a customer
  async createCustomer(
    data: CreateCustomerDTO,
  ): Promise<CustomerResponseDTO> {
    const response = await api.post<CustomerResponseDTO>(
      "/customers",
      data,
    )

    return response.data
  },

  // Get all customers
  async getAllCustomers(): Promise<CustomerResponseDTO[]> {
    const response = await api.get<CustomerResponseDTO[]>("/customers")

    return response.data
  },

  // Get a customer by ID
  async getCustomerById(id: number): Promise<CustomerResponseDTO> {
    const response = await api.get<CustomerResponseDTO>(`/customers/${id}`)

    return response.data
  },

  // Update a customer
  async updateCustomer(
    id: number,
    data: UpdateCustomerDTO,
  ): Promise<CustomerResponseDTO> {
    const response = await api.put<CustomerResponseDTO>(
      `/customers/${id}`,
      data,
    )

    return response.data
  },

  // Delete a customer
  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`)
  },
}

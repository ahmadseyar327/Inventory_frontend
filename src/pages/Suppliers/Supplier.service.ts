
import type {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponseDTO,
} from "../../types/supplier.types"

import { api } from "../../services/api"

export const supplierService = {
  // Create a supplier (Admin only)
  async createSupplier(
    data: CreateSupplierDTO,
  ): Promise<SupplierResponseDTO> {
    const response = await api.post<SupplierResponseDTO>(
      "/Suppliers",
      data,
    )

    return response.data
  },

  // Get all suppliers
  async getAllSuppliers(): Promise<SupplierResponseDTO[]> {
    const response = await api.get<SupplierResponseDTO[]>("/Suppliers")

    return response.data
  },

  // Get a supplier by ID
  async getSupplierById(id: number): Promise<SupplierResponseDTO> {
    const response = await api.get<SupplierResponseDTO>(
      `/Suppliers/${id}`,
    )

    return response.data
  },

  // Update a supplier (Admin only)
  async updateSupplier(
    id: number,
    data: UpdateSupplierDTO,
  ): Promise<SupplierResponseDTO> {
    const response = await api.put<SupplierResponseDTO>(
      `/Suppliers/${id}`,
      data,
    )

    return response.data
  },

  // Delete a supplier (Admin only)
  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/Suppliers/${id}`)
  },
}

import { api } from "../../services/api"
import type {
  CreateSaleDTO,
  SaleResponseDTO,
  UpdateSaleDTO,
} from "../../types/sales.types"

export const saleService = {
  // GET: api/Sale
  async getAll(): Promise<SaleResponseDTO[]> {
    const response = await api.get<SaleResponseDTO[]>("/Sale")
    return response.data
  },

  // GET: api/Sale/{id}
  async getById(id: number): Promise<SaleResponseDTO> {
    const response = await api.get<SaleResponseDTO>(`/Sale/${id}`)
    return response.data
  },

  // POST: api/Sale
  async create(data: CreateSaleDTO): Promise<SaleResponseDTO> {
    const response = await api.post<SaleResponseDTO>("/Sale", data)
    return response.data
  },

  // PUT: api/Sale/{id}
  async update(
    id: number,
    data: UpdateSaleDTO,
  ): Promise<SaleResponseDTO> {
    const response = await api.put<SaleResponseDTO>(`/Sale/${id}`, data)
    return response.data
  },

  // DELETE: api/Sale/{id}
  async delete(id: number): Promise<void> {
    await api.delete(`/Sale/${id}`)
  },
}
import { api } from "../../services/api"
import type {
  CreatePurchaseDTO,
  PurchaseResponseDTO,
  UpdatePurchaseDTO,
} from "../../types/purchase.types"

export const purchaseService = {
  // GET: api/Purchase
  async getAll(): Promise<PurchaseResponseDTO[]> {
    const response = await api.get<PurchaseResponseDTO[]>("/Purchase")
    return response.data
  },

  // GET: api/Purchase/{id}
  async getById(id: number): Promise<PurchaseResponseDTO> {
    const response = await api.get<PurchaseResponseDTO>(`/Purchase/${id}`)
    return response.data
  },

  // POST: api/Purchase
  async create(data: CreatePurchaseDTO): Promise<PurchaseResponseDTO> {
    const response = await api.post<PurchaseResponseDTO>("/Purchase", data)
    return response.data
  },

  // PUT: api/Purchase/{id}
  async update(
    id: number,
    data: UpdatePurchaseDTO,
  ): Promise<PurchaseResponseDTO> {
    const response = await api.put<PurchaseResponseDTO>(
      `/Purchase/${id}`,
      data,
    )
    return response.data
  },

  // DELETE: api/Purchase/{id}
  async delete(id: number): Promise<void> {
    await api.delete(`/Purchase/${id}`)
  },
}
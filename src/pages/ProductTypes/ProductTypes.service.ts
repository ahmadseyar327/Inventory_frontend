import { api } from "../../services/api"
import type {
  CreateProductTypeDTO,
  ProductTypeResponse,
  UpdateProductTypeDTO,
} from "../../types/productType.types"

export const productTypeService = {
  async getAll(): Promise<ProductTypeResponse[]> {
    const response = await api.get<ProductTypeResponse[]>("/ProductType")
    return response.data
  },

  async getById(id: number): Promise<ProductTypeResponse> {
    const response = await api.get<ProductTypeResponse>(`/ProductType/${id}`)
    return response.data
  },

  async create(data: CreateProductTypeDTO): Promise<ProductTypeResponse> {
    const response = await api.post<ProductTypeResponse>("/ProductType", data)
    return response.data
  },

  async update(
    id: number,
    data: UpdateProductTypeDTO,
  ): Promise<ProductTypeResponse> {
    const response = await api.put<ProductTypeResponse>(
      `/ProductType/${id}`,
      data,
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/ProductType/${id}`)
  },
}
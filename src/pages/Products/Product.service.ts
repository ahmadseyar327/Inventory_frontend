
import type {
  CreateProductDTO,
  UpdateProductDTO,
  ProductResponse,
} from "../../types/product.types"

import { api } from "../../services/api"

export const productService = {
  // Get all products (authenticated users)
  async getAllProducts(): Promise<ProductResponse[]> {
    const response = await api.get<ProductResponse[]>("/Product")
    return response.data
  },

  // Get a product by ID (authenticated users)
  async getProductById(id: number): Promise<ProductResponse> {
    const response = await api.get<ProductResponse>(`/Product/${id}`)
    return response.data
  },

  // Create a product (Admin only)
  async createProduct(data: CreateProductDTO): Promise<ProductResponse> {
    const response = await api.post<ProductResponse>("/Product", data)
    return response.data
  },

  // Update a product (Admin only)
  async updateProduct(
    id: number,
    data: UpdateProductDTO,
  ): Promise<ProductResponse> {
    const response = await api.put<ProductResponse>(
      `/Product/${id}`,
      data,
    )
    return response.data
  },

  // Delete a product (Admin only)
  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/Product/${id}`)
  },
}

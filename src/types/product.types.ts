
export interface ProductResponse {
  id: number
  name: string
  currentStock: number
  productTypeId: number
  productTypeName: string
}

export interface CreateProductDTO {
  name: string
  currentStock: number
  productTypeId: number
}

export interface UpdateProductDTO {
  name: string
  currentStock: number
  productTypeId: number
}

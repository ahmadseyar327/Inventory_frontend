export interface CreateSaleDTO {
  saleDate: string
  customerId: number
  items: CreateSaleItemDTO[]
}

export interface SaleResponseDTO {
  id: number
  saleDate: string
  customerId: number
  customerName: string
  items: SaleItemResponseDTO[]
  total: number
}

export interface UpdateSaleDTO {
  saleDate: string
  customerId: number
  items: CreateSaleItemDTO[]
}

export interface CreateSaleItemDTO {
  productId: number
  quantity: number
  unitPrice: number
}

export interface SaleItemResponseDTO {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}
export interface CreatePurchaseDTO {
  purchaseDate: string
  supplierId: number
  items: CreatePurchaseItemDTO[]
}

export interface PurchaseResponseDTO {
  id: number
  purchaseDate: string
  supplierId: number
  supplierName: string
  items: PurchaseItemResponseDTO[]
  total: number
}

export interface UpdatePurchaseDTO {
  purchaseDate: string
  supplierId: number
  items: CreatePurchaseItemDTO[]
}

export interface CreatePurchaseItemDTO {
  productId: number
  quantity: number
  unitPrice: number
}

export interface PurchaseItemResponseDTO {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}
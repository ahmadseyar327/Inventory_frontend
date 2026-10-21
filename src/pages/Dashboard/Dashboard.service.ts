import { api } from "../../services/api"

export interface DashboardSummary {
  totalProducts: number
  lowStockItems: number
  totalCategories: number
  totalSuppliers: number
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>("/dashboard")
    return response.data
  },
}
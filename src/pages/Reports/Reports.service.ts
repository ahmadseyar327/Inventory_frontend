
import { api } from "../../services/api"

// ======================================================
// Shared types
// ======================================================

export interface DateFilters {
  fromDate?: string;
  toDate?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ======================================================
// Finance report DTOs
// ======================================================

export interface FinanceReportSummary {
  fromDate: string | null;
  toDate: string | null;
  totalSales: number;
  totalPurchases: number;
  totalSalesTransactions: number;
  totalPurchaseTransactions: number;
  averageSaleValue: number;
  averagePurchaseValue: number;
}

export interface FinanceTrend {
  date: string;
  sales: number;
  purchases: number;
}

export interface SaleReport {
  saleId: number;
  saleDate: string;
  customerId: number;
  customerName: string;
  total: number;
}

export interface PurchaseReport {
  purchaseId: number;
  purchaseDate: string;
  supplierId: number;
  supplierName: string;
  total: number;
}

// ======================================================
// Product finance DTOs
// ======================================================

export interface ProductFinanceReport {
  productId: number;
  productName: string;
  productTypeName: string;
  fromDate: string | null;
  toDate: string | null;
  quantitySold: number;
  quantityPurchased: number;
  totalSalesRevenue: number;
  totalPurchaseValue: number;
  salesTransactions: number;
  purchaseTransactions: number;
  lastSaleDate: string | null;
  lastPurchaseDate: string | null;
}

export interface ProductSaleHistory {
  saleId: number;
  saleDate: string;
  customerId: number;
  customerName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ProductPurchaseHistory {
  purchaseId: number;
  purchaseDate: string;
  supplierId: number;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ======================================================
// Inventory DTOs
// ======================================================

export interface InventoryReport {
  totalProducts: number;
  totalUnitsInStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export type StockStatus =
  | "All"
  | "In Stock"
  | "Low Stock"
  | "Out of Stock";

export interface InventoryProduct {
  productId: number;
  productName: string;
  productTypeName: string;
  currentStock: number;
  unitCost: number | null;
  stockValue: number | null;
  stockStatus: string;
}

// ======================================================
// Query parameter helper
// ======================================================

function toQueryParams(params: object) {
  const query = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

  return { params: query };
}

type ReportFilters = DateFilters & PaginationParams;

// ======================================================
// Reports API service
// ======================================================

const reportsService = {
  // 1. Finance summary
  getFinanceSummary: async (
    filters: DateFilters = {}
  ): Promise<FinanceReportSummary> => {
    const response = await api.get<FinanceReportSummary>(
      "/Reports/finance/summary",
      toQueryParams(filters)
    );

    return response.data;
  },

  // 2. Daily sales-versus-purchases trend
  getFinanceTrend: async (
    filters: DateFilters = {}
  ): Promise<FinanceTrend[]> => {
    const response = await api.get<FinanceTrend[]>(
      "/Reports/finance/trend",
      toQueryParams(filters)
    );

    return response.data;
  },

  // 3. Paginated sales report
  getSalesReport: async (
    filters: ReportFilters = {}
  ): Promise<PagedResponse<SaleReport>> => {
    const response = await api.get<PagedResponse<SaleReport>>(
      "/Reports/finance/sales",
      toQueryParams({
        page: 1,
        pageSize: 20,
        ...filters,
      })
    );

    return response.data;
  },

  // 4. Paginated purchases report
  getPurchasesReport: async (
    filters: ReportFilters = {}
  ): Promise<PagedResponse<PurchaseReport>> => {
    const response = await api.get<PagedResponse<PurchaseReport>>(
      "/Reports/finance/purchases",
      toQueryParams({
        page: 1,
        pageSize: 20,
        ...filters,
      })
    );

    return response.data;
  },

  // 5. Finance analysis for a product
  getProductFinanceReport: async (
    productId: number,
    filters: DateFilters = {}
  ): Promise<ProductFinanceReport> => {
    const response = await api.get<ProductFinanceReport>(
      `/Reports/products/${productId}/finance`,
      toQueryParams(filters)
    );

    return response.data;
  },

  // 6. Paginated sales history for a product
  getProductSalesHistory: async (
    productId: number,
    filters: ReportFilters = {}
  ): Promise<PagedResponse<ProductSaleHistory>> => {
    const response = await api.get<
      PagedResponse<ProductSaleHistory>
    >(
      `/Reports/products/${productId}/sales`,
      toQueryParams({
        page: 1,
        pageSize: 20,
        ...filters,
      })
    );

    return response.data;
  },

  // 7. Paginated purchase history for a product
  getProductPurchaseHistory: async (
    productId: number,
    filters: ReportFilters = {}
  ): Promise<PagedResponse<ProductPurchaseHistory>> => {
    const response = await api.get<
      PagedResponse<ProductPurchaseHistory>
    >(
      `/Reports/products/${productId}/purchases`,
      toQueryParams({
        page: 1,
        pageSize: 20,
        ...filters,
      })
    );

    return response.data;
  },

  // 8. Inventory summary
  getInventoryReport: async (): Promise<InventoryReport> => {
    const response = await api.get<InventoryReport>(
      "/Reports/inventory/summary"
    );

    return response.data;
  },

  // 9. Paginated and filterable inventory products
  getInventoryProducts: async (
    filters: PaginationParams & {
      search?: string;
      stockStatus?: StockStatus;
    } = {}
  ): Promise<PagedResponse<InventoryProduct>> => {
    const response = await api.get<
      PagedResponse<InventoryProduct>
    >(
      "/Reports/inventory/products",
      toQueryParams({
        page: 1,
        pageSize: 20,
        ...filters,
      })
    );

    return response.data;
  },
};

export default reportsService;

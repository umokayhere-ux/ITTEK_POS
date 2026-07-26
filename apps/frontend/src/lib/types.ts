export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  isEmailVerified: boolean;
  twoFactorEnabled?: boolean;
}

export interface Tenant {
  id: string;
  businessName: string;
  businessType: string;
  slug: string;
  currency: string;
  country: string;
  timezone: string;
}

export interface AuthResult {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}

export interface RegisterResult {
  status: string;
  message: string;
  tenant: Pick<Tenant, 'id' | 'businessName' | 'slug'>;
}

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
}

export interface AdminTenant {
  _id: string;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  country: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PlatformStats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  rejected: number;
  totalUsers: number;
  totalSales: number;
}

// --- Domain entities (subset of backend models used by the UI) ---

export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  taxRate: number;
  reorderLevel: number;
  trackInventory?: boolean;
  categoryId?: string;
  images?: string[];
  isActive: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  outstandingBalance: number;
  isActive: boolean;
}

export interface Branch {
  _id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface SaleLine {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
  amountPaid: number;
  changeDue: number;
  balanceDue: number;
  status: string;
  items: SaleLine[];
  createdAt: string;
}

export interface Expense {
  _id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  branchId?: string;
}

export interface StockLevel {
  _id: string;
  productId: string;
  branchId: string;
  quantity: number;
}

export interface LowStockItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
}

export interface Purchase {
  _id: string;
  reference: string;
  supplierId: string;
  branchId: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  createdAt: string;
}

export interface CashRegister {
  _id: string;
  branchId: string;
  status: 'open' | 'closed';
  openingBalance: number;
  expectedCash: number;
  countedCash?: number;
  difference?: number;
  openedAt: string;
  closedAt?: string;
}

export interface SalesSummary {
  totalSales: number;
  count: number;
  totalTax: number;
  totalDiscount: number;
  averageSale: number;
  byDay: { date: string; total: number; count: number }[];
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
}

export interface ProfitLoss {
  revenue: number;
  expenses: number;
  netProfit: number;
  salesCount: number;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit {
  _id: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  timezone: string;
  logoUrl: string;
  taxNumber: string;
  receiptHeader: string;
  receiptFooter: string;
  status: string;
}

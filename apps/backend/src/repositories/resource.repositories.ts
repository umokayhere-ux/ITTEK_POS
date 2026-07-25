import { BaseRepository } from '../core/BaseRepository.js';
import { Branch, type BranchDocument } from '../models/Branch.js';
import { Expense, type ExpenseDocument } from '../models/Expense.js';
import { Brand, type BrandDocument } from '../models/Brand.js';
import { Category, type CategoryDocument } from '../models/Category.js';
import { Customer, type CustomerDocument } from '../models/Customer.js';
import { Product, type ProductDocument } from '../models/Product.js';
import { Supplier, type SupplierDocument } from '../models/Supplier.js';
import { Unit, type UnitDocument } from '../models/Unit.js';

export const branchRepository = new BaseRepository<BranchDocument>(Branch, ['name', 'code']);
export const categoryRepository = new BaseRepository<CategoryDocument>(Category, ['name']);
export const brandRepository = new BaseRepository<BrandDocument>(Brand, ['name']);
export const unitRepository = new BaseRepository<UnitDocument>(Unit, ['name', 'abbreviation']);
export const productRepository = new BaseRepository<ProductDocument>(Product, [
  'name',
  'sku',
  'barcode',
]);
export const customerRepository = new BaseRepository<CustomerDocument>(Customer, [
  'name',
  'phone',
  'email',
]);
export const supplierRepository = new BaseRepository<SupplierDocument>(Supplier, [
  'name',
  'phone',
  'email',
]);
export const expenseRepository = new BaseRepository<ExpenseDocument>(Expense, [
  'description',
  'category',
]);

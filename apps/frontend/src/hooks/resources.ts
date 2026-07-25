'use client';

import { createResourceHooks } from './use-resource';
import type { Brand, Branch, Category, Customer, Expense, Product, Supplier, Unit } from '@/lib/types';

export const products = createResourceHooks<Product>('products');
export const customers = createResourceHooks<Customer>('customers');
export const suppliers = createResourceHooks<Supplier>('suppliers');
export const branches = createResourceHooks<Branch>('branches');
export const expenses = createResourceHooks<Expense>('expenses');
export const categories = createResourceHooks<Category>('categories');
export const brands = createResourceHooks<Brand>('brands');
export const units = createResourceHooks<Unit>('units');

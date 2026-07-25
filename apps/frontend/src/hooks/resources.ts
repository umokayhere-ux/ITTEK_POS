'use client';

import { createResourceHooks } from './use-resource';
import type { Branch, Customer, Expense, Product, Supplier } from '@/lib/types';

export const products = createResourceHooks<Product>('products');
export const customers = createResourceHooks<Customer>('customers');
export const suppliers = createResourceHooks<Supplier>('suppliers');
export const branches = createResourceHooks<Branch>('branches');
export const expenses = createResourceHooks<Expense>('expenses');

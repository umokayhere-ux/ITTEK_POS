'use client';

import { createResourceHooks } from './use-resource';
import type { Branch, Customer, Product, Supplier } from '@/lib/types';

export const products = createResourceHooks<Product>('products');
export const customers = createResourceHooks<Customer>('customers');
export const suppliers = createResourceHooks<Supplier>('suppliers');
export const branches = createResourceHooks<Branch>('branches');

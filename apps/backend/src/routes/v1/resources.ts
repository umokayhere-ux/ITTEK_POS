import type { Router } from 'express';
import { createCrudController } from '../../core/crudController.js';
import { createCrudRouter } from '../../core/crudRouter.js';
import {
  branchRepository,
  brandRepository,
  categoryRepository,
  customerRepository,
  productRepository,
  supplierRepository,
  unitRepository,
} from '../../repositories/resource.repositories.js';
import * as v from '../../validators/resources.validator.js';

/**
 * Registry mapping URL segments to their fully-wired CRUD routers. Each entry
 * gets tenant-scoped create/list/get/update/soft-delete out of the shared core.
 */
export const resourceRouters: Record<string, Router> = {
  branches: createCrudRouter(createCrudController(branchRepository, 'Branch'), {
    createSchema: v.createBranchSchema,
    updateSchema: v.updateBranchSchema,
  }),
  categories: createCrudRouter(createCrudController(categoryRepository, 'Category'), {
    createSchema: v.createCategorySchema,
    updateSchema: v.updateCategorySchema,
  }),
  brands: createCrudRouter(createCrudController(brandRepository, 'Brand'), {
    createSchema: v.createBrandSchema,
    updateSchema: v.updateBrandSchema,
  }),
  units: createCrudRouter(createCrudController(unitRepository, 'Unit'), {
    createSchema: v.createUnitSchema,
    updateSchema: v.updateUnitSchema,
  }),
  products: createCrudRouter(createCrudController(productRepository, 'Product'), {
    createSchema: v.createProductSchema,
    updateSchema: v.updateProductSchema,
  }),
  customers: createCrudRouter(createCrudController(customerRepository, 'Customer'), {
    createSchema: v.createCustomerSchema,
    updateSchema: v.updateCustomerSchema,
  }),
  suppliers: createCrudRouter(createCrudController(supplierRepository, 'Supplier'), {
    createSchema: v.createSupplierSchema,
    updateSchema: v.updateSupplierSchema,
  }),
};

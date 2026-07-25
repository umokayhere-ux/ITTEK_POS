import type {
  FilterQuery,
  Model,
  RootFilterQuery,
  Types,
  UpdateQuery,
} from 'mongoose';
import type { TenantScopedFields } from '../models/baseFields.js';
import type { ListQuery } from './pagination.js';

export interface AuditContext {
  tenantId: string;
  userId: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * Generic data-access layer for tenant-scoped collections. Every query is
 * constrained to the caller's tenantId and excludes soft-deleted documents,
 * so isolation is enforced in one place rather than in every module.
 */
export class BaseRepository<TDoc extends TenantScopedFields> {
  constructor(
    protected readonly model: Model<TDoc>,
    /** Fields matched by the list `search` param (regex, case-insensitive). */
    protected readonly searchable: string[] = [],
  ) {}

  protected scope(tenantId: string, extra: FilterQuery<TDoc> = {}): FilterQuery<TDoc> {
    return { tenantId, isDeleted: false, ...extra } as FilterQuery<TDoc>;
  }

  async create(data: Partial<TDoc>, ctx: AuditContext): Promise<TDoc> {
    const doc = new this.model({
      ...data,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    return doc.save();
  }

  findById(tenantId: string, id: string): Promise<TDoc | null> {
    return this.model.findOne(this.scope(tenantId, { _id: id })).exec();
  }

  findOne(tenantId: string, filter: FilterQuery<TDoc>): Promise<TDoc | null> {
    return this.model.findOne(this.scope(tenantId, filter)).exec();
  }

  exists(tenantId: string, filter: FilterQuery<TDoc>): Promise<boolean> {
    return this.model
      .exists(this.scope(tenantId, filter) as RootFilterQuery<TDoc>)
      .then((doc) => doc !== null);
  }

  async list(tenantId: string, query: ListQuery, filter: FilterQuery<TDoc> = {}): Promise<PaginatedResult<TDoc>> {
    const scoped = this.scope(tenantId, filter);
    if (query.search && this.searchable.length > 0) {
      Object.assign(scoped, {
        $or: this.searchable.map((field) => ({
          [field]: { $regex: query.search, $options: 'i' },
        })),
      });
    }

    const [items, total] = await Promise.all([
      this.model
        .find(scoped)
        .sort({ [query.sortBy]: query.sortOrder })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.model.countDocuments(scoped).exec(),
    ]);

    return { items, total };
  }

  update(tenantId: string, id: string, data: Partial<TDoc>, ctx: AuditContext): Promise<TDoc | null> {
    const patch = { ...data, updatedBy: ctx.userId } as UpdateQuery<TDoc>;
    return this.model
      .findOneAndUpdate(this.scope(tenantId, { _id: id }), patch, { new: true, runValidators: true })
      .exec();
  }

  /** Soft-deletes a document, preserving it for audit/history. */
  softDelete(tenantId: string, id: string, ctx: AuditContext): Promise<TDoc | null> {
    return this.model
      .findOneAndUpdate(
        this.scope(tenantId, { _id: id }),
        { isDeleted: true, deletedAt: new Date(), updatedBy: ctx.userId } as UpdateQuery<TDoc>,
        { new: true },
      )
      .exec();
  }

  count(tenantId: string, filter: FilterQuery<TDoc> = {}): Promise<number> {
    return this.model.countDocuments(this.scope(tenantId, filter)).exec();
  }

  /** Escape hatch for aggregate/reporting queries that still must be tenant-scoped. */
  protected get _model(): Model<TDoc> {
    return this.model;
  }

  protected toId(id: string): Types.ObjectId | string {
    return id;
  }
}

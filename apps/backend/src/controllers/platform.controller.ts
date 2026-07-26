import type { Request, Response } from 'express';
import { TENANT_STATUS } from '../constants/index.js';
import { buildMeta, parseListQuery } from '../core/pagination.js';
import { Announcement } from '../models/Announcement.js';
import {
  PlatformSettings,
  getPlatformSettings,
  invalidatePlatformSettingsCache,
} from '../models/PlatformSettings.js';
import { SupportTicket, TICKET_STATUS } from '../models/SupportTicket.js';
import { Tenant } from '../models/Tenant.js';
import { platformService } from '../services/platform.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function adminId(req: Request): string {
  if (!req.platformAdminId) throw AppError.unauthorized();
  return req.platformAdminId;
}

export const platformController = {
  async login(req: Request, res: Response): Promise<void> {
    const result = await platformService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 'Logged in');
  },

  async me(req: Request, res: Response): Promise<void> {
    const admin = await platformService.me(adminId(req));
    sendSuccess(res, admin, 'Current admin');
  },

  async stats(req: Request, res: Response): Promise<void> {
    adminId(req);
    sendSuccess(res, await platformService.stats(), 'Platform stats');
  },

  async listTenants(req: Request, res: Response): Promise<void> {
    adminId(req);
    const q = parseListQuery(req.query as Record<string, unknown>);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await platformService.listTenants(q, status);
    sendSuccess(res, items, 'Businesses', 200, buildMeta(q.page, q.limit, total));
  },

  async approve(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(req.params.id as string, TENANT_STATUS.ACTIVE, adminId(req));
    sendSuccess(res, tenant, 'Business approved');
  },

  async reject(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(
      req.params.id as string,
      TENANT_STATUS.REJECTED,
      adminId(req),
      req.body?.reason,
    );
    sendSuccess(res, tenant, 'Business rejected');
  },

  async suspend(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(req.params.id as string, TENANT_STATUS.SUSPENDED, adminId(req));
    sendSuccess(res, tenant, 'Business suspended');
  },

  async reactivate(req: Request, res: Response): Promise<void> {
    const tenant = await platformService.setStatus(req.params.id as string, TENANT_STATUS.ACTIVE, adminId(req));
    sendSuccess(res, tenant, 'Business reactivated');
  },

  async getTenantFeatures(req: Request, res: Response): Promise<void> {
    adminId(req);
    const result = await platformService.getTenantFeatures(req.params.id as string);
    sendSuccess(res, result, 'Tenant features');
  },

  async setTenantFeatures(req: Request, res: Response): Promise<void> {
    adminId(req);
    const features = Array.isArray(req.body?.features) ? (req.body.features as string[]) : [];
    const enabled = await platformService.setTenantFeatures(req.params.id as string, features);
    sendSuccess(res, { enabled }, 'Tenant features updated');
  },

  async tenantOverview(req: Request, res: Response): Promise<void> {
    adminId(req);
    const overview = await platformService.tenantOverview(req.params.id as string);
    sendSuccess(res, overview, 'Tenant overview');
  },

  async listAnnouncements(req: Request, res: Response): Promise<void> {
    adminId(req);
    const items = await Announcement.find().sort({ createdAt: -1 }).exec();
    sendSuccess(res, items, 'Announcements');
  },

  async createAnnouncement(req: Request, res: Response): Promise<void> {
    adminId(req);
    const { title, body, level } = req.body as { title: string; body: string; level?: string };
    if (!title || !body) throw AppError.badRequest('Title and body are required');
    const doc = await Announcement.create({ title, body, level: level === 'warning' ? 'warning' : 'info' });
    sendSuccess(res, doc, 'Announcement published', 201);
  },

  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    adminId(req);
    await Announcement.deleteOne({ _id: req.params.id }).exec();
    sendSuccess(res, { id: req.params.id }, 'Announcement removed');
  },

  async getSettings(req: Request, res: Response): Promise<void> {
    adminId(req);
    const settings = await getPlatformSettings();
    sendSuccess(res, settings, 'Platform settings');
  },

  async listTickets(req: Request, res: Response): Promise<void> {
    adminId(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const filter = status ? { status } : {};
    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 }).limit(100).lean().exec();
    const tenantIds = [...new Set(tickets.map((t) => String(t.tenantId)))];
    const tenants = await Tenant.find({ _id: { $in: tenantIds } })
      .select('businessName')
      .lean()
      .exec();
    const nameById = new Map(tenants.map((t) => [String(t._id), t.businessName]));
    const withNames = tickets.map((t) => ({ ...t, businessName: nameById.get(String(t.tenantId)) ?? '—' }));
    sendSuccess(res, withNames, 'Support tickets');
  },

  async replyTicket(req: Request, res: Response): Promise<void> {
    adminId(req);
    const { message } = req.body as { message?: string };
    if (!message) throw AppError.badRequest('Message is required');
    const ticket = await SupportTicket.findById(req.params.id).exec();
    if (!ticket) throw AppError.notFound('Ticket not found');
    ticket.messages.push({ author: 'admin', body: message, at: new Date() });
    ticket.status = TICKET_STATUS.ANSWERED;
    await ticket.save();
    sendSuccess(res, ticket, 'Reply sent');
  },

  async closeTicket(req: Request, res: Response): Promise<void> {
    adminId(req);
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: TICKET_STATUS.CLOSED },
      { new: true },
    ).exec();
    if (!ticket) throw AppError.notFound('Ticket not found');
    sendSuccess(res, ticket, 'Ticket closed');
  },

  async updateSettings(req: Request, res: Response): Promise<void> {
    adminId(req);
    const { maintenanceMode, maintenanceMessage } = req.body as {
      maintenanceMode?: boolean;
      maintenanceMessage?: string;
    };
    const update: Record<string, unknown> = {};
    if (typeof maintenanceMode === 'boolean') update.maintenanceMode = maintenanceMode;
    if (typeof maintenanceMessage === 'string') update.maintenanceMessage = maintenanceMessage;
    const settings = await PlatformSettings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).exec();
    invalidatePlatformSettingsCache();
    sendSuccess(res, settings, 'Platform settings updated');
  },
};

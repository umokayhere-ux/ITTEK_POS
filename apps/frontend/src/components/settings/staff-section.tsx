'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api, getApiErrorMessage } from '@/lib/api';
import type { ApiSuccess, StaffMember } from '@/lib/types';

export const ROLES = [
  'branch_manager',
  'store_manager',
  'cashier',
  'store_keeper',
  'accountant',
  'sales_representative',
  'auditor',
];

const roleLabel = (r: string) => r.replace(/_/g, ' ');

export function StaffSection() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<StaffMember[]>>('/staff');
      return data.data;
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff'] });

  const create = useMutation({
    mutationFn: () => api.post('/staff', { name, email, password, role }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: invalidate,
  });

  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState('cashier');
  const [editActive, setEditActive] = useState(true);
  const update = useMutation({
    mutationFn: () => api.patch(`/staff/${editing?.id}`, { role: editRole, isActive: editActive }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  function openEdit(m: StaffMember) {
    setEditing(m);
    setEditRole(m.role);
    setEditActive(m.isActive);
  }

  const members = (list.data ?? []).filter((m) => m.role !== 'owner');
  const owner = (list.data ?? []).find((m) => m.role === 'owner');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Invite staff and assign roles. Staff sign in at the normal login.
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add staff
        </Button>
      </div>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {owner && (
              <TR>
                <TD className="font-medium">{owner.name}</TD>
                <TD className="text-muted-foreground">{owner.email}</TD>
                <TD>
                  <Badge tone="success">Owner</Badge>
                </TD>
                <TD>
                  <Badge tone="success">Active</Badge>
                </TD>
                <TD className="text-right text-muted-foreground">—</TD>
              </TR>
            )}
            {members.map((m) => (
              <TR key={m.id}>
                <TD className="font-medium">{m.name}</TD>
                <TD className="text-muted-foreground">{m.email}</TD>
                <TD className="capitalize">{roleLabel(m.role)}</TD>
                <TD>
                  <Badge tone={m.isActive ? 'success' : 'default'}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Remove"
                      onClick={() => {
                        if (confirm(`Remove ${m.name}?`)) remove.mutate(m.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Add staff member">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {roleLabel(r)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {create.isError && <p className="text-sm text-destructive">{getApiErrorMessage(create.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={create.isPending}
              disabled={!name || !email || password.length < 8}
              onClick={() => create.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? ''}`}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editRole">Role</Label>
            <Select id="editRole" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4" />
            Active (can sign in)
          </label>

          {update.isError && <p className="text-sm text-destructive">{getApiErrorMessage(update.error)}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={update.isPending} onClick={() => update.mutate()}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

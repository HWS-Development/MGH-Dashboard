import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { updateProperty } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, XCircle, Eye, CheckCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useTranslation } from '@/i18n';

export default function PendingUpdates() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewModal, setViewModal] = useState(null);
  const [tab, setTab] = useState('pending');
  const { t } = useTranslation();

  const { data: allUpdates = [], isLoading } = useQuery({
    queryKey: ['pending-updates-all'],
    queryFn: () => base44.entities.pending_updates.list('-updated_at'),
  });

  const pending = allUpdates.filter(u => u.status === 'pending');
  const history = allUpdates.filter(u => u.status !== 'pending');

  const approveMutation = useMutation({
    mutationFn: async (update) => {
      // Save changes to database
      const newValues = {};
      for (const [field, val] of Object.entries(update.changes || {})) {
        newValues[field] = val.new_value !== undefined ? val.new_value : val;
      }
      await updateProperty(update.property_id, newValues);
      // Mark as approved
      await base44.entities.pending_updates.update(update.id, {
        status: 'approved',
        approved_by: user?.email || 'admin',
        approved_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-updates-all'] });
      queryClient.invalidateQueries({ queryKey: ['layout-pending-count'] });
      toast({ title: t('pendingUpdates.approvedApplied') });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (update) => {
      await base44.entities.pending_updates.update(update.id, {
        status: 'rejected',
        approved_by: user?.email || 'admin',
        approved_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-updates-all'] });
      queryClient.invalidateQueries({ queryKey: ['layout-pending-count'] });
      toast({ title: t('pendingUpdates.rejectedMsg') });
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      for (const update of pending) {
        const newValues = {};
        for (const [field, val] of Object.entries(update.changes || {})) {
          newValues[field] = val.new_value !== undefined ? val.new_value : val;
        }
        await updateProperty(update.property_id, newValues);
        await base44.entities.pending_updates.update(update.id, {
          status: 'approved',
          approved_by: user?.email || 'admin',
          approved_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-updates-all'] });
      queryClient.invalidateQueries({ queryKey: ['layout-pending-count'] });
      toast({ title: t('pendingUpdates.allApproved', { count: pending.length }) });
    },
  });

  const formatDate = (d) => {
    try { return format(new Date(d), 'dd/MM/yyyy HH:mm'); } catch { return d || '—'; }
  };

  const displayList = tab === 'pending' ? pending : history;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('pendingUpdates.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('pendingUpdates.subtitle')}</p>
        </div>
        {pending.length > 0 && (
          <Button
            onClick={() => approveAllMutation.mutate()}
            disabled={approveAllMutation.isPending}
            className="flex items-center gap-2 text-white"
            style={{ background: '#384252' }}
          >
            <CheckCheck className="w-4 h-4" />
            {t('pendingUpdates.approveAll', { count: pending.length })}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'pending', label: t('pendingUpdates.pendingTab'), count: pending.length },
          { key: 'history', label: t('pendingUpdates.historyTab'), count: history.length },
        ].map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tb.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            {tb.label}
            {tb.count > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tb.key === 'pending' ? 'bg-red-500/15 text-red-400' : 'bg-muted text-muted-foreground'
              }`}>{tb.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t('pendingUpdates.riad')}</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t('pendingUpdates.modifiedBy')}</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t('pendingUpdates.date')}</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t('pendingUpdates.modifiedFields')}</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t('pendingUpdates.status')}</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{t('pendingUpdates.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : displayList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {tab === 'pending' ? t('pendingUpdates.noPending') : t('pendingUpdates.noHistory')}
                </td>
              </tr>
            ) : (
              displayList.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{u.property_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.updated_by_email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.updated_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {Object.keys(u.changes || {}).length} {t('common.fields')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'pending' && <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">{t('pendingUpdates.pending')}</span>}
                    {u.status === 'approved' && <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">{t('pendingUpdates.approved')}</span>}
                    {u.status === 'rejected' && <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">{t('pendingUpdates.rejected')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setViewModal(u)}>
                        <Eye className="w-3 h-3 mr-1" />{t('pendingUpdates.view')}
                      </Button>
                      {u.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs text-white"
                            style={{ background: '#16a34a' }}
                            onClick={() => approveMutation.mutate(u)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />{t('pendingUpdates.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => rejectMutation.mutate(u)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />{t('pendingUpdates.reject')}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewModal && (
        <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('pendingUpdates.modifications')} — {viewModal.property_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="text-xs text-muted-foreground mb-3">
                {t('pendingUpdates.byOn', { email: viewModal.updated_by_email, date: formatDate(viewModal.updated_at) })}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground px-2 pb-1 border-b">
                <div>{t('pendingUpdates.field')}</div>
                <div>{t('pendingUpdates.oldValue')}</div>
                <div>{t('pendingUpdates.newValue')}</div>
              </div>
              {Object.entries(viewModal.changes || {}).map(([field, val]) => {
                const oldV = val?.old_value !== undefined ? String(val.old_value ?? '') : '—';
                const newV = val?.new_value !== undefined ? String(val.new_value ?? '') : String(val ?? '');
                return (
                  <div key={field} className="grid grid-cols-3 gap-2 text-xs px-2 py-2 rounded bg-muted/50">
                    <div className="font-medium text-muted-foreground">{field}</div>
                    <div className="text-muted-foreground break-all">{oldV || '—'}</div>
                    <div className="text-primary font-medium break-all">{newV || '—'}</div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

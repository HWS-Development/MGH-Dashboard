import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { updateProperty } from '@/lib/supabase';
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

export default function PendingUpdates() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewModal, setViewModal] = useState(null);
  const [tab, setTab] = useState('pending');

  const { data: allUpdates = [], isLoading } = useQuery({
    queryKey: ['pending-updates-all'],
    queryFn: () => base44.entities.pending_updates.list('-updated_at'),
  });

  const pending = allUpdates.filter(u => u.status === 'pending');
  const history = allUpdates.filter(u => u.status !== 'pending');

  const approveMutation = useMutation({
    mutationFn: async (update) => {
      // Push changes to Supabase
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
      toast({ title: '✅ Modification approuvée et appliquée dans Supabase' });
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
      toast({ title: '❌ Modification rejetée' });
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
      toast({ title: `✅ ${pending.length} modification(s) approuvées` });
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
          <h1 className="text-2xl font-bold text-gray-900">Modifications en attente</h1>
          <p className="text-sm text-gray-500 mt-0.5">Demandes de modification soumises par les propriétaires</p>
        </div>
        {pending.length > 0 && (
          <Button
            onClick={() => approveAllMutation.mutate()}
            disabled={approveAllMutation.isPending}
            className="flex items-center gap-2 text-white"
            style={{ background: '#8B1A1A' }}
          >
            <CheckCheck className="w-4 h-4" />
            Tout approuver ({pending.length})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'pending', label: 'En attente', count: pending.length },
          { key: 'history', label: 'Historique', count: history.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-current text-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t.key ? { borderColor: '#8B1A1A', color: '#8B1A1A' } : {}}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                t.key === 'pending' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Riad</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Modifié par</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Champs modifiés</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : displayList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  {tab === 'pending' ? 'Aucune modification en attente' : 'Aucun historique'}
                </td>
              </tr>
            ) : (
              displayList.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.property_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.updated_by_email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.updated_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {Object.keys(u.changes || {}).length} champ(s)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">En attente</span>}
                    {u.status === 'approved' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Approuvé</span>}
                    {u.status === 'rejected' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Rejeté</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setViewModal(u)}>
                        <Eye className="w-3 h-3 mr-1" />Voir
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
                            <CheckCircle2 className="w-3 h-3 mr-1" />Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => rejectMutation.mutate(u)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />Rejeter
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
              <DialogTitle>Modifications — {viewModal.property_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="text-xs text-gray-500 mb-3">
                Par <strong>{viewModal.updated_by_email}</strong> le {formatDate(viewModal.updated_at)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 px-2 pb-1 border-b">
                <div>Champ</div>
                <div>Ancienne valeur</div>
                <div>Nouvelle valeur</div>
              </div>
              {Object.entries(viewModal.changes || {}).map(([field, val]) => {
                const oldV = val?.old_value !== undefined ? String(val.old_value ?? '') : '—';
                const newV = val?.new_value !== undefined ? String(val.new_value ?? '') : String(val ?? '');
                return (
                  <div key={field} className="grid grid-cols-3 gap-2 text-xs px-2 py-2 rounded bg-gray-50">
                    <div className="font-medium text-gray-700">{field}</div>
                    <div className="text-gray-500 break-all">{oldV || '—'}</div>
                    <div className="text-green-700 font-medium break-all">{newV || '—'}</div>
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
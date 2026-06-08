import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Contact as ContactIcon, Search, User, Mail, Phone, Calendar, Building2 } from 'lucide-react';
import { listContacts } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const statusColors = {
  active: 'bg-primary/15 text-primary border-primary/30',
  suspended: 'bg-red-500/15 text-red-400 border-red-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'ex-member': 'bg-muted text-muted-foreground border-border',
};

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: result, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => listContacts({ order: 'property_name.asc' }),
  });

  const contacts = result?.data || [];

  const filtered = contacts.filter(c => {
    const matchesSearch = !search || 
      (c.property_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.login_email || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.membership_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <ContactIcon className="w-8 h-8 text-accent" />
          Contacts
        </h1>
        <p className="text-muted-foreground mt-1">{contacts.length} contacts enregistrés</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un contact..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="ex-member">Ex-membre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Propriété</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Membre depuis</TableHead>
                <TableHead>Renouvellement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Aucun contact trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(contact => (
                  <TableRow key={contact.property_id} className="hover:bg-muted/30 cursor-pointer">
                    <TableCell>
                      <Link to={`/properties/${contact.property_id}`} className="flex items-center gap-2 text-sm font-medium hover:text-accent">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {contact.property_name || '—'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{contact.contact_name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{contact.login_email || '—'}</TableCell>
                    <TableCell className="text-sm">{contact.phone_owner || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColors[contact.membership_status] || ''}`}>
                        {contact.membership_status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{contact.member_since || '—'}</TableCell>
                    <TableCell className="text-sm">{contact.renewal_date || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
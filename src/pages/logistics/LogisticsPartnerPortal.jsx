/**
 * Logistics Partner Portal
 * 2026 OS-grade command center for logistics partners
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import {
  getLogisticsPartnerShipments,
  bulkUpdateShipments,
  updateShipmentMilestone
} from '@/services/logisticsService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' }
];

export default function LogisticsPartnerPortal() {
  const {
    profileCompanyId,
    isSystemReady,
    canLoadData,
    capabilities
  } = useDashboardKernel();

  const canLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [uploadMode, setUploadMode] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const [updateForm, setUpdateForm] = useState({
    milestoneName: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (!isSystemReady || !canLoadData || !profileCompanyId) return;
    if (!canLogistics) return;
    loadShipments();
  }, [isSystemReady, canLoadData, profileCompanyId, canLogistics]);

  useEffect(() => {
    if (!profileCompanyId) return;
    const channel = supabase
      .channel(`logistics_shipments:${profileCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `logistics_partner_id=eq.${profileCompanyId}`
        },
        () => loadShipments()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profileCompanyId]);

  async function loadShipments() {
    setLoading(true);
    setError(null);
    try {
      const result = await getLogisticsPartnerShipments(profileCompanyId);
      if (!result.success) throw new Error(result.error || 'Failed to load shipments');
      setShipments(result.shipments || []);
    } catch (err) {
      setError(err?.message || 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }

  const filteredShipments = useMemo(() => {
    let filtered = shipments;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s) =>
        s.tracking_number?.toLowerCase().includes(term) ||
        s.trades?.title?.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }
    return filtered;
  }, [shipments, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter((s) => s.status === 'in_transit').length;
    const delivered = shipments.filter((s) => s.status === 'delivered').length;
    const pending = shipments.filter((s) => s.status === 'pending').length;
    return { total, inTransit, delivered, pending };
  }, [shipments]);

  async function handleUpdateMilestone() {
    if (!selectedShipment || !updateForm.milestoneName) return;
    setUpdating(true);
    try {
      const result = await updateShipmentMilestone({
        shipmentId: selectedShipment.id,
        milestoneName: updateForm.milestoneName,
        location: updateForm.location,
        notes: updateForm.notes
      });
      if (result.success) {
        setShowUpdatePanel(false);
        setSelectedShipment(null);
        setUpdateForm({ milestoneName: '', location: '', notes: '' });
        await loadShipments();
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleBulkUpload() {
    if (!csvContent.trim()) return;
    setUpdating(true);
    try {
      const lines = csvContent.trim().split('\n');
      const updates = lines.slice(1).map((line) => {
        const [tracking, status, location, timestamp, notes] = line.split(',');
        return {
          tracking_number: tracking?.trim(),
          status: status?.trim(),
          location: location?.trim(),
          timestamp: timestamp?.trim() || new Date().toISOString(),
          notes: notes?.trim() || ''
        };
      }).filter((u) => u.tracking_number);

      const result = await bulkUpdateShipments(updates);
      if (result.success) {
        await loadShipments();
        setCsvContent('');
        setUploadMode(false);
      }
    } finally {
      setUpdating(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'in_transit':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'picked_up':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'out_for_delivery':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-white/10 text-gray-300 border-white/10';
    }
  };

  if (!isSystemReady || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

  if (!canLogistics) {
    return (
      <div className="max-w-2xl mx-auto mt-16">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 text-sm text-red-700">
            Logistics capability not approved. Contact support to activate your logistics profile.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C0F] via-[#0E1218] to-[#10141C] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Logistics Partner Portal</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Control Tower</h1>
            <p className="text-sm text-gray-400 mt-2">Real-time shipment orchestration and event injection.</p>
          </div>
          <div className="rounded-2xl border border-afrikoni-gold/20 bg-white/5 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Trust Layer</p>
            <p className="text-sm font-semibold text-afrikoni-gold flex items-center gap-2 justify-end">
              <ShieldCheck className="w-4 h-4" /> Verified Logistics
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50/50 mb-6">
            <CardContent className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Shipments', value: stats.total, icon: Package },
            { label: 'In Transit', value: stats.inTransit, icon: Truck },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle2 },
            { label: 'Pending', value: stats.pending, icon: Clock }
          ].map((stat) => (
            <Card key={stat.label} className="border border-white/10 bg-white/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className="w-6 h-6 text-afrikoni-gold/80" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tracking # or trade title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-black">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => setUploadMode(true)}
            className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-black"
          >
            <Upload className="w-4 h-4 mr-2" /> Bulk Upload
          </Button>
        </div>

        {/* Shipments Table */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-3">Tracking</th>
                    <th className="px-6 py-3">Trade</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Last Update</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm font-mono text-white">
                        {shipment.tracking_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">
                        {shipment.trades?.title || 'Trade'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border ${getStatusBadge(shipment.status)}`}>
                          {shipment.status?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {shipment.current_location || shipment.last_update_location || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {shipment.last_tracking_update
                          ? new Date(shipment.last_tracking_update).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white"
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setShowUpdatePanel(true);
                          }}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredShipments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                        No shipments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Panel */}
      <AnimatePresence>
        {showUpdatePanel && selectedShipment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 w-[360px] rounded-2xl border border-white/10 bg-[#0F141B] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400">Update Shipment</p>
                <p className="text-sm font-semibold">{selectedShipment.tracking_number}</p>
              </div>
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => setShowUpdatePanel(false)}>
                Close
              </Button>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Milestone (e.g., In Transit)"
                value={updateForm.milestoneName}
                onChange={(e) => setUpdateForm({ ...updateForm, milestoneName: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="Location"
                value={updateForm.location}
                onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="Notes"
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button
                onClick={handleUpdateMilestone}
                disabled={updating}
                className="w-full bg-afrikoni-gold text-black"
              >
                {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Apply Update'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Panel */}
      <AnimatePresence>
        {uploadMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-6 w-[420px] rounded-2xl border border-white/10 bg-[#0F141B] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400">Bulk Upload</p>
                <p className="text-sm font-semibold">CSV format</p>
              </div>
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => setUploadMode(false)}>
                Close
              </Button>
            </div>

            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={6}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white"
              placeholder="tracking_number,status,location,timestamp,notes"
            />

            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleBulkUpload}
                disabled={updating}
                className="w-full bg-afrikoni-gold text-black"
              >
                {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Process Updates'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

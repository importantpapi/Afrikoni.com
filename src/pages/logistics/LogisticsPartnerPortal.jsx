/**
 * Logistics Partner Portal
 * Real-time shipment tracking and bulk upload interface for logistics partners
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import {
  Map, Truck, Package, Upload, Search, Filter,
  CheckCircle2, Clock, AlertCircle, Loader2, MapPin
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import {
  getLogisticsPartnerShipments,
  bulkUpdateShipments,
  updateShipmentMilestone
} from '@/services/logisticsService';

export default function LogisticsPartnerPortal() {
  const [partner, setPartner] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const [updateForm, setUpdateForm] = useState({
    milestoneName: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    initializePartner();
  }, []);

  useEffect(() => {
    filterShipments();
  }, [shipments, searchTerm, filterStatus]);

  async function initializePartner() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get partner company
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      setPartner(company);

      // Load shipments
      if (company) {
        const result = await getLogisticsPartnerShipments(company.name);
        if (result.success) {
          setShipments(result.shipments);
        }
      }
    } catch (err) {
      console.error('Failed to initialize partner:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterShipments() {
    let filtered = shipments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.tracking_number?.toLowerCase().includes(term) ||
        s.trades?.title?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    setFilteredShipments(filtered);
  }

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
        setShipments(shipments.map(s =>
          s.id === result.shipment.id ? result.shipment : s
        ));
        setShowUpdateForm(false);
        setSelectedShipment(null);
        setUpdateForm({ milestoneName: '', location: '', notes: '' });
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleBulkUpload() {
    if (!csvContent.trim()) return;

    setUpdating(true);
    try {
      // Parse CSV: tracking_number,status,location,timestamp,notes
      const lines = csvContent.trim().split('\n');
      const updates = lines.slice(1).map(line => {
        const [tracking, status, location, timestamp, notes] = line.split(',');
        return {
          tracking_number: tracking?.trim(),
          status: status?.trim(),
          location: location?.trim(),
          timestamp: timestamp?.trim() || new Date().toISOString(),
          notes: notes?.trim() || ''
        };
      }).filter(u => u.tracking_number);

      const result = await bulkUpdateShipments(updates);

      if (result.success) {
        // Refresh shipments
        await initializePartner();
        setCsvContent('');
        setUploadMode(false);
        alert(`Updated ${result.results.filter(r => r.success).length}/${result.results.length} shipments`);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'picked_up':
        return <Package className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E8] mb-2">
          Logistics Partner Portal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {partner?.name} - Update and track all shipments
        </p>
      </div>

      {!showUpdateForm && !uploadMode ? (
        <>
          {/* Toolbar */}
          <div className="mb-6 flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by tracking number or trade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
            <Button
              onClick={() => setUploadMode(true)}
              className="flex gap-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Shipments', value: shipments.length, icon: Package },
              { label: 'In Transit', value: shipments.filter(s => s.status === 'in_transit').length, icon: Truck },
              { label: 'Delivered', value: shipments.filter(s => s.status === 'delivered').length, icon: CheckCircle2 },
              { label: 'Pending', value: shipments.filter(s => s.status === 'pending').length, icon: Clock }
            ].map((stat, i) => (
              <Card key={i} className="shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <stat.icon className="w-8 h-8 text-afrikoni-gold opacity-50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Shipments Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tracking #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trade</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Est. Delivery</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredShipments.map(shipment => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm font-semibold">{shipment.tracking_number}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{shipment.trades?.title}</p>
                            <p className="text-sm text-gray-600">{shipment.trades?.companies?.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(shipment.status)}
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(shipment.status)}`}>
                              {shipment.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {shipment.last_update_location ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {shipment.last_update_location}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {shipment.estimated_delivery_date
                            ? new Date(shipment.estimated_delivery_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setShowUpdateForm(true);
                            }}
                            className="text-xs bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : uploadMode ? (
        /* Bulk Upload Form */
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Bulk Upload Shipment Updates</h2>
            <p className="text-sm text-gray-600 mb-4">
              Paste CSV data with columns: tracking_number, status, location, timestamp, notes
            </p>
            <Textarea
              placeholder={`tracking_number,status,location,timestamp,notes
DHL123456,Pickup Confirmed,Lagos Port,2026-02-09T10:00:00Z,Ready for shipment
FDX789012,In Transit,Over Atlantic,2026-02-10T15:30:00Z,On schedule`}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={8}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setUploadMode(false);
                  setCsvContent('');
                }}
                variant="outline"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpload}
                disabled={updating || !csvContent.trim()}
                className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-gold/90"
              >
                {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Upload Updates'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Individual Update Form */
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Update Shipment</h2>
            <p className="text-sm text-gray-600 mb-4 font-mono">{selectedShipment?.tracking_number}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Milestone Event *</label>
                <select
                  value={updateForm.milestoneName}
                  onChange={(e) => setUpdateForm({ ...updateForm, milestoneName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select milestone</option>
                  <option value="Pickup Scheduled">Pickup Scheduled</option>
                  <option value="Pickup Confirmed">Pickup Confirmed</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivery Scheduled">Delivery Scheduled</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Location</label>
                <Input
                  placeholder="City, Country or GPS coordinates"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedShipment(null);
                  }}
                  variant="outline"
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateMilestone}
                  disabled={updating}
                  className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                >
                  {updating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update Shipment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

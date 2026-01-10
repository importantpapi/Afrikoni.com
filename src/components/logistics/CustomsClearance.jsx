/**
 * Customs Clearance Component
 * Manages customs clearance for cross-border shipments
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Upload, CheckCircle, AlertCircle, Clock, 
  DollarSign, Globe, Shield, Download, X
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shared/ui/dialog';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  requires_documents: 'bg-orange-100 text-orange-800',
  requires_payment: 'bg-red-100 text-red-800',
  cleared: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  held: 'bg-orange-100 text-orange-800'
};

export default function CustomsClearance({ shipmentId, orderId, isLogistics = false }) {
  const [customs, setCustoms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    status: 'pending',
    border_crossing_point: '',
    declared_value: '',
    duties_amount: '',
    taxes_amount: '',
    customs_broker_name: '',
    customs_broker_contact: '',
    broker_fee: '',
    customs_notes: '',
    estimated_clearance_date: ''
  });

  useEffect(() => {
    if (shipmentId) {
      loadCustomsData();
    }
  }, [shipmentId]);

  const loadCustomsData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customs_clearance')
        .select('*')
        .eq('shipment_id', shipmentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCustoms(data);
        setFormData({
          status: data.status || 'pending',
          border_crossing_point: data.border_crossing_point || '',
          declared_value: data.declared_value?.toString() || '',
          duties_amount: data.duties_amount?.toString() || '',
          taxes_amount: data.taxes_amount?.toString() || '',
          customs_broker_name: data.customs_broker_name || '',
          customs_broker_contact: data.customs_broker_contact || '',
          broker_fee: data.broker_fee?.toString() || '',
          customs_notes: data.customs_notes || '',
          estimated_clearance_date: data.estimated_clearance_date ? 
            format(new Date(data.estimated_clearance_date), 'yyyy-MM-dd') : ''
        });
      }
    } catch (error) {
      console.error('Error loading customs data:', error);
      toast.error('Failed to load customs information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);

      const updateData = {
        shipment_id: shipmentId,
        order_id: orderId,
        status: formData.status,
        border_crossing_point: formData.border_crossing_point || null,
        declared_value: formData.declared_value ? parseFloat(formData.declared_value) : null,
        duties_amount: formData.duties_amount ? parseFloat(formData.duties_amount) : 0,
        taxes_amount: formData.taxes_amount ? parseFloat(formData.taxes_amount) : 0,
        total_customs_fees: (parseFloat(formData.duties_amount || 0) + parseFloat(formData.taxes_amount || 0)),
        customs_broker_name: formData.customs_broker_name || null,
        customs_broker_contact: formData.customs_broker_contact || null,
        broker_fee: formData.broker_fee ? parseFloat(formData.broker_fee) : 0,
        customs_notes: formData.customs_notes || null,
        estimated_clearance_date: formData.estimated_clearance_date || null,
        updated_at: new Date().toISOString()
      };

      if (formData.status === 'submitted' && !customs?.submitted_at) {
        updateData.submitted_at = new Date().toISOString();
      }

      if (formData.status === 'cleared' && !customs?.cleared_at) {
        updateData.cleared_at = new Date().toISOString();
      }

      let result;
      if (customs) {
        const { data, error } = await supabase
          .from('customs_clearance')
          .update(updateData)
          .eq('id', customs.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('customs_clearance')
          .insert(updateData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      setCustoms(result);
      toast.success('Customs information saved');
      setShowEditDialog(false);

      // Create tracking event for customs status change
      await supabase.from('shipment_tracking_events').insert({
        shipment_id: shipmentId,
        event_type: formData.status === 'cleared' ? 'customs_cleared' : 'in_customs',
        status: formData.status,
        location: formData.border_crossing_point || 'Customs',
        description: `Customs status: ${formData.status.replace(/_/g, ' ')}`,
        notes: formData.customs_notes
      });
    } catch (error) {
      console.error('Error saving customs:', error);
      toast.error('Failed to save customs information');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-afrikoni-gold/20">
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-afrikoni-gold/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-afrikoni-gold" />
            Customs Clearance
          </CardTitle>
          {isLogistics && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  {customs ? 'Update' : 'Add Customs Info'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Customs Clearance Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="requires_documents">Requires Documents</SelectItem>
                          <SelectItem value="requires_payment">Requires Payment</SelectItem>
                          <SelectItem value="cleared">Cleared</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="held">Held</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Border Crossing Point</Label>
                      <Input
                        value={formData.border_crossing_point}
                        onChange={(e) => setFormData({...formData, border_crossing_point: e.target.value})}
                        placeholder="e.g., Lagos Port, Tema Port"
                      />
                    </div>
                    <div>
                      <Label>Declared Value (USD)</Label>
                      <Input
                        type="number"
                        value={formData.declared_value}
                        onChange={(e) => setFormData({...formData, declared_value: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Estimated Clearance Date</Label>
                      <Input
                        type="date"
                        value={formData.estimated_clearance_date}
                        onChange={(e) => setFormData({...formData, estimated_clearance_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Duties Amount (USD)</Label>
                      <Input
                        type="number"
                        value={formData.duties_amount}
                        onChange={(e) => setFormData({...formData, duties_amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Taxes Amount (USD)</Label>
                      <Input
                        type="number"
                        value={formData.taxes_amount}
                        onChange={(e) => setFormData({...formData, taxes_amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Customs Broker Name</Label>
                      <Input
                        value={formData.customs_broker_name}
                        onChange={(e) => setFormData({...formData, customs_broker_name: e.target.value})}
                        placeholder="Broker company name"
                      />
                    </div>
                    <div>
                      <Label>Broker Contact</Label>
                      <Input
                        value={formData.customs_broker_contact}
                        onChange={(e) => setFormData({...formData, customs_broker_contact: e.target.value})}
                        placeholder="Email or phone"
                      />
                    </div>
                    <div>
                      <Label>Broker Fee (USD)</Label>
                      <Input
                        type="number"
                        value={formData.broker_fee}
                        onChange={(e) => setFormData({...formData, broker_fee: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.customs_notes}
                      onChange={(e) => setFormData({...formData, customs_notes: e.target.value})}
                      placeholder="Additional customs information..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isUpdating} className="bg-afrikoni-gold hover:bg-afrikoni-goldDark">
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!customs ? (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-afrikoni-gold/50 mx-auto mb-3" />
            <p className="text-sm text-afrikoni-text-dark/70 mb-4">
              No customs clearance information yet
            </p>
            {isLogistics && (
              <Button size="sm" onClick={() => setShowEditDialog(true)}>
                Add Customs Information
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={STATUS_COLORS[customs.status] || STATUS_COLORS.pending}>
                {customs.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {customs.cleared_at && (
                <span className="text-xs text-afrikoni-text-dark/70">
                  Cleared: {format(new Date(customs.cleared_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {customs.border_crossing_point && (
                <div>
                  <span className="text-afrikoni-text-dark/70">Border Point</span>
                  <p className="font-medium">{customs.border_crossing_point}</p>
                </div>
              )}
              {customs.declared_value && (
                <div>
                  <span className="text-afrikoni-text-dark/70">Declared Value</span>
                  <p className="font-medium">${parseFloat(customs.declared_value).toLocaleString()}</p>
                </div>
              )}
              {customs.total_customs_fees > 0 && (
                <div>
                  <span className="text-afrikoni-text-dark/70">Total Customs Fees</span>
                  <p className="font-medium">${parseFloat(customs.total_customs_fees).toLocaleString()}</p>
                </div>
              )}
              {customs.estimated_clearance_date && (
                <div>
                  <span className="text-afrikoni-text-dark/70">Estimated Clearance</span>
                  <p className="font-medium">{format(new Date(customs.estimated_clearance_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {customs.customs_broker_name && (
                <div>
                  <span className="text-afrikoni-text-dark/70">Customs Broker</span>
                  <p className="font-medium">{customs.customs_broker_name}</p>
                </div>
              )}
            </div>

            {customs.customs_notes && (
              <div className="pt-4 border-t border-afrikoni-gold/20">
                <span className="text-xs text-afrikoni-text-dark/70">Notes</span>
                <p className="text-sm text-afrikoni-text-dark mt-1">{customs.customs_notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


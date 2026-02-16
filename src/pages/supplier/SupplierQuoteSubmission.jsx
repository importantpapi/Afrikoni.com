/**
 * Supplier Quote Explorer & Submission
 * Allows suppliers to find RFQs and submit competitive quotes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Search, Filter, MapPin, Calendar, DollarSign, TrendingUp,
  ChevronRight, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { getAvailableRFQs, getRFQDetails, submitQuote } from '@/services/quoteService';
import { supabase } from '@/api/supabaseClient';

export default function SupplierQuoteSubmission() {
  const [user, setUser] = useState(null);
  const [supplierCompany, setSupplierCompany] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [filteredRfqs, setFilteredRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [quoteForm, setQuoteForm] = useState({
    unitPrice: '',
    totalPrice: '',
    currency: 'USD',
    leadTime: '',
    incoterms: 'FOB',
    deliveryLocation: '',
    paymentTerms: 'Net 30',
    certificates: [],
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    initializeSupplier();
  }, []);

  useEffect(() => {
    filterRfqs();
  }, [rfqs, searchTerm, filterCountry]);

  async function initializeSupplier() {
    try {
      const { data: { user: userData } } = await supabase.auth.getUser();
      setUser(userData);

      if (userData) {
        // Get supplier's company
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', userData.id)
          .single();

        setSupplierCompany(company);

        // Load available RFQs
        const result = await getAvailableRFQs();
        if (result.success) {
          setRfqs(result.rfqs);
        }
      }
    } catch (err) {
      console.error('Failed to initialize supplier:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterRfqs() {
    let filtered = rfqs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rfq =>
        rfq.title?.toLowerCase().includes(term) ||
        rfq.description?.toLowerCase().includes(term)
      );
    }

    if (filterCountry) {
      filtered = filtered.filter(rfq =>
        rfq.companies?.country === filterCountry
      );
    }

    setFilteredRfqs(filtered);
  }

  function validateQuoteForm() {
    const errors = {};

    if (!quoteForm.unitPrice || parseFloat(quoteForm.unitPrice) <= 0) {
      errors.unitPrice = 'Valid unit price required';
    }

    if (!quoteForm.totalPrice || parseFloat(quoteForm.totalPrice) <= 0) {
      errors.totalPrice = 'Valid total price required';
    }

    if (!quoteForm.leadTime || parseInt(quoteForm.leadTime) <= 0) {
      errors.leadTime = 'Lead time in days required';
    }

    if (!quoteForm.deliveryLocation?.trim()) {
      errors.deliveryLocation = 'Delivery location required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmitQuote() {
    if (!validateQuoteForm() || !selectedRfq || !supplierCompany) return;

    setSubmitting(true);
    try {
      const result = await submitQuote({
        rfqId: selectedRfq.id,
        supplierId: user.id,
        supplierCompanyId: supplierCompany.id,
        unitPrice: parseFloat(quoteForm.unitPrice),
        totalPrice: parseFloat(quoteForm.totalPrice),
        currency: quoteForm.currency,
        leadTime: parseInt(quoteForm.leadTime),
        deliveryIncoterms: quoteForm.incoterms,
        deliveryLocation: quoteForm.deliveryLocation,
        paymentTerms: quoteForm.paymentTerms,
        certificates: quoteForm.certificates,
        notes: quoteForm.notes
      });

      if (result.success) {
        setSubmitSuccess(true);
        setShowQuoteForm(false);
        setSelectedRfq(null);
        setQuoteForm({
          unitPrice: '',
          totalPrice: '',
          currency: 'USD',
          leadTime: '',
          incoterms: 'FOB',
          deliveryLocation: '',
          paymentTerms: 'Net 30',
          certificates: [],
          notes: ''
        });

        // Refresh RFQs after short delay
        setTimeout(() => {
          setSubmitSuccess(false);
          initializeSupplier();
        }, 3000);
      } else {
        alert(`Quote submission failed: ${result.error}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="p-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-os-2xl font-bold text-green-900 mb-2">Quote Submitted!</h2>
            <p className="text-green-700">The buyer will review your quote and respond shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E8] mb-2">
          Available RFQs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and submit competitive quotes on buyer RFQs
        </p>
      </div>

      {!showQuoteForm ? (
        <>
          {/* Search & Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search RFQs by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Countries</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Kenya">Kenya</option>
                <option value="Egypt">Egypt</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>
          </div>

          {/* RFQ List */}
          <div className="space-y-4">
            {filteredRfqs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No RFQs match your filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredRfqs.map((rfq) => (
                <Card
                  key={rfq.id}
                  className="border-os-accent/20 hover:border-os-accent/40 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedRfq(rfq);
                    setShowQuoteForm(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-os-lg font-bold text-gray-900 dark:text-[#F5F0E8] mb-2">
                          {rfq.title}
                        </h3>
                        <p className="text-os-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {rfq.description}
                        </p>

                        <div className="grid grid-cols-4 gap-4 text-os-sm">
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                              {rfq.quantity} {rfq.quantity_unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Budget</p>
                            <p className="font-semibold text-os-accent">
                              ${rfq.target_price?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Buyer</p>
                            <p className="font-semibold text-gray-900 dark:text-[#F5F0E8]">
                              {rfq.companies?.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Trust Score</p>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                {rfq.companies?.trust_score?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-6 h-6 text-os-accent mt-1 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        /* Quote Submission Form */
        <Card className="border-os-accent/20 shadow-os-md rounded-afrikoni-lg">
          <CardContent className="p-8">
            <div className="mb-6">
              <Button
                onClick={() => {
                  setShowQuoteForm(false);
                  setSelectedRfq(null);
                }}
                variant="outline"
                className="mb-4"
              >
                ← Back to RFQs
              </Button>

              <h2 className="text-os-2xl font-bold text-gray-900 dark:text-[#F5F0E8]">
                Submit Quote
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedRfq?.title}
              </p>
            </div>

            {/* RFQ Summary */}
            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg mb-6 grid grid-cols-3 gap-4 text-os-sm">
              <div>
                <p className="text-gray-600">Required Quantity</p>
                <p className="font-bold text-gray-900 dark:text-[#F5F0E8]">
                  {selectedRfq?.quantity} {selectedRfq?.quantity_unit}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Budget</p>
                <p className="font-bold text-os-accent">
                  ${selectedRfq?.target_price?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Buyer Company</p>
                <p className="font-bold text-gray-900 dark:text-[#F5F0E8]">
                  {selectedRfq?.companies?.name}
                </p>
              </div>
            </div>

            {/* Quote Form */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Unit Price *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quoteForm.unitPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })}
                    className={formErrors.unitPrice ? 'border-red-500' : ''}
                  />
                  {formErrors.unitPrice && <p className="text-red-600 text-os-sm mt-1">{formErrors.unitPrice}</p>}
                </div>
                <div>
                  <Label>Total Price *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quoteForm.totalPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, totalPrice: e.target.value })}
                    className={formErrors.totalPrice ? 'border-red-500' : ''}
                  />
                  {formErrors.totalPrice && <p className="text-red-600 text-os-sm mt-1">{formErrors.totalPrice}</p>}
                </div>
                <div>
                  <Label>Currency</Label>
                  <select
                    value={quoteForm.currency}
                    onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="NGN">NGN</option>
                  </select>
                </div>
              </div>

              {/* Lead Time & Delivery */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Lead Time (days) *</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={quoteForm.leadTime}
                    onChange={(e) => setQuoteForm({ ...quoteForm, leadTime: e.target.value })}
                    className={formErrors.leadTime ? 'border-red-500' : ''}
                  />
                  {formErrors.leadTime && <p className="text-red-600 text-os-sm mt-1">{formErrors.leadTime}</p>}
                </div>
                <div>
                  <Label>Incoterms</Label>
                  <select
                    value={quoteForm.incoterms}
                    onChange={(e) => setQuoteForm({ ...quoteForm, incoterms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="EXW">EXW - Ex Works</option>
                    <option value="FOB">FOB - Free on Board</option>
                    <option value="CIF">CIF - Cost Insurance Freight</option>
                    <option value="CIP">CIP - Carriage and Insurance Paid</option>
                    <option value="DDP">DDP - Delivered Duty Paid</option>
                  </select>
                </div>
                <div>
                  <Label>Payment Terms</Label>
                  <select
                    value={quoteForm.paymentTerms}
                    onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="50% Advance">50% Advance + 50% on Delivery</option>
                    <option value="Full Advance">Full Advance</option>
                  </select>
                </div>
              </div>

              {/* Delivery Location */}
              <div>
                <Label>Delivery Location *</Label>
                <Input
                  placeholder="City, Country"
                  value={quoteForm.deliveryLocation}
                  onChange={(e) => setQuoteForm({ ...quoteForm, deliveryLocation: e.target.value })}
                  className={formErrors.deliveryLocation ? 'border-red-500' : ''}
                />
                {formErrors.deliveryLocation && <p className="text-red-600 text-os-sm mt-1">{formErrors.deliveryLocation}</p>}
              </div>

              {/* Notes */}
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any additional information to support your quote..."
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowQuoteForm(false);
                    setSelectedRfq(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitQuote}
                  disabled={submitting}
                  className="flex-1 bg-os-accent hover:bg-os-accent/90 text-white font-bold"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Quote</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

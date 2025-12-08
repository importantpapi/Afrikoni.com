import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

export default function SupplierVerificationModal({ open, onOpenChange, companyId, onSuccess }) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_license: '',
    tax_number: '',
    address_country: '',
    certificate_uploads: []
  });
  const [uploadingFiles, setUploadingFiles] = useState({});

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [field]: true }));

    try {
      const fileName = `verification-docs/${companyId}/${field}/${Date.now()}-${file.name}`;
      const { file_url } = await supabaseHelpers.storage.uploadFile(
        file,
        'files',
        fileName
      );

      if (field === 'certificate_uploads') {
        setFormData(prev => ({
          ...prev,
          certificate_uploads: [...prev.certificate_uploads, file_url]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: file_url
        }));
      }

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!companyId) {
      toast.error('Company ID is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update company with verification data
      const { error } = await supabase
        .from('companies')
        .update({
          business_license: formData.business_license || null,
          tax_number: formData.tax_number || null,
          address_country: formData.address_country || null,
          certificate_uploads: formData.certificate_uploads.length > 0 ? formData.certificate_uploads : null,
          verification_status: 'pending' // Set status to pending for admin review
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Verification documents submitted successfully. Our team will review them within 24-48 hours.');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Verification submission error:', error);
      toast.error('Failed to submit verification documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeCertificate = (index) => {
    setFormData(prev => ({
      ...prev,
      certificate_uploads: prev.certificate_uploads.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-afrikoni-chestnut">
            Supplier Verification
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Card */}
          <Card className="border-afrikoni-gold/20 bg-afrikoni-gold/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-afrikoni-deep">
                    Complete verification to get your "Verified Supplier" badge and increase buyer trust. 
                    All documents are securely stored and reviewed by our team.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business License */}
          <div>
            <Label htmlFor="business_license" className="font-semibold text-afrikoni-chestnut mb-2 block">
              Business License Number or Document
            </Label>
            <div className="space-y-2">
              <Input
                id="business_license"
                placeholder="Enter business license number"
                value={formData.business_license}
                onChange={(e) => setFormData(prev => ({ ...prev, business_license: e.target.value }))}
              />
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('business_license', file);
                    }}
                    disabled={uploadingFiles.business_license}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingFiles.business_license}
                    className="w-full"
                  >
                    {uploadingFiles.business_license ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload License Document
                      </>
                    )}
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Tax Number */}
          <div>
            <Label htmlFor="tax_number" className="font-semibold text-afrikoni-chestnut mb-2 block">
              Tax Identification Number
            </Label>
            <Input
              id="tax_number"
              placeholder="Enter tax ID number"
              value={formData.tax_number}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
            />
          </div>

          {/* Address Country */}
          <div>
            <Label htmlFor="address_country" className="font-semibold text-afrikoni-chestnut mb-2 block">
              Business Address Country
            </Label>
            <Input
              id="address_country"
              placeholder="Enter country of business address"
              value={formData.address_country}
              onChange={(e) => setFormData(prev => ({ ...prev, address_country: e.target.value }))}
            />
          </div>

          {/* Certificate Uploads */}
          <div>
            <Label className="font-semibold text-afrikoni-chestnut mb-2 block">
              Additional Certificates (Optional)
            </Label>
            <p className="text-sm text-afrikoni-deep/70 mb-3">
              Upload quality certificates, ISO certifications, or other relevant documents
            </p>
            <div className="space-y-2">
              {formData.certificate_uploads.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-afrikoni-offwhite rounded border border-afrikoni-gold/20">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-afrikoni-gold" />
                    <span className="text-sm text-afrikoni-deep truncate">{url.split('/').pop()}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCertificate(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('certificate_uploads', file);
                  }}
                  disabled={uploadingFiles.certificate_uploads}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingFiles.certificate_uploads}
                  className="w-full"
                >
                  {uploadingFiles.certificate_uploads ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Add Certificate
                    </>
                  )}
                </Button>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-sand/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


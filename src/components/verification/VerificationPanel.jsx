import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, CheckCircle, XCircle, Upload, FileText, UserCheck, Shield, Award, TrendingUp } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

const VERIFICATION_STEPS = [
  { id: 'business_registration', title: 'Business Registration', desc: 'Upload business license or certificate', icon: FileText, required: true },
  { id: 'identity_verification', title: 'Identity Verification', desc: 'Verify company directors/owners', icon: UserCheck, required: true },
  { id: 'tax_compliance', title: 'Tax Registration', desc: 'Provide valid TIN and tax docs', icon: Shield, required: true },
  { id: 'product_quality', title: 'Product Quality', desc: 'Upload certifications/standards', icon: Award, required: false },
  { id: 'bank_verification', title: 'Bank Account', desc: 'Verify business bank account', icon: TrendingUp, required: true }
];

export default function VerificationPanel({ onComplete }) {
  const { profileCompanyId, userId, organization } = useDashboardKernel();
  const [verifications, setVerifications] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileCompanyId) return;
    setLoading(true);
    supabase
      .from('kyc_verifications')
      .select('*')
      .eq('company_id', profileCompanyId)
      .then(({ data }) => {
        setVerifications(data || []);
        setLoading(false);
      });
  }, [profileCompanyId]);

  const handleUpload = async (step) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(step.id);
      const filePath = `kyc/${profileCompanyId}/${step.id}-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('kyc-documents').upload(filePath, file, { upsert: true });
      await supabase.from('kyc_verifications').upsert({
        company_id: profileCompanyId,
        user_id: userId,
        type: step.id,
        document_path: filePath,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });
      setUploading(null);
      // Refresh
      const { data } = await supabase.from('kyc_verifications').select('*').eq('company_id', profileCompanyId);
      setVerifications(data || []);
      if (onComplete) onComplete();
    };
    input.click();
  };

  const getStepStatus = (step) => {
    const v = verifications.find(v => v.type === step.id);
    if (!v) return { status: 'not_started' };
    return { status: v.status, doc: v.document_path };
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const allRequiredComplete = VERIFICATION_STEPS.filter(s => s.required).every(s => getStepStatus(s).status === 'verified');

  return (
    <Surface variant="panel" className="p-6 space-y-6">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-os-accent" /> Verification & Compliance</h2>
      <div className="space-y-4">
        {VERIFICATION_STEPS.map((step) => {
          const { status, doc } = getStepStatus(step);
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg bg-white/5">
              <Icon className="w-6 h-6 text-os-accent" />
              <div className="flex-1">
                <div className="font-bold">{step.title}</div>
                <div className="text-xs text-os-muted">{step.desc}</div>
              </div>
              {status === 'verified' ? (
                <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-4 h-4 mr-1" /> Verified</Badge>
              ) : status === 'pending' ? (
                <Badge className="bg-amber-100 text-amber-700"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>
              ) : (
                <Button size="sm" onClick={() => handleUpload(step)} disabled={!!uploading}>
                  {uploading === step.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Upload
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {allRequiredComplete ? (
        <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle className="w-5 h-5" /> All required steps complete</div>
      ) : null}
    </Surface>
  );
}

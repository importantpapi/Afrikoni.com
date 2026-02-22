import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, CheckCircle, XCircle, Upload, FileText, UserCheck, Shield, Award, TrendingUp, Clock } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import SuccessScreen from '@/components/shared/ui/SuccessScreen';

const VERIFICATION_STEPS = [
  { id: 'business_registration', title: 'Business Registration', desc: 'Upload business license or certificate', icon: FileText, required: true },
  { id: 'identity_verification', title: 'Identity Verification', desc: 'Verify company directors/owners', icon: UserCheck, required: true },
  { id: 'tax_compliance', title: 'Tax Registration', desc: 'Provide valid TIN and tax docs', icon: Shield, required: true },
  { id: 'product_quality', title: 'Product Quality', desc: 'Upload certifications/standards', icon: Award, required: false },
  { id: 'bank_verification', title: 'Bank Account', desc: 'Verify business bank account', icon: TrendingUp, required: true }
];

const COMPLIANCE_BY_COUNTRY = {
  'Nigeria': [
    { id: 'cac_status_report', title: 'CAC Status Report', desc: 'Active status report from Corporate Affairs Commission', icon: FileText, required: true },
    { id: 'soncap_cert', title: 'SONCAP Certificate', desc: 'Standard Organization of Nigeria Compliance', icon: Award, required: false }
  ],
  'Kenya': [
    { id: 'kra_compliance', title: 'KRA Tax Compliance', desc: 'Recent KRA TCC (Tax Compliance Certificate)', icon: Shield, required: true },
    { id: 'kebs_std', title: 'KEBS Standards', desc: 'Kenya Bureau of Standards PVoC', icon: Award, required: false }
  ],
  'Egypt': [
    { id: 'goat_cert', title: 'GOEIC Registration', desc: 'General Organization for Export & Import Control', icon: FileText, required: true }
  ]
};

export default function VerificationPanel({ onComplete, country = 'Nigeria' }) {
  const { profileCompanyId, userId, organization } = useDashboardKernel();
  const [verifications, setVerifications] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

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

  if (showSuccess) {
    return (
      <SuccessScreen
        title="Verification Documents Submitted"
        message="Your compliance documents have been received and are now under institutional review."
        theme="blue"
        icon={Shield}
        nextSteps={[
          { label: "Manual audit by Afrikoni Compliance Council (24-48h)", icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: "Trust Score recalculated upon validation", icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: "Tier-2 Trade Limits unlocked upon verification", icon: <Award className="w-4 h-4 text-blue-500" /> }
        ]}
        primaryAction={() => setShowSuccess(false)}
        primaryActionLabel="Review Documents"
        secondaryAction={onComplete}
        secondaryActionLabel="Continue to Dashboard"
      />
    );
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-os-accent" /></div>;

  const countrySteps = COMPLIANCE_BY_COUNTRY[country] || [];
  const combinedSteps = [...VERIFICATION_STEPS, ...countrySteps];
  const allRequiredComplete = combinedSteps.filter(s => s.required).every(s => getStepStatus(s).status === 'verified' || getStepStatus(s).status === 'pending');

  return (
    <Surface variant="panel" className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-os-accent" /> Verification & Compliance</h2>
        {country && <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{country} Specific Protocol</Badge>}
      </div>
      <div className="space-y-4">
        {combinedSteps.map((step) => {
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
                <Badge className="bg-amber-100 text-amber-700"><CheckCircle className="w-4 h-4 mr-1" /> Pending</Badge>
              ) : (
                <Button size="sm" onClick={() => handleUpload(step)} disabled={!!uploading}>
                  {uploading === step.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Upload
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {allRequiredComplete && (
        <div className="mt-8 pt-6 border-t border-os-stroke flex justify-center">
          <Button
            onClick={() => setShowSuccess(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 shadow-lg shadow-emerald-900/20"
          >
            Confirm Submission for Audit
          </Button>
        </div>
      )}
    </Surface>
  );
}

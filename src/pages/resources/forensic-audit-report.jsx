import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, Shield, CheckCircle, AlertTriangle,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import { generateForensicPDF } from '@/utils/pdfGenerator';

const REPORT_DATE = '2026-02-19';

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Conversation Overview',
    icon: FileText,
    items: [
      {
        label: 'Primary Objectives',
        content:
          'Forensic audit of Afrikoni, focusing on system architecture, security, UX, and business model. The goal was to understand how to attract suppliers, ensure user trust, and validate the platform's viability.'
      },
      {
        label: 'Session Context',
        content:
          'The conversation evolved from an initial audit request to discussions about market positioning, user experience, and security measures. Integration with WhatsApp and automation requirements were also explored.'
      },
      {
        label: 'User Intent Evolution',
        content:
          'Needs shifted from a general audit to specific inquiries about user engagement, supplier onboarding, and platform security measures.'
      }
    ]
  },
  {
    id: 'technical',
    title: '2. Technical Foundation',
    icon: Shield,
    items: [
      {
        label: 'WhatsApp Integration',
        content:
          'Core communication channel for user notification and automation. Enables outreach to low-tech users with limited internet connectivity.'
      },
      {
        label: 'Interface Philosophy',
        content:
          'User-friendly, mobile-first design targeted at traders with varying technical literacy across African markets.'
      },
      {
        label: 'Architectural Pattern',
        content:
          'Modular and scalable architecture to support organic growth, with an emphasis on low-bandwidth optimization.'
      },
      {
        label: 'Target Environment',
        content:
          'The platform caters to low-tech users with weak internet connectivity, requiring progressive enhancement and offline-friendly features.'
      }
    ]
  },
  {
    id: 'codebase',
    title: '3. Codebase Status',
    icon: CheckCircle,
    items: [
      {
        label: 'Platform Phase',
        content:
          'Afrikoni is in active development with core trade flows (RFQ, escrow, messaging, supplier onboarding) implemented. Focus areas include user engagement and security hardening.'
      },
      {
        label: 'Key Dependencies',
        content:
          'React 18, Supabase, Flutterwave, jsPDF/html2canvas (PDF generation), WhatsApp integration, Framer Motion for UX.'
      },
      {
        label: 'Security Measures',
        content:
          'KYC/KYB verification, audit logging, off-platform detection, escrow-protected payments, and Afrikoni Shield™ trust layer.'
      }
    ]
  },
  {
    id: 'problems',
    title: '4. Problem Resolution',
    icon: AlertTriangle,
    items: [
      {
        label: 'User Trust',
        content:
          'Addressed through escrow-protected payments, verified supplier badges, buyer protection guarantees, and a transparent dispute resolution mechanism.'
      },
      {
        label: 'Scam Prevention',
        content:
          'Off-platform communication detection, payment-channel enforcement, identity verification requirements, and proactive fraud monitoring are in place.'
      },
      {
        label: 'User Experience',
        content:
          'Simplified onboarding flows, WhatsApp-based RFQ submission, progressive disclosure for low-tech users, and mobile-first design reduce friction.'
      }
    ]
  },
  {
    id: 'progress',
    title: '5. Progress & Validated Outcomes',
    icon: CheckCircle,
    items: [
      {
        label: 'Completed',
        content:
          'Platform vision articulated; key improvement areas identified (user onboarding, supplier engagement, security); core flows (RFQ, escrow, messaging) built and tested.'
      },
      {
        label: 'In Progress',
        content:
          'WhatsApp automation integration, full forensic audit report finalization, supplier acquisition pipeline optimization.'
      },
      {
        label: 'Pending Validation',
        content:
          'End-to-end supplier onboarding user tests, payment gateway live transactions, logistics partner API connections.'
      }
    ]
  },
  {
    id: 'continuation',
    title: '6. Continuation Plan',
    icon: FileText,
    items: [
      {
        label: 'Priority 1 — Forensic Audit',
        content:
          'Conduct a full read-only audit of existing codebase and product flows to identify security gaps, UX bottlenecks, and architectural risks.'
      },
      {
        label: 'Priority 2 — WhatsApp Automation',
        content:
          'Develop a strategy for WhatsApp-based communication: automated RFQ notifications, order status updates, and supplier onboarding nudges.'
      },
      {
        label: 'Priority 3 — Supplier Strategy',
        content:
          'Build a targeted supplier acquisition playbook, including outreach scripts, onboarding incentives, and trust-building collateral.'
      },
      {
        label: 'Next Action',
        content:
          'Finalize this PDF summary and distribute it to the founding team and key stakeholders to align on priorities for the next sprint.'
      }
    ]
  }
];

function Section({ section }) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;
  return (
    <Card className="border-os-accent/20 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-os-accent/5 transition-colors rounded-t-lg"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-os-accent flex-shrink-0" />
          <h2 className="font-bold text-afrikoni-chestnut text-os-lg">{section.title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-afrikoni-deep/50" /> : <ChevronDown className="w-4 h-4 text-afrikoni-deep/50" />}
      </button>
      {open && (
        <CardContent className="pt-0 pb-5 px-5">
          <div className="space-y-4">
            {section.items.map((item, idx) => (
              <div key={idx} className="border-l-2 border-os-accent/30 pl-4">
                <p className="text-os-xs font-bold text-afrikoni-deep/60 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-afrikoni-deep leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ForensicAuditReport() {
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      await generateForensicPDF(
        reportRef.current.innerHTML,
        `Afrikoni_Forensic_Audit_Report_${REPORT_DATE}.pdf`
      );
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('[ForensicAuditReport] PDF generation failed:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <SEO
        title="Forensic Audit Report — Afrikoni Platform | AFRIKONI"
        description="Comprehensive forensic audit summary of Afrikoni's platform strategy, architecture, security, and business model as discussed during the founding session."
        url="/resources/forensic-audit-report"
      />

      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero */}
        <section className="bg-gradient-to-br from-os-accent/20 via-afrikoni-cream to-afrikoni-offwhite border-b border-os-accent/20">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-os-accent/20 mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <Shield className="w-8 h-8 text-os-accent" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Afrikoni Forensic Audit Report
              </h1>
              <p className="text-afrikoni-deep/70 text-os-lg mb-2">
                Platform Strategy · Architecture · Security · Business Model
              </p>
              <p className="text-afrikoni-deep/50 text-os-sm font-mono">
                Generated {REPORT_DATE} · Afrikoni Secure Ledger v2026.4
              </p>

              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="bg-afrikoni-chestnut hover:bg-afrikoni-chestnut/90 text-white px-8 py-3 text-os-base font-semibold shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating PDF…
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF Report
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Report Content */}
        <section className="py-10 md:py-14">
          <div className="max-w-4xl mx-auto px-4">
            <div ref={reportRef}>
              {SECTIONS.map((section, idx) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Section section={section} />
                </motion.div>
              ))}
            </div>

            {/* Footer CTA */}
            <motion.div
              className="mt-10 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                variant="outline"
                className="border-os-accent text-afrikoni-chestnut hover:bg-os-accent/10 px-8 py-3 font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <p className="mt-3 text-os-xs text-afrikoni-deep/50 font-mono">
                CERTIFIED BY AFRIKONI SECURE LEDGER · v2026.4 · IMMUTABLE DNA
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

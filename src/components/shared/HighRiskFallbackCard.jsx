import React from 'react';
import { MessageCircle, Phone, Mail } from 'lucide-react';

export default function HighRiskFallbackCard({
  title = 'Need human support right now?',
  description = 'If this step is blocked, contact Afrikoni support and share your trade or payment reference.',
  whatsappNumber = '+32456779368',
  phoneNumber = '+32 456 77 93 68',
  email = 'hello@afrikoni.com'
}) {
  const cleanWhatsApp = whatsappNumber.replace(/\D/g, '');
  return (
    <div className="rounded-os-md border border-os-accent/25 bg-os-accent/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--os-text-primary)]">{title}</h3>
      <p className="text-xs text-os-muted">{description}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/${cleanWhatsApp}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp Support
        </a>
        <a
          href={`tel:${phoneNumber}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-os-stroke bg-os-surface-1 text-[var(--os-text-primary)]"
        >
          <Phone className="w-3.5 h-3.5" />
          Call Support
        </a>
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-os-stroke bg-os-surface-1 text-[var(--os-text-primary)]"
        >
          <Mail className="w-3.5 h-3.5" />
          Email Support
        </a>
      </div>
    </div>
  );
}

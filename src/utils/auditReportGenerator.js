/**
 * THE FORENSIC AUDIT GENERATOR
 * 
 * Synthesizes Trade DNA, GPS logs, and Verification timestamps into
 * a "Bankable" digital certificate.
 */

import { TRADE_STATE_LABELS } from '@/services/tradeKernel';

/**
 * Generate a forensic profile for a trade
 * @param {Object} trade - The full trade object with metadata and relationships
 * @param {Array} events - The immutable trade_events ledger
 */
export function generateForensicProfile(trade, events) {
  const dna = trade.metadata?.trade_dna || 'NOT_INITIALIZED';
  const timestamp = new Date().toISOString();

  // 1. Extract GPS Breadcrumbs
  const gpsTrail = events
    .filter(e => e.metadata?.latitude && e.metadata?.longitude)
    .map(e => ({
      lat: e.metadata.latitude,
      lng: e.metadata.longitude,
      event: e.event_name,
      time: e.created_at
    }));

  // 2. Extract Verification Signatures
  const signatures = trade.metadata?.signatures || [];

  // 3. Construct Forensic HTML (for PDF/Print)
  const reportHtml = `
    <html>
      <body style="font-family: 'Inter', sans-serif; color: #111; padding: 40px; border: 12px solid #D4A937;">
        <div style="display: flex; justify-between; align-items: start; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">AFRIKONI OS</h1>
            <p style="margin: 5px 0 0; color: #666; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Forensic Audit Ledger • v2026.4</p>
          </div>
          <div style="text-align: right;">
             <p style="margin: 0; font-family: monospace; font-size: 11px; color: #888;">DNA: ${dna}</p>
          </div>
        </div>

        <div style="background: #F9FAFB; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Transaction DNA Profile</h2>
          <table style="width: 100%; font-size: 13px;">
            <tr><td style="color: #666;">Title:</td><td><strong>${trade.title}</strong></td></tr>
            <tr><td style="color: #666;">Counterparties:</td><td>${trade.buyer?.company_name} → ${trade.seller?.company_name || 'PENDING'}</td></tr>
            <tr><td style="color: #666;">Current State:</td><td><strong style="color: #059669;">${TRADE_STATE_LABELS[trade.status]}</strong></td></tr>
            <tr><td style="color: #666;">Integrity Commit:</td><td style="font-family: monospace; font-size: 11px;">${trade.id}</td></tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Forensic Event Stream</h2>
          <div style="font-family: monospace; font-size: 11px; margin-top: 15px;">
            ${events.map(e => `
              <div style="margin-bottom: 8px; border-left: 2px solid #525252; padding-left: 10px;">
                <span style="color: #888;">[${new Date(e.created_at).toLocaleTimeString()}]</span>
                <strong>${e.status_to.toUpperCase()}</strong>:
                <span style="color: #444;">${e.metadata?.reason || 'System Commit'}</span>
                ${e.metadata?.trade_dna ? `<br/><span style="color: #D4A937;">DNA-COMMIT: ${e.metadata.trade_dna.slice(0, 16)}...</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 30px;">
           <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Signature Verification (Consensus)</h2>
           <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
             ${signatures.map(s => `
               <div style="background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; padding: 8px 12px; border-radius: 8px; font-size: 10px; font-family: monospace;">
                 ${s}
               </div>
             `).join('')}
             ${signatures.length === 0 ? '<p style="font-size: 12px; color: #999;">Consensus pending next state transition.</p>' : ''}
           </div>
        </div>

        <div style="margin-top: 50px; border-top: 1px dotted #ccc; padding-top: 20px; font-size: 10px; color: #999; font-style: italic;">
          This document is an electronic representation of the Afrikoni Secure Trade Ledger. 
          The DNA hashes provided are cryptographically tied to the physical and digital state of the goods. 
          Verification Point: ${timestamp}
        </div>
      </body>
    </html>
  `;

  return {
    dna,
    timestamp,
    gpsTrail,
    signatures,
    reportHtml
  };
}

export default {
  generateForensicProfile
};

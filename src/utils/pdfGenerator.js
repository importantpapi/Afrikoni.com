/**
 * PDF Generator Service
 * Converts Forensic HTML into an Institutional-Grade Digital Certificate.
 */

import { sanitizeHTML } from './sanitizeHTML';

export async function generateForensicPDF(reportHtml, fileName = 'Forensic_Audit_Report.pdf') {
    const [{ jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas').then(m => m.default)
    ]);

    return new Promise(async (resolve, reject) => {
        try {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            container.style.width = '800px';
            container.innerHTML = sanitizeHTML(reportHtml);
            document.body.appendChild(container);

            // Give elements time to render if needed
            await new Promise(r => setTimeout(r, 100));

            const canvas = await html2canvas(container, {
                scale: 2, // High-res export
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add the main report image
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Add Institutional "Sovereign Proof" Watermark (Optional / Dynamic)
            pdf.setFontSize(8);
            pdf.setTextColor(200, 200, 200);
            pdf.text('CERTIFIED BY AFRIKONI SOVEREIGN LEDGER • v2026.4 • IMMUTABLE DNA', 105, 290, { align: 'center' });

            // Clean up
            document.body.removeChild(container);

            // Save the PDF
            pdf.save(fileName);
            resolve({ success: true, fileName });
        } catch (error) {
            console.error('[PDFGenerator] Export failed:', error);
            reject(error);
        }
    });
}

export default {
    generateForensicPDF
};

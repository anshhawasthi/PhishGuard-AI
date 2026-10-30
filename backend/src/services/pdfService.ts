import PDFDocument from 'pdfkit';
import { IAnalysisResponse } from './urlAnalyzer';

export function generatePdfReport(scan: IAnalysisResponse): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `PhishGuard AI Threat Report - ${scan.scanId || 'Scan'}`,
          Author: 'PhishGuard AI Security System',
          Subject: 'Automated Phishing Analysis Report',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors
      const primaryColor = '#00F0FF';
      const bgColor = '#050814';
      const darkCard = '#0F172A';
      const textLight = '#F8FAFC';
      const textMuted = '#94A3B8';
      const accentPurple = '#8B5CF6';

      let verdictColor = '#10B981'; // green for safe
      if (scan.verdict === 'phishing') verdictColor = '#EF4444'; // red
      else if (scan.verdict === 'suspicious') verdictColor = '#F59E0B'; // amber

      // 1. Header Banner
      doc.rect(0, 0, doc.page.width, 90).fill('#0B0F19');

      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold');
      doc.text('PHISHGUARD AI', 40, 25);

      doc.fillColor(accentPurple).fontSize(10).font('Helvetica');
      doc.text('Automated Phishing Detection & Threat Intelligence Platform', 40, 52);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica');
      doc.text(`REPORT GENERATED: ${new Date(scan.created_at).toUTCString()}`, doc.page.width - 240, 28, {
        align: 'right',
        width: 200,
      });
      doc.text(`SCAN ID: ${scan.scanId || 'LIVE-ON-DEMAND'}`, doc.page.width - 240, 42, {
        align: 'right',
        width: 200,
      });

      doc.moveDown(4);

      // 2. Executive Verdict Card
      const cardY = 110;
      doc.rect(40, cardY, doc.page.width - 80, 110).fillAndStroke(darkCard, '#1E293B');

      doc.fillColor(textMuted).fontSize(9).font('Helvetica-Bold');
      doc.text('TARGET URL EVALUATED', 60, cardY + 15);

      doc.fillColor(textLight).fontSize(11).font('Helvetica');
      const truncatedUrl = scan.original_url.length > 70 ? scan.original_url.slice(0, 70) + '...' : scan.original_url;
      doc.text(truncatedUrl, 60, cardY + 30);

      // Risk Gauge / Score display
      doc.fillColor(verdictColor).fontSize(32).font('Helvetica-Bold');
      doc.text(`${scan.risk_score}/100`, doc.page.width - 160, cardY + 20);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica');
      doc.text('RISK INDEX', doc.page.width - 160, cardY + 60);

      // Verdict Pill
      doc.rect(60, cardY + 65, 120, 24).fill(verdictColor);
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
      doc.text(scan.verdict.toUpperCase(), 60, cardY + 72, { width: 120, align: 'center' });

      // Model info
      doc.fillColor(textMuted).fontSize(9).font('Helvetica');
      doc.text(`Active ML Classifier: ${scan.model_version} | Probability: ${(scan.ml_probability * 100).toFixed(1)}%`, 200, cardY + 72);

      // 3. Threat Indicators & Risk Factors
      let currentY = cardY + 130;
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold');
      doc.text('DETECTED THREAT INDICATORS & EVIDENCE', 40, currentY);

      currentY += 22;
      doc.rect(40, currentY, doc.page.width - 80, 1).fill('#334155');
      currentY += 10;

      if (!scan.detected_factors || scan.detected_factors.length === 0) {
        doc.fillColor(textMuted).fontSize(9).font('Helvetica');
        doc.text('No active threat indicators detected during scan.', 40, currentY);
        currentY += 20;
      } else {
        for (const factor of scan.detected_factors.slice(0, 6)) {
          let badgeColor = '#3B82F6';
          if (factor.severity === 'critical') badgeColor = '#EF4444';
          else if (factor.severity === 'high') badgeColor = '#F97316';
          else if (factor.severity === 'medium') badgeColor = '#F59E0B';
          else if (factor.severity === 'low') badgeColor = '#10B981';

          doc.rect(40, currentY + 2, 8, 8).fill(badgeColor);
          doc.fillColor(textLight).fontSize(10).font('Helvetica-Bold');
          doc.text(`[${factor.severity.toUpperCase()}] ${factor.label}`, 55, currentY);

          currentY += 14;
          doc.fillColor(textMuted).fontSize(8.5).font('Helvetica');
          doc.text(factor.description, 55, currentY, { width: doc.page.width - 100 });

          currentY += 18;
          doc.fillColor('#64748B').fontSize(8).font('Helvetica-Oblique');
          doc.text(`Evidence: ${factor.evidence}`, 55, currentY, { width: doc.page.width - 100 });

          currentY += 16;
        }
      }

      // 4. Multi-Layer Technical Telemetry
      currentY += 10;
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold');
      doc.text('MULTI-LAYER TELEMETRY DETAILS', 40, currentY);
      currentY += 20;

      const colWidth = (doc.page.width - 90) / 2;

      // Left Box: Domain & DNS
      doc.rect(40, currentY, colWidth, 90).fillAndStroke('#0B132B', '#1E293B');
      doc.fillColor(textLight).fontSize(10).font('Helvetica-Bold');
      doc.text('Domain & DNS Telemetry', 50, currentY + 10);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica');
      doc.text(`Domain: ${scan.domain_analysis?.domain || 'N/A'}`, 50, currentY + 28);
      doc.text(`TLD: .${scan.domain_analysis?.tld || 'N/A'} (Suspicious: ${scan.domain_analysis?.is_suspicious_tld ? 'YES' : 'NO'})`, 50, currentY + 42);
      doc.text(`DNS Resolves: ${scan.domain_analysis?.dns_resolves ? 'YES' : 'NO'}`, 50, currentY + 56);
      doc.text(`Resolved IPs: ${(scan.domain_analysis?.ip_addresses || []).slice(0, 2).join(', ') || 'None'}`, 50, currentY + 70);

      // Right Box: SSL & Content
      doc.rect(40 + colWidth + 10, currentY, colWidth, 90).fillAndStroke('#0B132B', '#1E293B');
      doc.fillColor(textLight).fontSize(10).font('Helvetica-Bold');
      doc.text('SSL & Web Content Telemetry', 50 + colWidth + 10, currentY + 10);

      doc.fillColor(textMuted).fontSize(8).font('Helvetica');
      doc.text(`HTTPS Secured: ${scan.ssl_analysis?.has_https ? 'YES' : 'NO'}`, 50 + colWidth + 10, currentY + 28);
      doc.text(`Cert Valid: ${scan.ssl_analysis?.is_valid ? 'YES' : 'NO'} (${scan.ssl_analysis?.issuer || 'Unknown'})`, 50 + colWidth + 10, currentY + 42);
      doc.text(`Password Form Present: ${scan.content_analysis?.has_password_field ? 'YES' : 'NO'}`, 50 + colWidth + 10, currentY + 56);
      doc.text(`External Form Action: ${scan.content_analysis?.external_form_action ? 'YES' : 'NO'}`, 50 + colWidth + 10, currentY + 70);

      currentY += 105;

      // 5. Safety Recommendations
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold');
      doc.text('ACTIONABLE SAFETY RECOMMENDATIONS', 40, currentY);
      currentY += 16;

      doc.fillColor(textLight).fontSize(8.5).font('Helvetica');
      if (scan.verdict === 'phishing') {
        doc.text('• DO NOT enter credentials, personal data, or payment information on this website.', 40, currentY);
        currentY += 12;
        doc.text('• Disconnect active sessions immediately and report the domain to anti-abuse authorities.', 40, currentY);
      } else if (scan.verdict === 'suspicious') {
        doc.text('• Exercise heightened caution: domain exhibits anomalies or unusual registration signals.', 40, currentY);
        currentY += 12;
        doc.text('• Verify the domain spelling and authenticate via known official bookmarks.', 40, currentY);
      } else {
        doc.text('• The URL displays standard legitimate characteristics with no active threat indicators.', 40, currentY);
        currentY += 12;
        doc.text('• Always maintain standard browsing hygiene and verify HTTPS padlock indicators.', 40, currentY);
      }

      // Footer
      const footerY = doc.page.height - 40;
      doc.rect(40, footerY - 10, doc.page.width - 80, 1).fill('#1E293B');
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica');
      doc.text(
        'PhishGuard AI – Automated Phishing Website Detection (Major Project Deliverable) | Powered by Machine Learning & Multi-Layer Feature Extraction',
        40,
        footerY,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

import jsPDF from 'jspdf';
import type { GradedCard } from './types';

export async function generateCertificate(card: GradedCard, qrCodeDataUrl?: string) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border
  pdf.setDrawColor(100, 116, 139); // slate-500
  pdf.setLineWidth(0.5);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Inner border
  pdf.setDrawColor(148, 163, 184); // slate-400
  pdf.setLineWidth(0.2);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CERTIFICATE OF AUTHENTICITY', pageWidth / 2, 30, { align: 'center' });

  // GSA Logo/Text
  pdf.setFontSize(16);
  pdf.setTextColor(100, 116, 139);
  pdf.text('GLOBAL SLAB AUTHORITY', pageWidth / 2, 40, { align: 'center' });

  // Certificate ID
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  const certId = `GSA-${card.id?.toUpperCase() || 'UNKNOWN'}`;
  pdf.text(`Certificate ID: ${certId}`, pageWidth / 2, 47, { align: 'center' });

  // Card Details Section
  const leftCol = 30;
  const rightCol = pageWidth / 2 + 10;
  let yPos = 65;

  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CARD INFORMATION', leftCol, yPos);

  yPos += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text('Card Name:', leftCol, yPos);
  pdf.setTextColor(255, 255, 255);
  pdf.text(card.cardName || 'N/A', leftCol + 30, yPos);

  yPos += 8;
  pdf.setTextColor(148, 163, 184);
  pdf.text('Set:', leftCol, yPos);
  pdf.setTextColor(255, 255, 255);
  pdf.text(card.set || 'N/A', leftCol + 30, yPos);

  yPos += 8;
  pdf.setTextColor(148, 163, 184);
  pdf.text('Year:', leftCol, yPos);
  pdf.setTextColor(255, 255, 255);
  pdf.text(card.year ? card.year.toString() : 'N/A', leftCol + 30, yPos);

  yPos += 8;
  pdf.setTextColor(148, 163, 184);
  pdf.text('Graded:', leftCol, yPos);
  pdf.setTextColor(255, 255, 255);
  const cardGradeDate = card.createdAt
    ? card.createdAt instanceof Date
      ? card.createdAt
      : (card.createdAt as any).toDate?.()
    : new Date();
  pdf.text(cardGradeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), leftCol + 30, yPos);

  // Grading Section
  yPos = 65;
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GRADING DETAILS', rightCol, yPos);

  // Overall Grade - Large and prominent
  yPos += 15;
  pdf.setFontSize(48);
  pdf.setTextColor(34, 197, 94); // green-500
  const grade = card.grade?.toString() || 'N/A';
  pdf.text(grade, rightCol + 20, yPos, { align: 'center' });

  pdf.setFontSize(12);
  pdf.setTextColor(148, 163, 184);
  pdf.text('OVERALL GRADE', rightCol + 20, yPos + 7, { align: 'center' });

  // Sub-grades
  yPos += 20;
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);

  const subgrades = [
    { label: 'Centering', value: card.subgrades?.centering },
    { label: 'Corners', value: card.subgrades?.corners },
    { label: 'Edges', value: card.subgrades?.edges },
    { label: 'Surface', value: card.subgrades?.surface },
  ];

  subgrades.forEach((sg, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = rightCol + (col * 35);
    const y = yPos + (row * 8);

    pdf.setTextColor(148, 163, 184);
    pdf.text(`${sg.label}:`, x, y);
    pdf.setTextColor(255, 255, 255);
    const value = sg.value !== undefined && sg.value !== null 
      ? Number(sg.value).toFixed(1) 
      : 'N/A';
    pdf.text(value, x + 22, y);
  });

  // QR Code
  if (qrCodeDataUrl) {
    try {
      const qrSize = 30;
      const qrX = pageWidth - 50;
      const qrY = pageHeight - 55;
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
    } catch (error) {
      console.error('Failed to add QR code to PDF:', error);
    }
  }

  // Date
  const gradeDate = card.createdAt
    ? card.createdAt instanceof Date
      ? card.createdAt
      : (card.createdAt as any).toDate?.()
    : new Date();
  
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `Graded on: ${gradeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    leftCol,
    pageHeight - 20
  );

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    'This certificate verifies the authenticity and grading of the trading card listed above.',
    pageWidth / 2,
    pageHeight - 18,
    { align: 'center' }
  );
  pdf.text(
    'Global Slab Authority - Professional Card Grading Services',
    pageWidth / 2,
    pageHeight - 13,
    { align: 'center' }
  );

  return pdf;
}

export function downloadCertificate(card: GradedCard, qrCodeDataUrl?: string) {
  generateCertificate(card, qrCodeDataUrl).then((pdf) => {
    const fileName = `GSA-Certificate-${card.cardName?.replace(/[^a-z0-9]/gi, '-')}-${card.grade}.pdf`;
    pdf.save(fileName);
  });
}

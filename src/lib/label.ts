import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { GradedCard } from './types';

/**
 * Generates a double-sided label PDF for a graded card slab header
 * The label slides into the header slot of the slab (20mm height x 68mm width)
 * Page 1: Front (dark theme with grade info)
 * Page 2: Back (light theme with QR verification)
 * Both sides readable in same orientation when flipped
 */
export async function generateCardLabel(card: GradedCard) {
  // Label dimensions for slab header slot
  const labelWidth = 68;
  const labelHeight = 20;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [labelWidth, labelHeight],
  });

  // Colors matching GSA digital slab
  const primaryColor = [16, 185, 129]; // Emerald/Accent color
  const darkBg = [15, 23, 42]; // Dark background
  const lightText = [255, 255, 255];
  const mutedText = [148, 163, 184];

  // Generate QR code
  const publicUrl = `${window.location.origin}/card/${card.publicShareId}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    width: 256,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // =============================
  // PAGE 1: FRONT (Dark Theme)
  // =============================
  
  // Background - dark theme with subtle gradient feel
  pdf.setFillColor(17, 24, 39); // Darker blue-gray
  pdf.rect(0, 0, labelWidth, labelHeight, 'F');

  // Top border accent line
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, labelWidth, 0.5, 'F');

  // GSA Logo and branding - left side
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GSA', 3, 7);
  
  pdf.setFontSize(4);
  pdf.setTextColor(148, 163, 184); // Lighter gray for better contrast
  pdf.text('GEM-MT', 3, 10);

  // Grade - Large and prominent on the right
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(card.grade.toString(), labelWidth - 3, 9, { align: 'right' });

  pdf.setFontSize(4);
  pdf.setTextColor(148, 163, 184);
  pdf.text('GRADE', labelWidth - 3, 12, { align: 'right' });

  // Card metadata - full width usage
  const maxCardNameLength = 35; // Much longer
  const cardName = (card.cardName || 'Unknown Card').substring(0, maxCardNameLength);
  pdf.setFontSize(7); // Larger font
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cardName, 3, 15);

  // Set and year - below card name, use full horizontal space
  const setYear = card.set || card.year 
    ? `${card.set || ''}${card.set && card.year ? ' \u2022 ' : ''}${card.year || ''}` 
    : '';
  if (setYear) {
    pdf.setFontSize(5); // Larger font
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    // Use almost full width - up to 55 characters
    pdf.text(setYear.substring(0, 55), 3, 18.5);
  }

  // ID at bottom right
  pdf.setFontSize(3.5);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'mono');
  pdf.text(`ID: ${card.publicShareId.substring(0, 8)}`, labelWidth - 3, labelHeight - 2, { align: 'right' });

  // =============================
  // PAGE 2: BACK (Light Theme)
  // =============================
  
  pdf.addPage();

  // Background - clean white
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, labelWidth, labelHeight, 'F');

  // Top border accent line
  pdf.setFillColor(226, 232, 240); // Light gray border
  pdf.rect(0, 0, labelWidth, 0.5, 'F');

  // Grading date - top left
  const gradingDate = card.createdAt instanceof Date 
    ? card.createdAt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : (card.createdAt as any).toDate?.().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) || 'N/A';
  
  pdf.setFontSize(3);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Graded: ${gradingDate}`, 3, 3);

  // GSA branding - left side
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GSA', 3, 8);

  pdf.setFontSize(3);
  pdf.setTextColor(100, 116, 139);
  pdf.text('GRADING & AUTHENTICATION', 3, 10.5);

  // QR Code - right side
  const qrSize = 16;
  const qrX = labelWidth - qrSize - 3;
  const qrY = 2;
  pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // Verification section - left side, lower
  pdf.setFontSize(4.5);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VERIFY THIS CARD', 3, 15);

  pdf.setFontSize(3.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Scan QR code or visit: ', 3, 17.5);
  
  // URL on same line
  pdf.setFont('helvetica', 'mono');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`gsa.com/card/${card.publicShareId.substring(0, 8)}`, 24, 17.5);

  // =============================
  // DOWNLOAD
  // =============================
  const fileName = `GSA-Label-${card.publicShareId}.pdf`;
  pdf.save(fileName);
}

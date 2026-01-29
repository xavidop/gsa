import Papa from 'papaparse';
import jsPDF from 'jspdf';
import type { GradedCard } from './types';

export function exportToCSV(cards: GradedCard[]) {
  const data = cards.map((card) => ({
    'Card Name': card.cardName || '',
    'Set': card.set || '',
    'Year': card.year || '',
    'Overall Grade': card.grade,
    'Centering': card.subgrades?.centering || '',
    'Corners': card.subgrades?.corners || '',
    'Edges': card.subgrades?.edges || '',
    'Surface': card.subgrades?.surface || '',
    'Graded Date': card.createdAt
      ? card.createdAt instanceof Date
        ? card.createdAt.toLocaleDateString()
        : (card.createdAt as any).toDate?.().toLocaleDateString() || ''
      : '',
    'Public Share Link': card.publicShareId
      ? `${window.location.origin}/card/${card.publicShareId}`
      : '',
    'Visibility': card.isPublic !== false ? 'Public' : 'Private',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `gsa-collection-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToPDF(cards: GradedCard[], username?: string) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  let yPos = margin;

  // Helper function to add a new page
  const addNewPage = () => {
    pdf.addPage();
    yPos = margin;
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  };

  // Title Page
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GSA COLLECTION', pageWidth / 2, 80, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setTextColor(148, 163, 184);
  pdf.text('PORTFOLIO REPORT', pageWidth / 2, 95, { align: 'center' });

  if (username) {
    pdf.setFontSize(14);
    pdf.text(`@${username}`, pageWidth / 2, 110, { align: 'center' });
  }

  // Summary stats
  const totalCards = cards.length;
  const avgGrade = cards.reduce((sum, c) => sum + c.grade, 0) / totalCards;
  const highestGrade = Math.max(...cards.map(c => c.grade));
  const publicCards = cards.filter(c => c.isPublic !== false).length;

  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  yPos = 140;
  
  const stats = [
    `Total Cards: ${totalCards}`,
    `Average Grade: ${avgGrade.toFixed(2)}`,
    `Highest Grade: ${highestGrade}`,
    `Public Cards: ${publicCards}`,
  ];

  stats.forEach((stat) => {
    pdf.text(stat, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  });

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );

  // Cards List
  addNewPage();
  
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Collection Inventory', margin, yPos);
  yPos += 10;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Table headers
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 100, 100);
  
  const colWidths = {
    num: 10,
    name: 60,
    set: 45,
    grade: 15,
    centering: 15,
    corners: 15,
    edges: 15,
    surface: 15,
  };

  let xPos = margin;
  pdf.text('#', xPos, yPos);
  xPos += colWidths.num;
  pdf.text('Card Name', xPos, yPos);
  xPos += colWidths.name;
  pdf.text('Set', xPos, yPos);
  xPos += colWidths.set;
  pdf.text('Grade', xPos, yPos);
  xPos += colWidths.grade;
  pdf.text('C', xPos, yPos);
  xPos += colWidths.centering;
  pdf.text('Co', xPos, yPos);
  xPos += colWidths.corners;
  pdf.text('E', xPos, yPos);
  xPos += colWidths.edges;
  pdf.text('S', xPos, yPos);
  
  yPos += 2;
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Card rows
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);

  cards.forEach((card, index) => {
    checkNewPage(8);

    xPos = margin;
    pdf.text(`${index + 1}`, xPos, yPos);
    xPos += colWidths.num;
    
    const cardName = card.cardName || 'Unknown';
    const truncatedName = cardName.length > 30 ? cardName.substring(0, 27) + '...' : cardName;
    pdf.text(truncatedName, xPos, yPos);
    xPos += colWidths.name;
    
    const setName = card.set || 'N/A';
    const truncatedSet = setName.length > 20 ? setName.substring(0, 17) + '...' : setName;
    pdf.text(truncatedSet, xPos, yPos);
    xPos += colWidths.set;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(card.grade.toString(), xPos, yPos);
    pdf.setFont('helvetica', 'normal');
    xPos += colWidths.grade;
    
    pdf.text((card.subgrades?.centering || '-').toString(), xPos, yPos);
    xPos += colWidths.centering;
    pdf.text((card.subgrades?.corners || '-').toString(), xPos, yPos);
    xPos += colWidths.corners;
    pdf.text((card.subgrades?.edges || '-').toString(), xPos, yPos);
    xPos += colWidths.edges;
    pdf.text((card.subgrades?.surface || '-').toString(), xPos, yPos);

    yPos += 6;

    // Divider line
    if ((index + 1) % 5 === 0) {
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 2;
    }
  });

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    'Global Slab Authority - Professional Card Grading Services',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  pdf.save(`gsa-portfolio-${new Date().toISOString().split('T')[0]}.pdf`);
}

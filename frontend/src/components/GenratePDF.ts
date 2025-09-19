import jsPDF from 'jspdf';
import type { ReviewInterview } from '../types';

export const generatePDFReport = (interview: ReviewInterview) => {
  const doc = new jsPDF();
  
  const colors = {
    primary: '#1e293b',      
    secondary: '#64748b',   
    accent: '#0f172a',      
    success: '#16a34a',      
    warning: '#ea580c',      
    error: '#dc2626',        
    light: '#f8fafc',        
    border: '#e2e8f0',       
    highlight: '#f1f5f9'     
  };
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'PASS': return colors.success;
      case 'REVIEW': return colors.warning;
      case 'FAIL': return colors.error;
      default: return colors.secondary;
    }
  };


  let yPos = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  
  const checkPageSpace = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 40) {
      doc.addPage();
      yPos = 25;
      return true;
    }
    return false;
  };

  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(28);
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.text('Interview Integrity Report', margin, 22);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  yPos = 50;
  
  doc.setFillColor(colors.highlight);
  doc.rect(margin, yPos - 5, contentWidth, 25, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(colors.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('Report Generated:', margin + 5, yPos + 3);
  doc.text('Report ID:', margin + 5, yPos + 10);
  doc.text('Interview Session:', margin + 5, yPos + 17);
  
  doc.setTextColor(colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date().toLocaleString(), margin + 40, yPos + 3);
  doc.text(interview._id.slice(-8).toUpperCase(), margin + 40, yPos + 10);
  doc.text(new Date(interview.startTime).getFullYear().toString(), margin + 40, yPos + 17);
  
  yPos += 35;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text('Student & Interview Details', margin, yPos);
  yPos += 15;
  
  const infoItems = [
    ['Student Name:', interview.candidateName],
    ['Interview Date:', new Date(interview.startTime).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })],
    ['Duration:', `${interview.duration} minutes`],
    ['Interviewer/Proctor:', interview.interviewerName],
    ['Start Time:', new Date(interview.startTime).toLocaleTimeString()],
    ['End Time:', new Date(interview.endTime).toLocaleTimeString()]
  ];

  const leftColumnItems = infoItems.slice(0, 3);
  const rightColumnItems = infoItems.slice(3, 6);
  
  doc.setFillColor(colors.light);
  doc.rect(margin, yPos - 3, (contentWidth/2) - 5, 50, 'F');
  
  doc.rect(margin + (contentWidth/2) + 5, yPos - 3, (contentWidth/2) - 5, 50, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.accent);
  doc.text('Student Information', margin + 3, yPos + 5);
  
  doc.text('Session Details', margin + (contentWidth/2) + 8, yPos + 5);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  leftColumnItems.forEach(([label, value], itemIndex) => {
    const itemY = yPos + 15 + (itemIndex * 12);
    doc.setTextColor(colors.secondary);
    doc.text(label, margin + 3, itemY);
    doc.setTextColor(colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 3, itemY + 7);
    doc.setFont('helvetica', 'normal');
  });
  
  rightColumnItems.forEach(([label, value], itemIndex) => {
    const itemY = yPos + 15 + (itemIndex * 12);
    doc.setTextColor(colors.secondary);
    doc.text(label, margin + (contentWidth/2) + 8, itemY);
    doc.setTextColor(colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + (contentWidth/2) + 8, itemY + 7);
    doc.setFont('helvetica', 'normal');
  });
  
  yPos += 55;
  
  checkPageSpace(80);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text('Integrity Assessment', margin, yPos);
  yPos += 20;
  
  const centerX = pageWidth / 2;
  const scoreColor = getRecommendationColor(interview.recommendation);
  
  doc.setFillColor(colors.light);
  doc.circle(centerX, yPos + 25, 35, 'F');
  
  doc.setDrawColor(scoreColor);
  doc.setLineWidth(3);
  doc.circle(centerX, yPos + 25, 32, 'S');
  
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(scoreColor);
  doc.text(`${interview.integrityScore}%`, centerX, yPos + 20, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(colors.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('Integrity Score', centerX, yPos + 32, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(scoreColor);
  doc.text(`${interview.recommendation}`, centerX, yPos + 45, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(colors.primary);
  doc.setFont('helvetica', 'normal');
  
  yPos += 75;
  
  checkPageSpace(40);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  yPos += 15;
  
  doc.setDrawColor(colors.border);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos - 5, contentWidth, 35, 'S');
  
  doc.setFillColor(colors.highlight);
  doc.rect(margin + 1, yPos - 4, contentWidth - 2, 33, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.primary);
  
  const summaryLines = doc.splitTextToSize(interview.summary, contentWidth - 10);
  summaryLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 5, yPos + 5 + (index * 6));
  });
  
  yPos += 45;
  
  if (interview.events && interview.events.length > 0) {
    checkPageSpace(60);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary);
    doc.text('Behavioral Analysis', margin, yPos);
    yPos += 15;
    
    const eventCounts = interview.events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statCategories = [
      {
        title: 'Attention & Focus',
        items: [
          ['Focus Lapses:', eventCounts.FOCUS_LOST || 0, 'Times student looked away from screen'],
          ['Absence Events:', eventCounts.FACE_ABSENT || 0, 'Times student left camera view']
        ]
      },
      {
        title: 'Interview Violations',
        items: [
          ['Unauthorized Devices:', (eventCounts.PHONE_DETECTED || 0) + (eventCounts.DEVICE_DETECTED || 0), 'Phones, tablets, or other devices'],
          ['Reference Materials:', eventCounts.BOOK_DETECTED || 0, 'Books, notes, or written materials'],
          ['Multiple Persons:', eventCounts.MULTIPLE_FACES || 0, 'Additional people detected in frame']
        ]
      }
    ];

    statCategories.forEach((category, catIndex) => {
      const xOffset = catIndex * (contentWidth / 2);
      
      doc.setFillColor(colors.primary);
      doc.rect(margin + xOffset, yPos - 2, (contentWidth / 2) - 5, 12, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#ffffff');
      doc.text(category.title, margin + xOffset + 3, yPos + 6);
      
      let itemY = yPos + 18;
      category.items.forEach(([label, count, description]) => {
        doc.setFillColor(count > 0 ? '#fef2f2' : colors.light);
        doc.rect(margin + xOffset, itemY - 2, (contentWidth / 2) - 5, 16, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(count > 0 ? colors.error : colors.success);
        doc.text(count.toString(), margin + xOffset + 5, itemY + 3);
        
        doc.setTextColor(colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + xOffset + 15, itemY + 3);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.secondary);
        doc.text(description, margin + xOffset + 5, itemY + 10);
        
        itemY += 18;
      });
    });
    
    yPos += 75;
    
    if (interview.events.length > 0) {
      checkPageSpace(25);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary);
      doc.text('Incident Timeline', margin, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      interview.events.slice(0, 12).forEach((event, index) => {
        checkPageSpace(14);
        
        doc.setFillColor(index % 2 === 0 ? colors.light : '#ffffff');
        doc.rect(margin, yPos - 2, contentWidth, 12, 'F');
        
        const borderColor = event.confidence > 0.8 ? colors.error : 
                           event.confidence > 0.6 ? colors.warning : colors.secondary;
        doc.setFillColor(borderColor);
        doc.rect(margin, yPos - 2, 3, 12, 'F');
        
        doc.setTextColor(colors.secondary);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(event.timestamp).toLocaleTimeString(), margin + 8, yPos + 4);
        
        doc.setTextColor(colors.primary);
        doc.setFont('helvetica', 'bold');
        const eventText = formatEventType(event.eventType);
        doc.text(eventText, margin + 45, yPos + 4);
        
        doc.setTextColor(colors.secondary);
        doc.setFont('helvetica', 'normal');
        doc.text(`${Math.round(event.confidence * 100)}% confidence`, margin + 110, yPos + 4);
        
        if (event.metadata?.objectType) {
          doc.text(`(${event.metadata.objectType})`, margin + 150, yPos + 4);
        }
        
        yPos += 14;
      });
      
      if (interview.events.length > 12) {
        doc.setFontSize(9);
        doc.setTextColor(colors.secondary);
        doc.text(`... and ${interview.events.length - 12} more incidents (see full system logs for complete details)`, margin, yPos + 5);
        yPos += 15;
      }
    }
  } else {
    checkPageSpace(30);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.success);
    doc.text('Behavioral Analysis: No Violations Detected', margin, yPos);
    yPos += 15;
    
    doc.setFillColor('#f0fdf4');
    doc.rect(margin, yPos - 5, contentWidth, 20, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(colors.primary);
    doc.text('This student demonstrated exemplary interview integrity throughout the interview.', margin + 5, yPos + 8);
    
    yPos += 25;
  }
  
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary);
    doc.text('This report is confidential and intended for authorized interview personnel only.', margin, pageHeight - 18);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 12);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 12);
    doc.text('Interview Interview System ', pageWidth - margin - 50, pageHeight - 18);
  }
  
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Interview-Integrity-Report-${interview.candidateName.replace(/\s+/g, '-')}-${timestamp}.pdf`;
  doc.save(fileName);
};

const formatEventType = (type: string): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};
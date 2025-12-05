/**
 * PDF Export Utility for Financial Reports
 * Generates professional PDF reports for financial statements, loan applications, etc.
 */

import jsPDF from "jspdf";
import type { ProfitLossStatement, LoanApplication, ROICalculation } from "@/services/firestore-finance";
import { formatKsh } from "@/lib/currency";
import { format } from "date-fns";

/**
 * Export Profit/Loss Statement to PDF
 */
export function exportProfitLossStatementPDF(statement: ProfitLossStatement): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Profit & Loss Statement", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${statement.period}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 5;
  doc.text(
    `${format(new Date(statement.startDate), "MMM d, yyyy")} - ${format(new Date(statement.endDate), "MMM d, yyyy")}`,
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  yPos += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Total Revenue:", 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(formatKsh(statement.totalRevenue), pageWidth - 20, yPos, { align: "right" });
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Total Expenses:", 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(formatKsh(statement.totalExpenses), pageWidth - 20, yPos, { align: "right" });
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Net Profit:", 20, yPos);
  doc.setFont("helvetica", "bold");
  const profitColor = statement.netProfit >= 0 ? [0, 150, 0] : [200, 0, 0];
  doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
  doc.text(formatKsh(statement.netProfit), pageWidth - 20, yPos, { align: "right" });
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.text("Profit Margin:", 20, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`${statement.profitMargin.toFixed(2)}%`, pageWidth - 20, yPos, { align: "right" });
  yPos += 15;

  // Field Breakdown
  if (statement.fieldBreakdown && statement.fieldBreakdown.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Field Breakdown", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Field", 20, yPos);
    doc.text("Revenue", 80, yPos);
    doc.text("Expenses", 130, yPos);
    doc.text("Profit", pageWidth - 20, yPos, { align: "right" });
    yPos += 8;

    doc.setFont("helvetica", "normal");
    statement.fieldBreakdown.forEach((field) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(field.fieldName, 20, yPos);
      doc.text(formatKsh(field.revenue), 80, yPos);
      doc.text(formatKsh(field.expenses), 130, yPos);
      doc.text(formatKsh(field.profit), pageWidth - 20, yPos, { align: "right" });
      yPos += 7;
    });
    yPos += 5;
  }

  // Crop Breakdown
  if (statement.cropBreakdown && statement.cropBreakdown.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Crop Breakdown", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Crop", 20, yPos);
    doc.text("Revenue", 80, yPos);
    doc.text("Expenses", 130, yPos);
    doc.text("Profit", pageWidth - 20, yPos, { align: "right" });
    yPos += 8;

    doc.setFont("helvetica", "normal");
    statement.cropBreakdown.forEach((crop) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(crop.cropName, 20, yPos);
      doc.text(formatKsh(crop.revenue), 80, yPos);
      doc.text(formatKsh(crop.expenses), 130, yPos);
      doc.text(formatKsh(crop.profit), pageWidth - 20, yPos, { align: "right" });
      yPos += 7;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: "center" });
  }

  // Save PDF
  doc.save(`profit-loss-${statement.period.replace(/\s+/g, "-")}.pdf`);
}

/**
 * Export Loan Application to PDF
 */
export function exportLoanApplicationPDF(application: LoanApplication): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Loan Application Summary", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${application.lender} Bank`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Application Details
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Application Details", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const details = [
    { label: "Loan Amount:", value: formatKsh(application.loanAmount) },
    { label: "Interest Rate:", value: `${application.interestRate}% per annum` },
    { label: "Term:", value: `${application.term} months` },
    { label: "Monthly Payment:", value: formatKsh(application.monthlyPayment) },
    { label: "Purpose:", value: application.purpose },
    { label: "Status:", value: application.status.toUpperCase() },
  ];

  details.forEach((detail) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(detail.label, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(detail.value, 100, yPos);
    yPos += 8;
  });

  yPos += 5;

  // Eligibility Score
  if (application.eligibilityScore !== undefined) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Eligibility Score", 20, yPos);
    yPos += 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const scoreColor = application.eligibilityScore >= 60 ? [0, 150, 0] : [200, 0, 0];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${application.eligibilityScore}/100`, 20, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  }

  // Documents
  if (application.documents && application.documents.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Attached Documents", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    application.documents.forEach((docItem) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      const status = docItem.verified ? "✓ Verified" : "Pending";
      doc.text(`• ${docItem.name} - ${status}`, 25, yPos);
      yPos += 7;
    });
  }

  // Dates
  yPos += 10;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (application.createdAt) {
    doc.text(`Created: ${format(new Date(application.createdAt), "MMM d, yyyy")}`, 20, yPos);
    yPos += 8;
  }
  if (application.submittedAt) {
    doc.text(`Submitted: ${format(new Date(application.submittedAt), "MMM d, yyyy")}`, 20, yPos);
    yPos += 8;
  }
  if (application.approvedAt) {
    doc.text(`Approved: ${format(new Date(application.approvedAt), "MMM d, yyyy")}`, 20, yPos);
    yPos += 8;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: "center" });
  }

  // Save PDF
  doc.save(`loan-application-${application.lender}-${application.id}.pdf`);
}

/**
 * Export Financial Dashboard Summary to PDF
 */
export function exportFinancialDashboardPDF(data: {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  period: string;
  roi?: ROICalculation[];
}): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Dashboard Summary", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${data.period}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Financial Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  const summary = [
    { label: "Total Revenue:", value: formatKsh(data.totalRevenue) },
    { label: "Total Expenses:", value: formatKsh(data.totalExpenses) },
    { label: "Net Profit:", value: formatKsh(data.netProfit) },
    { label: "Profit Margin:", value: `${data.profitMargin.toFixed(2)}%` },
  ];

  summary.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.text(item.label, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(item.value, pageWidth - 20, yPos, { align: "right" });
    yPos += 8;
  });

  // ROI Section
  if (data.roi && data.roi.length > 0) {
    yPos += 10;
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Return on Investment (ROI)", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Crop/Field", 20, yPos);
    doc.text("Investment", 80, yPos);
    doc.text("Revenue", 130, yPos);
    doc.text("ROI", pageWidth - 20, yPos, { align: "right" });
    yPos += 8;

    doc.setFont("helvetica", "normal");
    data.roi.forEach((roi) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      const name = roi.cropName || roi.fieldName || "N/A";
      doc.text(name, 20, yPos);
      doc.text(formatKsh(roi.totalInvestment), 80, yPos);
      doc.text(formatKsh(roi.totalRevenue), 130, yPos);
      const roiColor = roi.roi >= 0 ? [0, 150, 0] : [200, 0, 0];
      doc.setTextColor(roiColor[0], roiColor[1], roiColor[2]);
      doc.text(`${roi.roi.toFixed(2)}%`, pageWidth - 20, yPos, { align: "right" });
      doc.setTextColor(0, 0, 0);
      yPos += 7;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: "center" });
  }

  // Save PDF
  doc.save(`financial-dashboard-${data.period.replace(/\s+/g, "-")}.pdf`);
}


import {
  CareRecipientProfile,
  FamilyMember,
  MedicalExpense,
  CaregiverShift,
  MemberBalanceSummary,
  EXPENSE_CATEGORY_META,
} from '../types/care';

interface GeneratePacketParams {
  recipient: CareRecipientProfile;
  members: FamilyMember[];
  expenses: MedicalExpense[];
  shifts: CaregiverShift[];
  balances: MemberBalanceSummary[];
  filterLabel: string;
  currency: string;
}

export const pdfReportService = {
  buildReimbursementHtml(params: GeneratePacketParams): string {
    const { recipient, members, expenses, shifts, balances, filterLabel, currency } = params;

    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    const grossTotal = expenses.reduce((s, e) => s + e.totalAmount, 0);
    const reimbursedTotal = expenses.reduce((s, e) => s + (e.insuranceReimbursedAmount || 0), 0);
    const netOutOfPocket = Math.max(0, grossTotal - reimbursedTotal);
    const taxDeductibleTotal = expenses
      .filter((e) => e.isTaxDeductible)
      .reduce((s, e) => s + Math.max(0, e.totalAmount - (e.insuranceReimbursedAmount || 0)), 0);
    const totalCaregiverHours = shifts.reduce((s, sh) => s + sh.hours, 0);

    const rowsHtml = expenses
      .map((exp) => {
        const payer = memberMap.get(exp.paidByMemberId) || 'Family Pool';
        const net = Math.max(0, exp.totalAmount - (exp.insuranceReimbursedAmount || 0));
        const catLabel = EXPENSE_CATEGORY_META[exp.category]?.shortLabel || exp.category;
        const lineItemsHtml = exp.lineItems
          .map(
            (li) =>
              `<div style="font-size:11px;color:#475569;margin-top:2px;">• ${li.description} ${
                li.code ? `<span style="font-family:monospace;background:#f1f5f9;padding:1px 4px;border-radius:3px;">[${li.code}]</span>` : ''
              } — ${currency}${li.total.toFixed(2)}</div>`
          )
          .join('');

        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${exp.date}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
              <div style="font-weight:700;font-size:13px;color:#0f172a;">${exp.providerName}</div>
              <div style="font-size:11px;color:#0d9488;font-weight:600;">${catLabel} • ${exp.insuranceClaimStatus.replace('_', ' ')}</div>
              ${lineItemsHtml}
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;">${payer}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;font-size:12px;">${currency}${exp.totalAmount.toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;font-size:12px;color:#059669;">${currency}${(exp.insuranceReimbursedAmount || 0).toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;font-weight:700;font-size:12px;">${currency}${net.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const balanceRowsHtml = balances
      .map(
        (b) => `
        <tr>
          <td style="padding:7px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${b.member.name} (${b.member.relationship})</td>
          <td style="padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:monospace;">${b.member.splitPercentage}%</td>
          <td style="padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${currency}${b.netOutOfPocketPaid.toFixed(2)}</td>
          <td style="padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${currency}${b.assignedShare.toFixed(2)}</td>
          <td style="padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;font-weight:700;color:${
            b.netBalance >= 0 ? '#059669' : '#dc2626'
          };">
            ${b.netBalance >= 0 ? `+${currency}${b.netBalance.toFixed(2)} (Owed)` : `-${currency}${Math.abs(b.netBalance).toFixed(2)} (Owes Pool)`}
          </td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CareCircle Reimbursement & Tax Summary — ${recipient.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 28px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
    .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .kpi-val { font-size: 20px; font-weight: 800; font-family: monospace; margin-top: 4px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
    @media print { .print-btn { display: none; } body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="print-btn" style="margin-bottom:16px;display:flex;gap:10px;">
    <button onclick="window.print()" style="background:#0d9488;color:white;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <div style="font-size:11px;font-weight:800;color:#0d9488;text-transform:uppercase;letter-spacing:0.08em;">CareCircle Official Reimbursement &amp; Tax Packet</div>
      <h1 style="margin:4px 0;font-size:22px;">Patient: ${recipient.name} (Age ${recipient.age})</h1>
      <div style="font-size:12px;color:#475569;">DOB: ${recipient.dateOfBirth} • Primary MD: ${recipient.primaryPhysician}</div>
      <div style="font-size:12px;color:#475569;">Insurance: <strong>${recipient.insuranceProvider}</strong> • Policy #: <code>${recipient.policyNumber}</code> • Group #: <code>${recipient.groupNumber}</code></div>
    </div>
    <div style="text-align:right;font-size:12px;color:#475569;">
      <div><strong>Generated:</strong> ${new Date().toISOString().split('T')[0]}</div>
      <div><strong>Filter Scope:</strong> ${filterLabel}</div>
      <div><strong>Receipts Included:</strong> ${expenses.length}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Gross Medical Billed</div>
      <div class="kpi-val">${currency}${grossTotal.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Insurance Reimbursed</div>
      <div class="kpi-val" style="color:#059669;">${currency}${reimbursedTotal.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Out-of-Pocket</div>
      <div class="kpi-val">${currency}${netOutOfPocket.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">IRS Pub 502 Tax-Deductible</div>
      <div class="kpi-val" style="color:#2563eb;">${currency}${taxDeductibleTotal.toFixed(2)}</div>
    </div>
  </div>

  <h3 style="font-size:14px;text-transform:uppercase;color:#0f172a;margin-bottom:8px;">1. Itemized Medical Bills, CPT/Rx Line Items &amp; Receipts</h3>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Provider &amp; Extracted CPT/Rx Line Items</th>
        <th>Paid By</th>
        <th style="text-align:right;">Billed</th>
        <th style="text-align:right;">Ins. Paid</th>
        <th style="text-align:right;">Net Out-of-Pocket</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <h3 style="font-size:14px;text-transform:uppercase;color:#0f172a;margin-bottom:8px;">2. Family Care Pool Split &amp; Reimbursement Ledger (${totalCaregiverHours} Caregiver Hrs Logged)</h3>
  <table>
    <thead>
      <tr>
        <th>Family Care Team Member</th>
        <th style="text-align:center;">Agreed Split %</th>
        <th style="text-align:right;">Out-of-Pocket Paid</th>
        <th style="text-align:right;">Fair Pool Share</th>
        <th style="text-align:right;">Net Pool Balance</th>
      </tr>
    </thead>
    <tbody>
      ${balanceRowsHtml}
    </tbody>
  </table>

  <div style="font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;margin-top:20px;">
    Prepared via CareCircle Family Medical Expense Coordinator. Retain original digital receipt scans alongside this summary for HSA/FSA administrators, Medicare supplemental claims, and IRS Form 1040 Schedule A medical expense deductions.
  </div>
</body>
</html>`;
  },

  openPrintPdfWindow(params: GeneratePacketParams): boolean {
    const html = this.buildReimbursementHtml(params);
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 350);
      return true;
    }
    // Fallback if popup blocked (e.g. mobile WebView): download printable HTML packet directly
    this.downloadHtmlPacket(params);
    return false;
  },

  downloadHtmlPacket(params: GeneratePacketParams) {
    const html = this.buildReimbursementHtml(params);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CareCircle_Reimbursement_Packet_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  downloadCsvExport(params: GeneratePacketParams) {
    const { expenses, members } = params;
    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    const headers = [
      'Date',
      'Provider',
      'Category',
      'Paid By',
      'Total Billed',
      'Insurance Reimbursed',
      'Net Out-Of-Pocket',
      'Claim Status',
      'Tax Deductible',
      'Line Items (CPT/NDC)',
    ];

    const rows = expenses.map((exp) => {
      const payer = memberMap.get(exp.paidByMemberId) || 'Family Pool';
      const net = Math.max(0, exp.totalAmount - (exp.insuranceReimbursedAmount || 0));
      const itemsStr = exp.lineItems
        .map((li) => `${li.description} (${li.code || 'N/A'}: $${li.total.toFixed(2)})`)
        .join(' | ');
      return [
        exp.date,
        `"${exp.providerName.replace(/"/g, '""')}"`,
        exp.category,
        `"${payer}"`,
        exp.totalAmount.toFixed(2),
        (exp.insuranceReimbursedAmount || 0).toFixed(2),
        net.toFixed(2),
        exp.insuranceClaimStatus,
        exp.isTaxDeductible ? 'YES' : 'NO',
        `"${itemsStr.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CareCircle_Medical_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

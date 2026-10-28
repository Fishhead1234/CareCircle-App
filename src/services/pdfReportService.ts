import {
  CareRecipientProfile,
  FamilyMember,
  MedicalExpense,
  CaregiverShift,
  MemberBalanceSummary,
} from '../types/care';
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';

interface GeneratePacketParams {
  recipient: CareRecipientProfile;
  members: FamilyMember[];
  expenses: MedicalExpense[];
  shifts: CaregiverShift[];
  balances: MemberBalanceSummary[];
  filterLabel: string;
  currency: string;
  language?: AppLanguage;
}

export const pdfReportService = {
  buildReimbursementHtml(params: GeneratePacketParams): string {
    const {
      recipient,
      members,
      expenses,
      balances,
      filterLabel,
      currency,
      language = 'zh-TW',
    } = params;

    const tr = (key: string, fallback: string) =>
      TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || fallback;

    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    const grossTotal = expenses.reduce((s, e) => s + e.totalAmount, 0);
    const reimbursedTotal = expenses.reduce((s, e) => s + (e.insuranceReimbursedAmount || 0), 0);
    const netOutOfPocket = Math.max(0, grossTotal - reimbursedTotal);

    const rowsHtml = expenses
      .map((exp) => {
        const payer =
          exp.paidByMemberId === 'SHARED_POOL'
            ? tr('shared_pool_payer', 'Family Fund Pool')
            : memberMap.get(exp.paidByMemberId) || '-';
        const net = Math.max(0, exp.totalAmount - (exp.insuranceReimbursedAmount || 0));
        const catLabel = tr(`cat_${exp.category}`, exp.category);
        const lineItemsHtml = exp.lineItems
          .map(
            (li) =>
              `<div style="font-size:11px;color:#475569;margin-top:2px;">• ${li.description} — ${currency}${li.total.toFixed(2)}</div>`
          )
          .join('');

        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${exp.date}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
              <div style="font-weight:700;font-size:13px;color:#0f172a;">${exp.providerName}</div>
              <div style="font-size:11px;color:#0d9488;font-weight:600;">${catLabel}</div>
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
            ${
              Math.abs(b.netBalance) < 0.5
                ? tr('status_settled', 'Settled')
                : b.netBalance > 0
                ? `+${currency}${b.netBalance.toFixed(2)} (${tr('status_owed', 'Owed')})`
                : `-${currency}${Math.abs(b.netBalance).toFixed(2)} (${tr('status_owes', 'Owes')})`
            }
          </td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${tr('app_title', 'CareCircle')} — ${recipient.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Microsoft JhengHei', sans-serif; color: #0f172a; margin: 28px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
    .kpi-label { font-size: 11px; color: #64748b; font-weight: 700; }
    .kpi-val { font-size: 20px; font-weight: 800; font-family: monospace; margin-top: 4px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; color: #475569; border-bottom: 2px solid #cbd5e1; }
    @media print { .print-btn { display: none; } body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="print-btn" style="margin-bottom:16px;display:flex;gap:10px;">
    <button onclick="window.print()" style="background:#0d9488;color:white;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;">${tr('generate_pdf_btn', 'Print / Save PDF')}</button>
  </div>
  <div class="header">
    <div>
      <div style="font-size:12px;font-weight:800;color:#0d9488;">${tr('app_title', 'CareCircle')} • ${tr('pdf_card_title', 'Summary')}</div>
      <h1 style="margin:4px 0;font-size:22px;">${tr('caring_for', 'Caring For')}: ${recipient.name}</h1>
      <div style="font-size:12px;color:#475569;">${tr('recipient_doctor_label', 'Doctor')}: ${recipient.primaryPhysician}</div>
      <div style="font-size:12px;color:#475569;">${tr('recipient_ins_label', 'Insurance')}: <strong>${recipient.insuranceProvider}</strong> (${recipient.policyNumber})</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#475569;">
      <div><strong>${tr('field_date', 'Date')}:</strong> ${new Date().toISOString().split('T')[0]}</div>
      <div><strong>Scope:</strong> ${filterLabel} (${expenses.length})</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">${tr('gross_billed', 'Total Billed')}</div>
      <div class="kpi-val">${currency}${grossTotal.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${tr('insurance_refund', 'Insurance Refund')}</div>
      <div class="kpi-val" style="color:#059669;">-${currency}${reimbursedTotal.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${tr('total_shared_cost', 'Net Shared Total')}</div>
      <div class="kpi-val" style="color:#0d9488;">${currency}${netOutOfPocket.toFixed(2)}</div>
    </div>
  </div>

  <h3 style="font-size:14px;color:#0f172a;margin-bottom:8px;">1. ${tr('bills_section_title', 'Medical Bills & Receipts')}</h3>
  <table>
    <thead>
      <tr>
        <th>${tr('field_date', 'Date')}</th>
        <th>${tr('field_provider', 'Provider')}</th>
        <th>${tr('paid_by', 'Paid By')}</th>
        <th style="text-align:right;">${tr('gross_billed', 'Total')}</th>
        <th style="text-align:right;">${tr('insurance_refund', 'Refund')}</th>
        <th style="text-align:right;">${tr('net_out_of_pocket', 'Net')}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <h3 style="font-size:14px;color:#0f172a;margin-bottom:8px;">2. ${tr('who_paid_what', 'Family Split & Balances')}</h3>
  <table>
    <thead>
      <tr>
        <th>${tr('family_card_title', 'Member')}</th>
        <th style="text-align:center;">%</th>
        <th style="text-align:right;">${tr('paid_prefix', 'Paid')}</th>
        <th style="text-align:right;">${tr('fair_share_prefix', 'Share')}</th>
        <th style="text-align:right;">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${balanceRowsHtml}
    </tbody>
  </table>
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
    this.downloadHtmlPacket(params);
    return false;
  },

  downloadHtmlPacket(params: GeneratePacketParams) {
    const html = this.buildReimbursementHtml(params);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CareCircle_Summary_${new Date().toISOString().split('T')[0]}.html`;
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
      'Insurance Refund',
      'Net Out-Of-Pocket',
      'Tax Eligible',
      'Items',
    ];

    const rows = expenses.map((exp) => {
      const payer = memberMap.get(exp.paidByMemberId) || 'Family Pool';
      const net = Math.max(0, exp.totalAmount - (exp.insuranceReimbursedAmount || 0));
      const itemsStr = exp.lineItems
        .map((li) => `${li.description} ($${li.total.toFixed(2)})`)
        .join(' | ');
      return [
        exp.date,
        `"${exp.providerName.replace(/"/g, '""')}"`,
        exp.category,
        `"${payer}"`,
        exp.totalAmount.toFixed(2),
        (exp.insuranceReimbursedAmount || 0).toFixed(2),
        net.toFixed(2),
        exp.isTaxDeductible ? 'YES' : 'NO',
        `"${itemsStr.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = ['\uFEFF' + headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CareCircle_Bills_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

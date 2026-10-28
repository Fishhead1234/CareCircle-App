import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import { EXPENSE_CATEGORY_META, ExpenseCategory } from '../../types/care';
import { pdfReportService } from '../../services/pdfReportService';

type ReportScope = 'ALL' | 'INSURANCE_PENDING' | 'TAX_DEDUCTIBLE';

export const ReimbursementReportScreen: React.FC = () => {
  const {
    recipient,
    members,
    expenses,
    shifts,
    currencySymbol,
    getMemberBalances,
  } = useCareStore();

  const [scope, setScope] = useState<ReportScope>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ALL');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const balances = getMemberBalances();
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const filteredExpenses = expenses.filter((exp) => {
    if (selectedMemberId !== 'ALL' && exp.paidByMemberId !== selectedMemberId) {
      return false;
    }
    if (scope === 'INSURANCE_PENDING') {
      return (
        exp.insuranceClaimStatus === 'NOT_SUBMITTED' ||
        exp.insuranceClaimStatus === 'SUBMITTED'
      );
    }
    if (scope === 'TAX_DEDUCTIBLE') {
      return exp.isTaxDeductible;
    }
    return true;
  });

  const grossTotal = filteredExpenses.reduce((s, e) => s + e.totalAmount, 0);
  const reimbursedTotal = filteredExpenses.reduce(
    (s, e) => s + (e.insuranceReimbursedAmount || 0),
    0
  );
  const netOutOfPocket = Math.max(0, grossTotal - reimbursedTotal);
  const taxDeductibleTotal = filteredExpenses
    .filter((e) => e.isTaxDeductible)
    .reduce(
      (s, e) => s + Math.max(0, e.totalAmount - (e.insuranceReimbursedAmount || 0)),
      0
    );

  const filterLabel = `${
    scope === 'ALL'
      ? 'All Medical Expenses'
      : scope === 'INSURANCE_PENDING'
      ? 'Pending Insurance Claims'
      : 'IRS Tax-Deductible Medical Only'
  }${
    selectedMemberId !== 'ALL'
      ? ` • Paid by ${memberMap.get(selectedMemberId) || 'Member'}`
      : ''
  }`;

  const handlePrintPdf = () => {
    pdfReportService.openPrintPdfWindow({
      recipient,
      members,
      expenses: filteredExpenses,
      shifts,
      balances,
      filterLabel,
      currency: currencySymbol,
    });
    setExportStatus('✓ Opened print-ready PDF Reimbursement & Tax Summary packet.');
    setTimeout(() => setExportStatus(null), 4000);
  };

  const handleDownloadDossier = () => {
    pdfReportService.downloadHtmlPacket({
      recipient,
      members,
      expenses: filteredExpenses,
      shifts,
      balances,
      filterLabel,
      currency: currencySymbol,
    });
    setExportStatus('✓ Downloaded printable Reimbursement Dossier file.');
    setTimeout(() => setExportStatus(null), 4000);
  };

  const handleDownloadCsv = () => {
    pdfReportService.downloadCsvExport({
      recipient,
      members,
      expenses: filteredExpenses,
      shifts,
      balances,
      filterLabel,
      currency: currencySymbol,
    });
    setExportStatus('✓ Downloaded CSV spreadsheet for CPA / HSA reimbursement.');
    setTimeout(() => setExportStatus(null), 4000);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Top Report Generator Card */}
      <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              Insurance &amp; IRS Pub 502 Tax Documentation
            </span>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              1-Click Reimbursement &amp; Tax Summary
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generates an itemized CPT/NDC packet with patient policy details and family pool balances.
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Scope & Member Filters */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Report Scope</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setScope('ALL')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                scope === 'ALL'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              All Bills ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('INSURANCE_PENDING')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                scope === 'INSURANCE_PENDING'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              Ins. Claims
            </button>
            <button
              type="button"
              onClick={() => setScope('TAX_DEDUCTIBLE')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                scope === 'TAX_DEDUCTIBLE'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              Tax-Deductible
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setSelectedMemberId('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedMemberId === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              All Family Payers
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  selectedMemberId === m.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                Paid by {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Summary KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Gross Billed
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">
              {currencySymbol}
              {grossTotal.toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
              Ins. Paid
            </span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {currencySymbol}
              {reimbursedTotal.toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25">
            <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300 block">
              Net Out-of-Pocket
            </span>
            <span className="text-base font-black font-mono text-teal-700 dark:text-teal-300">
              {currencySymbol}
              {netOutOfPocket.toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">
              Tax-Deductible
            </span>
            <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
              {currencySymbol}
              {taxDeductibleTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 1-Click PDF & Export Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>1-Click Generate PDF Reimbursement &amp; Tax Packet</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadDossier}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Save Printable Packet</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV for CPA</span>
            </button>
          </div>
        </div>

        {exportStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Category Breakdown & IRS Deductibility Preview */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            Category Subtotals &amp; Tax Classification
          </h2>
        </div>

        <div className="space-y-2.5">
          {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => {
            const catItems = filteredExpenses.filter((e) => e.category === cat);
            if (catItems.length === 0) return null;
            const catNet = catItems.reduce(
              (s, e) => s + Math.max(0, e.totalAmount - (e.insuranceReimbursedAmount || 0)),
              0
            );
            const pct = netOutOfPocket > 0 ? Math.min(100, (catNet / netOutOfPocket) * 100) : 0;
            const meta = EXPENSE_CATEGORY_META[cat];

            return (
              <div
                key={cat}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{meta.taxNote}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {currencySymbol}
                      {catNet.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {catItems.length} bill(s) • {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Itemized CPT / Rx Line-Item Audit Preview */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Included Line Items in Packet ({filteredExpenses.length} Receipts)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Policy: {recipient.policyNumber}
          </span>
        </div>

        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>
                  {exp.date} — {exp.providerName}
                </span>
                <span className="font-mono">
                  {currencySymbol}
                  {exp.totalAmount.toFixed(2)}
                </span>
              </div>
              {exp.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pl-2 border-l-2 border-teal-500/40"
                >
                  <span>
                    {li.description}{' '}
                    {li.code && (
                      <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px]">
                        {li.code}
                      </code>
                    )}
                  </span>
                  <span className="font-mono">
                    {currencySymbol}
                    {li.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

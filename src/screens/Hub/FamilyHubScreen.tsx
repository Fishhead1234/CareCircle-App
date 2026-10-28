import React, { useState } from 'react';
import {
  Camera,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  Scale,
  Receipt,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_META,
  InsuranceClaimStatus,
} from '../../types/care';

interface Props {
  onOpenScanner: () => void;
}

export const FamilyHubScreen: React.FC<Props> = ({ onOpenScanner }) => {
  const {
    recipient,
    members,
    expenses,
    settlements,
    currencySymbol,
    getMemberBalances,
    getSuggestedSettlements,
    recordSettlement,
    updateExpense,
    deleteExpense,
    setActiveTab,
  } = useCareStore();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ExpenseCategory>('ALL');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(
    expenses[0]?.id || null
  );
  const [settlementBanner, setSettlementBanner] = useState<string | null>(null);

  const balances = getMemberBalances();
  const suggestedSettlements = getSuggestedSettlements();
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const grossTotal = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const reimbursedTotal = expenses.reduce(
    (s, e) => s + (e.insuranceReimbursedAmount || 0),
    0
  );
  const netSharedPool = Math.max(0, grossTotal - reimbursedTotal);

  const filteredExpenses =
    selectedCategory === 'ALL'
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  const handleQuickSettle = (
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    fromName: string,
    toName: string
  ) => {
    recordSettlement({
      fromMemberId,
      toMemberId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'Zelle / Family Transfer',
      note: 'Automated Family Pool Balance Settlement',
    });
    setSettlementBanner(
      `✓ Recorded ${currencySymbol}${amount.toFixed(2)} settlement from ${fromName} to ${toName}`
    );
    setTimeout(() => setSettlementBanner(null), 4000);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Care Recipient Profile Hero Card */}
      <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white shadow-lg space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 font-bold">
                  Active Care Circle
                </span>
                <span className="text-[11px] text-teal-100/80 font-mono">
                  Policy: {recipient.policyNumber}
                </span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight mt-0.5">
                {recipient.preferredName} • {recipient.name}
              </h1>
              <p className="text-xs text-teal-100/90">
                Age {recipient.age} ({recipient.bloodType}) • {recipient.primaryPhysician}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="shrink-0 min-h-[44px] px-3.5 py-2 rounded-2xl bg-white text-teal-900 hover:bg-teal-50 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4 text-teal-600" />
            <span>Snap Bill</span>
          </button>
        </div>

        {/* Active Conditions & Allergies Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/15 text-[11px]">
          {recipient.primaryConditions.map((cond, i) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/95 font-medium"
            >
              {cond}
            </span>
          ))}
          {recipient.allergies.map((alg, i) => (
            <span
              key={`alg_${i}`}
              className="px-2.5 py-0.5 rounded-lg bg-rose-500/30 border border-rose-300/40 text-rose-100 font-bold"
            >
              ⚠️ Allergy: {alg}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Shared Family Pool & Split Balance Card */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Shared Family Pool &amp; Who Paid What
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1-Click PDF Summary →</span>
          </button>
        </div>

        {/* 3 Pool Totals KPI Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Gross Billed
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">
              {currencySymbol}
              {grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
              Ins. Reimbursed
            </span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {currencySymbol}
              {reimbursedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25">
            <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300 block">
              Net Family Pool
            </span>
            <span className="text-base font-black font-mono text-teal-700 dark:text-teal-300">
              {currencySymbol}
              {netSharedPool.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Member Balance Cards */}
        <div className="space-y-2">
          {balances.map((b) => {
            const isPositive = b.netBalance >= 0.01;
            const isSettled = Math.abs(b.netBalance) < 0.5;
            return (
              <div
                key={b.member.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                    style={{ backgroundColor: b.member.avatarColor }}
                  >
                    {b.member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {b.member.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        {b.member.splitPercentage}% share
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Paid {currencySymbol}
                      {b.netOutOfPocketPaid.toFixed(2)} • Fair Share {currencySymbol}
                      {b.assignedShare.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isSettled ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Settled
                    </span>
                  ) : (
                    <>
                      <span
                        className={`text-xs font-extrabold font-mono block ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {currencySymbol}
                        {Math.abs(b.netBalance).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isPositive ? 'Pool owes them' : 'Owes family pool'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested 1-Tap Pool Settlements */}
        {suggestedSettlements.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                ⚡ Recommended Transfers to Balance Family Pool
              </span>
              <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-300/80">
                1-Tap Settle
              </span>
            </div>
            <div className="space-y-1.5">
              {suggestedSettlements.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/20 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <strong>{s.fromName.split(' ')[0]}</strong>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{s.toName.split(' ')[0]}</strong>
                    <span className="font-mono font-extrabold text-teal-600 dark:text-teal-400 ml-1">
                      {currencySymbol}
                      {s.amount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSettle(
                        s.fromMemberId,
                        s.toMemberId,
                        s.amount,
                        s.fromName,
                        s.toName
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Mark Paid
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {settlementBanner && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center">
            {settlementBanner}
          </div>
        )}
      </div>

      {/* 3. Scanned Medical Bills & Pharmacy Receipts Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Medical Bills &amp; Pharmacy Receipts ({filteredExpenses.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenScanner}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>+ Scan Receipt</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            All ({expenses.length})
          </button>
          {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => {
            const count = expenses.filter((e) => e.category === cat).length;
            const selected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  selected
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {EXPENSE_CATEGORY_META[cat].shortLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* Expense Cards */}
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => {
            const payer = memberMap.get(exp.paidByMemberId);
            const catMeta = EXPENSE_CATEGORY_META[exp.category];
            const isExpanded = expandedExpenseId === exp.id;
            const netCost = Math.max(
              0,
              exp.totalAmount - (exp.insuranceReimbursedAmount || 0)
            );

            return (
              <div
                key={exp.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition"
              >
                <div
                  onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.badgeBg} ${catMeta.badgeText}`}
                      >
                        {catMeta.shortLabel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {exp.date}
                      </span>
                      {exp.aiConfidence && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> AI {exp.aiConfidence}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {exp.providerName}
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-teal-500" />
                        Paid by {payer?.name.split(' ')[0] || 'Family'}
                      </span>
                      <span>•</span>
                      <span>{exp.lineItems.length} line item(s)</span>
                      {exp.isTaxDeductible && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            Tax-Deductible
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white block">
                      {currencySymbol}
                      {exp.totalAmount.toFixed(2)}
                    </span>
                    {exp.insuranceReimbursedAmount > 0 ? (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block">
                        Net: {currencySymbol}
                        {netCost.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {exp.insuranceClaimStatus.replace('_', ' ')}
                      </span>
                    )}
                    <div className="mt-1 inline-flex items-center text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Line Items & Claim Status Control */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/50 space-y-3">
                    {exp.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        &ldquo;{exp.notes}&rdquo;
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Extracted Receipt Line Items:
                      </span>
                      {exp.lineItems.map((li) => (
                        <div
                          key={li.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {li.description}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              {li.code && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {li.code}
                                </span>
                              )}
                              <span>
                                Qty {li.quantity} × {currencySymbol}
                                {li.unitPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                            {currencySymbol}
                            {li.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Insurance Status Toggle & Delete */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Claim Status:
                        </span>
                        <select
                          value={exp.insuranceClaimStatus}
                          onChange={(e) =>
                            updateExpense(exp.id, {
                              insuranceClaimStatus: e.target.value as InsuranceClaimStatus,
                            })
                          }
                          className="rounded-lg px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <option value="NOT_SUBMITTED">Not Submitted</option>
                          <option value="SUBMITTED">Submitted to Ins.</option>
                          <option value="REIMBURSED">Reimbursed</option>
                          <option value="DENIED">Denied / Out-of-Pocket</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteExpense(exp.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

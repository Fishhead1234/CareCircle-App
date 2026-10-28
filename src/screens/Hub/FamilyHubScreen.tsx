import React, { useState } from 'react';
import {
  Camera,
  HeartPulse,
  CheckCircle2,
  ArrowRight,
  Receipt,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import { ExpenseCategory, EXPENSE_CATEGORY_META } from '../../types/care';

interface FamilyHubScreenProps {
  onOpenScanner: () => void;
}

export const FamilyHubScreen: React.FC<FamilyHubScreenProps> = ({ onOpenScanner }) => {
  const {
    recipient,
    members,
    expenses,
    currencySymbol,
    deleteExpense,
    recordSettlement,
    getMemberBalances,
    getSuggestedSettlements,
    t,
  } = useCareStore();

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [settledToast, setSettledToast] = useState<string | null>(null);

  const balances = getMemberBalances();
  const suggestions = getSuggestedSettlements();
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const grossTotal = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const reimbursedTotal = expenses.reduce((s, e) => s + (e.insuranceReimbursedAmount || 0), 0);
  const netSharedPool = Math.max(0, grossTotal - reimbursedTotal);

  const filteredExpenses = expenses.filter((exp) => {
    if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
    return true;
  });

  const handleSettleUp = (fromId: string, toId: string, amount: number, fromName: string, toName: string) => {
    recordSettlement({
      fromMemberId: fromId,
      toMemberId: toId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'Transfer',
      note: `${fromName} -> ${toName}`,
    });
    setSettledToast(`${t('settled_toast')} (${fromName} → ${toName} ${currencySymbol}${amount.toFixed(0)})`);
    setTimeout(() => setSettledToast(null), 3200);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Simple Hero Summary & Big Snap Button */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="text-[11px] text-teal-200 font-bold">
                {t('caring_for')}
              </div>
              <h2 className="text-base font-extrabold tracking-tight">
                {recipient.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>{t('snap_bill_btn')}</span>
          </button>
        </div>

        {/* Big Clear Pool Total */}
        <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-teal-100 font-medium">{t('total_shared_cost')}</div>
            <div className="text-2xl font-black font-mono tracking-tight mt-0.5">
              {currencySymbol}
              {netSharedPool.toFixed(2)}
            </div>
          </div>
          <div className="text-right text-xs text-teal-100 space-y-0.5 font-mono">
            <div>
              {t('gross_billed')}: {currencySymbol}
              {grossTotal.toFixed(0)}
            </div>
            {reimbursedTotal > 0 && (
              <div className="text-emerald-300">
                {t('insurance_refund')}: -{currencySymbol}
                {reimbursedTotal.toFixed(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast alert when settling */}
      {settledToast && (
        <div className="rounded-2xl bg-emerald-600 text-white px-4 py-3 text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{settledToast}</span>
        </div>
      )}

      {/* 2. Who Paid What & 1-Tap Settle Up */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">
          {t('who_paid_what')}
        </h3>

        <div className="space-y-2.5">
          {balances.map((b) => {
            const isOwed = b.netBalance > 0.5;
            const owesPool = b.netBalance < -0.5;
            return (
              <div
                key={b.member.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                    style={{ backgroundColor: b.member.avatarColor }}
                  >
                    {b.member.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {b.member.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {b.member.splitPercentage}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {t('paid_prefix')} {currencySymbol}
                      {b.netOutOfPocketPaid.toFixed(0)} • {t('fair_share_prefix')} {currencySymbol}
                      {b.assignedShare.toFixed(0)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-extrabold font-mono ${
                      isOwed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : owesPool
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isOwed
                      ? `+${currencySymbol}${b.netBalance.toFixed(0)}`
                      : owesPool
                      ? `-${currencySymbol}${Math.abs(b.netBalance).toFixed(0)}`
                      : `${currencySymbol}0`}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {isOwed
                      ? t('status_owed')
                      : owesPool
                      ? t('status_owes')
                      : t('status_settled')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested 1-Tap Transfers */}
        {suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-extrabold text-teal-700 dark:text-teal-400">
              {t('settle_up_title')}
            </div>
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-500/20 rounded-xl px-3 py-2"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span>{sug.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
                  <span>{sug.toName}</span>
                  <span className="font-mono font-black text-teal-700 dark:text-teal-300 ml-1">
                    {currencySymbol}
                    {sug.amount.toFixed(0)}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleSettleUp(sug.fromMemberId, sug.toMemberId, sug.amount, sug.fromName, sug.toName)
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  {t('mark_paid_btn')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Simple Medical Bills List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-teal-600" />
            <span>
              {t('bills_section_title')} ({filteredExpenses.length})
            </span>
          </h3>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('cat_all')}
          </button>
          {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t(`cat_${cat}`)}
            </button>
          ))}
        </div>

        {/* Bills Cards */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">{t('empty_bills')}</div>
        ) : (
          <div className="space-y-2.5">
            {filteredExpenses.map((exp) => {
              const payer = memberMap.get(exp.paidByMemberId);
              const catMeta = EXPENSE_CATEGORY_META[exp.category];
              const netCost = Math.max(0, exp.totalAmount - (exp.insuranceReimbursedAmount || 0));

              return (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catMeta?.badgeBg} ${catMeta?.badgeText}`}
                        >
                          {t(`cat_${exp.category}`)}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{exp.date}</span>
                        {exp.isTaxDeductible && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {t('tax_deductible_badge')}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {exp.providerName}
                      </h4>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-300">
                        <span>{t('paid_by')}</span>
                        {payer && (
                          <span
                            className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-white text-[11px]"
                            style={{ backgroundColor: payer.avatarColor }}
                          >
                            {payer.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {currencySymbol}
                        {netCost.toFixed(2)}
                      </div>
                      {exp.insuranceReimbursedAmount > 0 && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          -{currencySymbol}
                          {exp.insuranceReimbursedAmount.toFixed(0)}
                        </div>
                      )}
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('delete_btn')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Simple Line Items List */}
                  {exp.lineItems.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      {exp.lineItems.map((li) => (
                        <div
                          key={li.id}
                          className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
                        >
                          <span className="truncate pr-2">• {li.description}</span>
                          <span className="font-mono font-semibold shrink-0">
                            {currencySymbol}
                            {li.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Camera,
  HeartPulse,
  CheckCircle2,
  ArrowRight,
  Receipt,
  Trash2,
  Pencil,
  Plus,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import { ExpenseCategory, EXPENSE_CATEGORY_META } from '../../types/care';

interface FamilyHubScreenProps {
  onOpenScanner: () => void;
}

const AVATAR_COLORS = ['#0D9488', '#2563EB', '#7C3AED', '#EA580C', '#DB2777', '#059669'];

export const FamilyHubScreen: React.FC<FamilyHubScreenProps> = ({ onOpenScanner }) => {
  const {
    recipient,
    members,
    expenses,
    currencySymbol,
    updateRecipient,
    updateFamilyMember,
    addFamilyMember,
    removeFamilyMember,
    equalizeSplits,
    updateExpense,
    deleteExpense,
    recordSettlement,
    getMemberBalances,
    getSuggestedSettlements,
    t,
  } = useCareStore();

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [settledToast, setSettledToast] = useState<string | null>(null);
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const balances = getMemberBalances();
  const suggestions = getSuggestedSettlements();

  const grossTotal = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const reimbursedTotal = expenses.reduce((s, e) => s + (e.insuranceReimbursedAmount || 0), 0);
  const netSharedPool = Math.max(0, grossTotal - reimbursedTotal);

  const filteredExpenses = expenses.filter((exp) => {
    if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
    return true;
  });

  const handleSettleUp = (
    fromId: string,
    toId: string,
    amount: number,
    fromName: string,
    toName: string
  ) => {
    recordSettlement({
      fromMemberId: fromId,
      toMemberId: toId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'Transfer',
      note: `${fromName} -> ${toName}`,
    });
    setSettledToast(
      `${t('settled_toast')} (${fromName} → ${toName} ${currencySymbol}${amount.toFixed(0)})`
    );
    setTimeout(() => setSettledToast(null), 3200);
  };

  const handleQuickAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    addFamilyMember({
      name: newMemberName.trim(),
      relationship: newMemberRole.trim() || 'Family',
      avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
      splitPercentage: 0,
    });
    setNewMemberName('');
    setNewMemberRole('');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Simple Hero Summary & Big Snap Button */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5 text-teal-200" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-teal-200 font-bold">{t('caring_for')}</div>
              {isEditingRecipient ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => updateRecipient({ name: e.target.value })}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-900 text-xs font-extrabold w-44"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingRecipient(false)}
                    className="px-2 py-1 rounded-lg bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingRecipient(true)}
                  className="flex items-center gap-1.5 text-base font-extrabold tracking-tight hover:text-teal-200 cursor-pointer text-left"
                >
                  <span className="truncate">{recipient.name}</span>
                  <Pencil className="w-3.5 h-3.5 opacity-75 shrink-0" />
                </button>
              )}
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

        {/* Big Clear Total Out-of-Pocket Expense Explanation */}
        <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-teal-100 font-bold">{t('total_shared_cost')}</div>
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
          <div className="text-[11px] text-teal-200/90 mt-2 pt-2 border-t border-white/10">
            {t('total_shared_cost_hint')}
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

      {/* 2. Who Paid What & Inline Name/Split Editor */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t('who_paid_what')}
          </h3>
          <button
            onClick={() => setIsEditingMembers(!isEditingMembers)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              isEditingMembers
                ? 'bg-emerald-600 text-white'
                : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20'
            }`}
          >
            {isEditingMembers ? t('done_editing_btn') : t('edit_members_btn')}
          </button>
        </div>

        {/* Inline Edit Payer Names & Split % Mode */}
        {isEditingMembers ? (
          <div className="space-y-2.5 mb-3 p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300 mb-1">
              <span>{t('family_card_desc')}</span>
              <button
                type="button"
                onClick={equalizeSplits}
                className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-bold cursor-pointer shrink-0"
              >
                {t('equal_split_btn')}
              </button>
            </div>

            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.name.slice(0, 1)}
                </div>
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => updateFamilyMember(m.id, { name: e.target.value })}
                  placeholder="Name"
                  className="flex-1 min-w-[110px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={m.relationship}
                  onChange={(e) => updateFamilyMember(m.id, { relationship: e.target.value })}
                  placeholder="Role"
                  className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={m.splitPercentage}
                    onChange={(e) =>
                      updateFamilyMember(m.id, {
                        splitPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-center text-slate-900 dark:text-white"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFamilyMember(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Quick Add New Family Payer */}
            <form onSubmit={handleQuickAddMember} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder={t('add_member_placeholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                placeholder={t('add_role_placeholder')}
                className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add_member_btn')}</span>
              </button>
            </form>
          </div>
        ) : (
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
                        {b.netOutOfPocketPaid.toFixed(0)} • {t('fair_share_prefix')}{' '}
                        {currencySymbol}
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
        )}

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
                    handleSettleUp(
                      sug.fromMemberId,
                      sug.toMemberId,
                      sug.amount,
                      sug.fromName,
                      sug.toName
                    )
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

      {/* 3. Simple Medical Bills List (With 1-Tap Payer Reassignment) */}
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

                      {/* Interactive "Paid By" Selector on every bill */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span>{t('paid_by')}</span>
                        <select
                          aria-label="Paid by member"
                          value={exp.paidByMemberId}
                          onChange={(e) =>
                            updateExpense(exp.id, { paidByMemberId: e.target.value })
                          }
                          className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-teal-700 dark:text-teal-300 cursor-pointer"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
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

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  CheckCircle2,
  PieChart,
  History,
  ArrowUpRight,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';

export const FundsPoolScreen: React.FC = () => {
  const {
    members,
    fundContributions,
    currencySymbol,
    addFundContribution,
    deleteFundContribution,
    getPoolTotals,
    getMemberBalances,
    t,
  } = useCareStore();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members[0]?.id || 'mem_sarah'
  );
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const pool = getPoolTotals();
  const balances = getMemberBalances();
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    const payer = memberMap.get(selectedMemberId) || members[0];
    addFundContribution({
      memberId: payer?.id || 'mem_sarah',
      amount: num,
      date,
      note: note.trim() || `${payer?.name || ''} — Fund Deposit`,
    });

    setAmount('');
    setNote('');
    setToastMsg(`✓ +${currencySymbol}${num.toFixed(0)} (${payer?.name || ''})`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleQuickTopUpShortfall = (memberId: string, memberName: string, shortfall: number) => {
    const rounded = Math.ceil(shortfall * 100) / 100;
    addFundContribution({
      memberId,
      amount: rounded,
      date: new Date().toISOString().split('T')[0],
      note: `${memberName} — Shortfall Top-Up`,
    });
    setToastMsg(`✓ +${currencySymbol}${rounded.toFixed(2)} (${memberName})`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Pool of Funds Hero Summary */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white p-5 shadow-lg">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">{t('funds_tab_title')}</h2>
            <p className="text-[11px] text-teal-100/90">{t('funds_tab_subtitle')}</p>
          </div>
        </div>

        {/* Big Funds Available Box */}
        <div className="mt-3 rounded-2xl bg-white/10 p-4 border border-white/15">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-emerald-200">
                {t('funds_available_label')}
              </div>
              <div
                className={`text-3xl font-black font-mono tracking-tight mt-0.5 ${
                  pool.fundsAvailable >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {pool.fundsAvailable >= 0 ? '+' : '-'}
                {currencySymbol}
                {Math.abs(pool.fundsAvailable).toFixed(2)}
              </div>
              <div className="text-[11px] text-teal-200/80 mt-1">
                {t('funds_available_sub')}
              </div>
            </div>

            <div className="text-right text-xs font-mono space-y-1 text-teal-100">
              <div>
                {t('total_funds_in_label')}:{' '}
                <strong className="text-white">
                  {currencySymbol}
                  {pool.totalFundsPutIn.toFixed(2)}
                </strong>
              </div>
              <div>
                {t('total_shared_cost')}:{' '}
                <strong className="text-amber-200">
                  -{currencySymbol}
                  {pool.netOutOfPocket.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="rounded-2xl bg-emerald-600 text-white px-4 py-3 text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. Log Money Inputted into Pool of Funds */}
      <form
        onSubmit={handleAddDeposit}
        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3.5"
      >
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>{t('add_fund_title')}</span>
        </h3>

        {/* Select Which Payer */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            {t('select_payer_label')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {members.map((m) => {
              const selected = selectedMemberId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selected
                      ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {m.splitPercentage}% {t('share_suffix')}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {t('fund_amount_label')} ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {t('field_date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('fund_note_placeholder')}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow cursor-pointer shrink-0"
          >
            {t('add_fund_btn')}
          </button>
        </div>
      </form>

      {/* 3. % of Contribution Paid by Each Payer & Excess / Shortfall */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mb-3">
          <PieChart className="w-4 h-4 text-teal-600" />
          <span>{t('contrib_breakdown_title')}</span>
        </h3>

        {/* Stacked Contribution % Bar */}
        <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mb-3">
          {balances.map((b) => (
            <div
              key={b.member.id}
              style={{
                width: `${Math.max(2, b.actualContributionPercent)}%`,
                backgroundColor: b.member.avatarColor,
              }}
              title={`${b.member.name}: ${b.actualContributionPercent.toFixed(1)}%`}
            />
          ))}
        </div>

        <div className="space-y-2.5">
          {balances.map((b) => {
            const hasExcess = b.netBalance > 0.5;
            const needsToPay = b.netBalance < -0.5;

            return (
              <div
                key={b.member.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                      style={{ backgroundColor: b.member.avatarColor }}
                    >
                      {b.member.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {b.member.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          {t('actual_pct_label')}: {b.actualContributionPercent.toFixed(1)}%
                        </span>
                        <span>•</span>
                        <span>
                          {t('agreed_pct_label')}: {b.member.splitPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black font-mono ${
                        hasExcess
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : needsToPay
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {hasExcess
                        ? `+${currencySymbol}${b.netBalance.toFixed(2)}`
                        : needsToPay
                        ? `-${currencySymbol}${Math.abs(b.netBalance).toFixed(2)}`
                        : `${currencySymbol}0.00`}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {hasExcess
                        ? t('status_owed')
                        : needsToPay
                        ? t('status_owes')
                        : t('status_settled')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <div>
                    {t('contributed_prefix')}:{' '}
                    <strong>
                      {currencySymbol}
                      {b.totalContributed.toFixed(2)}
                    </strong>{' '}
                    <span className="text-[11px] text-slate-400">
                      ({t('fair_share_prefix')}: {currencySymbol}
                      {b.assignedShare.toFixed(2)})
                    </span>
                  </div>

                  {needsToPay && (
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickTopUpShortfall(
                          b.member.id,
                          b.member.name,
                          Math.abs(b.netBalance)
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-sans font-bold text-[11px] cursor-pointer"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>
                        {t('top_up_shortfall_btn')} ({currencySymbol}
                        {Math.abs(b.netBalance).toFixed(0)})
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Fund Deposit History */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mb-3">
          <History className="w-4 h-4 text-emerald-600" />
          <span>
            {t('fund_history_title')} ({fundContributions.length})
          </span>
        </h3>

        {fundContributions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">{t('empty_funds')}</div>
        ) : (
          <div className="space-y-2">
            {fundContributions.map((fc) => {
              const payer = memberMap.get(fc.memberId);
              return (
                <div
                  key={fc.id}
                  className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                      style={{ backgroundColor: payer?.avatarColor || '#0D9488' }}
                    >
                      {(payer?.name || 'F').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {payer?.name || 'Family'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{fc.date}</span>
                      </div>
                      {fc.note && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {fc.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      +{currencySymbol}
                      {fc.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteFundContribution(fc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


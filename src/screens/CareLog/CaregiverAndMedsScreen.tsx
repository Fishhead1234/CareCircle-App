import React, { useState } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';

export const CaregiverAndMedsScreen: React.FC = () => {
  const {
    members,
    shifts,
    medications,
    currencySymbol,
    addCaregiverShift,
    deleteCaregiverShift,
    addMedication,
    logDoseTaken,
    refillMedication,
    deleteMedication,
    t,
  } = useCareStore();

  const [showAddShift, setShowAddShift] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);

  // Simple Shift state
  const [caregiverName, setCaregiverName] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('6');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [paidByMemberId, setPaidByMemberId] = useState(members[0]?.id || 'mem_sarah');
  const [vitalsOrNotes, setVitalsOrNotes] = useState('');
  const [autoCreateBill, setAutoCreateBill] = useState(true);

  // Simple Med state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medPills, setMedPills] = useState('30');

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    if (!caregiverName.trim() || h <= 0) return;

    addCaregiverShift(
      {
        caregiverName: caregiverName.trim(),
        role: '',
        date: shiftDate,
        startTime: '09:00',
        endTime: '15:00',
        hours: h,
        hourlyRate: rate,
        totalPay: h * rate,
        paidByMemberId,
        tasksCompleted: [],
        vitalsOrNotes: vitalsOrNotes.trim(),
      },
      autoCreateBill
    );

    setCaregiverName('');
    setVitalsOrNotes('');
    setShowAddShift(false);
  };

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    addMedication({
      name: medName.trim(),
      dosage: medDosage.trim() || '1 Pill',
      frequency: medFreq.trim() || 'Daily',
      timeOfDay: ['08:00'],
      purpose: '',
      prescribingDoctor: '',
      pillsRemaining: parseInt(medPills, 10) || 30,
      refillThreshold: 10,
    });

    setMedName('');
    setMedDosage('');
    setMedFreq('');
    setShowAddMed(false);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Daily Medication Checklist */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>{t('meds_title')}</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('meds_subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowAddMed(!showAddMed)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('add_med_btn')}</span>
          </button>
        </div>

        {/* Simple Add Med Form */}
        {showAddMed && (
          <form
            onSubmit={handleCreateMed}
            className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5"
          >
            <input
              type="text"
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder={t('med_name_placeholder')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder={t('med_dose_placeholder')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={medFreq}
                onChange={(e) => setMedFreq(e.target.value)}
                placeholder={t('med_freq_placeholder')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={medPills}
                onChange={(e) => setMedPills(e.target.value)}
                placeholder={t('pills_left')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMed(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500"
              >
                {t('cancel_btn')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
              >
                {t('add_med_btn')}
              </button>
            </div>
          </form>
        )}

        {/* Medication Cards */}
        <div className="space-y-2.5">
          {medications.map((med) => {
            const isLow = med.pillsRemaining <= med.refillThreshold;
            return (
              <div
                key={med.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {med.name}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300">
                      {med.dosage}
                    </span>
                    {isLow && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" />
                        {t('refill_soon')} ({med.pillsRemaining})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {med.frequency} • {t('pills_left')}: {med.pillsRemaining}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    {med.lastTakenAt
                      ? `${t('last_taken')} ${med.lastTakenAt} (${med.lastAdministeredBy || ''})`
                      : t('not_taken_today')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => logDoseTaken(med.id, members[0]?.name || 'Family')}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                  >
                    {t('take_dose_btn')}
                  </button>
                  <button
                    onClick={() => refillMedication(med.id, 30)}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    {t('refill_btn')}
                  </button>
                  <button
                    onClick={() => deleteMedication(med.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Caregiver Shift Hours */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>{t('shifts_title')}</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('shifts_subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowAddShift(!showAddShift)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('add_shift_btn')}</span>
          </button>
        </div>

        {showAddShift && (
          <form
            onSubmit={handleCreateShift}
            className="mb-4 p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('caregiver_name')}
                </label>
                <input
                  type="text"
                  required
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="林美玲 / Maria"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('field_date')}
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('shift_hours')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('hourly_rate')} ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t('paid_by')}
                </label>
                <select
                  value={paidByMemberId}
                  onChange={(e) => setPaidByMemberId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              type="text"
              value={vitalsOrNotes}
              onChange={(e) => setVitalsOrNotes(e.target.value)}
              placeholder={t('shift_notes')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateBill}
                  onChange={(e) => setAutoCreateBill(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span>{t('auto_add_bill')}</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                {t('save_shift_btn')}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {shifts.map((sh) => {
            const payer = memberMap.get(sh.paidByMemberId);
            return (
              <div
                key={sh.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {sh.caregiverName}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{sh.date}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {sh.hours}h × {currencySymbol}
                    {sh.hourlyRate}/hr • {t('paid_by')} {payer?.name || '-'}
                  </div>
                  {sh.vitalsOrNotes && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {sh.vitalsOrNotes}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {currencySymbol}
                    {sh.totalPay.toFixed(0)}
                  </div>
                  <button
                    onClick={() => deleteCaregiverShift(sh.id)}
                    className="mt-1 text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    {t('delete_btn')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

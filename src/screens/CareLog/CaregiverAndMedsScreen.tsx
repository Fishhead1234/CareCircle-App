import React, { useState } from 'react';
import {
  Clock,
  Pill,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  UserCheck,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';

export const CaregiverAndMedsScreen: React.FC = () => {
  const {
    shifts,
    medications,
    members,
    currencySymbol,
    addCaregiverShift,
    deleteCaregiverShift,
    addMedication,
    logDoseTaken,
    refillMedication,
    deleteMedication,
  } = useCareStore();

  const [showAddShift, setShowAddShift] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);

  // Shift Form State
  const [caregiverName, setCaregiverName] = useState('Maria Santos, CNA');
  const [role, setRole] = useState('Certified Home Health Aide');
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [hours, setHours] = useState('8');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [paidByMemberId, setPaidByMemberId] = useState(members[0]?.id || 'mem_sarah');
  const [vitalsOrNotes, setVitalsOrNotes] = useState('');
  const [autoPostExpense, setAutoPostExpense] = useState(true);

  // Medication Form State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Twice Daily');
  const [medPurpose, setMedPurpose] = useState('');
  const [medDoctor, setMedDoctor] = useState('Dr. Marcus Lin, MD');
  const [medPills, setMedPills] = useState('30');

  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const totalHours = shifts.reduce((s, sh) => s + sh.hours, 0);
  const totalShiftPay = shifts.reduce((s, sh) => s + sh.totalPay, 0);

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Math.max(0.5, Number(hours) || 1);
    const rate = Math.max(1, Number(hourlyRate) || 35);
    addCaregiverShift(
      {
        caregiverName: caregiverName.trim() || 'Caregiver',
        role: role.trim() || 'Home Care Aide',
        date: shiftDate,
        startTime,
        endTime,
        hours: h,
        hourlyRate: rate,
        totalPay: Math.round(h * rate * 100) / 100,
        paidByMemberId,
        tasksCompleted: ['Vitals Check', 'Medication Assist', 'Mobility & Meals'],
        vitalsOrNotes:
          vitalsOrNotes.trim() || 'Routine daily care & mobility exercises completed.',
      },
      autoPostExpense
    );
    setVitalsOrNotes('');
    setShowAddShift(false);
  };

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    addMedication({
      name: medName.trim(),
      dosage: medDosage.trim() || '1 Tablet',
      frequency: medFrequency.trim(),
      timeOfDay: ['08:00 AM', '08:00 PM'],
      purpose: medPurpose.trim() || 'Daily Maintenance',
      prescribingDoctor: medDoctor.trim() || 'Primary Physician',
      pillsRemaining: Math.max(1, Number(medPills) || 30),
      refillThreshold: 14,
    });
    setMedName('');
    setMedDosage('');
    setMedPurpose('');
    setShowAddMed(false);
  };

  return (
    <div className="space-y-5 pb-28">
      {/* 1. MEDICATION & REFILL SCHEDULE */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Active Medications &amp; Dose Verification
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shared family &amp; caregiver log so doses are never doubled or missed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMed(!showAddMed)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rx</span>
          </button>
        </div>

        {showAddMed && (
          <form
            onSubmit={handleCreateMed}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Medication Name (e.g. Eliquis)"
                className="rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <input
                type="text"
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 5 mg)"
                className="rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <input
                type="text"
                value={medPurpose}
                onChange={(e) => setMedPurpose(e.target.value)}
                placeholder="Purpose (e.g. Blood Pressure)"
                className="rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <input
                type="number"
                value={medPills}
                onChange={(e) => setMedPills(e.target.value)}
                placeholder="Pills Remaining (e.g. 30)"
                className="rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMed(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold cursor-pointer"
              >
                Save Medication
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {medications.map((med) => {
            const needsRefill = med.pillsRemaining <= med.refillThreshold;
            return (
              <div
                key={med.id}
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  needsRefill
                    ? 'bg-amber-500/5 border-amber-500/40'
                    : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {med.name}
                      </h3>
                      <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                        {med.dosage}
                      </span>
                      {needsRefill && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Refill Soon ({med.pillsRemaining} left)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {med.frequency} • {med.purpose} • {med.prescribingDoctor}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {med.pillsRemaining} pills
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {med.lastTakenAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Last dose: {med.lastTakenAt} ({med.lastAdministeredBy})
                      </span>
                    ) : (
                      <span>No dose logged today yet</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        logDoseTaken(med.id, members[0]?.name || 'Care Team')
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      ✓ Log Dose
                    </button>
                    <button
                      type="button"
                      onClick={() => refillMedication(med.id, 30)}
                      title="Add 30-Pill Refill"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>+30</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMedication(med.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CAREGIVER SHIFT & VITALS LOG */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Caregiver Hours &amp; Shift Log ({totalHours} hrs • {currencySymbol}
                {totalShiftPay.toFixed(0)})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Track visiting nurse/aide hours and auto-sync pay to the family pool
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddShift(!showAddShift)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Shift</span>
          </button>
        </div>

        {showAddShift && (
          <form
            onSubmit={handleCreateShift}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Caregiver Name
                </label>
                <input
                  type="text"
                  required
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Hourly Rate ({currencySymbol}/hr)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Paid By Family Member
              </label>
              <select
                value={paidByMemberId}
                onChange={(e) => setPaidByMemberId(e.target.value)}
                className="w-full rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Vitals &amp; Care Notes (BP, Glucose, Mobility)
              </label>
              <input
                type="text"
                value={vitalsOrNotes}
                onChange={(e) => setVitalsOrNotes(e.target.value)}
                placeholder="e.g. BP 124/78, Fasting Glucose 105 mg/dL, 30m walk completed"
                className="w-full rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>
                Automatically add shift cost ({currencySymbol}
                {((Number(hours) || 0) * (Number(hourlyRate) || 0)).toFixed(2)}) to Family
                Expense Pool
              </span>
              <input
                type="checkbox"
                checked={autoPostExpense}
                onChange={(e) => setAutoPostExpense(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddShift(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Save Shift Log
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {shifts.map((sh) => (
            <div
              key={sh.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {sh.caregiverName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
                      {sh.hours} hrs @ {currencySymbol}
                      {sh.hourlyRate}/hr
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sh.date} ({sh.startTime}–{sh.endTime}) • Paid by{' '}
                    <strong>{memberMap.get(sh.paidByMemberId) || 'Family'}</strong>
                  </p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {currencySymbol}
                    {sh.totalPay.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteCaregiverShift(sh.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Stethoscope className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <span>{sh.vitalsOrNotes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


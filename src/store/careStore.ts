import { create } from 'zustand';
import {
  CareRecipientProfile,
  FamilyMember,
  MedicalExpense,
  PoolSettlement,
  CaregiverShift,
  MedicationSchedule,
  MemberBalanceSummary,
  SuggestedSettlement,
} from '../types/care';

export type AppTab = 'hub' | 'carelog' | 'reports' | 'settings';

export const ADMIN_PASSCODES = ['admin888', 'invest2026'];

interface CareStoreState {
  activeTab: AppTab;
  themeMode: 'light' | 'dark';
  currencySymbol: string;
  geminiApiKey: string;
  isPro: boolean;
  isAdmin: boolean;
  trialStartDate: string;

  recipient: CareRecipientProfile;
  members: FamilyMember[];
  expenses: MedicalExpense[];
  settlements: PoolSettlement[];
  shifts: CaregiverShift[];
  medications: MedicationSchedule[];

  // Navigation & UI
  setActiveTab: (tab: AppTab) => void;
  toggleTheme: () => void;
  setGeminiApiKey: (key: string) => void;
  unlockAdmin: (passcode: string) => boolean;

  // Recipient & Family
  updateRecipient: (profile: Partial<CareRecipientProfile>) => void;
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;
  equalizeSplits: () => void;

  // Expenses & Settlements
  addExpense: (expense: Omit<MedicalExpense, 'id'>) => string;
  updateExpense: (id: string, updates: Partial<MedicalExpense>) => void;
  deleteExpense: (id: string) => void;
  recordSettlement: (settlement: Omit<PoolSettlement, 'id'>) => void;
  deleteSettlement: (id: string) => void;

  // Caregiver Shifts & Medications
  addCaregiverShift: (shift: Omit<CaregiverShift, 'id'>, autoCreateExpense: boolean) => void;
  deleteCaregiverShift: (id: string) => void;
  addMedication: (med: Omit<MedicationSchedule, 'id'>) => void;
  logDoseTaken: (medId: string, administeredBy: string) => void;
  refillMedication: (medId: string, addedPills: number) => void;
  deleteMedication: (id: string) => void;

  // Computed Pool Math
  getMemberBalances: () => MemberBalanceSummary[];
  getSuggestedSettlements: () => SuggestedSettlement[];

  // Sync / Backup
  exportSyncJson: () => string;
  importSyncJson: (rawJson: string) => { success: boolean; message: string };
  resetToDemoData: () => void;
  clearAllData: () => void;
}

const STORAGE_KEY = 'carecircle_family_hub_v1';

const DEFAULT_RECIPIENT: CareRecipientProfile = {
  name: 'Eleanor Vance-Chen',
  preferredName: 'Mom (Eleanor)',
  age: 78,
  dateOfBirth: '1948-04-12',
  bloodType: 'O+',
  primaryConditions: ['Post-Hip Arthroplasty Recovery', 'Hypertension (Stage 1)', 'Type 2 Diabetes'],
  allergies: ['Penicillin', 'Sulfa Drugs'],
  primaryPhysician: 'Dr. Marcus Lin, MD (Geriatrics & Internal Medicine)',
  clinicPhone: '(415) 890-4420',
  insuranceProvider: 'Medicare Part A/B + BlueShield Medigap Plan G',
  policyNumber: 'MCR-994-8210-A',
  groupNumber: 'BS-GRP-40291',
};

const DEFAULT_MEMBERS: FamilyMember[] = [
  {
    id: 'mem_sarah',
    name: 'Sarah Chen',
    relationship: 'Eldest Daughter (Medical POA)',
    avatarColor: '#0D9488',
    splitPercentage: 40,
    email: 'sarah.chen@example.com',
    isPrimaryCoordinator: true,
  },
  {
    id: 'mem_david',
    name: 'David Chen',
    relationship: 'Son (Financial Co-Coordinator)',
    avatarColor: '#2563EB',
    splitPercentage: 40,
    email: 'david.chen@example.com',
  },
  {
    id: 'mem_emily',
    name: 'Emily Chen-Park',
    relationship: 'Younger Daughter (Local Care Support)',
    avatarColor: '#7C3AED',
    splitPercentage: 20,
    email: 'emily.park@example.com',
  },
];

const DEFAULT_EXPENSES: MedicalExpense[] = [
  {
    id: 'exp_1',
    providerName: 'St. Jude Orthopedic & Rehabilitation Center',
    date: '2026-10-18',
    category: 'HOSPITAL_CLINIC',
    totalAmount: 1480.0,
    insuranceReimbursedAmount: 620.0,
    paidByMemberId: 'mem_sarah',
    insuranceClaimStatus: 'REIMBURSED',
    isTaxDeductible: true,
    aiConfidence: 99,
    notes: 'Post-op orthopedic follow-up, pelvic X-ray series, and wound dressing evaluation.',
    lineItems: [
      {
        id: 'li_101',
        description: 'Orthopedic Specialist Follow-Up Level 4',
        code: 'CPT-99214',
        quantity: 1,
        unitPrice: 420.0,
        total: 420.0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
      {
        id: 'li_102',
        description: 'Radiologic Exam, Hip Bilateral (2 Views)',
        code: 'CPT-73502',
        quantity: 1,
        unitPrice: 680.0,
        total: 680.0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
      {
        id: 'li_103',
        description: 'Post-Op Cryotherapy Hip Support Brace',
        code: 'HCPCS-L1686',
        quantity: 1,
        unitPrice: 380.0,
        total: 380.0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
    ],
  },
  {
    id: 'exp_2',
    providerName: 'Walgreens Specialty Pharmacy #4102',
    date: '2026-10-21',
    category: 'PHARMACY_MEDS',
    totalAmount: 246.5,
    insuranceReimbursedAmount: 0,
    paidByMemberId: 'mem_david',
    insuranceClaimStatus: 'SUBMITTED',
    isTaxDeductible: true,
    aiConfidence: 98,
    notes: 'Monthly blood thinner, blood pressure, and glucose test strips refill.',
    lineItems: [
      {
        id: 'li_201',
        description: 'Eliquis (Apixaban) 5mg Tablets (60-Day Supply)',
        code: 'NDC-0003-0894',
        quantity: 1,
        unitPrice: 165.0,
        total: 165.0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
      {
        id: 'li_202',
        description: 'Lisinopril 10mg Tablets (90 Count)',
        code: 'NDC-0093-1040',
        quantity: 1,
        unitPrice: 24.5,
        total: 24.5,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
      {
        id: 'li_203',
        description: 'Contour Next Blood Glucose Test Strips (100pk)',
        code: 'NDC-0193-7312',
        quantity: 1,
        unitPrice: 57.0,
        total: 57.0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
    ],
  },
  {
    id: 'exp_3',
    providerName: 'ComfortHands Senior Home Care Agency',
    date: '2026-10-24',
    category: 'IN_HOME_CAREGIVER',
    totalAmount: 560.0,
    insuranceReimbursedAmount: 0,
    paidByMemberId: 'mem_sarah',
    insuranceClaimStatus: 'NOT_SUBMITTED',
    isTaxDeductible: true,
    aiConfidence: 97,
    notes: '16 hours Certified Nursing Assistant (CNA) mobility & bathing assistance ($35/hr).',
    lineItems: [
      {
        id: 'li_301',
        description: 'In-Home CNA Personal Care & Mobility Assist (16 hrs @ $35/hr)',
        code: 'HCPCS-T1019',
        quantity: 16,
        unitPrice: 35.0,
        total: 560.0,
        isInsuranceEligible: false,
        isTaxDeductible: true,
      },
    ],
  },
  {
    id: 'exp_4',
    providerName: 'MedLine Home Medical Equipment',
    date: '2026-10-26',
    category: 'MEDICAL_SUPPLIES',
    totalAmount: 315.0,
    insuranceReimbursedAmount: 0,
    paidByMemberId: 'mem_emily',
    insuranceClaimStatus: 'SUBMITTED',
    isTaxDeductible: true,
    aiConfidence: 96,
    notes: 'Folding rollator walker with seat, shower transfer bench, and grab bars.',
    lineItems: [
      {
        id: 'li_401',
        description: 'Lightweight Folding Rollator Walker w/ Hand Brakes',
        code: 'HCPCS-E0143',
        quantity: 1,
        unitPrice: 195.0,
        total: 195.0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
      {
        id: 'li_402',
        description: 'Padded Tub Transfer Bench & Suction Grab Bar Kit',
        code: 'HCPCS-E0247',
        quantity: 1,
        unitPrice: 120.0,
        total: 120.0,
        isInsuranceEligible: false,
        isTaxDeductible: true,
      },
    ],
  },
];

const DEFAULT_SHIFTS: CaregiverShift[] = [
  {
    id: 'sh_1',
    caregiverName: 'Maria Santos, CNA',
    role: 'Certified Home Health Aide',
    date: '2026-10-24',
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
    hourlyRate: 35,
    totalPay: 280,
    paidByMemberId: 'mem_sarah',
    tasksCompleted: ['Morning Vitals & Glucose Check', 'Assisted Shower & Dressing', 'Hip PT Range-of-Motion Exercises', 'Low-Sodium Lunch Prep'],
    vitalsOrNotes: 'BP 126/78 mmHg, Fasting Glucose 108 mg/dL. Walked 150 ft with rollator without hip discomfort.',
    linkedExpenseId: 'exp_3',
  },
  {
    id: 'sh_2',
    caregiverName: 'Maria Santos, CNA',
    role: 'Certified Home Health Aide',
    date: '2026-10-27',
    startTime: '09:00',
    endTime: '15:00',
    hours: 6,
    hourlyRate: 35,
    totalPay: 210,
    paidByMemberId: 'mem_david',
    tasksCompleted: ['Medication Administration', 'Accompanied to Outpatient PT', 'Grocery & Pharmacy Pickup'],
    vitalsOrNotes: 'BP 124/76 mmHg. Completed 45-min outpatient physical therapy session with good balance.',
  },
];

const DEFAULT_MEDICATIONS: MedicationSchedule[] = [
  {
    id: 'med_1',
    name: 'Eliquis (Apixaban)',
    dosage: '5 mg (1 Tablet)',
    frequency: 'Twice Daily (With Water)',
    timeOfDay: ['08:00 AM', '08:00 PM'],
    purpose: 'Post-Surgery DVT / Blood Clot Prevention',
    prescribingDoctor: 'Dr. Marcus Lin, MD',
    pillsRemaining: 42,
    refillThreshold: 14,
    lastTakenAt: 'Today, 08:05 AM',
    lastAdministeredBy: 'Sarah Chen',
  },
  {
    id: 'med_2',
    name: 'Lisinopril',
    dosage: '10 mg (1 Tablet)',
    frequency: 'Once Daily (Morning)',
    timeOfDay: ['08:00 AM'],
    purpose: 'Blood Pressure Management',
    prescribingDoctor: 'Dr. Marcus Lin, MD',
    pillsRemaining: 68,
    refillThreshold: 15,
    lastTakenAt: 'Today, 08:05 AM',
    lastAdministeredBy: 'Sarah Chen',
  },
  {
    id: 'med_3',
    name: 'Metformin HCl ER',
    dosage: '500 mg (1 Tablet)',
    frequency: 'Twice Daily (With Meals)',
    timeOfDay: ['08:30 AM', '06:30 PM'],
    purpose: 'Blood Glucose Control',
    prescribingDoctor: 'Dr. Marcus Lin, MD',
    pillsRemaining: 9,
    refillThreshold: 14,
    lastTakenAt: 'Today, 08:30 AM',
    lastAdministeredBy: 'Maria Santos, CNA',
  },
];

const loadInitialState = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load CareCircle state:', e);
  }
  return null;
};

export const useCareStore = create<CareStoreState>((set, get) => {
  const saved = loadInitialState();

  const persist = () => {
    try {
      const s = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          themeMode: s.themeMode,
          currencySymbol: s.currencySymbol,
          geminiApiKey: s.geminiApiKey,
          isPro: s.isPro,
          isAdmin: s.isAdmin,
          trialStartDate: s.trialStartDate,
          recipient: s.recipient,
          members: s.members,
          expenses: s.expenses,
          settlements: s.settlements,
          shifts: s.shifts,
          medications: s.medications,
        })
      );
    } catch (e) {
      console.error('Failed to persist CareCircle state:', e);
    }
  };

  return {
    activeTab: 'hub',
    themeMode: saved?.themeMode || 'light',
    currencySymbol: saved?.currencySymbol || '$',
    geminiApiKey: saved?.geminiApiKey || '',
    isPro: saved?.isPro ?? true,
    isAdmin: saved?.isAdmin ?? false,
    trialStartDate: saved?.trialStartDate || new Date().toISOString(),

    recipient: saved?.recipient || DEFAULT_RECIPIENT,
    members: saved?.members || DEFAULT_MEMBERS,
    expenses: saved?.expenses || DEFAULT_EXPENSES,
    settlements: saved?.settlements || [],
    shifts: saved?.shifts || DEFAULT_SHIFTS,
    medications: saved?.medications || DEFAULT_MEDICATIONS,

    setActiveTab: (tab) => set({ activeTab: tab }),

    toggleTheme: () => {
      set((state) => ({
        themeMode: state.themeMode === 'light' ? 'dark' : 'light',
      }));
      persist();
    },

    setGeminiApiKey: (key) => {
      set({ geminiApiKey: key.trim() });
      persist();
    },

    unlockAdmin: (passcode) => {
      if (ADMIN_PASSCODES.includes(passcode.trim().toLowerCase())) {
        set({ isAdmin: true, isPro: true });
        persist();
        return true;
      }
      return false;
    },

    updateRecipient: (profile) => {
      set((state) => ({
        recipient: { ...state.recipient, ...profile },
      }));
      persist();
    },

    addFamilyMember: (member) => {
      const newMember: FamilyMember = {
        ...member,
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      set((state) => ({
        members: [...state.members, newMember],
      }));
      persist();
    },

    updateFamilyMember: (id, updates) => {
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      }));
      persist();
    },

    removeFamilyMember: (id) => {
      set((state) => {
        if (state.members.length <= 1) return state;
        const remaining = state.members.filter((m) => m.id !== id);
        return { members: remaining };
      });
      persist();
    },

    equalizeSplits: () => {
      set((state) => {
        const count = state.members.length;
        if (count === 0) return state;
        const base = Math.floor(100 / count);
        const remainder = 100 - base * count;
        return {
          members: state.members.map((m, idx) => ({
            ...m,
            splitPercentage: idx === 0 ? base + remainder : base,
          })),
        };
      });
      persist();
    },

    addExpense: (expense) => {
      const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newExpense: MedicalExpense = { ...expense, id };
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
      }));
      persist();
      return id;
    },

    updateExpense: (id, updates) => {
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
      persist();
    },

    deleteExpense: (id) => {
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
      persist();
    },

    recordSettlement: (settlement) => {
      const newSettlement: PoolSettlement = {
        ...settlement,
        id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      set((state) => ({
        settlements: [newSettlement, ...state.settlements],
      }));
      persist();
    },

    deleteSettlement: (id) => {
      set((state) => ({
        settlements: state.settlements.filter((s) => s.id !== id),
      }));
      persist();
    },

    addCaregiverShift: (shift, autoCreateExpense) => {
      const shiftId = `sh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      let linkedExpenseId: string | undefined;

      if (autoCreateExpense && shift.totalPay > 0) {
        linkedExpenseId = get().addExpense({
          providerName: `${shift.caregiverName} (${shift.role})`,
          date: shift.date,
          category: 'IN_HOME_CAREGIVER',
          totalAmount: shift.totalPay,
          insuranceReimbursedAmount: 0,
          paidByMemberId: shift.paidByMemberId,
          insuranceClaimStatus: 'NOT_SUBMITTED',
          isTaxDeductible: true,
          notes: `Shift ${shift.startTime}–${shift.endTime} (${shift.hours} hrs @ $${shift.hourlyRate}/hr). ${shift.vitalsOrNotes}`,
          lineItems: [
            {
              id: `li_${Date.now()}`,
              description: `In-Home Care Shift (${shift.hours} hrs @ $${shift.hourlyRate}/hr) — ${shift.tasksCompleted.join(', ')}`,
              code: 'HCPCS-T1019',
              quantity: shift.hours,
              unitPrice: shift.hourlyRate,
              total: shift.totalPay,
              isInsuranceEligible: false,
              isTaxDeductible: true,
            },
          ],
        });
      }

      const newShift: CaregiverShift = {
        ...shift,
        id: shiftId,
        linkedExpenseId,
      };

      set((state) => ({
        shifts: [newShift, ...state.shifts],
      }));
      persist();
    },

    deleteCaregiverShift: (id) => {
      set((state) => ({
        shifts: state.shifts.filter((sh) => sh.id !== id),
      }));
      persist();
    },

    addMedication: (med) => {
      const newMed: MedicationSchedule = {
        ...med,
        id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      set((state) => ({
        medications: [...state.medications, newMed],
      }));
      persist();
    },

    logDoseTaken: (medId, administeredBy) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      set((state) => ({
        medications: state.medications.map((m) =>
          m.id === medId
            ? {
                ...m,
                pillsRemaining: Math.max(0, m.pillsRemaining - 1),
                lastTakenAt: `Today, ${nowStr}`,
                lastAdministeredBy: administeredBy,
              }
            : m
        ),
      }));
      persist();
    },

    refillMedication: (medId, addedPills) => {
      set((state) => ({
        medications: state.medications.map((m) =>
          m.id === medId
            ? { ...m, pillsRemaining: m.pillsRemaining + Math.max(1, addedPills) }
            : m
        ),
      }));
      persist();
    },

    deleteMedication: (id) => {
      set((state) => ({
        medications: state.medications.filter((m) => m.id !== id),
      }));
      persist();
    },

    getMemberBalances: () => {
      const { members, expenses, settlements } = get();
      const totalSplitWeight = members.reduce((acc, m) => acc + (m.splitPercentage || 0), 0) || 100;

      // Net shared pool cost = sum of (totalAmount - insuranceReimbursedAmount)
      const totalNetPoolExpense = expenses.reduce(
        (sum, exp) => sum + Math.max(0, exp.totalAmount - (exp.insuranceReimbursedAmount || 0)),
        0
      );

      return members.map((member) => {
        const memberExpenses = expenses.filter((e) => e.paidByMemberId === member.id);
        const grossPaid = memberExpenses.reduce((s, e) => s + e.totalAmount, 0);
        const insuranceReimbursed = memberExpenses.reduce(
          (s, e) => s + (e.insuranceReimbursedAmount || 0),
          0
        );
        const netOutOfPocketPaid = Math.max(0, grossPaid - insuranceReimbursed);

        const shareRatio = (member.splitPercentage || 0) / totalSplitWeight;
        const assignedShare = totalNetPoolExpense * shareRatio;

        const settlementsPaidOut = settlements
          .filter((s) => s.fromMemberId === member.id)
          .reduce((acc, s) => acc + s.amount, 0);

        const settlementsReceived = settlements
          .filter((s) => s.toMemberId === member.id)
          .reduce((acc, s) => acc + s.amount, 0);

        // If a member paid $1,000 out of pocket, their assigned share is $600,
        // and they haven't received settlements yet -> netBalance = +$400 (pool owes them $400).
        // If they paid $100 out of pocket, assigned share is $400, and they sent $300 settlement ->
        // netBalance = (100 + 300 - 0) - 400 = $0.
        const netBalance =
          netOutOfPocketPaid + settlementsPaidOut - settlementsReceived - assignedShare;

        return {
          member,
          grossPaid,
          insuranceReimbursed,
          netOutOfPocketPaid,
          assignedShare,
          settlementsPaidOut,
          settlementsReceived,
          netBalance,
        };
      });
    },

    getSuggestedSettlements: () => {
      const balances = get().getMemberBalances();
      const creditors = balances
        .filter((b) => b.netBalance > 0.5)
        .map((b) => ({ id: b.member.id, name: b.member.name, amount: b.netBalance }))
        .sort((a, b) => b.amount - a.amount);

      const debtors = balances
        .filter((b) => b.netBalance < -0.5)
        .map((b) => ({ id: b.member.id, name: b.member.name, amount: Math.abs(b.netBalance) }))
        .sort((a, b) => b.amount - a.amount);

      const suggestions: SuggestedSettlement[] = [];
      let i = 0;
      let j = 0;

      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const transfer = Math.min(debtor.amount, creditor.amount);

        if (transfer > 0.5) {
          suggestions.push({
            fromMemberId: debtor.id,
            fromName: debtor.name,
            toMemberId: creditor.id,
            toName: creditor.name,
            amount: Math.round(transfer * 100) / 100,
          });
        }

        debtor.amount -= transfer;
        creditor.amount -= transfer;

        if (debtor.amount <= 0.5) i++;
        if (creditor.amount <= 0.5) j++;
      }

      return suggestions;
    },

    exportSyncJson: () => {
      const s = get();
      return JSON.stringify(
        {
          app: 'CareCircle',
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          recipient: s.recipient,
          members: s.members,
          expenses: s.expenses,
          settlements: s.settlements,
          shifts: s.shifts,
          medications: s.medications,
        },
        null,
        2
      );
    },

    importSyncJson: (rawJson) => {
      try {
        const parsed = JSON.parse(rawJson);
        if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.expenses)) {
          return {
            success: false,
            message: 'Invalid CareCircle sync file format.',
          };
        }
        set({
          recipient: parsed.recipient || get().recipient,
          members: parsed.members,
          expenses: parsed.expenses,
          settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
          shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
          medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        });
        persist();
        return {
          success: true,
          message: `Synced ${parsed.expenses.length} medical bills & ${parsed.members.length} family members!`,
        };
      } catch (e) {
        return {
          success: false,
          message: 'Could not parse JSON sync code. Please check the pasted text.',
        };
      }
    },

    resetToDemoData: () => {
      set({
        recipient: DEFAULT_RECIPIENT,
        members: DEFAULT_MEMBERS,
        expenses: DEFAULT_EXPENSES,
        settlements: [],
        shifts: DEFAULT_SHIFTS,
        medications: DEFAULT_MEDICATIONS,
      });
      persist();
    },

    clearAllData: () => {
      set({
        expenses: [],
        settlements: [],
        shifts: [],
        medications: [],
      });
      persist();
    },
  };
});


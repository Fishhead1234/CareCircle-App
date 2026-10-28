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
import { AppLanguage, TRANSLATIONS } from '../i18n/translations';

export type AppTab = 'hub' | 'carelog' | 'settings';

export const ADMIN_PASSCODES = ['admin888', 'invest2026'];

interface CareStoreState {
  activeTab: AppTab;
  language: AppLanguage;
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

  // Navigation, i18n & UI
  setActiveTab: (tab: AppTab) => void;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
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

const STORAGE_KEY = 'carecircle_family_hub_v2';

const DEMO_DATA_ZH_TW = {
  recipient: {
    name: '陳林淑芬 (媽媽)',
    preferredName: '媽媽 (陳林淑芬)',
    age: 78,
    dateOfBirth: '1948-04-12',
    bloodType: 'O+',
    primaryConditions: ['人工髖關節術後復健', '高血壓', '第二型糖尿病'],
    allergies: ['盤尼西林 (Penicillin)'],
    primaryPhysician: '台大醫院 老年醫學部 林志豪醫師',
    clinicPhone: '(02) 2312-3456',
    insuranceProvider: '全民健保 + 富邦實支實付醫療險',
    policyNumber: 'NHI-882910-TW',
    groupNumber: 'FUBON-MED-209',
  } as CareRecipientProfile,
  members: [
    {
      id: 'mem_sarah',
      name: '陳怡君 (大姐)',
      relationship: '大姐（主要醫療聯絡人）',
      avatarColor: '#0D9488',
      splitPercentage: 40,
      email: 'sarah.chen@example.com',
      isPrimaryCoordinator: true,
    },
    {
      id: 'mem_david',
      name: '陳建宏 (大哥)',
      relationship: '大哥（帳務分攤）',
      avatarColor: '#2563EB',
      splitPercentage: 40,
      email: 'david.chen@example.com',
    },
    {
      id: 'mem_emily',
      name: '陳雅婷 (小妹)',
      relationship: '小妹（陪同回診照顧）',
      avatarColor: '#7C3AED',
      splitPercentage: 20,
      email: 'emily.park@example.com',
    },
  ] as FamilyMember[],
  expenses: [
    {
      id: 'exp_1',
      providerName: '台大醫院 — 骨科回診與X光檢查',
      date: '2026-10-18',
      category: 'HOSPITAL_CLINIC',
      totalAmount: 1480,
      insuranceReimbursedAmount: 620,
      paidByMemberId: 'mem_sarah',
      insuranceClaimStatus: 'REIMBURSED',
      isTaxDeductible: true,
      aiConfidence: 99,
      notes: '髖關節術後回診、骨盆X光檢查與自費護具費。',
      lineItems: [
        {
          id: 'li_101',
          description: '骨科門診掛號與部分負擔',
          quantity: 1,
          unitPrice: 420,
          total: 420,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_102',
          description: '雙側髖關節數位 X 光檢查與耗材',
          quantity: 1,
          unitPrice: 680,
          total: 680,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_103',
          description: '術後醫療級髖關節固定護具',
          quantity: 1,
          unitPrice: 380,
          total: 380,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
    {
      id: 'exp_2',
      providerName: '躍獅連鎖藥局 — 慢性病處方與血糖試紙',
      date: '2026-10-21',
      category: 'PHARMACY_MEDS',
      totalAmount: 246.5,
      insuranceReimbursedAmount: 0,
      paidByMemberId: 'mem_david',
      insuranceClaimStatus: 'SUBMITTED',
      isTaxDeductible: true,
      aiConfidence: 98,
      notes: '抗凝血藥、降血壓藥與拜安進血糖試紙一盒。',
      lineItems: [
        {
          id: 'li_201',
          description: '艾必克凝 (Eliquis) 5mg 抗凝血處方藥',
          quantity: 1,
          unitPrice: 165,
          total: 165,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_202',
          description: '脈優 (降血壓藥) 30天份處方',
          quantity: 1,
          unitPrice: 24.5,
          total: 24.5,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_203',
          description: 'Contour 血糖機試紙 (100片裝)',
          quantity: 1,
          unitPrice: 57,
          total: 57,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
      ],
    },
    {
      id: 'exp_3',
      providerName: '安心居家長照機構 — 照顧服務員費',
      date: '2026-10-24',
      category: 'IN_HOME_CAREGIVER',
      totalAmount: 560,
      insuranceReimbursedAmount: 0,
      paidByMemberId: 'mem_sarah',
      insuranceClaimStatus: 'NOT_SUBMITTED',
      isTaxDeductible: true,
      aiConfidence: 97,
      notes: '16小時居家照服員：協助沐浴、助行器復健散步與備餐。',
      lineItems: [
        {
          id: 'li_301',
          description: '居家照顧服務費 (16小時 @ $35/時)',
          quantity: 16,
          unitPrice: 35,
          total: 560,
          isInsuranceEligible: false,
          isTaxDeductible: true,
        },
      ],
    },
    {
      id: 'exp_4',
      providerName: '杏一醫療用品 — 四輪助行車與浴室扶手',
      date: '2026-10-26',
      category: 'MEDICAL_SUPPLIES',
      totalAmount: 315,
      insuranceReimbursedAmount: 0,
      paidByMemberId: 'mem_emily',
      insuranceClaimStatus: 'SUBMITTED',
      isTaxDeductible: true,
      aiConfidence: 96,
      notes: '鋁合金折疊四輪助行車、洗澡椅與防滑扶手。',
      lineItems: [
        {
          id: 'li_401',
          description: '輕量化鋁合金帶座四輪助行車',
          quantity: 1,
          unitPrice: 195,
          total: 195,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_402',
          description: '浴室防滑洗澡椅與安全扶手組',
          quantity: 1,
          unitPrice: 120,
          total: 120,
          isInsuranceEligible: false,
          isTaxDeductible: true,
        },
      ],
    },
  ] as MedicalExpense[],
  shifts: [
    {
      id: 'sh_1',
      caregiverName: '林美玲 (居家照服員)',
      role: '居家照服員',
      date: '2026-10-24',
      startTime: '08:00',
      endTime: '16:00',
      hours: 8,
      hourlyRate: 35,
      totalPay: 280,
      paidByMemberId: 'mem_sarah',
      tasksCompleted: ['量測血壓與血糖', '協助沐浴更衣', '髖關節復健運動', '準備低鹽午餐'],
      vitalsOrNotes: '血壓 126/78 mmHg，空腹血糖 108 mg/dL。使用助行器步行穩定，精神良好。',
      linkedExpenseId: 'exp_3',
    },
    {
      id: 'sh_2',
      caregiverName: '林美玲 (居家照服員)',
      role: '居家照服員',
      date: '2026-10-27',
      startTime: '09:00',
      endTime: '15:00',
      hours: 6,
      hourlyRate: 35,
      totalPay: 210,
      paidByMemberId: 'mem_david',
      tasksCompleted: ['提醒按時服藥', '陪同至診所物理治療', '領取慢性病處方藥'],
      vitalsOrNotes: '血壓 124/76 mmHg。完成 45 分鐘復健步態訓練。',
    },
  ] as CaregiverShift[],
  medications: [
    {
      id: 'med_1',
      name: '艾必克凝 (Eliquis 抗凝血藥)',
      dosage: '5 mg (每次 1 顆)',
      frequency: '早晚飯後各一次',
      timeOfDay: ['08:00', '20:00'],
      purpose: '預防術後血栓',
      prescribingDoctor: '林志豪醫師',
      pillsRemaining: 42,
      refillThreshold: 14,
      lastTakenAt: '今日 08:05',
      lastAdministeredBy: '陳怡君 (大姐)',
    },
    {
      id: 'med_2',
      name: '脈優 (Norvasc 降血壓藥)',
      dosage: '5 mg (每次 1 顆)',
      frequency: '每日早上一次',
      timeOfDay: ['08:00'],
      purpose: '控制血壓穩定',
      prescribingDoctor: '林志豪醫師',
      pillsRemaining: 68,
      refillThreshold: 15,
      lastTakenAt: '今日 08:05',
      lastAdministeredBy: '陳怡君 (大姐)',
    },
    {
      id: 'med_3',
      name: '庫魯化 (Metformin 降血糖藥)',
      dosage: '500 mg (每次 1 顆)',
      frequency: '早晚餐隨餐服用',
      timeOfDay: ['08:30', '18:30'],
      purpose: '控制血糖',
      prescribingDoctor: '林志豪醫師',
      pillsRemaining: 9,
      refillThreshold: 14,
      lastTakenAt: '今日 08:30',
      lastAdministeredBy: '林美玲 (看護)',
    },
  ] as MedicationSchedule[],
};

const DEMO_DATA_EN = {
  recipient: {
    name: 'Eleanor Vance-Chen (Mom)',
    preferredName: 'Mom (Eleanor)',
    age: 78,
    dateOfBirth: '1948-04-12',
    bloodType: 'O+',
    primaryConditions: ['Post-Hip Surgery Recovery', 'Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    primaryPhysician: 'Dr. Marcus Lin, MD (UCSF Geriatrics)',
    clinicPhone: '(415) 890-4420',
    insuranceProvider: 'Medicare Part A/B + BlueShield Medigap',
    policyNumber: 'MCR-994-8210-A',
    groupNumber: 'BS-GRP-40291',
  } as CareRecipientProfile,
  members: [
    {
      id: 'mem_sarah',
      name: 'Sarah Chen',
      relationship: 'Eldest Sister (Coordinator)',
      avatarColor: '#0D9488',
      splitPercentage: 40,
      email: 'sarah.chen@example.com',
      isPrimaryCoordinator: true,
    },
    {
      id: 'mem_david',
      name: 'David Chen',
      relationship: 'Brother',
      avatarColor: '#2563EB',
      splitPercentage: 40,
      email: 'david.chen@example.com',
    },
    {
      id: 'mem_emily',
      name: 'Emily Chen',
      relationship: 'Younger Sister',
      avatarColor: '#7C3AED',
      splitPercentage: 20,
      email: 'emily.park@example.com',
    },
  ] as FamilyMember[],
  expenses: [
    {
      id: 'exp_1',
      providerName: 'St. Jude Orthopedic & Rehab Clinic',
      date: '2026-10-18',
      category: 'HOSPITAL_CLINIC',
      totalAmount: 1480.0,
      insuranceReimbursedAmount: 620.0,
      paidByMemberId: 'mem_sarah',
      insuranceClaimStatus: 'REIMBURSED',
      isTaxDeductible: true,
      aiConfidence: 99,
      notes: 'Post-op hip follow-up, X-ray, and support brace.',
      lineItems: [
        {
          id: 'li_101',
          description: 'Orthopedic Specialist Visit',
          quantity: 1,
          unitPrice: 420.0,
          total: 420.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_102',
          description: 'Bilateral Hip X-Ray Exam',
          quantity: 1,
          unitPrice: 680.0,
          total: 680.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_103',
          description: 'Post-Op Hip Support Brace',
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
      providerName: 'Walgreens Pharmacy',
      date: '2026-10-21',
      category: 'PHARMACY_MEDS',
      totalAmount: 246.5,
      insuranceReimbursedAmount: 0,
      paidByMemberId: 'mem_david',
      insuranceClaimStatus: 'SUBMITTED',
      isTaxDeductible: true,
      aiConfidence: 98,
      notes: 'Monthly prescriptions & glucose test strips.',
      lineItems: [
        {
          id: 'li_201',
          description: 'Eliquis 5mg Tablets (60-Day)',
          quantity: 1,
          unitPrice: 165.0,
          total: 165.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_202',
          description: 'Lisinopril 10mg Tablets',
          quantity: 1,
          unitPrice: 24.5,
          total: 24.5,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_203',
          description: 'Contour Blood Glucose Test Strips',
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
      providerName: 'ComfortHands Home Caregiver',
      date: '2026-10-24',
      category: 'IN_HOME_CAREGIVER',
      totalAmount: 560.0,
      insuranceReimbursedAmount: 0,
      paidByMemberId: 'mem_sarah',
      insuranceClaimStatus: 'NOT_SUBMITTED',
      isTaxDeductible: true,
      aiConfidence: 97,
      notes: '16 hours home care assistance ($35/hr).',
      lineItems: [
        {
          id: 'li_301',
          description: 'In-Home Caregiver Shift (16 hrs @ $35/hr)',
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
      providerName: 'MedLine Medical Supplies',
      date: '2026-10-26',
      category: 'MEDICAL_SUPPLIES',
      totalAmount: 315.0,
      insuranceReimbursedAmount: 0,
      paidByMemberId: 'mem_emily',
      insuranceClaimStatus: 'SUBMITTED',
      isTaxDeductible: true,
      aiConfidence: 96,
      notes: 'Folding walker and shower transfer bench.',
      lineItems: [
        {
          id: 'li_401',
          description: 'Lightweight Folding Rollator Walker',
          quantity: 1,
          unitPrice: 195.0,
          total: 195.0,
          isInsuranceEligible: true,
          isTaxDeductible: true,
        },
        {
          id: 'li_402',
          description: 'Shower Bench & Safety Grab Bars',
          quantity: 1,
          unitPrice: 120.0,
          total: 120.0,
          isInsuranceEligible: false,
          isTaxDeductible: true,
        },
      ],
    },
  ] as MedicalExpense[],
  shifts: [
    {
      id: 'sh_1',
      caregiverName: 'Maria Santos (Caregiver)',
      role: 'Home Care Aide',
      date: '2026-10-24',
      startTime: '08:00',
      endTime: '16:00',
      hours: 8,
      hourlyRate: 35,
      totalPay: 280,
      paidByMemberId: 'mem_sarah',
      tasksCompleted: ['Morning Vitals', 'Shower Assist', 'Walking Exercise', 'Lunch Prep'],
      vitalsOrNotes: 'BP 126/78 mmHg, Glucose 108 mg/dL. Walked well with walker.',
      linkedExpenseId: 'exp_3',
    },
    {
      id: 'sh_2',
      caregiverName: 'Maria Santos (Caregiver)',
      role: 'Home Care Aide',
      date: '2026-10-27',
      startTime: '09:00',
      endTime: '15:00',
      hours: 6,
      hourlyRate: 35,
      totalPay: 210,
      paidByMemberId: 'mem_david',
      tasksCompleted: ['Meds Reminder', 'Outpatient PT Visit', 'Pharmacy Pickup'],
      vitalsOrNotes: 'BP 124/76 mmHg. Good energy after PT session.',
    },
  ] as CaregiverShift[],
  medications: [
    {
      id: 'med_1',
      name: 'Eliquis (Blood Thinner)',
      dosage: '5 mg (1 Pill)',
      frequency: 'Morning & Night after meals',
      timeOfDay: ['08:00', '20:00'],
      purpose: 'Post-Surgery Clot Prevention',
      prescribingDoctor: 'Dr. Marcus Lin',
      pillsRemaining: 42,
      refillThreshold: 14,
      lastTakenAt: 'Today 08:05',
      lastAdministeredBy: 'Sarah Chen',
    },
    {
      id: 'med_2',
      name: 'Lisinopril (Blood Pressure)',
      dosage: '10 mg (1 Pill)',
      frequency: 'Every Morning',
      timeOfDay: ['08:00'],
      purpose: 'Blood Pressure Control',
      prescribingDoctor: 'Dr. Marcus Lin',
      pillsRemaining: 68,
      refillThreshold: 15,
      lastTakenAt: 'Today 08:05',
      lastAdministeredBy: 'Sarah Chen',
    },
    {
      id: 'med_3',
      name: 'Metformin (Blood Sugar)',
      dosage: '500 mg (1 Pill)',
      frequency: 'Twice Daily with meals',
      timeOfDay: ['08:30', '18:30'],
      purpose: 'Glucose Control',
      prescribingDoctor: 'Dr. Marcus Lin',
      pillsRemaining: 9,
      refillThreshold: 14,
      lastTakenAt: 'Today 08:30',
      lastAdministeredBy: 'Maria Santos',
    },
  ] as MedicationSchedule[],
};

const getDemoDataset = (lang: AppLanguage) => {
  if (lang === 'en') return DEMO_DATA_EN;
  return DEMO_DATA_ZH_TW;
};

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
  const initialLang: AppLanguage = saved?.language || 'zh-TW';
  const initialDemo = getDemoDataset(initialLang);

  const persist = () => {
    try {
      const s = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          language: s.language,
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
    language: initialLang,
    themeMode: saved?.themeMode || 'light',
    currencySymbol: saved?.currencySymbol || '$',
    geminiApiKey: saved?.geminiApiKey || '',
    isPro: saved?.isPro ?? true,
    isAdmin: saved?.isAdmin ?? false,
    trialStartDate: saved?.trialStartDate || new Date().toISOString(),

    recipient: saved?.recipient || initialDemo.recipient,
    members: saved?.members || initialDemo.members,
    expenses: saved?.expenses || initialDemo.expenses,
    settlements: saved?.settlements || [],
    shifts: saved?.shifts || initialDemo.shifts,
    medications: saved?.medications || initialDemo.medications,

    setActiveTab: (tab) => set({ activeTab: tab }),

    setLanguage: (lang) => {
      const current = get();
      // If using default demo recipient, also switch sample data language so the user sees localized bills
      const isStillDemoRecipient =
        current.recipient.name === DEMO_DATA_ZH_TW.recipient.name ||
        current.recipient.name === DEMO_DATA_EN.recipient.name ||
        current.recipient.name === 'Eleanor Vance-Chen';

      if (isStillDemoRecipient && current.expenses.length <= 5) {
        const nextDemo = getDemoDataset(lang);
        set({
          language: lang,
          recipient: nextDemo.recipient,
          members: nextDemo.members,
          expenses: nextDemo.expenses,
          shifts: nextDemo.shifts,
          medications: nextDemo.medications,
        });
      } else {
        set({ language: lang });
      }
      persist();
    },

    t: (key, fallback) => {
      const lang = get().language || 'zh-TW';
      return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || fallback || key;
    },

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
          providerName: shift.caregiverName,
          date: shift.date,
          category: 'IN_HOME_CAREGIVER',
          totalAmount: shift.totalPay,
          insuranceReimbursedAmount: 0,
          paidByMemberId: shift.paidByMemberId,
          insuranceClaimStatus: 'NOT_SUBMITTED',
          isTaxDeductible: true,
          notes: `${shift.hours}h @ $${shift.hourlyRate}/hr. ${shift.vitalsOrNotes}`,
          lineItems: [
            {
              id: `li_${Date.now()}`,
              description: `${shift.caregiverName} (${shift.hours}h @ $${shift.hourlyRate}/hr)`,
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
                lastTakenAt: `${nowStr}`,
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
          version: '1.1.0',
          language: s.language,
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
            message: 'Invalid CareCircle sync code.',
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
          message: `OK (${parsed.expenses.length})`,
        };
      } catch (e) {
        return {
          success: false,
          message: 'Error parsing sync code.',
        };
      }
    },

    resetToDemoData: () => {
      const demo = getDemoDataset(get().language);
      set({
        recipient: demo.recipient,
        members: demo.members,
        expenses: demo.expenses,
        settlements: [],
        shifts: demo.shifts,
        medications: demo.medications,
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

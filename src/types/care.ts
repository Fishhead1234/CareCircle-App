export type ExpenseCategory =
  | 'HOSPITAL_CLINIC'
  | 'PHARMACY_MEDS'
  | 'IN_HOME_CAREGIVER'
  | 'MEDICAL_SUPPLIES'
  | 'THERAPY_REHAB'
  | 'LAB_DIAGNOSTICS';

export type InsuranceClaimStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'REIMBURSED'
  | 'DENIED';

export interface ReceiptLineItem {
  id: string;
  description: string;
  code?: string; // CPT, HCPCS, or Rx NDC code
  quantity: number;
  unitPrice: number;
  total: number;
  isInsuranceEligible: boolean;
  isTaxDeductible: boolean;
}

export interface MedicalExpense {
  id: string;
  providerName: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  totalAmount: number;
  insuranceReimbursedAmount: number;
  paidByMemberId: string;
  lineItems: ReceiptLineItem[];
  insuranceClaimStatus: InsuranceClaimStatus;
  isTaxDeductible: boolean;
  notes?: string;
  receiptImageDataUrl?: string;
  aiConfidence?: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string; // e.g., "Eldest Daughter (Primary POA)", "Son", "Younger Sister"
  avatarColor: string;
  splitPercentage: number; // e.g., 40, 35, 25 (sums to 100)
  email?: string;
  isPrimaryCoordinator?: boolean;
}

export interface PoolSettlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  method: string; // e.g. "Zelle", "Venmo", "Bank Transfer", "Family Care Account"
  note?: string;
}

export interface CaregiverShift {
  id: string;
  caregiverName: string;
  role: string; // e.g., "Home Health Aide (CNA)", "Visiting Physical Therapist", "Night Shift Companion"
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  hourlyRate: number;
  totalPay: number;
  paidByMemberId: string;
  tasksCompleted: string[];
  vitalsOrNotes: string;
  linkedExpenseId?: string;
}

export interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  purpose: string;
  prescribingDoctor: string;
  pillsRemaining: number;
  refillThreshold: number;
  lastTakenAt?: string;
  lastAdministeredBy?: string;
}

export interface CareRecipientProfile {
  name: string;
  preferredName: string;
  age: number;
  dateOfBirth: string;
  bloodType: string;
  primaryConditions: string[];
  allergies: string[];
  primaryPhysician: string;
  clinicPhone: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
}

export interface MemberBalanceSummary {
  member: FamilyMember;
  grossPaid: number;
  insuranceReimbursed: number;
  netOutOfPocketPaid: number;
  assignedShare: number;
  settlementsPaidOut: number;
  settlementsReceived: number;
  /** Positive = Family pool owes this member. Negative = This member owes the family pool. */
  netBalance: number;
}

export interface SuggestedSettlement {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; shortLabel: string; badgeBg: string; badgeText: string; taxNote: string }
> = {
  HOSPITAL_CLINIC: {
    label: 'Hospital & Specialist Visits',
    shortLabel: 'Hospital / Clinic',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    badgeText: 'text-blue-600 dark:text-blue-400',
    taxNote: 'IRS Pub 502 Eligible Medical Care',
  },
  PHARMACY_MEDS: {
    label: 'Pharmacy & Prescriptions',
    shortLabel: 'Pharmacy / Rx',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    taxNote: 'Prescription Rx & Insulin Deductible',
  },
  IN_HOME_CAREGIVER: {
    label: 'In-Home Caregiver & Nursing',
    shortLabel: 'Caregiver Hours',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-400',
    taxNote: 'Qualified Long-Term Care Services',
  },
  MEDICAL_SUPPLIES: {
    label: 'Medical Equipment & Supplies',
    shortLabel: 'DME & Supplies',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
    taxNote: 'Durable Medical Equipment & Diagnostic Devices',
  },
  THERAPY_REHAB: {
    label: 'Physical & Occupational Therapy',
    shortLabel: 'Therapy / Rehab',
    badgeBg: 'bg-teal-500/15 border-teal-500/30',
    badgeText: 'text-teal-600 dark:text-teal-400',
    taxNote: 'Rehabilitative Therapy Eligible',
  },
  LAB_DIAGNOSTICS: {
    label: 'Lab Work & Diagnostic Imaging',
    shortLabel: 'Labs & Imaging',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    taxNote: 'Diagnostic X-Ray, MRI & Blood Panels',
  },
};


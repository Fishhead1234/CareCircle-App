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
  code?: string;
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
  /** Either a member.id (paid out-of-pocket by that member) or 'SHARED_POOL' (paid from the Family Fund Pool) */
  paidByMemberId: string;
  lineItems: ReceiptLineItem[];
  insuranceClaimStatus: InsuranceClaimStatus;
  isTaxDeductible: boolean;
  notes?: string;
  receiptImageDataUrl?: string;
  aiConfidence?: number;
}

export interface FundContribution {
  id: string;
  memberId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
  splitPercentage: number; // e.g., 40, 40, 20 (sums to 100)
  email?: string;
  isPrimaryCoordinator?: boolean;
}

export interface PoolSettlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
}

export type CaregiverRateType = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface CaregiverShift {
  id: string;
  caregiverName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  rateType?: CaregiverRateType;
  /** Number of hours, days, weeks, or months depending on rateType */
  hours: number;
  /** Rate per hour, day, week, or month depending on rateType */
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
  /** Cash deposited directly into the Family Fund Pool */
  fundDeposited: number;
  /** Net bills paid directly out of this member's pocket (when paidByMemberId === member.id) */
  directBillsPaid: number;
  /** Total put in by this member = fundDeposited + directBillsPaid */
  totalContributed: number;
  /** Actual % of total family contributions paid by this member (0 - 100) */
  actualContributionPercent: number;
  grossPaid: number;
  insuranceReimbursed: number;
  netOutOfPocketPaid: number;
  /** Agreed Split % * Total Net Out-of-Pocket Medical Expenses */
  assignedShare: number;
  settlementsPaidOut: number;
  settlementsReceived: number;
  /**
   * Positive = Excess credit in pool (member has put in more than their required share of expenses).
   * Negative = Shortfall (actual amount this member still needs to put in / pay).
   */
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
    taxNote: 'Medical Care',
  },
  PHARMACY_MEDS: {
    label: 'Pharmacy & Prescriptions',
    shortLabel: 'Pharmacy / Rx',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    taxNote: 'Prescription Rx',
  },
  IN_HOME_CAREGIVER: {
    label: 'In-Home Caregiver & Nursing',
    shortLabel: 'Caregiver Hours',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-400',
    taxNote: 'Long-Term Care Services',
  },
  MEDICAL_SUPPLIES: {
    label: 'Medical Equipment & Supplies',
    shortLabel: 'Medical Supplies',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
    taxNote: 'Medical Equipment',
  },
  THERAPY_REHAB: {
    label: 'Physical & Occupational Therapy',
    shortLabel: 'Therapy / Rehab',
    badgeBg: 'bg-teal-500/15 border-teal-500/30',
    badgeText: 'text-teal-600 dark:text-teal-400',
    taxNote: 'Rehabilitative Therapy',
  },
  LAB_DIAGNOSTICS: {
    label: 'Lab Work & Diagnostic Imaging',
    shortLabel: 'Labs & Imaging',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    taxNote: 'Diagnostic Labs',
  },
};

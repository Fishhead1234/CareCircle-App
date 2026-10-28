import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  FileText,
  ShieldCheck,
  UserCheck,
  Receipt,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import {
  ExpenseCategory,
  InsuranceClaimStatus,
  ReceiptLineItem,
  EXPENSE_CATEGORY_META,
} from '../../types/care';
import {
  aiReceiptService,
  SAMPLE_RECEIPT_PRESETS,
} from '../../services/aiReceiptService';

interface Props {
  onClose: () => void;
}

export const ReceiptScannerModal: React.FC<Props> = ({ onClose }) => {
  const { members, addExpense, geminiApiKey, currencySymbol } = useCareStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanBanner, setScanBanner] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | undefined>(undefined);
  const [aiConfidence, setAiConfidence] = useState<number | undefined>(undefined);

  const [providerName, setProviderName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('HOSPITAL_CLINIC');
  const [paidByMemberId, setPaidByMemberId] = useState(members[0]?.id || 'mem_sarah');
  const [insuranceClaimStatus, setInsuranceClaimStatus] =
    useState<InsuranceClaimStatus>('NOT_SUBMITTED');
  const [insuranceReimbursedAmount, setInsuranceReimbursedAmount] = useState('0');
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([
    {
      id: 'li_init_1',
      description: '',
      code: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isInsuranceEligible: true,
      isTaxDeductible: true,
    },
  ]);

  const applyExtractedResult = (res: typeof SAMPLE_RECEIPT_PRESETS[0]['result']) => {
    setProviderName(res.providerName);
    setDate(res.date);
    setCategory(res.category);
    setIsTaxDeductible(res.isTaxDeductible);
    setAiConfidence(res.aiConfidence);
    setNotes(res.notes);
    setLineItems(res.lineItems);
    setScanBanner(
      `✓ AI Extracted ${res.lineItems.length} line item(s) (${res.aiConfidence}% confidence)`
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanBanner('Analyzing medical receipt & extracting CPT/Rx line items...');

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setReceiptPreviewUrl(dataUrl);
      const extracted = await aiReceiptService.analyzeReceiptImage(
        dataUrl,
        file.name,
        geminiApiKey
      );
      setIsScanning(false);
      applyExtractedResult(extracted);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (presetId: string) => {
    const preset = SAMPLE_RECEIPT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setIsScanning(true);
    setScanBanner(`Scanning "${preset.title}" with AI Receipt Vision...`);
    await new Promise((r) => setTimeout(r, 450));
    setIsScanning(false);
    applyExtractedResult(preset.result);
  };

  const computedTotal = lineItems.reduce((sum, li) => sum + (Number(li.total) || 0), 0);

  const handleUpdateLineItem = (
    id: string,
    field: keyof ReceiptLineItem,
    value: string | number | boolean
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = Number(field === 'quantity' ? value : updated.quantity) || 1;
          const p = Number(field === 'unitPrice' ? value : updated.unitPrice) || 0;
          updated.total = Math.round(q * p * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        description: '',
        code: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim() || computedTotal <= 0) return;

    addExpense({
      providerName: providerName.trim(),
      date,
      category,
      totalAmount: computedTotal,
      insuranceReimbursedAmount: Math.max(0, Number(insuranceReimbursedAmount) || 0),
      paidByMemberId,
      insuranceClaimStatus,
      isTaxDeductible,
      notes: notes.trim() || undefined,
      receiptImageDataUrl: receiptPreviewUrl,
      aiConfidence,
      lineItems: lineItems.filter((li) => li.description.trim().length > 0 || li.total > 0),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                AI Vision Receipt &amp; Bill Scanner
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Snap Medical Bill or Pharmacy Receipt
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. Snap Photo OR Try 1-Tap AI Sample Receipts */}
          <div className="p-3.5 rounded-2xl bg-teal-500/5 dark:bg-teal-950/25 border border-teal-500/25 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <span>Step 1: Snap Receipt Photo or Test AI Sample</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Extracts CPT/Rx codes, line items, totals, and IRS tax tags automatically.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="shrink-0 min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Snap / Upload</span>
              </button>
            </div>

            {/* 1-Tap Sample Receipt Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Or tap a sample medical bill to test instant AI extraction:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_RECEIPT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className="p-2 rounded-xl border text-left transition cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        {preset.badge}
                      </span>
                      <FileText className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {preset.title}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {preset.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isScanning && (
              <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{scanBanner}</span>
              </div>
            )}

            {!isScanning && scanBanner && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{scanBanner}</span>
              </div>
            )}
          </div>

          {/* 2. Provider, Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Hospital, Clinic, Pharmacy, or Care Agency *
              </label>
              <input
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g. UCSF Medical Center, Walgreens #4102, Visiting Angels"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Date of Service / Receipt
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-xs font-mono bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl px-3 py-2.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                {Object.entries(EXPENSE_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Who Paid? (Tag Family Member) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>Who Paid This Bill? (Credits Their Family Pool Balance)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {members.map((m) => {
                const selected = paidByMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidByMemberId(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selected
                        ? 'bg-teal-500/15 border-teal-500 text-slate-900 dark:text-white ring-1 ring-teal-500/40'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.avatarColor }}
                      />
                      <span className="text-xs font-bold truncate">{m.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                      Pool Split: {m.splitPercentage}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Extracted Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-teal-500" />
                <span>Itemized Line Items &amp; CPT/Rx Codes</span>
              </label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, 'description', e.target.value)
                      }
                      placeholder="Item / Procedure (e.g. Eliquis 5mg or Hip X-Ray)"
                      className="flex-1 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={item.code || ''}
                      onChange={(e) => handleUpdateLineItem(item.id, 'code', e.target.value)}
                      placeholder="CPT / NDC"
                      className="w-24 rounded-lg px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Qty / Hrs</span>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))
                        }
                        className="w-full rounded-lg px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Unit Price ({currencySymbol})</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice || ''}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, 'unitPrice', Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Line Total</span>
                      <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                        {currencySymbol}
                        {Number(item.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Insurance & IRS Tax Deductibility */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Insurance Claim Status
                </label>
                <select
                  value={insuranceClaimStatus}
                  onChange={(e) =>
                    setInsuranceClaimStatus(e.target.value as InsuranceClaimStatus)
                  }
                  className="w-full rounded-xl px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <option value="NOT_SUBMITTED">Not Submitted Yet</option>
                  <option value="SUBMITTED">Submitted to Insurance</option>
                  <option value="REIMBURSED">Reimbursed (Partial/Full)</option>
                  <option value="DENIED">Out-of-Network / Denied</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Insurance Paid Back ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={insuranceReimbursedAmount}
                  onChange={(e) => setInsuranceReimbursedAmount(e.target.value)}
                  className="w-full rounded-xl px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <label className="flex items-center justify-between pt-1 cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>IRS Pub 502 Tax-Deductible / HSA-Eligible Medical Expense</span>
              </span>
              <input
                type="checkbox"
                checked={isTaxDeductible}
                onChange={(e) => setIsTaxDeductible(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded"
              />
            </label>
          </div>

          {/* Footer Submit Bar */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Bill Amount
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {currencySymbol}
                {computedTotal.toFixed(2)}
              </span>
            </div>
            <button
              type="submit"
              disabled={!providerName.trim() || computedTotal <= 0}
              className="flex-1 min-h-[48px] py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Save to Family Pool Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


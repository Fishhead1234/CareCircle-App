import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import {
  ExpenseCategory,
  ReceiptLineItem,
  EXPENSE_CATEGORY_META,
} from '../../types/care';
import {
  aiReceiptService,
  getSampleReceiptPresets,
  SampleReceiptPreset,
} from '../../services/aiReceiptService';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose }) => {
  const { members, geminiApiKey, currencySymbol, addExpense, language, t } = useCareStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessBanner, setScanSuccessBanner] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [providerName, setProviderName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('HOSPITAL_CLINIC');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [insuranceReimbursedAmount, setInsuranceReimbursedAmount] = useState<string>('0');
  const [paidByMemberId, setPaidByMemberId] = useState<string>(members[0]?.id || '');
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([]);

  if (!isOpen) return null;

  const samplePresets = getSampleReceiptPresets(language);

  const applyExtractedResult = (res: SampleReceiptPreset['result']) => {
    setProviderName(res.providerName);
    setDate(res.date);
    setCategory(res.category);
    setTotalAmount(res.totalAmount.toFixed(2));
    setIsTaxDeductible(res.isTaxDeductible);
    setLineItems(res.lineItems);
    setScanSuccessBanner(t('scanner_extracted'));
  };

  const handleSamplePreset = async (preset: SampleReceiptPreset) => {
    setIsScanning(true);
    setScanSuccessBanner(null);
    await new Promise((r) => setTimeout(r, 450));
    applyExtractedResult(preset.result);
    setIsScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanSuccessBanner(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setReceiptPreview(dataUrl);
      const extracted = await aiReceiptService.analyzeReceiptImage(
        dataUrl,
        file.name,
        geminiApiKey,
        language
      );
      applyExtractedResult(extracted);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBlankLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li_${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        isInsuranceEligible: true,
        isTaxDeductible: true,
      },
    ]);
  };

  const handleUpdateLineItem = (id: string, patch: Partial<ReceiptLineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if (patch.total !== undefined) {
          updated.unitPrice = Number(patch.total) || 0;
        }
        return updated;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTotal =
      parseFloat(totalAmount) ||
      lineItems.reduce((sum, li) => sum + (Number(li.total) || 0), 0);
    if (!providerName.trim() || numericTotal <= 0) return;

    addExpense({
      providerName: providerName.trim(),
      date,
      category,
      totalAmount: numericTotal,
      insuranceReimbursedAmount: parseFloat(insuranceReimbursedAmount) || 0,
      paidByMemberId: paidByMemberId || members[0]?.id || 'mem_sarah',
      insuranceClaimStatus:
        parseFloat(insuranceReimbursedAmount) > 0 ? 'REIMBURSED' : 'NOT_SUBMITTED',
      isTaxDeductible,
      receiptImageDataUrl: receiptPreview || undefined,
      lineItems: lineItems.filter((li) => li.description.trim() !== ''),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Camera className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('scanner_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
          {/* 1. Snap or Sample Receipt Box */}
          <div className="rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-500/5 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {t('scanner_step1')}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>{t('scanner_camera_btn')}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {t('scanner_sample_hint')}
            </div>

            {/* 4 Quick Sample Receipts */}
            <div className="grid grid-cols-2 gap-2">
              {samplePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSamplePreset(preset)}
                  className="text-left p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                    {preset.badge}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {preset.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{preset.subtitle}</div>
                </button>
              ))}
            </div>

            {isScanning && (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-2 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('scanner_scanning')}</span>
              </div>
            )}

            {scanSuccessBanner && !isScanning && (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{scanSuccessBanner}</span>
              </div>
            )}
          </div>

          {/* 2. Who Paid? (1-Tap Family Member Selector) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('field_who_paid')}
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
                        ? 'border-teal-600 bg-teal-500/10 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.slice(0, 1)}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Essential Fields: Provider, Category, Total */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('field_provider')}
              </label>
              <input
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder={t('field_provider_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('field_category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`cat_${cat}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('field_date')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('field_total')} ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('field_ins_refund')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={insuranceReimbursedAmount}
                  onChange={(e) => setInsuranceReimbursedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 4. Optional Simple Items List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {t('field_items_optional')}
              </span>
              <button
                type="button"
                onClick={handleAddBlankLineItem}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer"
              >
                {t('add_item_btn')}
              </button>
            </div>

            {lineItems.length > 0 && (
              <div className="space-y-2">
                {lineItems.map((li) => (
                  <div key={li.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={li.description}
                      onChange={(e) => handleUpdateLineItem(li.id, { description: e.target.value })}
                      placeholder="項目說明 / Item"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={li.total || ''}
                      onChange={(e) =>
                        handleUpdateLineItem(li.id, { total: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="$0"
                      className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(li.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tax / Insurance checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isTaxDeductible}
              onChange={(e) => setIsTaxDeductible(e.target.checked)}
              className="rounded text-teal-600"
            />
            <span>{t('field_tax_eligible')}</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('cancel_btn')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md cursor-pointer"
            >
              {t('save_bill_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

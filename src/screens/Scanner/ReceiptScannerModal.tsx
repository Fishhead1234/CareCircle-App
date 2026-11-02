import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Key,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useCareStore } from '../../store/careStore';
import {
  ExpenseCategory,
  ReceiptLineItem,
  EXPENSE_CATEGORY_META,
} from '../../types/care';
import { aiReceiptService } from '../../services/aiReceiptService';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose }) => {
  const { members, geminiApiKey, setGeminiApiKey, currencySymbol, addExpense, language, t } =
    useCareStore();

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressPercent, setScanProgressPercent] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanSuccessBanner, setScanSuccessBanner] = useState<string | null>(null);
  const [scanWarningBanner, setScanWarningBanner] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Quick API Key Popover
  const [showKeyPopover, setShowKeyPopover] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiApiKey || '');

  const [providerName, setProviderName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('HOSPITAL_CLINIC');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [insuranceReimbursedAmount, setInsuranceReimbursedAmount] = useState<string>('0');
  const [paidByMemberId, setPaidByMemberId] = useState<string>(members[0]?.id || 'mem_sarah');
  const [paidFrom, setPaidFrom] = useState<'FUND_POOL' | 'OUT_OF_POCKET'>('FUND_POOL');
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [lineItems, setLineItems] = useState<ReceiptLineItem[]>([]);

  if (!isOpen) return null;

  const isZh = language !== 'en';
  const hasValidGeminiKey = geminiApiKey.length > 15;

  const applyExtractedResult = (res: {
    providerName: string;
    date: string;
    category: ExpenseCategory;
    totalAmount: number;
    isTaxDeductible: boolean;
    lineItems: ReceiptLineItem[];
  }) => {
    if (res.providerName) setProviderName(res.providerName);
    if (res.date) setDate(res.date);
    if (res.category) setCategory(res.category);
    if (res.totalAmount > 0) setTotalAmount(res.totalAmount.toFixed(2));
    setIsTaxDeductible(res.isTaxDeductible);
    if (res.lineItems && res.lineItems.length > 0) {
      setLineItems(res.lineItems);
    }
  };

  const processReceiptDataUrl = async (dataUrl: string, fileName: string) => {
    setIsScanning(true);
    setScanSuccessBanner(null);
    setScanWarningBanner(null);
    setReceiptPreview(dataUrl);
    setScanProgressPercent(10);
    setScanStatusText(isZh ? '正在優化收據照片...' : 'Optimizing photo...');

    try {
      const extracted = await aiReceiptService.analyzeReceiptImage(
        dataUrl,
        fileName,
        geminiApiKey,
        language,
        (pct, status) => {
          setScanProgressPercent(pct);
          setScanStatusText(status);
        }
      );

      if (extracted.totalAmount > 0 || extracted.providerName.trim() !== '') {
        applyExtractedResult(extracted);
        if (extracted.aiConfidence > 0) {
          setScanSuccessBanner(
            isZh
              ? `✅ 成功辨識！院所：${extracted.providerName || '已辨識'}，金額：$${extracted.totalAmount} (信心度 ${extracted.aiConfidence}%)`
              : `✅ Successfully extracted! ${extracted.providerName}, Total: $${extracted.totalAmount} (${extracted.aiConfidence}% match)`
          );
        }
      } else {
        setScanWarningBanner(
          isZh
            ? '⚠️ 未能在收據中讀取到清晰文字。收據照片已為您保留，請確認照片光線或手動輸入金額與院所名稱。'
            : '⚠️ Could not read clear text. Photo is saved, please review and enter details manually.'
        );
      }
    } catch (err) {
      console.error('Receipt recognition error:', err);
      setScanWarningBanner(
        isZh
          ? '⚠️ 辨識過程發生異常。收據照片已保留，請手動確認或補充資料。'
          : '⚠️ Recognition error. Photo saved, please enter details manually.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleTakePhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });
        if (photo?.dataUrl) {
          await processReceiptDataUrl(photo.dataUrl, 'camera_capture.jpg');
        }
        return;
      } catch (err: any) {
        if (err?.message?.includes('User cancelled')) return;
        console.warn('Native camera failed, falling back to file input:', err);
      }
    }
    cameraInputRef.current?.click();
  };

  const handlePickGallery = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });
        if (photo?.dataUrl) {
          await processReceiptDataUrl(photo.dataUrl, 'gallery_photo.jpg');
        }
        return;
      } catch (err: any) {
        if (err?.message?.includes('User cancelled')) return;
        console.warn('Native gallery pick failed, falling back to file input:', err);
      }
    }
    galleryInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name;
    // Reset value so re-selecting same or taking another photo triggers onChange!
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      await processReceiptDataUrl(dataUrl, fileName);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(keyInput.trim());
    setShowKeyPopover(false);
    setScanSuccessBanner(
      keyInput.trim()
        ? (isZh ? '✨ Gemini AI 金鑰已儲存！' : '✨ Gemini AI Key saved!')
        : (isZh ? '已清除金鑰，切換為本地離線 OCR 模式' : 'Switched to local OCR mode')
    );
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
      paidFrom,
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
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {t('scanner_title')}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    hasValidGeminiKey
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {hasValidGeminiKey ? 'Gemini AI 辨識' : '本地 OCR (免金鑰)'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowKeyPopover(!showKeyPopover)}
                  className="text-[10px] text-slate-500 hover:text-teal-600 underline font-medium cursor-pointer"
                >
                  {showKeyPopover ? '關閉設定' : '切換/設定金鑰'}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini API Key Popover */}
        {showKeyPopover && (
          <div className="p-4 bg-purple-500/10 border-b border-purple-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-600" />
                Google Gemini API Key 設定 (選用)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
              >
                免費獲取金鑰 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              貼上 Gemini API 金鑰可使用多模態 AI 深度萃取項目；未設定時會自動使用<strong>本地 OCR 辨識引擎</strong>，完全免費用且能離線執行。
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shrink-0"
              >
                儲存
              </button>
              {keyInput && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyInput('');
                    setGeminiApiKey('');
                    setShowKeyPopover(false);
                  }}
                  className="px-2 py-1.5 text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  清除
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
          {/* 1. Snap or Sample Receipt Box */}
          <div className="rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-500/5 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {t('scanner_step1')}
              </span>

              {/* Action Buttons: Take Photo & Choose Gallery */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>拍照</span>
                </button>

                <button
                  type="button"
                  onClick={handlePickGallery}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>相簿</span>
                </button>
              </div>

              {/* Hidden file inputs for web & fallback */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Receipt Preview Thumbnail */}
            {receiptPreview && (
              <div className="mb-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      📷 已附加收據照片
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      已壓縮並隨此筆支出一併儲存
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-600 bg-teal-500/10 hover:bg-teal-500/20 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    重拍
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptPreview(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="移除照片"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Helpful Guide when no preview */}
            {!receiptPreview && !isScanning && (
              <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>
                  {isZh
                    ? '請點擊上方「拍照」或「相簿」上傳醫療收據。AI 將自動辨識醫院診所名稱、費用表格項目與實收金額。'
                    : 'Tap "Take Photo" or "Choose Photo" above. AI will automatically read hospital names, item tables, and amounts.'}
                </span>
              </div>
            )}

            {/* Scanning Progress Bar & Status */}
            {isScanning && (
              <div className="mt-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-300">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>{scanStatusText || t('scanner_scanning')}</span>
                  </div>
                  <span className="font-mono">{scanProgressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(8, scanProgressPercent)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Banner */}
            {scanSuccessBanner && !isScanning && (
              <div className="mt-3 flex items-start gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{scanSuccessBanner}</span>
              </div>
            )}

            {/* Warning Banner */}
            {scanWarningBanner && !isScanning && (
              <div className="mt-3 flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/25 px-3 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{scanWarningBanner}</span>
              </div>
            )}
          </div>

          {/* 2. Separate Paid By & Paid From Sections */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('field_who_paid', '1. Paid By (Who paid first?)')}
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

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('field_paid_from', '2. Paid From (Reimbursed from Funding Pool?)')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidFrom('FUND_POOL')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    paidFrom === 'FUND_POOL'
                      ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t('source_FUND_POOL', '🏦 Reimbursed from Fund Pool')}
                  </span>
                  {paidFrom === 'FUND_POOL' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaidFrom('OUT_OF_POCKET')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    paidFrom === 'OUT_OF_POCKET'
                      ? 'border-amber-600 bg-amber-500/10 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t('source_OUT_OF_POCKET', '👛 Out-of-Pocket (Not Reimbursed)')}
                  </span>
                  {paidFrom === 'OUT_OF_POCKET' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </button>
              </div>
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
                      className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
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
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
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

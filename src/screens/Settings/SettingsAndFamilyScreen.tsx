import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Users,
  HeartPulse,
  Share2,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Globe,
  KeyRound,
  Lock,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';
import { pdfReportService } from '../../services/pdfReportService';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';

const AVATAR_COLORS = ['#0D9488', '#2563EB', '#7C3AED', '#EA580C', '#DB2777', '#059669'];

export const SettingsAndFamilyScreen: React.FC = () => {
  const {
    recipient,
    members,
    expenses,
    shifts,
    currencySymbol,
    language,
    setLanguage,
    geminiApiKey,
    isAdmin,
    setGeminiApiKey,
    unlockAdmin,
    updateRecipient,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    equalizeSplits,
    getMemberBalances,
    exportSyncJson,
    importSyncJson,
    resetToDemoData,
    t,
  } = useCareStore();

  const [pdfTaxOnly, setPdfTaxOnly] = useState(false);

  // Add Member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');

  // Sync
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Hidden 5-tap Admin unlock
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');

  const balances = getMemberBalances();
  const filteredExpenses = pdfTaxOnly
    ? expenses.filter((e) => e.isTaxDeductible)
    : expenses;

  const handlePrintPdf = () => {
    pdfReportService.openPrintPdfWindow({
      recipient,
      members,
      expenses: filteredExpenses,
      shifts,
      balances,
      filterLabel: pdfTaxOnly ? t('filter_tax_only') : t('filter_all_bills'),
      currency: currencySymbol,
      language,
    });
  };

  const handleExportCsv = () => {
    pdfReportService.downloadCsvExport({
      recipient,
      members,
      expenses: filteredExpenses,
      shifts,
      balances,
      filterLabel: pdfTaxOnly ? t('filter_tax_only') : t('filter_all_bills'),
      currency: currencySymbol,
      language,
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    addFamilyMember({
      name: newMemberName.trim(),
      relationship: newMemberRelation.trim() || 'Family',
      avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
      splitPercentage: 0,
    });
    setNewMemberName('');
    setNewMemberRelation('');
  };

  const handleCopySyncCode = async () => {
    const json = exportSyncJson();
    try {
      await navigator.clipboard.writeText(json);
      setBannerMsg('✓ ' + t('copy_sync_btn'));
    } catch {
      setBannerMsg('✓ Copied');
    }
    setTimeout(() => setBannerMsg(null), 3000);
  };

  const handleImportSync = () => {
    const res = importSyncJson(importJsonText);
    setBannerMsg(res.message);
    if (res.success) {
      setShowImportBox(false);
      setImportJsonText('');
    }
    setTimeout(() => setBannerMsg(null), 3000);
  };

  const handleVersionTap = () => {
    const next = versionTapCount + 1;
    setVersionTapCount(next);
    if (next >= 5) {
      setShowAdminPrompt(true);
      setVersionTapCount(0);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {bannerMsg && (
        <div className="rounded-2xl bg-emerald-600 text-white px-4 py-3 text-xs font-bold flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bannerMsg}</span>
        </div>
      )}

      {/* 1. 1-Click PDF Summary & CSV Card */}
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 shadow-lg">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-200" />
          </div>
          <h2 className="text-base font-extrabold">{t('pdf_card_title')}</h2>
        </div>
        <p className="text-xs text-teal-100/90 leading-relaxed mb-3.5">
          {t('pdf_card_desc')}
        </p>

        {/* Simple Filter Toggle */}
        <div className="flex items-center gap-2 mb-3.5">
          <button
            onClick={() => setPdfTaxOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              !pdfTaxOnly
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-teal-100 hover:bg-white/20'
            }`}
          >
            {t('filter_all_bills')} ({expenses.length})
          </button>
          <button
            onClick={() => setPdfTaxOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              pdfTaxOnly
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-teal-100 hover:bg-white/20'
            }`}
          >
            {t('filter_tax_only')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={handlePrintPdf}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('generate_pdf_btn')}</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('export_csv_btn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Language Selector Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mb-3">
          <Globe className="w-4 h-4 text-teal-600" />
          <span>語言設定 / Language</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SUPPORTED_LANGUAGES.map((langOpt) => {
            const active = language === langOpt.code;
            return (
              <button
                key={langOpt.code}
                onClick={() => setLanguage(langOpt.code)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{langOpt.flag}</span>
                <span>{langOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Family Members & Split % */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              <span>{t('family_card_title')}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('family_card_desc')}
            </p>
          </div>
          <button
            onClick={equalizeSplits}
            className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-xs cursor-pointer shrink-0"
          >
            {t('equal_split_btn')}
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {m.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{m.relationship}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={m.splitPercentage}
                  onChange={(e) =>
                    updateFamilyMember(m.id, {
                      splitPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-14 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center text-slate-900 dark:text-white"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
                {members.length > 1 && (
                  <button
                    onClick={() => removeFamilyMember(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddMember} className="flex items-center gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder={t('add_member_placeholder')}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={newMemberRelation}
            onChange={(e) => setNewMemberRelation(e.target.value)}
            placeholder={t('add_role_placeholder')}
            className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 4. Care Recipient Info */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>{t('recipient_card_title')}</span>
        </h3>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {t('recipient_name_label')}
            </label>
            <input
              type="text"
              value={recipient.name}
              onChange={(e) => updateRecipient({ name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {t('recipient_doctor_label')}
            </label>
            <input
              type="text"
              value={recipient.primaryPhysician}
              onChange={(e) => updateRecipient({ primaryPhysician: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {t('recipient_ins_label')}
            </label>
            <input
              type="text"
              value={recipient.insuranceProvider}
              onChange={(e) => updateRecipient({ insuranceProvider: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 5. Family Sync Code & Demo Reset */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>{t('sync_card_title')}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('sync_card_desc')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopySyncCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('copy_sync_btn')}</span>
          </button>
          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('import_sync_btn')}</span>
          </button>
          <button
            onClick={resetToDemoData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('restore_demo_btn')}</span>
          </button>
        </div>

        {showImportBox && (
          <div className="space-y-2 pt-2">
            <textarea
              rows={3}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste Family Sync JSON..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
            />
            <button
              onClick={handleImportSync}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
            >
              {t('apply_sync_btn')}
            </button>
          </div>
        )}

        {/* Optional Gemini Key */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1">
            <KeyRound className="w-3 h-3" />
            <span>Gemini API Key (Optional)</span>
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Footer Version (5-Tap Admin Unlock) */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={handleVersionTap}
          className="text-[11px] text-slate-400 select-none cursor-pointer"
        >
          CareCircle v1.1.0 • {isAdmin ? 'Admin Pro Unlocked' : 'Family Hub'}
        </button>

        {showAdminPrompt && (
          <div className="mt-2 max-w-xs mx-auto p-3 rounded-2xl bg-slate-900 text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-400 shrink-0" />
            <input
              type="password"
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              placeholder="Admin passcode"
              className="flex-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white"
            />
            <button
              onClick={() => {
                unlockAdmin(adminPassInput);
                setShowAdminPrompt(false);
                setAdminPassInput('');
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Users,
  HeartHandshake,
  Share2,
  Upload,
  Key,
  Sun,
  Moon,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Scale,
  Crown,
} from 'lucide-react';
import { useCareStore } from '../../store/careStore';

const AVATAR_COLORS = ['#0D9488', '#2563EB', '#7C3AED', '#EA580C', '#DB2777', '#059669'];

export const SettingsAndFamilyScreen: React.FC = () => {
  const {
    themeMode,
    toggleTheme,
    recipient,
    updateRecipient,
    members,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    equalizeSplits,
    geminiApiKey,
    setGeminiApiKey,
    exportSyncJson,
    importSyncJson,
    resetToDemoData,
    isAdmin,
    unlockAdmin,
  } = useCareStore();

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Sibling / Care Member');
  const [newMemberSplit, setNewMemberSplit] = useState('25');

  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncText, setSyncText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  // Hidden 5-tap admin access
  const [tapCount, setTapCount] = useState(0);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  const totalSplitWeight = members.reduce((acc, m) => acc + (m.splitPercentage || 0), 0);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    addFamilyMember({
      name: newMemberName.trim(),
      relationship: newMemberRole.trim() || 'Family Member',
      avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
      splitPercentage: Math.max(0, Number(newMemberSplit) || 20),
    });
    setNewMemberName('');
    setStatusMessage('✓ Added family member to Care Circle.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCopySyncSnapshot = async () => {
    const json = exportSyncJson();
    try {
      await navigator.clipboard.writeText(json);
      setStatusMessage('✓ Copied Family Sync Snapshot to clipboard! Paste in family chat to sync.');
    } catch {
      setSyncText(json);
      setShowImportBox(true);
      setStatusMessage('✓ Generated Family Sync Snapshot below.');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleImportSnapshot = () => {
    const res = importSyncJson(syncText);
    setStatusMessage(`${res.success ? '✓' : '✕'} ${res.message}`);
    if (res.success) {
      setShowImportBox(false);
      setSyncText('');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleVersionTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setShowAdminInput(true);
      setTapCount(0);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {statusMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. FAMILY CARE TEAM & SPLIT RATIOS */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Family Care Team &amp; Pool Split Ratios
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Total split weight: <strong className="font-mono">{totalSplitWeight}%</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={equalizeSplits}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-teal-500" />
            <span>Equal Split</span>
          </button>
        </div>

        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {m.relationship}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={m.splitPercentage}
                    onChange={(e) =>
                      updateFamilyMember(m.id, {
                        splitPercentage: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-14 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  <span className="text-xs font-mono text-slate-400">%</span>
                </div>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFamilyMember(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Family Member Form */}
        <form onSubmit={handleAddMember} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Add Sibling or Care Team Member
          </span>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Name (e.g. Michael Chen)"
              className="rounded-xl px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
            <input
              type="text"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              placeholder="Role (e.g. Brother)"
              className="rounded-xl px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
            <button
              type="submit"
              className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. CARE RECIPIENT & INSURANCE PROFILE */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            Care Recipient &amp; Insurance Policy Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Full Legal Name (For Insurance Claims)
            </label>
            <input
              type="text"
              value={recipient.name}
              onChange={(e) => updateRecipient({ name: e.target.value })}
              className="w-full rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Primary Physician / Clinic
            </label>
            <input
              type="text"
              value={recipient.primaryPhysician}
              onChange={(e) => updateRecipient({ primaryPhysician: e.target.value })}
              className="w-full rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Insurance Carrier &amp; Plan
            </label>
            <input
              type="text"
              value={recipient.insuranceProvider}
              onChange={(e) => updateRecipient({ insuranceProvider: e.target.value })}
              className="w-full rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Policy / Medicare ID Number
            </label>
            <input
              type="text"
              value={recipient.policyNumber}
              onChange={(e) => updateRecipient({ policyNumber: e.target.value })}
              className="w-full rounded-xl px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 3. FAMILY HUB SYNC SNAPSHOT (EXPORT / IMPORT) */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Family Sync Snapshot (No Account Required)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Copy &amp; share your family ledger code via WhatsApp/iMessage to sync devices
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopySyncSnapshot}
            className="min-h-[42px] py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Family Sync Code</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImportBox(!showImportBox)}
            className="min-h-[42px] py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Sync Code</span>
          </button>
        </div>

        {showImportBox && (
          <div className="space-y-2 pt-1">
            <textarea
              rows={4}
              value={syncText}
              onChange={(e) => setSyncText(e.target.value)}
              placeholder="Paste CareCircle JSON Sync Snapshot here..."
              className="w-full rounded-xl p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
            <button
              type="button"
              onClick={handleImportSnapshot}
              className="w-full py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
            >
              Load &amp; Sync Family Ledger
            </button>
          </div>
        )}
      </div>

      {/* 4. APPEARANCE, GEMINI AI OCR KEY & DATA RESET */}
      <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            Display Theme
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {themeMode === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-teal-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-teal-500" />
            <span>Gemini 3.8 Flash API Key (Optional for Live Camera OCR)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste AIzaSy... key (or leave blank for built-in OCR)"
              className="flex-1 rounded-xl px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
            <button
              type="button"
              onClick={() => {
                setGeminiApiKey(keyInput);
                setStatusMessage('✓ Saved Gemini 3.8 Flash Vision OCR key.');
                setTimeout(() => setStatusMessage(null), 3000);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              resetToDemoData();
              setStatusMessage('✓ Restored sample family care data.');
              setTimeout(() => setStatusMessage(null), 3000);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Demo Family Data</span>
          </button>

          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Crown className="w-3 h-3" /> ADMIN UNLOCKED
            </span>
          )}
        </div>
      </div>

      {/* Hidden 5-Tap Admin Unlock Footer */}
      <div
        onClick={handleVersionTap}
        className="text-center pt-1 text-[11px] font-mono text-slate-400 select-none cursor-pointer"
      >
        <p>CareCircle v1.0.0 • Family Caregiver &amp; Medical Expense Coordinator</p>
        <p>HIPAA-Conscious Local-First Architecture • IRS Pub 502 Ready</p>
      </div>

      {showAdminInput && !isAdmin && (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-500/40 flex gap-2">
          <input
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            placeholder="Enter admin passcode..."
            className="flex-1 rounded-xl px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              if (unlockAdmin(adminPass)) {
                setShowAdminInput(false);
                setAdminPass('');
                setStatusMessage('✓ Admin Mode Activated');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold"
          >
            Unlock
          </button>
        </div>
      )}
    </div>
  );
};

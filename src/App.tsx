import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  Camera,
  Clock,
  FileSpreadsheet,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import { useCareStore, AppTab } from './store/careStore';
import { FamilyHubScreen } from './screens/Hub/FamilyHubScreen';
import { CaregiverAndMedsScreen } from './screens/CareLog/CaregiverAndMedsScreen';
import { ReimbursementReportScreen } from './screens/Reports/ReimbursementReportScreen';
import { SettingsAndFamilyScreen } from './screens/Settings/SettingsAndFamilyScreen';
import { ReceiptScannerModal } from './screens/Scanner/ReceiptScannerModal';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, themeMode, toggleTheme, expenses, medications } =
    useCareStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const isDark = themeMode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [themeMode]);

  const lowRefillCount = medications.filter(
    (m) => m.pillsRemaining <= m.refillThreshold
  ).length;

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'hub',
      label: 'Family Hub',
      icon: <HeartHandshake className="w-5 h-5" />,
      badge: expenses.length,
    },
    {
      id: 'carelog',
      label: 'Care & Meds',
      icon: <Clock className="w-5 h-5" />,
      badge: lowRefillCount > 0 ? lowRefillCount : undefined,
    },
    {
      id: 'reports',
      label: 'PDF Claims',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Team & Sync',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-[#F4F6F9] dark:bg-[#0B1120] shadow-xl relative">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  CareCircle
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  AI HUB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Family Caregiver &amp; Medical Expense Coordinator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Bill</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Light / Dark Theme"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            >
              {themeMode === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </header>

        {/* Main Screen Container */}
        <main className="flex-1 px-4 pt-4">
          {activeTab === 'hub' && (
            <FamilyHubScreen onOpenScanner={() => setIsScannerOpen(true)} />
          )}
          {activeTab === 'carelog' && <CaregiverAndMedsScreen />}
          {activeTab === 'reports' && <ReimbursementReportScreen />}
          {activeTab === 'settings' && <SettingsAndFamilyScreen />}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex-1 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                  active
                    ? 'text-teal-600 dark:text-teal-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ${
                        item.id === 'carelog'
                          ? 'bg-amber-500 text-white'
                          : 'bg-teal-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Receipt Scanner Modal */}
        {isScannerOpen && (
          <ReceiptScannerModal onClose={() => setIsScannerOpen(false)} />
        )}
      </div>
    </div>
  );
};

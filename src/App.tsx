import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  Camera,
  Clock,
  FileSpreadsheet,
  Users,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
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
    document.body.style.backgroundColor = isDark ? '#0B1120' : '#F4F6F9';

    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? '#0B1120' : '#F4F6F9' }).catch(
        () => {}
      );
    }
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
    <div className="min-h-screen w-full bg-[#E5E9F0] dark:bg-[#060A14] text-slate-900 dark:text-slate-100 flex justify-center items-stretch overflow-x-hidden">
      {/* Mobile-First Phone Shell: 100% width on phones, sleek centered mobile frame on desktop/Vercel */}
      <div className="w-full sm:max-w-md min-h-screen flex flex-col bg-[#F4F6F9] dark:bg-[#0B1120] sm:shadow-2xl sm:border-x sm:border-slate-200/80 dark:sm:border-slate-800/80 relative overflow-x-hidden">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  CareCircle
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                  FAMILY HUB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Caregiver &amp; Medical Expense Coordinator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Bill</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Light / Dark Theme"
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-95"
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
        <main className="flex-1 px-3.5 pt-3.5">
          {activeTab === 'hub' && (
            <FamilyHubScreen onOpenScanner={() => setIsScannerOpen(true)} />
          )}
          {activeTab === 'carelog' && <CaregiverAndMedsScreen />}
          {activeTab === 'reports' && <ReimbursementReportScreen />}
          {activeTab === 'settings' && <SettingsAndFamilyScreen />}
        </main>

        {/* Persistent Thumb-Zone Quick Action Bar (Easy 1-Handed Mobile Reach) */}
        <div className="sticky bottom-[64px] left-0 right-0 px-3.5 pb-2 z-20 pointer-events-none">
          <div className="pointer-events-auto p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-lg flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>+ Snap Medical Bill</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('carelog')}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Log Shift / Rx</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Bottom Navigation Bar (48px+ touch targets) */}
        <nav className="sticky bottom-0 left-0 right-0 w-full z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex-1 min-h-[48px] py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                  active
                    ? 'text-teal-600 dark:text-teal-400 font-extrabold bg-teal-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
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
                <span className="text-[11px] leading-tight">{item.label}</span>
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

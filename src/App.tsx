import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Clock,
  FileText,
  Camera,
  Sun,
  Moon,
  HeartHandshake,
  Globe,
  Coins,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { useCareStore, AppTab } from './store/careStore';
import { saveSupabaseConfig, getSupabaseConfig } from './services/supabaseSyncService';
import { FamilyHubScreen } from './screens/Hub/FamilyHubScreen';
import { FundsPoolScreen } from './screens/Funds/FundsPoolScreen';
import { CaregiverAndMedsScreen } from './screens/CareLog/CaregiverAndMedsScreen';
import { SettingsAndFamilyScreen } from './screens/Settings/SettingsAndFamilyScreen';
import { ReceiptScannerModal } from './screens/Scanner/ReceiptScannerModal';
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  AppLanguage,
} from './i18n/translations';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    themeMode,
    toggleTheme,
    language,
    setLanguage,
    currencyCode,
    setCurrency,
    roomCode,
    syncStatus,
    connectCloudRoom,
    pullFromCloudRoom,
    t,
  } = useCareStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // Auto-join room from URL query params (?room=CODE&sbUrl=...&sbKey=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    const urlSbUrl = params.get('sbUrl');
    const urlSbKey = params.get('sbKey');

    if (urlSbUrl && urlSbKey) {
      const current = getSupabaseConfig();
      saveSupabaseConfig(urlSbUrl || current.url, urlSbKey || current.anonKey);
    }

    if (urlRoom) {
      connectCloudRoom(urlRoom);
      // Clean sensitive params from URL bar while keeping app state
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (roomCode) {
      pullFromCloudRoom(true);
    }
  }, []);

  // Continuous background auto-sync every 8 seconds & on window focus
  useEffect(() => {
    if (!roomCode) return;

    const interval = setInterval(() => {
      pullFromCloudRoom(true);
    }, 8000);

    const handleFocus = () => {
      pullFromCloudRoom(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pullFromCloudRoom(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [roomCode, pullFromCloudRoom]);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'hub',
      label: t('tab_hub'),
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'funds',
      label: t('tab_funds'),
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: 'carelog',
      label: t('tab_care'),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: t('tab_settings'),
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Sticky Top Header with Instant Language & Currency Switchers */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-3 h-14 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:block min-w-0">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white block truncate">
                {t('app_title')}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {t('app_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {deferredInstallPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="px-2 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-extrabold cursor-pointer shadow-sm shrink-0"
              >
                📲 {language === 'zh-TW' ? '安裝 App' : 'Install'}
              </button>
            )}
            {/* Live Cloud Room Status Pill */}
            <button
              type="button"
              onClick={() => {
                if (roomCode) {
                  pullFromCloudRoom(false);
                } else {
                  setActiveTab('settings');
                }
              }}
              title={
                roomCode
                  ? `Connected to Family Room: ${roomCode} (Tap to sync now)`
                  : 'Set up Family Room Auto-Sync'
              }
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition ${
                roomCode
                  ? syncStatus === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span className="max-w-[78px] truncate">
                {roomCode ? roomCode : 'Room'}
              </span>
            </button>

            {/* Currency Dropdown Pill */}
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-1.5 border border-slate-200 dark:border-slate-700">
              <Coins className="w-3.5 h-3.5 text-amber-500 mr-1 shrink-0" />
              <select
                aria-label="Currency"
                value={currencyCode}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option
                    key={c.code}
                    value={c.code}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Dropdown Pill */}
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-1.5 border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mr-1 shrink-0" />
              <select
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                className="bg-transparent text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option
                    key={l.code}
                    value={l.code}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Mobile-First Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3.5 pt-4 pb-24">
        {activeTab === 'hub' && (
          <FamilyHubScreen onOpenScanner={() => setIsScannerOpen(true)} />
        )}
        {activeTab === 'funds' && <FundsPoolScreen />}
        {activeTab === 'carelog' && <CaregiverAndMedsScreen />}
        {activeTab === 'settings' && <SettingsAndFamilyScreen />}
      </main>

      {/* Floating Camera Action Button on Mobile */}
      <button
        onClick={() => setIsScannerOpen(true)}
        aria-label="Snap Receipt"
        className="sm:hidden fixed right-4 bottom-20 z-30 w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-600/30 flex items-center justify-center active:scale-95 transition cursor-pointer"
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* 4-Tab Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-2 h-16 grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl my-1.5 transition cursor-pointer ${
                  active
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                }`}
              >
                {item.icon}
                <span className="text-[11px] leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* AI Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};

export default App;

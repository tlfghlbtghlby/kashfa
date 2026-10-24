import { Calendar, Users, CheckCircle2, FileDown, PlusCircle, Smartphone, Monitor, Shield, Sun, Moon, FileSpreadsheet, Undo2, Redo2 } from 'lucide-react';
import { formatArabicDate } from '../utils/scoutHelper';

interface HeaderProps {
  activeTab: 'attendance' | 'members' | 'patrols';
  setActiveTab: (tab: 'attendance' | 'members' | 'patrols') => void;
  activeDate: string;
  onOpenDatePicker: () => void;
  onOpenAddMember: () => void;
  onOpenPrintReport: () => void;
  onOpenExcelImport?: () => void;
  stats: {
    total: number;
    present: number;
    departed: number;
    absent: number;
  };
  storedDaysCount?: number;
  lastSavedTime?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoCount?: number;
  lastActionDescription?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeDate,
  onOpenDatePicker,
  onOpenAddMember,
  onOpenPrintReport,
  onOpenExcelImport,
  stats,
  storedDaysCount = 1,
  lastSavedTime,
  isDarkMode,
  onToggleDarkMode,
  isMobileFrame,
  setIsMobileFrame,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoCount = 0,
  lastActionDescription,
}) => {
  return (
    <header className="bg-[#00685e] dark:bg-[#004f47] text-white shadow-lg sticky top-0 z-30 transition-colors">
      {/* Top Brand Bar */}
      <div className="px-3.5 sm:px-4 py-3 flex items-center justify-between border-b border-[#00554d] dark:border-[#003d37]">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="/assets/aistudio/_____________e13acb2d.jpg"
            alt="شعار كشافة العباس (ع)"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-emerald-200/60 shadow-sm bg-white"
          />
          <div>
            <h1 className="text-sm sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
              <span>حضور وانصراف كشافة العباس</span>
              <span className="text-emerald-200 text-xs font-normal">(ع)</span>
            </h1>
            <p className="text-emerald-100/90 text-[11px] sm:text-xs flex items-center gap-1">
              <span>البراعم (6-8)</span>
              <span>·</span>
              <span>الأشبال (9-11)</span>
              <span>·</span>
              <span>الكشافة (12-14)</span>
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Theme Toggle & Print & Storage Badge */}
        <div className="flex items-center gap-1.5">
          {/* Undo and Redo Tools (أداة التراجع والإعادة) */}
          <div className="flex items-center bg-[#00524a] dark:bg-[#003d37] rounded-xl p-0.5 border border-emerald-500/25 shadow-2xs">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              type="button"
              title={
                canUndo
                  ? `تراجع عن: ${lastActionDescription || 'آخر إجراء'} (Ctrl+Z)`
                  : 'لا يوجد إجراء سابق للتراجع عنه'
              }
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                canUndo
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 active:scale-95 shadow-xs cursor-pointer'
                  : 'text-emerald-300/40 opacity-40 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>تراجع</span>
              {undoCount > 0 && (
                <span className="text-[10px] bg-slate-900/20 text-slate-900 font-mono font-black px-1.5 py-0.2 rounded-full">
                  {undoCount}
                </span>
              )}
            </button>

            {canRedo && (
              <button
                onClick={onRedo}
                type="button"
                title="إعادة تطبيق الإجراء الأخير (Ctrl+Y)"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-[#006056] hover:bg-[#006f63] text-emerald-100 transition-all active:scale-95 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">إعادة</span>
              </button>
            )}
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            className="p-2 rounded-lg bg-[#00524a] hover:bg-[#00433d] text-amber-200 dark:text-amber-300 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 border border-emerald-500/20 shadow-xs"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
                <span className="hidden md:inline text-[11px] text-emerald-100">فاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-200" />
                <span className="hidden md:inline text-[11px] text-emerald-100">داكن</span>
              </>
            )}
          </button>

          {/* Excel Import Button */}
          {onOpenExcelImport && (
            <button
              onClick={onOpenExcelImport}
              title="استيراد معلومات الأفراد من ملف إكسل"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all border border-emerald-500/30 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">استيراد إكسل</span>
            </button>
          )}

          {/* Storage Badge */}
          <button
            onClick={onOpenDatePicker}
            title="كل يوم يتم حفظه تلقائياً. اضغط لفتح أرشيف الأيام السابقة"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#004f46] hover:bg-[#00433d] text-emerald-100 text-[11px] font-bold border border-emerald-500/30 transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>مخزن تلقائياً ({storedDaysCount} أيام)</span>
          </button>

          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            title={isMobileFrame ? 'التبديل إلى العرض العريض' : 'التبديل إلى مظهر الموبايل'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00524a] hover:bg-[#00433d] text-xs text-emerald-100 transition-colors"
          >
            {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{isMobileFrame ? 'عرض كامل' : 'إطار موبايل'}</span>
          </button>

          <button
            onClick={onOpenPrintReport}
            title="طباعة وتصدير الكشف"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">تقرير / طباعة</span>
          </button>
        </div>
      </div>

      {/* Date Bar & Quick Counter (Interactive Date Selector) */}
      <div className="px-4 py-2.5 bg-[#00574f] flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          onClick={onOpenDatePicker}
          className="flex items-center gap-2 bg-[#004740] hover:bg-[#003c36] text-emerald-100 px-3 py-1.5 rounded-lg transition-all border border-emerald-600/30 font-medium active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-300" />
          <span>تاريخ النشاط:</span>
          <span className="font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded text-[11px] dir-ltr">
            {activeDate}
          </span>
          <span className="text-[11px] text-emerald-200 hidden xs:inline">
            ({formatArabicDate(activeDate)})
          </span>
          <span className="text-emerald-300 text-[10px] underline mr-1">تغيير / أرشيف الأيام</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-emerald-100 font-medium">
          <span className="flex items-center gap-1 bg-[#004740] px-2 py-1 rounded">
            <span>الكل:</span>
            <strong className="text-white">{stats.total}</strong>
          </span>
          <span className="flex items-center gap-1 bg-emerald-900/60 text-emerald-200 px-2 py-1 rounded">
            <span>حاضر:</span>
            <strong className="text-emerald-300">{stats.present}</strong>
          </span>
          <span className="flex items-center gap-1 bg-teal-900/60 text-teal-200 px-2 py-1 rounded">
            <span>انصرف:</span>
            <strong className="text-teal-300">{stats.departed}</strong>
          </span>
          <span className="flex items-center gap-1 bg-rose-950/40 text-rose-200 px-2 py-1 rounded">
            <span>غائب:</span>
            <strong className="text-rose-300">{stats.absent}</strong>
          </span>
        </div>
      </div>

      {/* Linked Windows Tab Bar (Now with 3 tabs) */}
      <div className="flex bg-[#004d46] p-1 border-t border-[#00403a] overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
            activeTab === 'attendance'
              ? 'bg-white text-[#00685e] shadow-md'
              : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>النافذة 1: الحضور والانصراف</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
            activeTab === 'members'
              ? 'bg-white text-[#00685e] shadow-md'
              : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>النافذة 2: سجل الأعضاء</span>
        </button>

        <button
          onClick={() => setActiveTab('patrols')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
            activeTab === 'patrols'
              ? 'bg-white text-[#00685e] shadow-md'
              : 'text-emerald-100 hover:text-white hover:bg-emerald-800/40'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span>النافذة 3: تشكيل الطلائع (المجاميع)</span>
        </button>
      </div>
    </header>
  );
};


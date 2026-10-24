import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  Plus,
  Check,
  Trash2,
  Database,
  Download,
  Upload,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AttendanceSession, ScoutMember } from '../types/scout';
import { formatArabicDate, getTodayDateString } from '../utils/scoutHelper';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDate: string;
  onSelectDate: (date: string) => void;
  sessions: Record<string, AttendanceSession>;
  members: ScoutMember[];
  onAddDate: (newDate: string, title?: string) => void;
  onDeleteSession?: (date: string) => void;
  onImportBackup?: (data: { members: ScoutMember[]; sessions: Record<string, AttendanceSession> }) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  activeDate,
  onSelectDate,
  sessions,
  members,
  onAddDate,
  onDeleteSession,
  onImportBackup,
}) => {
  const [newDateInput, setNewDateInput] = useState(getTodayDateString());
  const [newDateTitle, setNewDateTitle] = useState('نشاط كشفي أسبوعي');
  const [showAddForm, setShowAddForm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput) return;
    onAddDate(newDateInput, newDateTitle.trim() || 'نشاط كشفي');
    onSelectDate(newDateInput);
    setShowAddForm(false);
  };

  const datesList = Object.keys(sessions).sort((a, b) => b.localeCompare(a));

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      app: 'حضور وانصراف كشافة العباس',
      version: '1.0',
      exportDate: new Date().toISOString(),
      members,
      sessions,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_كشافة_العباس_${getTodayDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.members && parsed.sessions && onImportBackup) {
          onImportBackup({
            members: parsed.members,
            sessions: parsed.sessions,
          });
          setImportStatus('تمت استعادة البيانات بنجاح!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          alert('ملف النسخة الاحتياطية غير صالح.');
        }
      } catch {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#00685e] dark:bg-[#004f47] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 dark:bg-emerald-900 flex items-center justify-center border border-emerald-400/30">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                أرشيف وتخزين سجلات الحضور اليومية
              </h3>
              <p className="text-[11px] text-emerald-100">
                يتم تخزين كافة سجلات الأيام تلقائياً في ذاكرة الجهاز بشكل دائم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#00554d] hover:bg-[#00433d] flex items-center justify-center text-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Storage Notice & Reassurance */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 px-4 py-3 border-b border-emerald-100 dark:border-emerald-800/70 flex items-center gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-[#00685e] dark:text-emerald-400 shrink-0" />
          <div className="leading-snug">
            <strong className="font-bold">التخزين اليومي نشط:</strong>{' '}
            <span className="text-slate-700 dark:text-slate-300">
              كل يوم تسجل فيه الحضور والانصراف يُحفظ فوراً ومستقلاً عن بقية الأيام مع أسماء الحاضرين والطلائع.
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Add Date Toggle Button or Form */}
          {!showAddForm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex-1 py-2.5 px-4 rounded-xl border-2 border-dashed border-[#00685e]/40 hover:border-[#00685e] dark:border-emerald-600/50 dark:hover:border-emerald-400 text-[#00685e] dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وتسجيل يوم نشاط جديد يدوياً</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddSubmit} className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#00685e] dark:text-emerald-400" />
                  <span>إضافة تاريخ نشاط جديد</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  إلغاء
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ اليوم (يوم / شهر / سنة)
                </label>
                <input
                  type="date"
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-[#00685e] dark:focus:border-emerald-500 outline-none text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان النشاط أو التجمع (اختياري)
                </label>
                <input
                  type="text"
                  value={newDateTitle}
                  onChange={(e) => setNewDateTitle(e.target.value)}
                  placeholder="مثال: نشاط الجمعة الأسبوعي، دورة كشفية، مخيم..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-[#00685e] dark:focus:border-emerald-500 outline-none text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#00685e] dark:bg-[#007a6e] hover:bg-[#00554d] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ التاريخ وفتح سجل الحضور</span>
              </button>
            </form>
          )}

          {/* List of Stored Days & History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>سجل الأيام المخزنة ({datesList.length} أيام):</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                اضغط على أي يوم لفتحه واستعراضه
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {datesList.map((date) => {
                const session = sessions[date];
                const isSelected = date === activeDate;
                const records = session?.records || {};
                const presentCount = Object.values(records).filter((r) => r.status === 'present').length;
                const departedCount = Object.values(records).filter((r) => r.departureStatus === 'departed').length;
                const patrolsCount = session?.patrols?.length || 0;

                return (
                  <div
                    key={date}
                    onClick={() => {
                      onSelectDate(date);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#00685e] dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-300 dark:ring-emerald-700'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#00685e] dark:bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 dir-ltr font-mono">
                            {date}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-black text-[#00685e] dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              اليوم المعروض حالياً
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {formatArabicDate(date)} {session?.title ? `· ${session.title}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                          حضور: {presentCount}
                        </span>
                        <span className="bg-teal-100/80 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md">
                          انصرف: {departedCount}
                        </span>
                        {patrolsCount > 0 && (
                          <span className="bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded-md text-[10px]">
                            {patrolsCount} طلائع
                          </span>
                        )}
                      </div>

                      {onDeleteSession && datesList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت متأكد من حذف سجل تاريخ ${date}؟`)) {
                              onDeleteSession(date);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="حذف سجل هذا اليوم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup & Export / Import Tools */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              النسخ الاحتياطي وحماية البيانات:
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#00685e] dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/50 text-[#00685e] dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="تنزيل نسخة احتياطية من كافة الأيام المحفوظة إلى هاتفك"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير نسخة احتياطية (ملف JSON)</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="استعادة البيانات من نسخة سابقة"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>استعادة نسخة سابقة</span>
              </button>
            </div>

            {importStatus && (
              <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 p-2 rounded-xl text-center text-xs font-bold">
                {importStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            كشافة العباس (ع) · التخزين الدائم مفعل
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

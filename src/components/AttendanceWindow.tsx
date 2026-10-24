import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  ArrowUpDown,
  UserPlus,
  Check,
  X,
  LogOut,
  Calendar,
  Clock,
  AlertCircle,
  Camera,
  ImageIcon,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  Undo2
} from 'lucide-react';
import { ScoutMember, ScoutCategory, AttendanceStatus, DepartureStatus, DayAttendance } from '../types/scout';
import { CATEGORY_ORDER, getCategoryColor, getCurrentTimeArabic, getBoyInitials, compressScoutPhoto } from '../utils/scoutHelper';

interface AttendanceWindowProps {
  members: ScoutMember[];
  activeDate: string;
  records: Record<string, DayAttendance>;
  onUpdateAttendance: (memberId: string, status: AttendanceStatus, departureStatus?: DepartureStatus) => void;
  onUpdateTimes: (memberId: string, checkInTime?: string, departureTime?: string, note?: string) => void;
  onOpenAddMember: () => void;
  onOpenDatePicker: () => void;
  onBulkAttendance: (status: AttendanceStatus) => void;
  onBulkDeparture: (departureStatus: DepartureStatus) => void;
  onViewPhoto: (member: ScoutMember) => void;
  onAttachPhoto: (memberId: string, photoUrl: string) => void;
  onOpenExcelImport?: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
  undoCount?: number;
  lastActionDescription?: string;
}

export const AttendanceWindow: React.FC<AttendanceWindowProps> = ({
  members,
  activeDate,
  records,
  onUpdateAttendance,
  onUpdateTimes,
  onOpenAddMember,
  onOpenDatePicker,
  onBulkAttendance,
  onBulkDeparture,
  onViewPhoto,
  onAttachPhoto,
  onOpenExcelImport,
  canUndo = false,
  onUndo,
  undoCount = 0,
  lastActionDescription,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ScoutCategory | 'الكل'>('الكل');
  // Sort mode: 'category' (براعم -> أشبال -> كشافة) or 'name' (أ-ي)
  const [sortField, setSortField] = useState<'category' | 'name'>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Quick photo upload ref
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [targetMemberIdForPhoto, setTargetMemberIdForPhoto] = useState<string | null>(null);

  // Sorting and Filtering
  const filteredAndSortedMembers = useMemo(() => {
    let list = [...members];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }

    // Filter by category
    if (categoryFilter !== 'الكل') {
      list = list.filter((m) => m.category === categoryFilter);
    }

    // Sort either by Category (براعم -> أشبال -> كشافة) or Name (أبجدياً)
    list.sort((a, b) => {
      if (sortField === 'category') {
        const orderA = CATEGORY_ORDER[a.category] || 99;
        const orderB = CATEGORY_ORDER[b.category] || 99;
        if (orderA !== orderB) {
          return sortDirection === 'asc' ? orderA - orderB : orderB - orderA;
        }
        // Sub-sort by name
        return a.name.localeCompare(b.name, 'ar');
      } else {
        // Sort by Name
        const comp = a.name.localeCompare(b.name, 'ar');
        return sortDirection === 'asc' ? comp : -comp;
      }
    });

    return list;
  }, [members, searchQuery, categoryFilter, sortField, sortDirection]);

  // Handle Attendance toggle
  const handleToggleAttendance = (memberId: string, newStatus: AttendanceStatus) => {
    const currentRecord = records[memberId];
    if (newStatus === 'present') {
      onUpdateAttendance(memberId, 'present', currentRecord?.departureStatus || 'present_not_departed');
      if (!currentRecord?.checkInTime) {
        onUpdateTimes(memberId, getCurrentTimeArabic(), currentRecord?.departureTime, currentRecord?.note);
      }
    } else {
      // If absent or excused, set departure to 'none'
      onUpdateAttendance(memberId, newStatus, 'none');
    }
  };

  // Handle Departure toggle
  const handleToggleDeparture = (memberId: string) => {
    const currentRecord = records[memberId];
    const isDeparted = currentRecord?.departureStatus === 'departed';

    if (isDeparted) {
      // Revert to present and not departed
      onUpdateAttendance(memberId, 'present', 'present_not_departed');
      onUpdateTimes(memberId, currentRecord?.checkInTime, undefined, currentRecord?.note);
    } else {
      // Mark as departed with departure time
      onUpdateAttendance(memberId, 'present', 'departed');
      onUpdateTimes(
        memberId,
        currentRecord?.checkInTime || getCurrentTimeArabic(),
        getCurrentTimeArabic(),
        currentRecord?.note
      );
    }
  };

  const handleQuickPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetMemberIdForPhoto) return;

    try {
      const compressed = await compressScoutPhoto(file);
      onAttachPhoto(targetMemberIdForPhoto, compressed);
    } catch (err) {
      console.error('Error attaching photo:', err);
    } finally {
      setTargetMemberIdForPhoto(null);
      if (quickPhotoInputRef.current) {
        quickPhotoInputRef.current.value = '';
      }
    }
  };

  const triggerAttachPhoto = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetMemberIdForPhoto(memberId);
    quickPhotoInputRef.current?.click();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden file input for fast in-place photo attachment */}
      <input
        type="file"
        ref={quickPhotoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleQuickPhotoChange}
      />

      {/* Top Banner & Date Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00685e] dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تاريخ الحضور والانصراف (يدوي):</span>
                <span className="px-2 py-0.5 rounded-md bg-[#00685e] dark:bg-[#007a6e] text-white font-mono font-bold text-xs">
                  {activeDate}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                جدول الحضور والانصراف مع صور الكشافين والتصنيف العمري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExcelImport && (
              <button
                onClick={onOpenExcelImport}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#00685e] dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-[#00685e] dark:hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="استيراد كشافين من ملف إكسل"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>استيراد إكسل</span>
              </button>
            )}
            <button
              onClick={onOpenDatePicker}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-[#00685e] dark:border-emerald-500/50 text-[#00685e] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>تغيير أو إضافة تاريخ</span>
            </button>
            <button
              onClick={onOpenAddMember}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#00685e] dark:bg-[#007a6e] hover:bg-[#00554d] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة كشاف</span>
            </button>
          </div>
        </div>

        {/* Quick Bulk Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">إجراءات سريعة لليوم:</span>
            <button
              onClick={() => onBulkAttendance('present')}
              className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] transition-colors"
            >
              تحضير الجميع
            </button>
            <button
              onClick={() => onBulkDeparture('departed')}
              className="px-2.5 py-1 rounded-lg bg-teal-100/70 dark:bg-teal-950/60 hover:bg-teal-200 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 font-semibold text-[11px] transition-colors"
            >
              انصراف الجميع
            </button>
            <button
              onClick={() => onBulkAttendance('absent')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium text-[11px] transition-colors"
            >
              تصفير السجل
            </button>

            {/* Quick Undo Action */}
            {onUndo && (
              <button
                onClick={onUndo}
                disabled={!canUndo}
                type="button"
                title={canUndo ? `تراجع عن: ${lastActionDescription || 'آخر إجراء'} (Ctrl+Z)` : 'لا يوجد إجراء سابق للتراجع عنه'}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all ${
                  canUndo
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 active:scale-95 shadow-2xs cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>تراجع</span>
                {undoCount > 0 && (
                  <span className="font-mono text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                    {undoCount}
                  </span>
                )}
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-400">
            يظهر {filteredAndSortedMembers.length} من {members.length} كشاف
          </span>
        </div>
      </div>

      {/* Auto-save & Daily Storage Guarantee Card */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs transition-colors">
        <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-bold">التخزين اليومي مفعل:</span>
          <span className="text-slate-700 dark:text-slate-300">
            يتم تخزين حضور وانصراف وأوقات كل يوم تلقائياً دون فقدان أي بيانات سابقة.
          </span>
        </div>
        <button
          onClick={onOpenDatePicker}
          className="text-[#00685e] dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 hover:underline shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          <span>فتح سجل وتواريخ الأيام السابقة</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-3 transition-colors">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم عن كشاف..."
            className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#00685e] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#00685e]/15 outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories Bar & Sorting Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-1">تصفية:</span>
            {(['الكل', 'براعم', 'أشبال', 'كشافة'] as const).map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#00685e] dark:bg-[#007a6e] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat === 'الكل'
                    ? 'الكل'
                    : cat === 'براعم'
                    ? 'البراعم (6-8)'
                    : cat === 'أشبال'
                    ? 'الأشبال (9-11)'
                    : 'الكشافة (12-14)'}
                </button>
              );
            })}
          </div>

          {/* Sort By Name or By Category (as requested: براعم -> أشبال -> كشافة) */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              الفرز:
            </span>
            <button
              onClick={() => {
                if (sortField === 'category') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('category');
                  setSortDirection('asc');
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                sortField === 'category'
                  ? 'bg-white dark:bg-slate-800 text-[#00685e] dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="فرز حسب الفئة: البراعم ثم الأشبال ثم الكشافة"
            >
              حسب الفئة {sortField === 'category' ? (sortDirection === 'asc' ? '↓' : '↑') : ''}
            </button>
            <button
              onClick={() => {
                if (sortField === 'name') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('name');
                  setSortDirection('asc');
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                sortField === 'name'
                  ? 'bg-white dark:bg-slate-800 text-[#00685e] dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="فرز أبجدي حسب الاسم"
            >
              حسب الاسم {sortField === 'name' ? (sortDirection === 'asc' ? 'أ-ي' : 'ي-أ') : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance & Departure Table / Card View */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden transition-colors">
        {/* Table Header (Responsive) */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="col-span-5 flex items-center gap-1.5">
            <span>الاسم وصورة الفتى</span>
          </div>
          <div className="col-span-4 text-center">
            <span>تسجيل الحضور والانصراف</span>
          </div>
          <div className="col-span-3 text-left pl-2">
            <span>الفئة الكشفية</span>
          </div>
        </div>

        {/* Member Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {filteredAndSortedMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">لم يتم العثور على كشافين مطابقين</p>
              <button
                onClick={onOpenAddMember}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00685e] dark:bg-[#007a6e] text-white text-xs font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إضافة كشاف جديد الآن</span>
              </button>
            </div>
          ) : (
            filteredAndSortedMembers.map((member, index) => {
              const record = records[member.id] || {
                memberId: member.id,
                status: 'absent',
                departureStatus: 'none',
              };
              const isPresent = record.status === 'present';
              const isExcused = record.status === 'excused';
              const isAbsent = record.status === 'absent';
              const isDeparted = record.departureStatus === 'departed';
              const categoryTheme = getCategoryColor(member.category);

              return (
                <div
                  key={member.id}
                  className={`p-3.5 sm:px-4 sm:py-3 transition-colors ${
                    isPresent
                      ? 'bg-emerald-50/25 dark:bg-emerald-950/20 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30'
                      : isExcused
                      ? 'bg-amber-50/20 dark:bg-amber-950/20 hover:bg-amber-50/30 dark:hover:bg-amber-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Field 1: الاسم وصورة الفتى (Name & Photo) */}
                    <div className="sm:col-span-5 flex items-center justify-between sm:justify-start gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Index Badge */}
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        {/* Photo Attachment / Avatar Circle */}
                        <div
                          className="relative group shrink-0"
                          onClick={() => onViewPhoto(member)}
                          title={member.photoUrl ? 'اضغط لعرض صورة الفتى' : 'اضغط لإرفاق صورة'}
                        >
                          <div
                            className={`w-11 h-11 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center shadow-xs transition-transform active:scale-95 ${
                              member.photoUrl
                                ? 'border-[#00685e] dark:border-emerald-400'
                                : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:border-[#00685e]'
                            }`}
                          >
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-300">
                                <span className="text-[11px] font-bold text-[#00685e] dark:text-emerald-300">
                                  {getBoyInitials(member.name)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick camera icon button over avatar */}
                          <button
                            type="button"
                            onClick={(e) => triggerAttachPhoto(member.id, e)}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00685e] dark:bg-[#007a6e] text-white flex items-center justify-center shadow-xs hover:bg-[#004f47] transition-all border border-white dark:border-slate-800"
                            title="إرفاق صورة جديدة للفتى"
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Name and Age Info */}
                        <div className="min-w-0">
                          <h4
                            onClick={() => onViewPhoto(member)}
                            className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate hover:text-[#00685e] dark:hover:text-emerald-300 cursor-pointer"
                          >
                            {member.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>{member.age} سنة</span>
                            {member.birthDate && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                                مواليد {member.birthDate}
                              </span>
                            )}
                            {record.checkInTime && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {record.checkInTime}
                                </span>
                              </>
                            )}
                            {record.departureTime && (
                              <>
                                <span>·</span>
                                <span className="text-teal-800 dark:text-teal-300 flex items-center gap-0.5">
                                  <LogOut className="w-3 h-3" />
                                  {record.departureTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* On mobile: Category badge beside name */}
                      <div className="sm:hidden">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${categoryTheme.badge}`}
                        >
                          {member.category}
                        </span>
                      </div>
                    </div>

                    {/* Field 2: الحضور والانصراف (Attendance & Departure) */}
                    <div className="sm:col-span-4 flex flex-wrap items-center justify-center gap-1.5">
                      {/* Attendance Buttons: حاضر / غائب / معذور */}
                      <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                        {/* حاضر */}
                        <button
                          onClick={() => handleToggleAttendance(member.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حاضر</span>
                        </button>

                        {/* غائب */}
                        <button
                          onClick={() => handleToggleAttendance(member.id, 'absent')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isAbsent
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>

                        {/* معذور */}
                        <button
                          onClick={() => handleToggleAttendance(member.id, 'excused')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isExcused
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300'
                          }`}
                        >
                          <span>معذور</span>
                        </button>
                      </div>

                      {/* Departure Toggle: انصرف / لم ينصرف */}
                      {isPresent && (
                        <button
                          onClick={() => handleToggleDeparture(member.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                            isDeparted
                              ? 'bg-[#004d46] dark:bg-[#006057] text-white border-[#004d46] dark:border-[#006057] shadow-xs'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                          }`}
                          title={isDeparted ? 'تم تسجيل انصرافه' : 'اضغط لتسجيل انصراف الكشاف'}
                        >
                          <LogOut className="w-3.5 h-3.5 text-current" />
                          <span>{isDeparted ? 'انصرف' : 'تسجيل انصراف'}</span>
                        </button>
                      )}
                    </div>

                    {/* Field 3: الفئة المخصصة (براعم / أشبال / كشافة) */}
                    <div className="hidden sm:flex sm:col-span-3 items-center justify-end pl-2">
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${categoryTheme.bg} ${categoryTheme.border} ${categoryTheme.text}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>فئة {member.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Reasons */}
                  {record.note && (
                    <div className="mt-2 mr-8 text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>ملاحظة: {record.note}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

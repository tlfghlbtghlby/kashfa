import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Check, Sparkles, Camera, Image as ImageIcon, Trash2, Calendar, Cake } from 'lucide-react';
import { ScoutMember, ScoutCategory } from '../types/scout';
import {
  getCategoryFromAge,
  getCategoryColor,
  compressScoutPhoto,
  calculateAgeFromBirthDate,
  formatBirthDateArabic,
  getBirthdayStatus,
  getTodayDateString,
} from '../utils/scoutHelper';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<ScoutMember, 'id'>, editId?: string) => void;
  memberToEdit?: ScoutMember | null;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
}) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<number>(8);
  const [category, setCategory] = useState<ScoutCategory>('براعم');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [autoCategory, setAutoCategory] = useState(true);
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setBirthDate(memberToEdit.birthDate || '');
      setAge(memberToEdit.age);
      setCategory(memberToEdit.category);
      setPhotoUrl(memberToEdit.photoUrl);
      setPhone(memberToEdit.phone || '');
      setNotes(memberToEdit.notes || '');
      setAutoCategory(false);
    } else {
      setName('');
      setBirthDate('');
      setAge(8);
      setCategory('براعم');
      setPhotoUrl(undefined);
      setPhone('');
      setNotes('');
      setAutoCategory(true);
    }
    setError('');
  }, [memberToEdit, isOpen]);

  // When birthDate changes: calculate age dynamically and update category
  const handleBirthDateChange = (newBirthDate: string) => {
    setBirthDate(newBirthDate);
    if (newBirthDate) {
      const calculatedAge = calculateAgeFromBirthDate(newBirthDate);
      setAge(calculatedAge);
      if (autoCategory || !memberToEdit) {
        setCategory(getCategoryFromAge(calculatedAge));
      }
    }
  };

  // Helper to quickly pick a birth year
  const handleSelectBirthYear = (year: number) => {
    const today = new Date();
    // Default to middle of year if picking just year
    const formattedDate = `${year}-06-15`;
    handleBirthDateChange(formattedDate);
  };

  // When age changes and autoCategory is on, update category automatically according to rules:
  // 6, 7, 8 => البراعم
  // 9, 10, 11 => الأشبال
  // 12, 13, 14 => الكشافة
  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    if (autoCategory) {
      setCategory(getCategoryFromAge(newAge));
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressScoutPhoto(file);
      setPhotoUrl(compressedDataUrl);
      setError('');
    } catch {
      setError('حدث خطأ أثناء معالجة الصورة، يرجى تجربة صورة أخرى');
    } finally {
      setIsCompressing(false);
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم العضو بالكامل');
      return;
    }
    if (age < 5 || age > 18) {
      setError('العمر المسموح به في الكشافة بين 6 و 14 سنة (أو ضمن الفئات المقررة)');
    }

    onSave(
      {
        name: name.trim(),
        age: Number(age),
        category,
        birthDate: birthDate.trim() || undefined,
        photoUrl,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      memberToEdit?.id
    );
    onClose();
  };

  const categoryStyle = getCategoryColor(category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#00685e] dark:bg-[#004f47] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-800/80 dark:bg-emerald-900 flex items-center justify-center border border-emerald-400/30">
              <UserPlus className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {memberToEdit ? 'تعديل بيانات كشاف' : 'إضافة كشاف جديد'}
              </h3>
              <p className="text-[11px] text-emerald-100">
                تسجيل الاسم، إرفاق الصورة، وتحديد الفئة العمرية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#00554d] hover:bg-[#004740] flex items-center justify-center text-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm text-slate-700 dark:text-slate-200">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 p-2.5 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Photo Attachment Section */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 flex flex-col items-center gap-2.5 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-20 h-20 rounded-full cursor-pointer overflow-hidden border-2 flex items-center justify-center shadow-md transition-all ${
                  photoUrl
                    ? 'border-[#00685e] dark:border-emerald-400 ring-2 ring-emerald-300 dark:ring-emerald-700'
                    : 'border-dashed border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 hover:border-[#00685e]'
                }`}
                title="اضغط لاختيار أو التقاط صورة الفتى"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name || 'صورة الفتى'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-300 p-2">
                    <Camera className="w-6 h-6 mb-0.5 text-[#00685e] dark:text-emerald-400" />
                    <span className="text-[10px] font-bold">صورة الفتى</span>
                  </div>
                )}
              </div>

              {/* Floating Camera Button badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#00685e] dark:bg-emerald-600 text-white flex items-center justify-center shadow-sm hover:bg-[#005047] transition-all"
                title="إرفاق صورة"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 hover:border-[#00685e] text-[#00685e] dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{photoUrl ? 'تغيير الصورة' : 'إرفاق صورة الفتى'}</span>
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              )}
            </div>
            {isCompressing && (
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium animate-pulse">
                جارٍ معالجة وضغط الصورة...
              </span>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              اسم العضو / الكشاف <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="مثال: عباس محمد الموسوي"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-[#00685e] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#00685e]/20 outline-none text-slate-900 dark:text-slate-100 font-medium"
              autoFocus
            />
          </div>

          {/* Birth Date Section (مواليد الفتى - تتحول تلقائياً إلى عمر وتتحدث مع مرور الزمن) */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00685e] dark:text-emerald-400" />
                <span>مواليد الفتى / تاريخ الميلاد</span>
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/90 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>تحديث عمري تلقائي</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={birthDate}
                max={getTodayDateString()}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-[#00685e]/20 outline-none"
              />
              {birthDate && (
                <button
                  type="button"
                  onClick={() => setBirthDate('')}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
                  title="مسح تاريخ الميلاد"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Birth Year Selector */}
            <div>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                أو اختر سنة المواليد سريعاً:
              </span>
              <div className="flex flex-wrap gap-1">
                {[2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012].map((yr) => {
                  const isSelected = birthDate.startsWith(String(yr));
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectBirthYear(yr)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        isSelected
                          ? 'bg-[#00685e] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Age feedback indicator */}
            {birthDate ? (
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-950 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Cake className="w-4 h-4 text-amber-500" />
                    <span>العمر المحسوب:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-black">{age} سنوات</strong>
                  </span>
                  <span className="text-[10px] bg-[#00685e] text-white px-2 py-0.5 rounded-full font-bold">
                    فئة {category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                  ✨ <strong>ميزة التحديث التلقائي:</strong> عند حلول يوم ميلاد الفتى في كل سنة، سيزداد عمره تلقائياً وتنتقل فئته الكشفية آلياً (مثلاً من 7 سنوات براعم إلى 8 ثم 9 أشبال).
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-tight">
                💡 إدخال المواليد يجعل عمر الكشاف وفئته يتجددان ذاتياً كلما مرت السنين.
              </p>
            )}
          </div>

          {/* Age & Category Confirmation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                العمر المعتمد <span className="text-rose-500">*</span>
              </label>
              <select
                value={age}
                onChange={(e) => handleAgeChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-[#00685e] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#00685e]/20 outline-none bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100"
              >
                <optgroup label="فئة البراعم (6 - 8 سنوات)">
                  <option value={6}>6 سنوات (براعم)</option>
                  <option value={7}>7 سنوات (براعم)</option>
                  <option value={8}>8 سنوات (براعم)</option>
                </optgroup>
                <optgroup label="فئة الأشبال (9 - 11 سنة)">
                  <option value={9}>9 سنوات (أشبال)</option>
                  <option value={10}>10 سنوات (أشبال)</option>
                  <option value={11}>11 سنة (أشبال)</option>
                </optgroup>
                <optgroup label="فئة الكشافة (12 - 14 سنة)">
                  <option value={12}>12 سنة (كشافة)</option>
                  <option value={13}>13 سنة (كشافة)</option>
                  <option value={14}>14 سنة (كشافة)</option>
                </optgroup>
              </select>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                الفئة المعتمدة
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ScoutCategory);
                    setAutoCategory(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold outline-none transition-colors ${categoryStyle.border} ${categoryStyle.bg} ${categoryStyle.text}`}
                >
                  <option value="براعم">فئة البراعم (6-8)</option>
                  <option value="أشبال">فئة الأشبال (9-11)</option>
                  <option value="كشافة">فئة الكشافة (12-14)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Age-category rule explanation helper */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#00685e] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-800 dark:text-slate-100">قاعدة التصنيف العمري:</span>
              <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                <span className={category === 'براعم' ? 'text-emerald-700 dark:text-emerald-300 font-bold' : ''}>
                  • 6، 7، 8: براعم
                </span>
                <span className={category === 'أشبال' ? 'text-teal-800 dark:text-teal-300 font-bold' : ''}>
                  • 9، 10، 11: أشبال
                </span>
                <span className={category === 'كشافة' ? 'text-cyan-800 dark:text-cyan-300 font-bold' : ''}>
                  • 12، 13، 14: كشافة
                </span>
              </div>
            </div>
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              رقم هاتف ولي الأمر (اختياري)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-[#00685e] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#00685e]/20 outline-none text-slate-900 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              ملاحظات إضافية (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: قائد طليعة، حالة صحية خاصة، إلخ"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-[#00685e] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#00685e]/20 outline-none text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00685e] dark:bg-[#007a6e] hover:bg-[#00554d] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/10 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{memberToEdit ? 'حفظ التعديلات' : 'إضافة الكشاف'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

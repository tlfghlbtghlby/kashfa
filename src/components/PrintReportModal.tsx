import React from 'react';
import { X, Printer, Download, CheckCircle2, FileText } from 'lucide-react';
import { ScoutMember, AttendanceSession } from '../types/scout';
import { formatArabicDate, CATEGORY_ORDER } from '../utils/scoutHelper';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDate: string;
  session?: AttendanceSession;
  members: ScoutMember[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  activeDate,
  session,
  members,
}) => {
  if (!isOpen) return null;

  const records = session?.records || {};

  // Sort members by category (براعم -> أشبال -> كشافة) then name
  const sortedMembers = [...members].sort((a, b) => {
    const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name, 'ar');
  });

  const presentCount = Object.values(records).filter((r) => r.status === 'present').length;
  const departedCount = Object.values(records).filter((r) => r.departureStatus === 'departed').length;
  const absentCount = Object.values(records).filter((r) => r.status === 'absent').length;
  const excusedCount = Object.values(records).filter((r) => r.status === 'excused').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['ت', 'الاسم', 'المواليد', 'العمر', 'الفئة', 'حالة الحضور', 'حالة الانصراف', 'وقت الحضور', 'وقت الانصراف', 'ملاحظات'];
    const rows = sortedMembers.map((m, idx) => {
      const r = records[m.id];
      const statusText =
        r?.status === 'present' ? 'حاضر' : r?.status === 'excused' ? 'معذور' : 'غائب';
      const depText = r?.departureStatus === 'departed' ? 'انصرف' : r?.status === 'present' ? 'موجود' : '-';
      return [
        idx + 1,
        `"${m.name}"`,
        `"${m.birthDate || '-'}"`,
        m.age,
        `"فئة ${m.category}"`,
        `"${statusText}"`,
        `"${depText}"`,
        `"${r?.checkInTime || '-'}"`,
        `"${r?.departureTime || '-'}"`,
        `"${r?.note || m.notes || '-'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_حضور_وانصراف_كشافة_العباس_${activeDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
        {/* Modal Top Actions (no-print) */}
        <div className="no-print bg-[#00685e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-sm sm:text-base">
              تقرير كشف الحضور والانصراف الرسمي
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel/CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white text-[#00685e] hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#00554d] hover:bg-[#004740] flex items-center justify-center text-emerald-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 sm:p-8 bg-white text-slate-800 text-sm print:p-0">
          {/* Official Letterhead */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#00685e]">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/_____________e13acb2d.jpg"
                alt="شعار كشافة العباس"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#00685e]"
              />
              <div>
                <h2 className="text-xl font-black text-[#00685e]">
                  كشافة العباس <span className="text-sm font-normal">(ع)</span>
                </h2>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  سجل كشف الحضور والانصراف الميداني
                </p>
                <p className="text-[11px] text-slate-500">
                  فئات: البراعم (6-8) · الأشبال (9-11) · الكشافة (12-14)
                </p>
              </div>
            </div>

            <div className="text-left text-xs space-y-1">
              <div>
                <span className="font-bold text-slate-700">التاريخ: </span>
                <span className="font-mono font-bold text-slate-900 dir-ltr">{activeDate}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {formatArabicDate(activeDate)}
              </div>
              {session?.title && (
                <div className="text-[11px] text-emerald-800 font-bold">
                  المناسبة: {session.title}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary Bar */}
          <div className="my-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">إجمالي الأعضاء</div>
              <strong className="text-slate-900 text-base">{members.length}</strong>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <div className="text-emerald-700 text-[11px]">حضور</div>
              <strong className="text-emerald-800 text-base">{presentCount}</strong>
            </div>
            <div className="bg-teal-50 p-2 rounded-lg border border-teal-200">
              <div className="text-teal-700 text-[11px]">انصراف</div>
              <strong className="text-teal-800 text-base">{departedCount}</strong>
            </div>
            <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
              <div className="text-rose-700 text-[11px]">غياب ومعذور</div>
              <strong className="text-rose-800 text-base">{absentCount + excusedCount}</strong>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-right text-xs border border-slate-300">
            <thead>
              <tr className="bg-[#00685e] text-white">
                <th className="p-2 border border-slate-300 text-center w-8">ت</th>
                <th className="p-2 border border-slate-300">اسم الكشاف</th>
                <th className="p-2 border border-slate-300 text-center w-16">العمر</th>
                <th className="p-2 border border-slate-300 text-center w-24">الفئة</th>
                <th className="p-2 border border-slate-300 text-center w-24">الحضور</th>
                <th className="p-2 border border-slate-300 text-center w-24">الانصراف</th>
                <th className="p-2 border border-slate-300">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedMembers.map((member, index) => {
                const rec = records[member.id];
                const isPresent = rec?.status === 'present';
                const isExcused = rec?.status === 'excused';
                const isDeparted = rec?.departureStatus === 'departed';

                return (
                  <tr key={member.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-[#00685e] shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-400 text-[9px] flex items-center justify-center shrink-0">
                            -
                          </div>
                        )}
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold">
                      <div>{member.age} سنة</div>
                      {member.birthDate && (
                        <div className="text-[9px] text-slate-500 font-normal">مواليد {member.birthDate}</div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      <span
                        className={
                          member.category === 'براعم'
                            ? 'text-emerald-700'
                            : member.category === 'أشبال'
                            ? 'text-teal-800'
                            : 'text-cyan-900'
                        }
                      >
                        {member.category}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-300 text-center">
                      <span
                        className={`font-bold ${
                          isPresent
                            ? 'text-emerald-700'
                            : isExcused
                            ? 'text-amber-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {isPresent ? 'حاضر' : isExcused ? 'معذور' : 'غائب'}
                      </span>
                      {rec?.checkInTime && isPresent && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {rec.checkInTime}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center">
                      <span
                        className={`font-bold ${
                          isDeparted ? 'text-teal-800' : isPresent ? 'text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {isDeparted ? 'انصرف' : isPresent ? 'لم ينصرف' : '-'}
                      </span>
                      {rec?.departureTime && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {rec.departureTime}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-[11px] text-slate-600">
                      {rec?.note || member.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Formed Patrols Summary in Print */}
          {session?.patrols && session.patrols.length > 0 && (
            <div className="mt-6 pt-4 border-t-2 border-slate-300">
              <h4 className="font-bold text-xs text-[#00685e] mb-2">
                تشكيل طلائع الحاضرين (المجاميع الميدانية):
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {session.patrols.map((patrol, idx) => {
                  const pMembers = patrol.memberIds
                    .map((id) => members.find((m) => m.id === id))
                    .filter(Boolean) as ScoutMember[];
                  const leader = pMembers[0];
                  const others = pMembers.slice(1);

                  return (
                    <div key={patrol.id} className="border border-slate-300 p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1 font-bold">
                        <span className="text-[#00685e]">
                          {patrol.name || `طليعة #${idx + 1}`} ({patrol.category})
                        </span>
                        <span className="text-[10px] text-slate-500">{pMembers.length} أفراد</span>
                      </div>
                      {leader && (
                        <div className="font-bold text-amber-900 text-[11px] mb-0.5">
                          ⭐ قائد الطليعة: {leader.name} ({leader.age} سنة)
                        </div>
                      )}
                      <div className="text-[10px] text-slate-600">
                        {others.map((o) => o.name).join(' · ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-8 pt-6 flex justify-between items-center text-xs text-slate-700 border-t border-slate-200">
            <div className="text-center space-y-4">
              <span className="font-bold">قائد الوحدة الكشفية</span>
              <div className="text-slate-400">التوقيع: .....................</div>
            </div>
            <div className="text-center space-y-4">
              <span className="font-bold">مسؤول شؤون الكشافين</span>
              <div className="text-slate-400">التوقيع: .....................</div>
            </div>
            <div className="text-center space-y-4">
              <span className="font-bold">مفوضية كشافة العباس (ع)</span>
              <div className="text-slate-400">الختم الرسمي</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (no-print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

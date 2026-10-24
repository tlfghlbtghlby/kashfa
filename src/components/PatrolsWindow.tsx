import React, { useState, useMemo } from 'react';
import {
  Shield,
  Crown,
  Users,
  Plus,
  Trash2,
  ArrowUp,
  UserCheck,
  Sparkles,
  Printer,
  ChevronDown,
  AlertCircle,
  Edit3,
  Calendar,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { ScoutMember, ScoutCategory, ScoutPatrol, DayAttendance } from '../types/scout';
import { getCategoryColor, autoGeneratePatrols, getBoyInitials, formatArabicDate } from '../utils/scoutHelper';

interface PatrolsWindowProps {
  members: ScoutMember[];
  activeDate: string;
  records: Record<string, DayAttendance>;
  patrols: ScoutPatrol[];
  onUpdatePatrols: (newPatrols: ScoutPatrol[]) => void;
  onViewPhoto: (member: ScoutMember) => void;
}

export const PatrolsWindow: React.FC<PatrolsWindowProps> = ({
  members,
  activeDate,
  records,
  patrols,
  onUpdatePatrols,
  onViewPhoto,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<ScoutCategory | 'الكل'>('الكل');
  const [newPatrolCategory, setNewPatrolCategory] = useState<ScoutCategory>('كشافة');
  const [showAddPatrolForm, setShowAddPatrolForm] = useState(false);
  const [newPatrolName, setNewPatrolName] = useState('');

  // 1. Filter present members for the active date
  const presentMembers = useMemo(() => {
    return members.filter((m) => records[m.id]?.status === 'present');
  }, [members, records]);

  const presentMemberIds = useMemo(() => {
    return presentMembers.map((m) => m.id);
  }, [presentMembers]);

  // Breakdown of present members by category
  const presentCountsByCategory = useMemo(() => {
    return {
      براعم: presentMembers.filter((m) => m.category === 'براعم').length,
      أشبال: presentMembers.filter((m) => m.category === 'أشبال').length,
      كشافة: presentMembers.filter((m) => m.category === 'كشافة').length,
    };
  }, [presentMembers]);

  // 2. Members map for quick lookup
  const membersMap = useMemo(() => {
    const map = new Map<string, ScoutMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // 3. Find unassigned present members
  const assignedMemberIds = useMemo(() => {
    const set = new Set<string>();
    patrols.forEach((p) => {
      p.memberIds.forEach((id) => set.add(id));
    });
    return set;
  }, [patrols]);

  const unassignedPresentMembers = useMemo(() => {
    return presentMembers.filter((m) => !assignedMemberIds.has(m.id));
  }, [presentMembers, assignedMemberIds]);

  // Handler: Auto-generate Patrols (5 members each, single category per patrol, first is leader)
  const handleAutoFormPatrols = () => {
    if (presentMembers.length === 0) {
      alert('لا يوجد أعضاء مسجلين بحالة (حاضر) في تاريخ اليوم لتشكيل الطلائع. يرجى تسجيل حضور الكشافين أولاً من النافذة الأولى.');
      return;
    }
    const generated = autoGeneratePatrols(members, presentMemberIds, 5);
    onUpdatePatrols(generated);
  };

  // Handler: Change Patrol Name
  const handlePatrolNameChange = (patrolId: string, name: string) => {
    onUpdatePatrols(
      patrols.map((p) => (p.id === patrolId ? { ...p, name } : p))
    );
  };

  // Handler: Delete Patrol
  const handleDeletePatrol = (patrolId: string) => {
    onUpdatePatrols(patrols.filter((p) => p.id !== patrolId));
  };

  // Handler: Make Member the Leader (Moves member to index 0 in patrol)
  const handleMakeLeader = (patrolId: string, memberId: string) => {
    onUpdatePatrols(
      patrols.map((p) => {
        if (p.id !== patrolId) return p;
        const currentMembers = [...p.memberIds];
        const memberIndex = currentMembers.indexOf(memberId);
        if (memberIndex === -1 || memberIndex === 0) return p;

        // Move to index 0
        currentMembers.splice(memberIndex, 1);
        currentMembers.unshift(memberId);
        return { ...p, memberIds: currentMembers };
      })
    );
  };

  // Handler: Remove Member from Patrol
  const handleRemoveMemberFromPatrol = (patrolId: string, memberId: string) => {
    onUpdatePatrols(
      patrols.map((p) => {
        if (p.id !== patrolId) return p;
        return {
          ...p,
          memberIds: p.memberIds.filter((id) => id !== memberId),
        };
      })
    );
  };

  // Handler: Add Member to Patrol (Only if same category & not exceeding 5 recommended)
  const handleAddMemberToPatrol = (patrolId: string, memberId: string) => {
    onUpdatePatrols(
      patrols.map((p) => {
        if (p.id !== patrolId) return p;
        if (p.memberIds.includes(memberId)) return p;
        return {
          ...p,
          memberIds: [...p.memberIds, memberId],
        };
      })
    );
  };

  // Handler: Create New Custom Patrol
  const handleCreateNewPatrol = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newPatrolName.trim() || `طليعة جديدة (${newPatrolCategory})`;
    const newPatrol: ScoutPatrol = {
      id: `patrol_${Date.now()}`,
      name: finalName,
      category: newPatrolCategory,
      memberIds: [],
    };
    onUpdatePatrols([...patrols, newPatrol]);
    setNewPatrolName('');
    setShowAddPatrolForm(false);
  };

  // Filter patrols by category
  const filteredPatrols = useMemo(() => {
    if (categoryFilter === 'الكل') return patrols;
    return patrols.filter((p) => p.category === categoryFilter);
  }, [patrols, categoryFilter]);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#00685e] dark:text-emerald-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60 shrink-0">
              <Shield className="w-5 h-5 text-[#00685e] dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">طلائع الحاضرين لتاريخ:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#00685e] dark:bg-[#007a6e] text-white font-mono font-bold text-xs">
                  {activeDate}
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                  {presentMembers.length} كشاف حاضر
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
                تشكيل مجاميع الكشافة (5 أفراد لكل طليعة من فئة واحدة مع قائد الطليعة)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFormPatrols}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#00685e] dark:bg-[#007a6e] hover:bg-[#00554d] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="تشكيل آلي لجميع الحاضرين في مجموعات خماسية حسب الفئة"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>تشكيل تلقائي للطلائع (5 لكل طليعة)</span>
            </button>

            <button
              onClick={() => setShowAddPatrolForm(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#00685e] dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-[#00685e] dark:hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">طليعة جديدة</span>
            </button>
          </div>
        </div>

        {/* Presence breakdown per category */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">الحاضرون المؤهلون:</span>
            <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md text-[11px]">
              البراعم: <strong>{presentCountsByCategory.براعم}</strong>
            </span>
            <span className="bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded-md text-[11px]">
              الأشبال: <strong>{presentCountsByCategory.أشبال}</strong>
            </span>
            <span className="bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 px-2 py-0.5 rounded-md text-[11px]">
              الكشافة: <strong>{presentCountsByCategory.كشافة}</strong>
            </span>
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            إجمالي الطلائع المشكلة:{' '}
            <strong className="text-slate-800 dark:text-slate-100">{patrols.length}</strong> طليعة
          </span>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 transition-colors">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-1">عرض الطلائع:</span>
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
                  ? `كافة الطلائع (${patrols.length})`
                  : cat === 'براعم'
                  ? `طلائع البراعم (${patrols.filter((p) => p.category === 'براعم').length})`
                  : cat === 'أشبال'
                  ? `طلائع الأشبال (${patrols.filter((p) => p.category === 'أشبال').length})`
                  : `طلائع الكشافة (${patrols.filter((p) => p.category === 'كشافة').length})`}
              </button>
            );
          })}
        </div>

        {patrols.length > 0 && (
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة توزيع الطلائع</span>
          </button>
        )}
      </div>

      {/* Modal / In-line form to add custom patrol */}
      {showAddPatrolForm && (
        <form
          onSubmit={handleCreateNewPatrol}
          className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00685e]" />
              <span className="text-xs font-bold text-slate-800">إنشاء طليعة كشفية جديدة</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPatrolForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                اسم الطليعة
              </label>
              <input
                type="text"
                value={newPatrolName}
                onChange={(e) => setNewPatrolName(e.target.value)}
                placeholder="مثال: طليعة الفرسان، سداسي الأمل..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#00685e] outline-none text-xs bg-white font-bold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                الفئة العمرية المخصصة للطليعة
              </label>
              <select
                value={newPatrolCategory}
                onChange={(e) => setNewPatrolCategory(e.target.value as ScoutCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#00685e] outline-none text-xs bg-white font-bold"
              >
                <option value="براعم">فئة البراعم (6 - 8 سنوات)</option>
                <option value="أشبال">فئة الأشبال (9 - 11 سنة)</option>
                <option value="كشافة">فئة الكشافة (12 - 14 سنة)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00685e] hover:bg-[#00554d] text-white text-xs font-bold transition-all shadow-xs"
            >
              حفظ وإنشاء الطليعة
            </button>
          </div>
        </form>
      )}

      {/* Unassigned Present Scouts Banner (if any) */}
      {unassignedPresentMembers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold">
                كشافون حاضرون لم يتم توزيعهم بعد في أي طليعة ({unassignedPresentMembers.length}):
              </span>
            </div>
            <button
              onClick={handleAutoFormPatrols}
              className="text-[11px] text-[#00685e] font-bold underline hover:text-[#004f47]"
            >
              توزيعهم آلياً في طلائع خماسية
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {unassignedPresentMembers.map((member) => {
              const catTheme = getCategoryColor(member.category);
              return (
                <div
                  key={member.id}
                  className="bg-white border border-amber-200 px-2.5 py-1.5 rounded-xl flex items-center gap-2 text-xs shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500">
                        {getBoyInitials(member.name)}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-800">{member.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${catTheme.badge}`}>
                    {member.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patrols Groups Grid / Fields */}
      {filteredPatrols.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
          <Shield className="w-12 h-12 mx-auto text-emerald-800/40" />
          <h3 className="text-sm font-bold text-slate-800">
            {presentMembers.length === 0
              ? 'لا يوجد كشافون حاضرون مسجلون اليوم'
              : 'لم يتم تشكيل أي طلائع كشفية بعد'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {presentMembers.length === 0
              ? 'قم بالدخول إلى النافذة الأولى وسجل الحضور، ثم عد إلى هنا لتشكيل المجاميع والطلائع.'
              : 'اضغط على زر (تشكيل تلقائي للطلائع) لتوزيع الحاضرين في مجاميع خماسية (5 لكل مجموعة) من نفس الفئة العمرية.'}
          </p>
          {presentMembers.length > 0 && (
            <button
              onClick={handleAutoFormPatrols}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00685e] hover:bg-[#00554d] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>تشكيل تلقائي للطلائع الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatrols.map((patrol, pIndex) => {
            const catTheme = getCategoryColor(patrol.category);
            const patrolMembers = patrol.memberIds
              .map((id) => membersMap.get(id))
              .filter(Boolean) as ScoutMember[];

            const leader = patrolMembers[0]; // First member is the patrol leader
            const otherMembers = patrolMembers.slice(1);

            // Unassigned members of the SAME category to allow manual adding
            const availableForPatrol = unassignedPresentMembers.filter(
              (m) => m.category === patrol.category
            );

            return (
              <div
                key={patrol.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border-2 border-slate-200/90 dark:border-slate-700 overflow-hidden flex flex-col hover:border-[#00685e]/40 dark:hover:border-emerald-500/40 transition-all"
              >
                {/* 1. الخانة في أعلى المجموعة: تحتوي على اسم الطليعة وتصنيف الفئة */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400">
                      طليعة #{pIndex + 1}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Category Badge */}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold ${catTheme.badge}`}
                      >
                        فئة {patrol.category}
                      </span>

                      {/* Count Badge (e.g. 5/5) */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                          patrolMembers.length === 5
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : patrolMembers.length > 5
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {patrolMembers.length} / 5 أفراد
                      </span>

                      {/* Delete patrol */}
                      <button
                        onClick={() => handleDeletePatrol(patrol.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="حذف هذه الطليعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* اسم الطليعة Editable Input Box */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      اسم الطليعة:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={patrol.name}
                          onChange={(e) => handlePatrolNameChange(patrol.id, e.target.value)}
                          placeholder="اكتب اسم الطليعة هنا..."
                          className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-[#00685e] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#00685e]/15 outline-none font-black text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. أعضاء المجموعة: الأول هو قائد الطليعة وباقي الأفراد */}
                <div className="p-3.5 flex-1 space-y-2.5">
                  {/* Leader Row (الاسم الأول = قائد الطليعة) */}
                  {leader ? (
                    <div className="bg-gradient-to-r from-amber-50/90 to-emerald-50/70 dark:from-amber-950/40 dark:to-emerald-950/30 border-2 border-amber-300/80 dark:border-amber-700/70 rounded-xl p-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Photo with Crown */}
                          <div
                            onClick={() => onViewPhoto(leader)}
                            className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-500 shrink-0 cursor-pointer bg-white dark:bg-slate-800 shadow-xs"
                            title="قائد الطليعة - اضغط لعرض البطاقة"
                          >
                            {leader.photoUrl ? (
                              <img
                                src={leader.photoUrl}
                                alt={leader.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#00685e] dark:text-emerald-300">
                                {getBoyInitials(leader.name)}
                              </div>
                            )}
                            <div className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs">
                              <Crown className="w-2.5 h-2.5" />
                            </div>
                          </div>

                          {/* Leader Name and Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded flex items-center gap-0.5 shadow-2xs">
                                <Crown className="w-2.5 h-2.5" />
                                <span>قائد الطليعة</span>
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                (العضو رقم 1)
                              </span>
                            </div>
                            <h4
                              onClick={() => onViewPhoto(leader)}
                              className="font-black text-sm text-slate-900 dark:text-slate-100 truncate hover:text-[#00685e] dark:hover:text-emerald-300 cursor-pointer mt-0.5"
                            >
                              {leader.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              العمر: {leader.age} سنة
                            </span>
                          </div>
                        </div>

                        {/* Remove leader from patrol */}
                        <button
                          onClick={() => handleRemoveMemberFromPatrol(patrol.id, leader.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          title="إزالة من الطليعة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-800 rounded-xl p-3 text-center text-xs text-amber-800 dark:text-amber-300">
                      لم يتم تعيين قائد لهذه الطليعة بعد. أضف أعضاء ليصبح الاسم الأول قائداً.
                    </div>
                  )}

                  {/* Rest of the 4 Members (الأعضاء من 2 إلى 5) */}
                  <div className="space-y-1.5">
                    {otherMembers.map((member, mIdx) => (
                      <div
                        key={member.id}
                        className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/70 rounded-xl px-2.5 py-2 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Slot number: 2, 3, 4, 5 */}
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {mIdx + 2}
                          </span>

                          {/* Member Photo */}
                          <div
                            onClick={() => onViewPhoto(member)}
                            className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 bg-white dark:bg-slate-800 cursor-pointer"
                            title="اضغط لعرض صورة الفتى"
                          >
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                                {getBoyInitials(member.name)}
                              </div>
                            )}
                          </div>

                          {/* Name and age */}
                          <div className="min-w-0">
                            <span
                              onClick={() => onViewPhoto(member)}
                              className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block hover:text-[#00685e] dark:hover:text-emerald-300 cursor-pointer"
                            >
                              {member.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {member.age} سنة
                            </span>
                          </div>
                        </div>

                        {/* Actions for member */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMakeLeader(patrol.id, member.id)}
                            className="px-2 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-950/70 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                            title="تعيين هذا الكشاف كقائد للطليعة (يصبح الاسم الأول)"
                          >
                            <ArrowUp className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>ترقية لقائد</span>
                          </button>
                          <button
                            onClick={() => handleRemoveMemberFromPatrol(patrol.id, member.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="إزالة من الطليعة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slot empty reminders if under 5 */}
                  {patrolMembers.length < 5 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">
                      المتبقي لاكتمال الطليعة الخماسية: {5 - patrolMembers.length} أفراد
                    </div>
                  )}

                  {/* Add Unassigned Member of same category */}
                  {availableForPatrol.length > 0 && (
                    <div className="pt-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMemberToPatrol(patrol.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="w-full py-1.5 px-3 rounded-xl border border-dashed border-[#00685e]/40 dark:border-emerald-600/50 hover:border-[#00685e] dark:hover:border-emerald-400 text-[#00685e] dark:text-emerald-300 text-xs font-bold bg-emerald-50/40 dark:bg-emerald-950/30 outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          + إضافة كشاف حاضر من فئة ({patrol.category})...
                        </option>
                        {availableForPatrol.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.age} سنة)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Header
} from './components/Header';
import { AttendanceWindow } from './components/AttendanceWindow';
import { MembersWindow } from './components/MembersWindow';
import { PatrolsWindow } from './components/PatrolsWindow';
import { AddMemberModal } from './components/AddMemberModal';
import { DatePickerModal } from './components/DatePickerModal';
import { PrintReportModal } from './components/PrintReportModal';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ContactActionModal } from './components/ContactActionModal';
import {
  ScoutMember,
  ScoutPatrol,
  AttendanceSession,
  AttendanceStatus,
  DepartureStatus,
  DayAttendance
} from './types/scout';
import {
  loadMembersFromStorage,
  saveMembersToStorage,
  loadSessionsFromStorage,
  saveSessionsToStorage,
  loadActiveDate,
  saveActiveDate,
  getTodayDateString,
  getCurrentTimeArabic,
  INITIAL_MEMBERS
} from './utils/scoutHelper';
import { CheckCircle2, Users, Calendar, PlusCircle, Smartphone, Sparkles, RotateCcw, Shield, Check, Undo2, Redo2, X } from 'lucide-react';

interface HistorySnapshot {
  id: string;
  timestamp: number;
  description: string;
  members: ScoutMember[];
  sessions: Record<string, AttendanceSession>;
  activeDate: string;
}

interface ToastState {
  message: string;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'members' | 'patrols'>('attendance');
  const [members, setMembers] = useState<ScoutMember[]>(loadMembersFromStorage);
  const [sessions, setSessions] = useState<Record<string, AttendanceSession>>(loadSessionsFromStorage);
  const [activeDate, setActiveDate] = useState<string>(loadActiveDate);

  // Dark Mode Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kashafa_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kashafa_theme', isDarkMode ? 'dark' : 'light');
    } catch {}
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ScoutMember | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [selectedMemberForPhoto, setSelectedMemberForPhoto] = useState<ScoutMember | null>(null);
  const [selectedMemberForContact, setSelectedMemberForContact] = useState<ScoutMember | null>(null);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Undo & Redo History State (أداة التراجع والإعادة)
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveMembersToStorage(members);
  }, [members]);

  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  useEffect(() => {
    saveActiveDate(activeDate);
  }, [activeDate]);

  // Ensure current active date has an initialized session
  useEffect(() => {
    if (!sessions[activeDate]) {
      const newSession: AttendanceSession = {
        date: activeDate,
        title: 'نشاط كشفي',
        records: {},
      };
      setSessions((prev) => ({
        ...prev,
        [activeDate]: newSession,
      }));
    }
  }, [activeDate, sessions]);

  // Snapshot recording function before any state modification
  const recordAction = useCallback((description: string) => {
    setUndoStack((prev) => [
      ...prev.slice(-39), // maintain up to 40 history steps
      {
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        description,
        members: members.map((m) => ({ ...m })),
        sessions: JSON.parse(JSON.stringify(sessions)),
        activeDate,
      },
    ]);
    setRedoStack([]); // Clear redo on fresh new user action

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message: description, canUndo: true });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, [members, sessions, activeDate]);

  // Execute Undo (تراجع عن الإجراء السابق)
  const handleUndo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;

      const previousSnapshot = prevUndo[prevUndo.length - 1];
      const newUndoStack = prevUndo.slice(0, -1);

      // Save current state into redo stack
      setRedoStack((prevRedo) => [
        ...prevRedo.slice(-39),
        {
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          description: previousSnapshot.description,
          members: members.map((m) => ({ ...m })),
          sessions: JSON.parse(JSON.stringify(sessions)),
          activeDate,
        },
      ]);

      // Restore snapshot
      setMembers(previousSnapshot.members);
      setSessions(previousSnapshot.sessions);
      setActiveDate(previousSnapshot.activeDate);

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({
        message: `تم التراجع عن: ${previousSnapshot.description}`,
        canUndo: newUndoStack.length > 0,
        canRedo: true,
      });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 4500);

      return newUndoStack;
    });
  }, [members, sessions, activeDate]);

  // Execute Redo (إعادة تطبيق الإجراء)
  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;

      const nextSnapshot = prevRedo[prevRedo.length - 1];
      const newRedoStack = prevRedo.slice(0, -1);

      // Save current state into undo stack
      setUndoStack((prevUndo) => [
        ...prevUndo.slice(-39),
        {
          id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          description: nextSnapshot.description,
          members: members.map((m) => ({ ...m })),
          sessions: JSON.parse(JSON.stringify(sessions)),
          activeDate,
        },
      ]);

      // Restore next state
      setMembers(nextSnapshot.members);
      setSessions(nextSnapshot.sessions);
      setActiveDate(nextSnapshot.activeDate);

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({
        message: `تمت إعادة: ${nextSnapshot.description}`,
        canUndo: true,
        canRedo: newRedoStack.length > 0,
      });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 4500);

      return newRedoStack;
    });
  }, [members, sessions, activeDate]);

  // Keyboard shortcut listener (Ctrl+Z: تراجع, Ctrl+Y / Ctrl+Shift+Z: إعادة)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Current session & records
  const currentSession = sessions[activeDate];
  const currentRecords = currentSession?.records || {};

  // Compute daily stats for Header
  const dailyStats = useMemo(() => {
    const recordsList = Object.values(currentRecords);
    const present = recordsList.filter((r) => r.status === 'present').length;
    const departed = recordsList.filter((r) => r.departureStatus === 'departed').length;
    const absent = recordsList.filter((r) => r.status === 'absent').length;
    return {
      total: members.length,
      present,
      departed,
      absent,
    };
  }, [currentRecords, members.length]);

  // Handler: Add or Edit Member (Synchronizes to both Window 1 and Window 2)
  const handleSaveMember = (memberData: Omit<ScoutMember, 'id'>, editId?: string) => {
    const targetName = editId ? (members.find((m) => m.id === editId)?.name || memberData.name) : memberData.name;
    recordAction(editId ? `تعديل بيانات الكشاف ${targetName}` : `إضافة الكشاف الجديد ${targetName}`);

    if (editId) {
      // Edit existing member
      setMembers((prev) =>
        prev.map((m) => (m.id === editId ? { ...m, ...memberData } : m))
      );
    } else {
      // Add new member
      const newId = `m_${Date.now()}`;
      const newMember: ScoutMember = {
        id: newId,
        ...memberData,
        joinedDate: getTodayDateString(),
      };
      setMembers((prev) => [...prev, newMember]);

      // Initialize record for active session
      setSessions((prev) => {
        const session = prev[activeDate] || { date: activeDate, records: {} };
        return {
          ...prev,
          [activeDate]: {
            ...session,
            records: {
              ...session.records,
              [newId]: {
                memberId: newId,
                status: 'present',
                departureStatus: 'present_not_departed',
                checkInTime: getCurrentTimeArabic(),
              },
            },
          },
        };
      });
    }
  };

  // Handler: Delete Member
  const handleDeleteMember = (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    recordAction(`حذف الكشاف ${target?.name || ''}`);

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    // Clean up records from active sessions
    setSessions((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((d) => {
        if (updated[d].records && updated[d].records[memberId]) {
          const newRecs = { ...updated[d].records };
          delete newRecs[memberId];
          updated[d] = { ...updated[d], records: newRecs };
        }
      });
      return updated;
    });
  };

  // Handler: Attach/update photo directly for a boy
  const handleAttachPhoto = (memberId: string, photoUrl: string) => {
    const target = members.find((m) => m.id === memberId);
    recordAction(`تحديث صورة الكشاف ${target?.name || ''}`);

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, photoUrl } : m))
    );
  };

  // Handler: Update Attendance status (حاضر / غائب / معذور)
  const handleUpdateAttendance = (
    memberId: string,
    status: AttendanceStatus,
    departureStatus?: DepartureStatus
  ) => {
    const target = members.find((m) => m.id === memberId);
    const statusLabel = status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : 'معذور';
    recordAction(`تسجيل ${target?.name || 'الكشاف'} كـ ${statusLabel}`);

    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const existing = session.records[memberId] || {
        memberId,
        status: 'absent',
        departureStatus: 'none',
      };

      const newRecord: DayAttendance = {
        ...existing,
        status,
        departureStatus: departureStatus !== undefined ? departureStatus : existing.departureStatus,
      };

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: {
            ...session.records,
            [memberId]: newRecord,
          },
        },
      };
    });
  };

  // Handler: Update check-in or departure times and notes
  const handleUpdateTimes = (
    memberId: string,
    checkInTime?: string,
    departureTime?: string,
    note?: string
  ) => {
    const target = members.find((m) => m.id === memberId);
    recordAction(`تحديث وقت أو ملاحظة الكشاف ${target?.name || ''}`);

    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const existing = session.records[memberId] || {
        memberId,
        status: 'present',
        departureStatus: 'present_not_departed',
      };

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: {
            ...session.records,
            [memberId]: {
              ...existing,
              checkInTime: checkInTime !== undefined ? checkInTime : existing.checkInTime,
              departureTime: departureTime !== undefined ? departureTime : existing.departureTime,
              note: note !== undefined ? note : existing.note,
            },
          },
        },
      };
    });
  };

  // Bulk Attendance
  const handleBulkAttendance = (status: AttendanceStatus) => {
    recordAction(status === 'present' ? 'تحضير جميع الكشافين' : 'تصفير سجل حضور الجميع');

    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const updatedRecords: Record<string, DayAttendance> = { ...session.records };

      members.forEach((m) => {
        const prevRec = updatedRecords[m.id];
        updatedRecords[m.id] = {
          memberId: m.id,
          status,
          departureStatus: status === 'present' ? 'present_not_departed' : 'none',
          checkInTime: status === 'present' ? (prevRec?.checkInTime || getCurrentTimeArabic()) : undefined,
          departureTime: status === 'present' ? prevRec?.departureTime : undefined,
          note: prevRec?.note,
        };
      });

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: updatedRecords,
        },
      };
    });
  };

  // Bulk Departure
  const handleBulkDeparture = (departureStatus: DepartureStatus) => {
    recordAction(departureStatus === 'departed' ? 'تسجيل انصراف جميع الحاضرين' : 'إلغاء انصراف الكشافين');

    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const updatedRecords: Record<string, DayAttendance> = { ...session.records };

      members.forEach((m) => {
        const prevRec = updatedRecords[m.id];
        if (prevRec && prevRec.status === 'present') {
          updatedRecords[m.id] = {
            ...prevRec,
            departureStatus,
            departureTime: departureStatus === 'departed' ? getCurrentTimeArabic() : undefined,
          };
        }
      });

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: updatedRecords,
        },
      };
    });
  };

  // Handler: Update patrols for current active session
  const handleUpdatePatrols = (newPatrols: ScoutPatrol[]) => {
    recordAction('تحديث تشكيل الطلائع الكشفية');

    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      return {
        ...prev,
        [activeDate]: {
          ...session,
          patrols: newPatrols,
        },
      };
    });
  };

  // Handler: Add New Manual Date Session
  const handleAddDate = (newDate: string, title?: string) => {
    recordAction(`إضافة تاريخ نشاط جديد (${newDate})`);

    setSessions((prev) => {
      if (prev[newDate]) return prev;
      return {
        ...prev,
        [newDate]: {
          date: newDate,
          title: title || 'نشاط كشفي',
          records: {},
        },
      };
    });
    setActiveDate(newDate);
  };

  // Handler: Delete Session
  const handleDeleteSession = (dateToDelete: string) => {
    recordAction(`حذف جلسة النشاط (${dateToDelete})`);

    setSessions((prev) => {
      const updated = { ...prev };
      delete updated[dateToDelete];
      return updated;
    });
    const remaining = Object.keys(sessions).filter((d) => d !== dateToDelete);
    if (remaining.length > 0) {
      setActiveDate(remaining[0]);
    } else {
      const today = getTodayDateString();
      handleAddDate(today);
    }
  };

  // Handler: Import full backup
  const handleImportBackup = (data: { members: ScoutMember[]; sessions: Record<string, AttendanceSession> }) => {
    recordAction('استيراد نسخة احتياطية كاملة');
    setMembers(data.members);
    setSessions(data.sessions);
    const dates = Object.keys(data.sessions);
    if (dates.length > 0) {
      setActiveDate(dates[0]);
    }
  };

  // Handler: Import from Excel (.xlsx, .xls, .csv)
  const handleImportExcelMembers = (importedMembers: ScoutMember[], mode: 'merge' | 'replace') => {
    recordAction(`استيراد ${importedMembers.length} كشاف من ملف الإكسل`);

    let finalMembers: ScoutMember[];

    if (mode === 'replace') {
      finalMembers = importedMembers;
    } else {
      // Merge: Enrich existing members if they match by name, and append newly introduced members
      const existingNameMap = new Map(members.map((m) => [m.name.trim().toLowerCase(), m]));
      const newAdditions: ScoutMember[] = [];

      const updatedExisting = members.map((existing) => {
        const imported = importedMembers.find(
          (im) => im.name.trim().toLowerCase() === existing.name.trim().toLowerCase()
        );
        if (imported) {
          return {
            ...existing,
            age: imported.age !== undefined && imported.age > 0 ? imported.age : existing.age,
            category: imported.category || existing.category,
            birthDate: imported.birthDate || existing.birthDate,
            phone: imported.phone || existing.phone,
            notes: imported.notes || existing.notes,
          };
        }
        return existing;
      });

      importedMembers.forEach((im) => {
        if (!existingNameMap.has(im.name.trim().toLowerCase())) {
          newAdditions.push(im);
        }
      });

      finalMembers = [...updatedExisting, ...newAdditions];
    }

    setMembers(finalMembers);

    // Synchronize to current active session attendance immediately
    setSessions((prev) => {
      const session = prev[activeDate] || { date: activeDate, records: {} };
      const updatedRecords = mode === 'replace' ? {} : { ...session.records };

      finalMembers.forEach((m) => {
        if (!updatedRecords[m.id]) {
          updatedRecords[m.id] = {
            memberId: m.id,
            status: 'present',
            departureStatus: 'present_not_departed',
            checkInTime: getCurrentTimeArabic(),
          };
        }
      });

      return {
        ...prev,
        [activeDate]: {
          ...session,
          records: updatedRecords,
        },
      };
    });
  };

  // Reset to initial sample data
  const handleResetSampleData = () => {
    if (confirm('هل ترغب في إعادة ضبط البيانات إلى النماذج الافتراضية لكشافة العباس؟')) {
      recordAction('إعادة ضبط البيانات إلى الوضع الافتراضي');
      localStorage.clear();
      setMembers(INITIAL_MEMBERS);
      const today = getTodayDateString();
      const initialMap = loadSessionsFromStorage();
      setSessions(initialMap);
      setActiveDate(today);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start py-0 md:py-6 px-0 md:px-4 text-slate-800 dark:text-slate-100 transition-colors`}>
      {/* Interactive Toast Notification with Inline Undo Action */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-sm sm:max-w-md w-[92vw] sm:w-auto">
          <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs border border-slate-700/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="font-bold truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {toast.canUndo && undoStack.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="تراجع عن هذا الإجراء فوراً (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>تراجع</span>
                </button>
              )}
              {toast.canRedo && redoStack.length > 0 && (
                <button
                  onClick={handleRedo}
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="إعادة تطبيق الإجراء (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>إعادة</span>
                </button>
              )}
              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Container (Supports authentic mobile chassis frame or wide layout) */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md bg-white dark:bg-slate-900 min-h-[92vh] rounded-[36px] shadow-2xl border-[10px] border-slate-900 dark:border-slate-800 overflow-hidden relative my-2'
            : 'max-w-5xl bg-slate-50 dark:bg-slate-900 min-h-screen md:min-h-0 md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden'
        }`}
      >
        {/* Mobile speaker notch when in mobile frame mode */}
        {isMobileFrame && (
          <div className="bg-slate-900 text-white pt-2.5 pb-1 flex justify-center items-center">
            <div className="w-20 h-4 bg-slate-800 rounded-full flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <div className="w-8 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        )}

        {/* Scout App Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeDate={activeDate}
          onOpenDatePicker={() => setIsDatePickerOpen(true)}
          onOpenAddMember={() => {
            setMemberToEdit(null);
            setIsAddMemberOpen(true);
          }}
          onOpenPrintReport={() => setIsPrintReportOpen(true)}
          onOpenExcelImport={() => setIsExcelImportOpen(true)}
          stats={dailyStats}
          storedDaysCount={Object.keys(sessions).length}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          undoCount={undoStack.length}
          lastActionDescription={undoStack[undoStack.length - 1]?.description}
        />

        {/* Main Content Area */}
        <main className="p-3 sm:p-5">
          {activeTab === 'attendance' ? (
            /* Window 1: نافذة الحضور والانصراف */
            <AttendanceWindow
              members={members}
              activeDate={activeDate}
              records={currentRecords}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateTimes={handleUpdateTimes}
              onOpenAddMember={() => {
                setMemberToEdit(null);
                setIsAddMemberOpen(true);
              }}
              onOpenDatePicker={() => setIsDatePickerOpen(true)}
              onBulkAttendance={handleBulkAttendance}
              onBulkDeparture={handleBulkDeparture}
              onViewPhoto={(member) => setSelectedMemberForPhoto(member)}
              onAttachPhoto={handleAttachPhoto}
              onOpenExcelImport={() => setIsExcelImportOpen(true)}
              canUndo={undoStack.length > 0}
              onUndo={handleUndo}
              undoCount={undoStack.length}
              lastActionDescription={undoStack[undoStack.length - 1]?.description}
            />
          ) : activeTab === 'members' ? (
            /* Window 2: نافذة سجل الأعضاء والفئات */
            <MembersWindow
              members={members}
              sessions={sessions}
              onOpenAddMember={() => {
                setMemberToEdit(null);
                setIsAddMemberOpen(true);
              }}
              onEditMember={(member) => {
                setMemberToEdit(member);
                setIsAddMemberOpen(true);
              }}
              onDeleteMember={handleDeleteMember}
              onViewPhoto={(member) => setSelectedMemberForPhoto(member)}
              onAttachPhoto={handleAttachPhoto}
              onContactMember={(member) => setSelectedMemberForContact(member)}
              onOpenExcelImport={() => setIsExcelImportOpen(true)}
            />
          ) : (
            /* Window 3: نافذة تشكيل الطلائع والمجاميع للحاضرين */
            <PatrolsWindow
              members={members}
              activeDate={activeDate}
              records={currentRecords}
              patrols={currentSession?.patrols || []}
              onUpdatePatrols={handleUpdatePatrols}
              onViewPhoto={(member) => setSelectedMemberForPhoto(member)}
            />
          )}
        </main>

        {/* Mobile Sticky Bottom Navigation Bar (3 Tabs + Quick Add) */}
        <nav className="fixed md:sticky bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-between shadow-lg">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              activeTab === 'attendance'
                ? 'text-[#00685e] dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 ${activeTab === 'attendance' ? 'text-[#00685e] dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
            />
            <span className="text-[10px]">1. الحضور</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              activeTab === 'members'
                ? 'text-[#00685e] dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users
              className={`w-5 h-5 ${activeTab === 'members' ? 'text-[#00685e] dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
            />
            <span className="text-[10px]">2. الأعضاء</span>
          </button>

          {/* Quick Floating Add Button in Center */}
          <button
            onClick={() => {
              setMemberToEdit(null);
              setIsAddMemberOpen(true);
            }}
            className="w-10 h-10 -mt-4 mx-1 rounded-full bg-[#00685e] dark:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 hover:bg-[#00554d] active:scale-90 transition-all border-2 border-white dark:border-slate-800 shrink-0"
            title="إضافة كشاف جديد"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('patrols')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              activeTab === 'patrols'
                ? 'text-[#00685e] dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield
              className={`w-5 h-5 ${activeTab === 'patrols' ? 'text-[#00685e] dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
            />
            <span className="text-[10px]">3. الطلائع (5/مجموعة)</span>
          </button>
        </nav>

        {/* Desktop Footer with reset and info */}
        <footer className="hidden sm:flex items-center justify-between px-5 py-3 bg-slate-100 dark:bg-slate-900/90 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/_____________e13acb2d.jpg"
              alt="كشافة العباس"
              className="w-4 h-4 rounded-full object-cover"
            />
            <span>كشافة العباس (ع) · نظام إدارة الحضور والانصراف والفئات</span>
          </div>
          <button
            onClick={handleResetSampleData}
            className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
            title="استعادة البيانات الافتراضية"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة تعيين البيانات النموذجية</span>
          </button>
        </footer>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setMemberToEdit(null);
        }}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImport={handleImportExcelMembers}
        currentMembersCount={members.length}
      />

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        activeDate={activeDate}
        onSelectDate={(date) => setActiveDate(date)}
        sessions={sessions}
        members={members}
        onAddDate={handleAddDate}
        onDeleteSession={handleDeleteSession}
        onImportBackup={handleImportBackup}
      />

      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        activeDate={activeDate}
        session={currentSession}
        members={members}
      />

      {/* Photo Preview & Scout Card Modal */}
      <PhotoPreviewModal
        member={selectedMemberForPhoto}
        onClose={() => setSelectedMemberForPhoto(null)}
        onEditPhoto={(member) => {
          setSelectedMemberForPhoto(null);
          setMemberToEdit(member);
          setIsAddMemberOpen(true);
        }}
        onContactMember={(member) => {
          setSelectedMemberForContact(member);
        }}
      />

      {/* Contact Action Modal: Direct Phone Call or WhatsApp */}
      <ContactActionModal
        isOpen={!!selectedMemberForContact}
        member={selectedMemberForContact}
        onClose={() => setSelectedMemberForContact(null)}
      />
    </div>
  );
}

export type ScoutCategory = 'براعم' | 'أشبال' | 'كشافة';

export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type DepartureStatus = 'departed' | 'present_not_departed' | 'none';

export interface ScoutMember {
  id: string;
  name: string;
  age: number; // 6-8: براعم, 9-11: أشبال, 12-14: كشافة
  category: ScoutCategory;
  birthDate?: string; // YYYY-MM-DD تاريخ الميلاد (تتحول تلقائياً إلى عمر وتتحدث مع مرور الزمن)
  photoUrl?: string; // Image data URL or link to boy's photo
  phone?: string;
  notes?: string;
  joinedDate?: string;
}

export interface DayAttendance {
  memberId: string;
  status: AttendanceStatus;
  departureStatus: DepartureStatus;
  checkInTime?: string;
  departureTime?: string;
  note?: string;
}

export interface ScoutPatrol {
  id: string;
  name: string; // اسم الطليعة
  category: ScoutCategory; // كل مجموعة تشمل الأشخاص من فئة عمرية واحدة
  memberIds: string[]; // الاسم الأول يكون هو قائد الطليعة
}

export interface AttendanceSession {
  date: string; // YYYY-MM-DD
  title?: string; // e.g. "نشاط الجمعة الأسبوعي"
  records: Record<string, DayAttendance>; // memberId -> DayAttendance
  patrols?: ScoutPatrol[]; // طلائع الحاضرين المشكلة لهذا اليوم
}

export type SortField = 'name' | 'category' | 'age' | 'status';
export type SortOrder = 'asc' | 'desc';


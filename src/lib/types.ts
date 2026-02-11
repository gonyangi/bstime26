export type RoomId = 'gangdang' | 'playground' | 'science' | 'library' | 'imagination' | 'computer';
export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
export type PeriodId = '1' | '2' | '3' | '4' | 'lunch' | '5' | '6';

export type FixedData = {
  [key: string]: string; // e.g., "science-mon-1": "3-1"
};

export type ExtraReservation = {
  id: string; // Firestore document ID
  room: string;
  date: string; // "YYYY-MM-DD"
  period: PeriodId;
  className: string;
};

export type ClassSubjects = {
  [key: string]: string; // e.g., "1-1-mon-1": "국어"
};

export type TeacherSchedules = {
  [key: string]: string; // e.g., "교무-mon-1": "3-1"
};

export interface TimetableData {
  fixedData: FixedData;
  extraRes: ExtraReservation[];
  classSubjects: ClassSubjects;
  teacherSchedules: TeacherSchedules;
}

export interface TimetableContextType extends TimetableData {
  loading: boolean;
}

import type { CommitResult } from '../types';

export type RootStackParamList = {
  Lock: undefined;
  Main: undefined;
  Setup: undefined;
};

export type TabParamList = {
  Home: undefined;
  Attendance: undefined;
  Students: undefined;
  Market: undefined;
  Settings: undefined;
};

export type AttendanceStackParamList = {
  AttendanceHome: undefined;
  SessionDetail: { sessionId: number; ministryName: string; sessionDate: string };
  AttendanceHistory: { ministryId?: number; studentId?: number };
  SessionSummary: { result: CommitResult };
};

export type StudentsStackParamList = {
  StudentList: undefined;
  StudentDetail: { studentId: number };
  AddStudent: undefined;
  EditStudent: { studentId: number };
  PointsLedger: { studentId: number; studentName: string };
  AwardPoints: { studentId: number; studentName: string };
  ArchiveStudent: { studentId: number; studentName: string };
};

export type MarketStackParamList = {
  MarketHome: undefined;
  RedeemConfirm: { studentId: number; itemId: number };
  MarketHistory: { studentId?: number };
  ManageItems: undefined;
  AddEditItem: { itemId?: number };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Ministries: undefined;
  MinistryDetail: { ministryId?: number };
  Security: undefined;
  Backup: undefined;
  About: undefined;
};

export interface User {
  userId: number;
  username: string;
  fullName: string;
  role: 'Administrator' | 'User';
  isActive?: number;
  createdDate?: string;
  lastLogin?: string;
}

export interface CourtCase {
  ID: number;
  SerialNo: number;
  CaseDate: string;        // YYYY-MM-DD
  CaseNumber: string;
  Result: string;
  DairyDate: string;       // YYYY-MM-DD
  Description: string;
  Remarks: string;
  CreatedDate: string;
  UpdatedDate: string;
  CreatedBy: string;
  UpdatedBy: string;
  DisplayCaseDate?: string; // DD-MM-YYYY
  DisplayDairyDate?: string; // DD-MM-YYYY
  statusBadge?: 'Today' | 'Tomorrow' | 'Upcoming' | 'Overdue';
}

export interface CaseProceeding {
  ID: number;
  CaseID: number;
  HearingDate: string;
  BusinessRecorded: string;
  NextHearingDate?: string;
  BenchNotes?: string;
  CreatedBy: string;
  CreatedDate: string;
  DisplayHearingDate?: string;
  DisplayNextHearingDate?: string;
  CaseNumber?: string;
  SerialNo?: number;
}

export interface CaseDocument {
  ID: number;
  CaseID: number;
  Title: string;
  DocumentType: string;
  FileName: string;
  FileSize: number;
  MimeType: string;
  Base64Data?: string;
  UploadedBy: string;
  UploadedDate: string;
}

export interface ResultOption {
  ResultID: number;
  ResultName: string;
  IsActive: number;
  CreatedDate: string;
}

export interface SystemSettings {
  appName: string;
  appSubtitle: string;
  courtName: string;
  reportHeader: string;
  reportFooter: string;
  defaultResult: string;
  dateFormat: string;
  upcomingDays: string;
  theme: string;
  autoBackup: string;
}

export interface DashboardData {
  statistics: {
    totalCases: number;
    todayCases: number;
    upcomingCases: number;
    overdueCases: number;
    pendingCases: number;
    disposedCases: number;
    monthCases: number;
    yearCases: number;
  };
  casesByResult: { Result: string; count: number }[];
  todayList: CourtCase[];
  upcomingList: CourtCase[];
  overdueList: CourtCase[];
  recentProceedings: CaseProceeding[];
  currentDateIso: string;
  currentDateDisplay: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface AuditLogItem {
  ID: number;
  Action: string;
  Module: string;
  RecordID: string;
  Details: string;
  PerformedBy: string;
  PerformedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

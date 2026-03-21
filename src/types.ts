export type UserRole = 'admin' | 'hod' | 'faculty';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId?: string;
  profilePhotoUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  hodUid?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface Attendance {
  id: string;
  facultyUid: string;
  date: string;
  status: 'present' | 'absent';
  markedBy: string;
  year: '1st' | '2nd' | '3rd';
}

export interface TimetableEntry {
  id: string;
  facultyUid: string;
  facultyName: string;
  subjectId: string;
  courseId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
}

export interface LeaveRequest {
  id: string;
  facultyUid: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  appliedAt: string;
}

export interface ResearchPublication {
  id: string;
  facultyUid: string;
  title: string;
  description?: string;
  publicationDate: string;
  fileUrl?: string;
  citations?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorUid: string;
  createdAt: string;
  targetRole: 'all' | 'hod' | 'faculty';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  information: string;
  createdAt: string;
}

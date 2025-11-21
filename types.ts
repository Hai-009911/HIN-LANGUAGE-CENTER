

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum AssignmentCategory {
    GRAMMAR = 'Ngữ pháp',
    VOCABULARY = 'Từ vựng',
    LISTENING = 'Nghe',
    SPEAKING = 'Nói',
    READING = 'Đọc',
    WRITING = 'Viết',
    WRITING_TASK_1 = 'Writing Task 1',
    WRITING_TASK_2 = 'Writing Task 2',
}

export interface Attachment {
    name: string;
    url: string;
}

// ADDED: For new Learning Objective feature
export interface LearningObjective {
  mainGoal: string;
  milestones: { text: string; completed: boolean }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bio?: string;
  birthdate?: string;
  classIds?: string[]; // For students and teachers
  learningObjective?: LearningObjective; // REPLACED goal and targetScore
  avatarUrl?: string; // ADDED: For profile pictures/videos
  phone?: string;
  parentName?: string;
  inputDetails?: string; 
  outputCommitment?: string; 
  specialNotes?: string;
  studyStreak?: number; // ADDED
  // --- NEW FIELDS ---
  schoolClass?: string;
  parentPhone?: string;
  engagementLevel?: 'low' | 'medium' | 'high';
}

export type ScheduleDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';


export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  classLinks?: {
    facebook?: string;
    zalo?: string;
    drive?: string;
  }
  // ADDED: Curriculum details
  curriculum?: {
    totalSessions: number;
    hoursPerSession: number;
    schedule: ScheduleDay[];
  }
  examDate?: string; // ADDED: For countdown
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  link: string; // Assignment is now a link
  imageUrl?: string;
  htmlContent?: string; // ADDED: For interactive HTML assignments
  classId: string;
  teacherId: string;
  createdAt: string;
  dueDate: string;
  category: AssignmentCategory;
  attachments?: Attachment[];
  attachmentRequirements?: string;
  studentIds?: string[]; // ADDED: For assigning to specific students
  readingConfig?: { startStage: string }; // ADDED: For configuring reading assignments
}

// Represents a single attempt within an interactive assignment submission.
export interface SubmissionAttempt {
  submittedAt: string;
  score: number;
  status: 'completed' | 'not completed';
  timeSpentSeconds: number;
  completedArticle?: string;
  allAttemptErrors?: string[];
  // For Reading
  commonMistakes?: string[];
  vocabularyList?: string[];
  translationStage3_0Score?: number;
  translationStage3_5Score?: number;
  // For Listening
  attemptCount?: number;
  stage2WrongAnswers?: string[];
  stage3WrongAnswers?: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: 'submitted' | 'graded'; // Replaced 'reviewed' with 'graded'
  submissionLink?: string; // ADDED: For students to submit a link (e.g., Google Drive)
  grade?: number; // Teacher's final grade
  feedback?: string; // AI feedback
  errors?: string[]; // ADDED: For tracking common errors
  gradedDriveLink?: string; // For teacher's graded work link
  attempts?: SubmissionAttempt[]; // For interactive assignments to store all attempts

  // --- NEW FIELDS FOR TEACHER RE-GRADING ---
  aiSuggestedGrade?: number; // The original score from the AI
  teacherFeedback?: string; // Teacher's specific written feedback
  isRedoRequired?: boolean; // Flag to ask student to redo the assignment
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface TeachingSession {
  id: string;
  classId: string;
  teacherId: string;
  date: string;
  topic: string;
  content: string;
}

// ADDED: New interface for announcements
export interface Announcement {
  id: string;
  classId: string;
  teacherId: string;
  content: string;
  createdAt: string;
}

// ADDED: For new Teacher Notes feature
export enum StudentNoteType {
  PARTICIPATION = 'Ghi chú Tham gia',
  COMMUNICATION = 'Liên lạc Phụ huynh',
  PERIODIC_REPORT = 'Báo cáo Định kỳ', // ADDED
  SESSION_FEEDBACK = 'Nhận xét Buổi học' // ADDED
}

export interface StudentNote {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  content: string;
  type: StudentNoteType;
  createdAt: string;
}

// ADDED: For student gamification
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
}

// ADDED: For student discussion forum
export interface DiscussionPost {
  id: string;
  classId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies?: DiscussionPost[];
}

// ADDED: for Chatbot feature
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// ADDED: For AI tool to get student details
export interface StudentDetails {
    id: string;
    name: string;
    email: string;
    classes: { id: string; name: string }[];
    recentSubmissions: { assignmentTitle: string; grade: number | undefined; status: string }[];
}

// --- ADDED FOR NEW CHATBOT FUNCTIONS ---
export interface SubmissionStatus {
    status: 'graded' | 'submitted' | 'not_submitted' | 'not_found';
    grade?: number;
    submittedAt?: string;
    message: string;
}

export interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
}
// --- END ADDED FOR NEW CHATBOT FUNCTIONS ---


// --- ADDED FOR NEW FEATURES ---

// For Discipline Score
export interface DisciplineLog {
    date: string;
    points: number; // e.g., -5
    reason: string;
}

export interface StudentDiscipline {
    studentId: string;
    score: number;
    logs: DisciplineLog[];
}

// For urgent notifications to students
export interface UrgentNotification {
    id: string;
    studentId: string;
    teacherId: string;
    content: string;
    createdAt: string;
    isRead: boolean;
}

// For Teacher Dashboard Student Overview
export interface StudentOverview {
  id: string;
  name: string;
  email: string;
  averageGrade: number;
  disciplineScore: number;
}

// For Lesson Library feature
export interface LessonTemplate {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  link: string;
  htmlContent?: string;
  category: AssignmentCategory;
  attachments?: Attachment[];
  attachmentRequirements?: string;
  assignedClassIds: string[]; // ADDED
}

// ADDED: For material comments
export interface MaterialComment {
    id: string;
    materialId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
}

// ADDED: For external submission verification
export interface PendingSubmission {
  id: string;
  studentId: string;
  studentNameAttempt: string;
  classNameAttempt: string;
  assignmentTitleAttempt: string;
  score: number;
  submittedAt: string;
  status: 'completed' | 'not completed';
  timeSpentSeconds: number;
  // --- NEW FIELDS FOR DETAILED RESULTS ---
  // For Writing
  completedArticle?: string;
  allAttemptErrors?: string[];
  retryCount?: number;
  // For Listening
  attemptCount?: number;
  stage2WrongAnswers?: string[];
  stage3WrongAnswers?: string[];
  // For Reading
  commonMistakes?: string[];
  vocabularyList?: string[];
  translationStage3_0Score?: number;
  translationStage3_5Score?: number;
}

// ADDED: For comprehensive test results
export interface Test {
  id: string;
  name: string;
  classId: string;
  date: string;
  // Defines the columns/scores for this test
  // Example: [{ key: 'reading_band', label: 'Reading Band' }]
  scoreStructure: { key: string; label: string; type: 'raw' | 'band' | 'overall' }[];
}

export interface TestScore {
  id: string;
  testId: string;
  studentId: string;
  // scores will have keys matching scoreStructure keys
  scores: { [key: string]: number | undefined };
}

// ADDED: For editable warning statistics
export interface WarningLog {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  reason: string;
  createdAt: string;
}

// ADDED: For per-student lesson assignments
export interface StudentLesson {
  id: string;
  studentId: string;
  lessonTemplateId: string;
  classId: string; // for context
  assignedAt: string;
  status: 'not_started' | 'completed';
}

// ADDED: For teacher meetings
export interface TeacherMeeting {
  id: string;
  teacherId: string;
  title: string;
  date: string; // ISO string
  driveLink: string;
  notes?: string;
  completedTasks?: { text: string; completed: boolean }[];
}

// ADDED: For teacher hour logging
export interface TeachingHourLog {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  notes: string;
  status: 'pending' | 'confirmed' | 'rejected';
  originalScheduledHours: number;
}

// --- ADDED FOR CLASS HEALTH DASHBOARD ---
export interface StudentToWatch {
    studentId: string;
    name: string;
    reason: string;
    value: number | string;
    avatarUrl?: string;
}

export interface ProblematicAssignment {
    assignmentId: string;
    title: string;
    reason: string;
    value: string;
}

export interface RecentActivity {
    id: string;
    type: 'submission' | 'discussion';
    authorName: string;
    content: string;
    timestamp: string;
}

export interface ClassHealthOverview {
    studentsToWatch: StudentToWatch[];
    problematicAssignments: ProblematicAssignment[];
    recentActivity: RecentActivity[];
}
// --- END ADDED FOR CLASS HEALTH DASHBOARD ---

import { 
    User, UserRole, Class, Assignment, Submission, AssignmentCategory, 
    Announcement, StudentNote, StudentNoteType, StudentDiscipline, 
    LessonTemplate, Test, TestScore, TeacherMeeting, TeachingHourLog, 
    PendingSubmission, WarningLog, StudentLesson, MaterialComment, UrgentNotification,
    Badge, DiscussionPost, StudentDetails, SubmissionStatus, AttendanceSummary, DisciplineLog 
} from '../types';

// --- UTILITY ---
export const generateId = () => Math.random().toString(36).substring(2, 11);

// --- BASE DATA ---
const today = new Date();
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// --- USERS ---
const mockUsers: User[] = [
  { id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: UserRole.ADMIN },
  { id: 'teacher1', name: 'Alice Teacher', email: 'teacher@example.com', role: UserRole.TEACHER, classIds: ['class1', 'class2'] },
  { id: 'student1', name: 'Student User', email: 'student@example.com', role: UserRole.STUDENT, classIds: ['class1'], learningObjective: { mainGoal: 'Đạt IELTS 7.0', milestones: [{text: 'Hoàn thành khóa ngữ pháp', completed: true}, {text: 'Luyện nói hàng ngày', completed: false}] }, avatarUrl: 'https://i.pravatar.cc/150?u=student1', bio: 'I love learning English!', studyStreak: 12 },
  { id: 'student2', name: 'Charlie Brown', email: 'charlie@example.com', role: UserRole.STUDENT, classIds: ['class1'] },
  { id: 'student3', name: 'Diana Prince', email: 'diana@example.com', role: UserRole.STUDENT, classIds: ['class2'] },
  { id: 'student4', name: 'Bruce Wayne', email: 'bruce@example.com', role: UserRole.STUDENT, classIds: ['class2'] },
];

// --- CLASSES ---
const mockClasses: Class[] = [
  { id: 'class1', name: 'IELTS Foundation K46', teacherId: 'teacher1', studentIds: ['student1', 'student2'], examDate: addDays(today, 30).toISOString(), curriculum: { totalSessions: 24, hoursPerSession: 2, schedule: ['tuesday', 'thursday'] }, classLinks: { zalo: 'https://zalo.me', drive: 'https://drive.google.com'} },
  { id: 'class2', name: 'Advanced Grammar', teacherId: 'teacher1', studentIds: ['student3', 'student4'], curriculum: { totalSessions: 16, hoursPerSession: 1.5, schedule: ['monday', 'wednesday']} },
];

// --- ASSIGNMENTS ---
const mockAssignments: Assignment[] = [
  { id: 'assign1', title: 'Grammar Practice 1', description: 'Complete exercises 1-5 in the textbook.', classId: 'class1', teacherId: 'teacher1', createdAt: addDays(today, -8).toISOString(), dueDate: addDays(today, 2).toISOString(), category: AssignmentCategory.GRAMMAR, link: '#' },
  { id: 'assign2', title: 'Writing Task 2: Environment', description: 'Write an essay about environmental problems. You should write at least 250 words.', classId: 'class1', teacherId: 'teacher1', createdAt: addDays(today, -5).toISOString(), dueDate: addDays(today, 5).toISOString(), category: AssignmentCategory.WRITING_TASK_2, link: 'https://hinwebwritingtask2update.netlify.app/' },
  { id: 'assign3', title: 'Vocabulary Unit 3', description: 'Learn the new words from Unit 3 and do the quiz.', classId: 'class2', teacherId: 'teacher1', createdAt: addDays(today, -10).toISOString(), dueDate: addDays(today, -2).toISOString(), category: AssignmentCategory.VOCABULARY, link: '#' },
  { id: 'assign4', title: 'Past Tense Review', description: 'Complete the review exercises on past tenses.', classId: 'class1', teacherId: 'teacher1', createdAt: addDays(today, -7).toISOString(), dueDate: addDays(today, -4).toISOString(), category: AssignmentCategory.GRAMMAR, link: '#' },
  { id: 'assign5', title: 'Bài học: Henry Moore (GĐ 3)', description: 'Reading practice about Henry Moore.', classId: 'class1', teacherId: 'teacher1', createdAt: addDays(today, -6).toISOString(), dueDate: addDays(today, 10).toISOString(), category: AssignmentCategory.READING, link: '#', readingConfig: { startStage: 'stage3.1' }},
];

// --- SUBMISSIONS ---
const mockSubmissions: Submission[] = [
  { id: 'sub1', assignmentId: 'assign4', studentId: 'student1', submittedAt: addDays(today, -5).toISOString(), status: 'graded', grade: 85, feedback: 'Good job on the past simple, but be careful with irregular verbs.', teacherFeedback: 'Excellent work on your essay structure! However, try to use more varied vocabulary in your next piece.' },
  { id: 'sub2', assignmentId: 'assign3', studentId: 'student3', submittedAt: addDays(today, -3).toISOString(), status: 'submitted', submissionLink: 'https://docs.google.com/document/d/example' },
  { id: 'sub3', assignmentId: 'assign4', studentId: 'student2', submittedAt: addDays(today, -4).toISOString(), status: 'submitted' },
];

// --- ANNOUNCEMENTS ---
const mockAnnouncements: Announcement[] = [
    { id: 'ann1', classId: 'class1', teacherId: 'teacher1', content: 'Remember the upcoming test next week! Review units 1-3.', createdAt: new Date().toISOString() }
];

// --- STUDENT NOTES ---
const mockStudentNotes: StudentNote[] = [
    { id: 'note1', studentId: 'student2', classId: 'class1', teacherId: 'teacher1', content: 'Went late by 15 mins.', type: StudentNoteType.PARTICIPATION, createdAt: addDays(today, -2).toISOString() },
    { id: 'note2', studentId: 'student1', classId: 'class1', teacherId: 'teacher1', content: 'Very active in speaking practice today.', type: StudentNoteType.SESSION_FEEDBACK, createdAt: addDays(today, -2).toISOString() }
];

// --- DISCIPLINE ---
const mockDiscipline: StudentDiscipline[] = mockUsers.filter(u => u.role === UserRole.STUDENT).map(u => ({
    studentId: u.id, score: u.id === 'student2' ? 95 : 100, logs: u.id === 'student2' ? [{ date: addDays(today, -2).toISOString(), points: -5, reason: 'Đi học muộn'}] : []
}));

// --- LESSON TEMPLATES ---
const mockLessonTemplates: LessonTemplate[] = [
    { id: 'lesson1', teacherId: 'teacher1', title: 'Intro to IELTS Writing Task 1', description: 'Learn about different chart types and how to describe them.', link: 'https://www.youtube.com/watch?v=example1', category: AssignmentCategory.WRITING_TASK_1, assignedClassIds: ['class1'] },
    { id: 'lesson2', teacherId: 'teacher1', title: 'Advanced Tenses', description: 'A review of perfect and continuous tenses.', link: 'https://www.youtube.com/watch?v=example2', category: AssignmentCategory.GRAMMAR, assignedClassIds: [] }
];

// --- PENDING SUBMISSIONS ---
const mockPendingSubmissions: PendingSubmission[] = [
    { id: 'pending1', studentId: 'unknown', studentNameAttempt: 'Bruce W.', classNameAttempt: 'Advanced Grammar', assignmentTitleAttempt: 'Vocabulary Unit 3', score: 92, submittedAt: new Date().toISOString(), status: 'completed', timeSpentSeconds: 600 }
];

export let mockData = {
    users: mockUsers,
    classes: mockClasses,
    assignments: mockAssignments,
    submissions: mockSubmissions,
    announcements: mockAnnouncements,
    studentNotes: mockStudentNotes,
    discipline: mockDiscipline,
    lessonTemplates: mockLessonTemplates,
    pendingSubmissions: mockPendingSubmissions,
    tests: [] as Test[],
    testScores: [] as TestScore[],
    teacherMeetings: [] as TeacherMeeting[],
    teachingHourLogs: [] as TeachingHourLog[],
    warningLogs: [] as WarningLog[],
    studentLessons: [] as StudentLesson[],
    materialComments: [] as MaterialComment[],
    // FIX: Added mock data for notifications to enable testing of the feature.
    urgentNotifications: [
        { id: 'notif1', studentId: 'student1', teacherId: 'teacher1', content: 'Urgent: Please submit your overdue assignment immediately.', createdAt: new Date().toISOString(), isRead: false }
    ] as UrgentNotification[],
    // FIX: Added mock data for discussion posts.
    discussionPosts: [
        { id: 'post1', classId: 'class1', authorId: 'student2', authorName: 'Charlie Brown', content: 'Can anyone explain the difference between past simple and present perfect again?', createdAt: addDays(today, -1).toISOString() }
    ] as DiscussionPost[],
};
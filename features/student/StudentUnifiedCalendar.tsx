import React, { useState } from 'react';
import { User } from '../../types';
import StudentClassSchedule from './StudentClassSchedule';
import StudentCalendar from './StudentCalendar';

interface StudentUnifiedCalendarProps {
    currentUser: User;
}

const StudentUnifiedCalendar: React.FC<StudentUnifiedCalendarProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'class' | 'assignment'>('class');

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Lịch</h1>
             <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('class')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'class' ? 'border-hin-orange text-hin-blue-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Lịch học lớp
                    </button>
                    <button onClick={() => setActiveTab('assignment')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignment' ? 'border-hin-orange text-hin-blue-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Lịch làm bài
                    </button>
                </nav>
            </div>
            {activeTab === 'class' && <StudentClassSchedule currentUser={currentUser} />}
            {activeTab === 'assignment' && <StudentCalendar currentUser={currentUser} />}
        </div>
    );
};

export default StudentUnifiedCalendar;

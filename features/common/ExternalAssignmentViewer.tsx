import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { Assignment, Submission, User } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface ExternalAssignmentViewerProps {
  assignment: Assignment;
  submission: Submission;
  currentUser: User;
  onBack: () => void;
}

const FullscreenEnterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m0 0v-4m0 4l-5-5" />
    </svg>
);


const ExternalAssignmentViewer: React.FC<ExternalAssignmentViewerProps> = ({ assignment, submission, currentUser, onBack }) => {
  const [error, setError] = useState('');
  const [alertInfo, setAlertInfo] = useState<{ message: string } | null>(null);
  const [className, setClassName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClassName = async () => {
        const cls = await api.getClassDetails(assignment.classId);
        if (cls) setClassName(cls.name);
    }
    fetchClassName();
    
    // Fallback listener for specific iframe-only messages like alerts.
    const handleIframeMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'HIN_ALERT' && typeof data.message === 'string') {
        setAlertInfo({ message: data.message });
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [assignment]);

  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const getAssignmentUrl = () => {
    if (!assignment.link || assignment.link === '#') return '';
    try {
        const url = new URL(assignment.link);
        url.searchParams.append('studentId', currentUser.id);
        url.searchParams.append('studentName', currentUser.name);
        url.searchParams.append('classId', assignment.classId);
        url.searchParams.append('className', className);
        url.searchParams.append('assignmentTitle', assignment.title);
        url.searchParams.append('submissionId', submission.id);
        url.searchParams.append('dueDate', assignment.dueDate);
        return url.toString();
    } catch(e) {
        return assignment.link;
    }
  };
  
  const assignmentSrc = assignment.htmlContent ? undefined : getAssignmentUrl();
  const assignmentSrcDoc = assignment.htmlContent ? assignment.htmlContent.replace('</body>', `<script>window.HIN_DATA = ${JSON.stringify({ submissionId: submission.id })}</script></body>`) : undefined;


  return (
    <div ref={containerRef} className="h-full w-full flex flex-col bg-hin-blue-50">
       <Modal
          isOpen={!!alertInfo}
          onClose={() => setAlertInfo(null)}
          title="Thông báo từ Bài tập"
       >
           <div className="p-6">
               <p>{alertInfo?.message}</p>
           </div>
           <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
               <Button onClick={() => setAlertInfo(null)}>OK</Button>
           </div>
       </Modal>
        
        <header className="p-3 bg-white flex-shrink-0 flex justify-between items-center border border-hin-blue-500">
             <h1 className="text-lg font-bold text-hin-blue-900 truncate pr-4">{assignment.title}</h1>
             <div className="flex items-center gap-2">
                <Button onClick={handleFullscreen} variant="ghost" size="sm" aria-label="Toàn màn hình">
                    <FullscreenEnterIcon />
                </Button>
                <Button onClick={onBack} variant="secondary" size="sm">
                    Thoát
                </Button>
             </div>
        </header>
      
        {error && <p className="px-4 pt-2 text-red-500">{error}</p>}

        <div className="flex-grow relative">
            <iframe
                src={assignmentSrc}
                srcDoc={assignmentSrcDoc}
                title={assignment.title}
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
                allowFullScreen
                allow="autoplay; camera; microphone; geolocation; display-capture"
            />
        </div>
    </div>
  );
};

export default ExternalAssignmentViewer;

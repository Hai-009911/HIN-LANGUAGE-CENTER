import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import Modal from './Modal';
import Spinner from './Spinner';
import { UserRole } from '../../types';

// Speech Recognition interface for browser compatibility
interface SpeechRecognition {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
    onresult: (event: any) => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

interface QuickSearchAiProps {
  onNavigate: (view: string) => void;
  userRole: UserRole;
}

const QuickSearchAi: React.FC<QuickSearchAiProps> = ({ onNavigate, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const teacherViews = "'dashboard' (bảng điều khiển), 'my-classes' (lớp học), 'assignments' (bài tập), 'attendance' (điểm danh), 'calendar' (lịch học)";
  const studentViews = "'dashboard' (bảng điều khiển), 'my-class' (lớp học), 'assignments' (bài tập), 'progress-report' (báo cáo tiến độ), 'achievements' (thành tích), 'calendar' (lịch học)";

  const navigateToFunctionDeclaration: FunctionDeclaration = {
      name: 'navigateTo',
      description: 'Điều hướng người dùng đến một trang cụ thể trong ứng dụng.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              view: {
                  type: Type.STRING,
                  description: `Trang cần điều hướng đến. Các giá trị hợp lệ cho vai trò ${userRole} là: ${userRole === UserRole.TEACHER ? teacherViews : studentViews}.`
              }
          },
          required: ['view']
      }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Trình duyệt không hỗ trợ Web Speech API.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        console.error('Lỗi nhận dạng giọng nói:', event.error);
        setIsListening(false);
    };
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Automatically submit after voice input
        handleSearch(transcript);
    };
    recognitionRef.current = recognition;

    return () => {
        recognitionRef.current?.stop();
    };
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Dựa trên yêu cầu của người dùng, hãy điều hướng đến trang phù hợp. Yêu cầu của người dùng: "${query}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ functionDeclarations: [navigateToFunctionDeclaration] }]
        }
      });

      const functionCall = response.functionCalls?.[0];

      if (functionCall?.name === 'navigateTo' && functionCall.args.view) {
        const view = functionCall.args.view as string;
        onNavigate(view);
        setIsOpen(false);
        setInputValue('');
      } else {
        // Fallback if no function call is returned
        alert("Tôi không hiểu yêu cầu của bạn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bằng AI:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputValue);
  };
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-hin-orange"
        aria-label="Tìm kiếm nhanh bằng AI"
      >
        <SearchIcon />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tìm kiếm nhanh bằng AI" size="lg">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Bạn muốn đi đâu? Hãy nói hoặc gõ lệnh. Ví dụ: "mở bài tập" hoặc "xem điểm danh".
          </p>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border border-gray-300 rounded-full p-1 focus-within:ring-2 focus-within:ring-hin-orange">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tôi có thể giúp gì cho bạn?"
              className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <MicIcon />
            </button>
          </form>
          {isLoading && (
            <div className="flex justify-center items-center mt-4">
              <Spinner size="sm" />
              <p className="ml-2 text-sm text-gray-600">AI đang xử lý...</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default QuickSearchAi;

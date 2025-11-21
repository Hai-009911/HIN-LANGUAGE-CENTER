import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type, GenerateContentResponse, Part } from "@google/genai";
import { api } from '../../services/api';
import { ChatMessage, StudentDetails, SubmissionStatus, AttendanceSummary } from '../../types';
import Spinner from './Spinner';

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const SendIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const findStudentByNameFunctionDeclaration: FunctionDeclaration = {
    name: 'findStudentByName',
    description: 'Tìm kiếm thông tin chi tiết của một học viên bằng tên của họ. Bao gồm ID, email, các lớp học và các bài nộp gần đây.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: 'Tên của học viên cần tìm kiếm.'
            }
        },
        required: ['name']
    }
};

const getSubmissionStatusFunctionDeclaration: FunctionDeclaration = {
    name: 'getSubmissionStatus',
    description: 'Kiểm tra trạng thái nộp bài và điểm số của một bài tập cụ thể cho một học viên.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            studentName: { type: Type.STRING, description: 'Tên đầy đủ của học viên.' },
            assignmentTitle: { type: Type.STRING, description: 'Tiêu đề hoặc một phần tiêu đề của bài tập cần kiểm tra.' }
        },
        required: ['studentName', 'assignmentTitle']
    }
};

const getAttendanceSummaryFunctionDeclaration: FunctionDeclaration = {
    name: 'getAttendanceSummary',
    description: 'Lấy thống kê chuyên cần (có mặt, vắng, trễ) của một học viên trong một lớp học.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            studentName: { type: Type.STRING, description: 'Tên đầy đủ của học viên.' },
            classId: { type: Type.STRING, description: 'ID của lớp học để kiểm tra chuyên cần.' }
        },
        required: ['studentName', 'classId']
    }
};


export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Chào bạn! Tôi là trợ lý ảo của Hin. Tôi có thể giúp gì cho bạn? (VD: "bài tập Henry Moore của Student User đã được chấm chưa?")' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chatRef.current) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'Bạn là một trợ lý ảo hữu ích cho trung tâm Anh ngữ Hin. Bạn có thể trả lời các câu hỏi, xác minh thông tin (ví dụ: "bài tập của em A đã được chấm chưa?"), và giúp tìm kiếm thông tin học viên. Hãy trả lời bằng tiếng Việt.',
                    tools: [{ functionDeclarations: [findStudentByNameFunctionDeclaration, getSubmissionStatusFunctionDeclaration, getAttendanceSummaryFunctionDeclaration] }]
                }
            });
        }
    }, [isOpen]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMessage.text });
            let modelResponseText = response.text;

            // Check for function calls
            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionCalls = response.functionCalls;
                const functionResponseParts: Part[] = [];

                for (const fc of functionCalls) {
                    let result;
                    if (fc.name === 'findStudentByName' && fc.args.name) {
                        result = await api.findStudentByName(fc.args.name as string);
                    } else if (fc.name === 'getSubmissionStatus' && fc.args.studentName && fc.args.assignmentTitle) {
                        result = await api.getSubmissionStatus(fc.args.studentName as string, fc.args.assignmentTitle as string);
                    } else if (fc.name === 'getAttendanceSummary' && fc.args.studentName && fc.args.classId) {
                        result = await api.getAttendanceSummary(fc.args.studentName as string, fc.args.classId as string);
                    }

                    functionResponseParts.push({
                        functionResponse: {
                            name: fc.name,
                            response: {
                                name: fc.name,
                                content: result ? JSON.stringify(result) : JSON.stringify({ error: "Không tìm thấy thông tin." }),
                            }
                        }
                    });
                }

                const functionResponseResult = await chatRef.current.sendMessage({ message: functionResponseParts });
                modelResponseText = functionResponseResult.text;
            }

            const modelMessage: ChatMessage = { role: 'model', text: modelResponseText };
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-hin-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-hin-blue-800 focus:outline-none focus:ring-2 focus:ring-hin-blue-800 focus:ring-offset-2"
                    aria-label="Open Chatbot"
                >
                    <ChatIcon />
                </button>
            </div>

            <div className={`fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                <header className="flex items-center justify-between p-4 border-b bg-hin-blue-800 text-white rounded-t-2xl">
                    <h3 className="font-semibold">Hin Assistant</h3>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-hin-blue-700">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl ${msg.role === 'user' ? 'bg-hin-blue-700 text-white' : 'bg-gray-200 text-hin-blue-900'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-[80%] px-3 py-2 rounded-xl bg-gray-200 text-hin-blue-900 flex items-center">
                                <Spinner size="sm" className="mr-2" /> Đang suy nghĩ...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập câu hỏi của bạn..."
                            className="flex-1 px-4 py-2 bg-gray-100 border-transparent border rounded-full focus:ring-2 focus:ring-hin-orange focus:outline-none"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-hin-blue-700 text-white rounded-full disabled:bg-gray-300 hover:bg-hin-blue-800 focus:outline-none focus:ring-2 focus:ring-hin-blue-800 focus:ring-offset-2"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </>
    );
};
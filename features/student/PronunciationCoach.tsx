import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { User } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

// Audio decoding helpers from Gemini guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Blob to base64 helper
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
  });
};

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V14a1 1 0 10-2 0v.93a7 7 0 00-5.94 6.01a1 1 0 101.98.2A5 5 0 0110 16a5 5 0 014.96 4.14a1 1 0 101.98-.2A7 7 0 0011 14.93z" clipRule="evenodd" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;

const PronunciationCoach: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [textToPractice, setTextToPractice] = useState('Hello world, this is a beautiful day to learn English.');
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isLoadingTts, setIsLoadingTts] = useState(false);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleListen = async () => {
        if (!textToPractice.trim()) {
            setError('Vui lòng nhập văn bản để nghe.');
            return;
        }
        setIsLoadingTts(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: textToPractice }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            } else {
                throw new Error("Không nhận được dữ liệu âm thanh từ AI.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Không thể phát âm thanh.');
        } finally {
            setIsLoadingTts(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioBlob(null);
            setFeedback('');
        } catch (err) {
            console.error('Không thể truy cập micro:', err);
            setError('Không thể truy cập micro. Vui lòng cấp quyền và thử lại.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleGetFeedback = async () => {
        if (!audioBlob) {
            setError('Vui lòng ghi âm giọng nói của bạn trước.');
            return;
        }
        setIsLoadingFeedback(true);
        setError('');
        setFeedback('');

        try {
            const audioData = await blobToBase64(audioBlob);
            const audioPart = {
                inlineData: {
                    mimeType: audioBlob.type,
                    data: audioData,
                },
            };
            const textPart = {
                text: `You are an expert English pronunciation coach. The user is practicing the sentence: "${textToPractice}". Analyze their pronunciation in the provided audio. Give specific, constructive feedback on any mispronounced words, sounds, intonation, or rhythm. Keep the feedback concise and encouraging. Respond in Vietnamese.`
            };
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [textPart, audioPart] },
            });
            
            setFeedback(response.text);
            
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Không thể nhận được phản hồi từ AI.');
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-hin-blue-900 dark:text-white">Huấn luyện viên Phát âm AI</h1>
            <p className="text-gray-600 dark:text-gray-400">Nhập một câu, nghe AI đọc mẫu, ghi âm lại giọng của bạn và nhận phản hồi chi tiết.</p>

            <Card>
                <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">1. Nhập văn bản</h3></CardHeader>
                <CardContent>
                    <textarea
                        value={textToPractice}
                        onChange={(e) => setTextToPractice(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md p-2 dark:bg-hin-blue-900 dark:text-white dark:border-hin-blue-600"
                        placeholder="Nhập câu hoặc từ bạn muốn luyện tập..."
                    />
                    <div className="mt-2 text-right">
                        <Button onClick={handleListen} disabled={isLoadingTts}>
                            {isLoadingTts ? <Spinner size="sm" /> : <><PlayIcon /> Nghe mẫu</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">2. Ghi âm giọng nói của bạn</h3></CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? 'danger' : 'primary'} size="lg" className="w-48">
                        <MicIcon /> {isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
                    </Button>
                    {isRecording && <p className="text-sm text-red-500 animate-pulse">Đang ghi âm...</p>}
                    {audioBlob && !isRecording && <p className="text-sm text-green-600">✓ Đã ghi âm xong. Sẵn sàng nhận phản hồi.</p>}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">3. Nhận phản hồi từ AI</h3></CardHeader>
                 <CardContent>
                     <div className="text-center">
                        <Button onClick={handleGetFeedback} disabled={!audioBlob || isLoadingFeedback} size="lg">
                            {isLoadingFeedback ? <Spinner /> : 'Nhận phản hồi'}
                        </Button>
                     </div>
                     {isLoadingFeedback && <p className="text-center text-sm text-gray-500 mt-4">AI đang phân tích giọng nói của bạn...</p>}
                     {feedback && (
                         <div className="mt-4 p-4 bg-hin-blue-50 dark:bg-hin-blue-900/50 rounded-md border dark:border-hin-blue-700">
                             <h4 className="font-bold text-hin-blue-800 dark:text-hin-blue-100">Phản hồi của Huấn luyện viên AI:</h4>
                             <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2">{feedback}</p>
                         </div>
                     )}
                 </CardContent>
            </Card>
             {error && <p className="text-center text-red-500">{error}</p>}
        </div>
    );
};

export default PronunciationCoach;
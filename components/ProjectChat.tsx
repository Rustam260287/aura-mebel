
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { ProjectContext, ChatMessage } from '../types';

// --- Speech Recognition Hook ---
const useSpeechRecognition = (onResult: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            onResult(finalTranscript + interimTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onResult]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
        setIsListening(!isListening);
    };
    
    return { isListening, toggleListening };
};


interface ProjectChatProps {
  project: ProjectContext;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ project }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(project.chatHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isListening, toggleListening } = useSpeechRecognition(setInput);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) toggleListening(); // Stop listening on send

    const userMessage = input.trim();
    if (!userMessage || isLoading || !user) return;

    const newMessage: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/projects/${project.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const aiResponse = await res.json();
      setMessages(prev => [...prev, aiResponse]);
      
      if (aiResponse.action?.type === 'SET_MATERIAL') {
          const event = new CustomEvent('set-material', { detail: aiResponse.action.payload });
          window.dispatchEvent(event);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Ошибка. Попробуйте позже." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white max-w-3xl mx-auto h-[70vh] flex flex-col rounded-2xl shadow-lg border border-gray-200">
      <div className="p-4 border-b">
        <h3 className="font-bold text-lg">{project.name}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-brown text-white' : 'bg-gray-100'}`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2 items-center">
        <button type="button" onClick={toggleListening} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-100'}`}>
          <MicrophoneIcon className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Слушаю вас..." : "Спросите AI..."}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
        />
        <button type="submit" disabled={isLoading} className="bg-brand-brown text-white p-2 rounded-full disabled:opacity-50">
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

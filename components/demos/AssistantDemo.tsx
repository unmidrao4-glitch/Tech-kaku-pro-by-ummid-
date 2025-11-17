
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, ChatModel } from '../../types';
import { streamChat } from '../../services/geminiService';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Loader } from '../ui/Loader';

const GroundingChunk: React.FC<{ chunk: any }> = ({ chunk }) => {
    const source = chunk.web || chunk.maps;
    if (!source) return null;

    return (
        <a href={source.uri} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-gray-700 hover:bg-gray-600 rounded-full px-2 py-1 transition-colors block truncate max-w-full">
            🌐 {source.title}
        </a>
    );
};

export const AssistantDemo: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState<ChatModel>('flash');
    const [useGrounding, setUseGrounding] = useState(true);
    const location = useGeolocation();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setHistory(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await streamChat(
                history,
                input,
                model,
                useGrounding,
                (location.latitude && location.longitude) ? { latitude: location.latitude, longitude: location.longitude } : null
            );

            let fullResponse = '';
            let groundingChunks: any[] = [];
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                fullResponse += chunk.text;
                if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                }
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: fullResponse }], groundingChunks };
                    return newHistory;
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Sorry, I encountered an error.' }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px]">
            <div className="flex-grow overflow-y-auto pr-4" ref={chatContainerRef}>
                <div className="space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <span className="text-2xl mt-1">🤖</span>}
                            <div className={`p-3 rounded-2xl max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-gray-600 space-y-1">
                                        {msg.groundingChunks.map((chunk, i) => <GroundingChunk key={i} chunk={chunk} />)}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && <span className="text-2xl mt-1">🧑‍💻</span>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">🤖</span>
                            <div className="p-3 rounded-2xl bg-gray-700">
                                <Loader size="sm" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Model</label>
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button onClick={() => setModel('lite')} className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition ${model === 'lite' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}>Lite (Fast)</button>
                            <button onClick={() => setModel('flash')} className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition ${model === 'flash' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}>Flash (Balanced)</button>
                            <button onClick={() => setModel('pro')} className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition ${model === 'pro' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}>Pro (Complex)</button>
                        </div>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-1">
                            <input type="checkbox" checked={useGrounding} onChange={e => setUseGrounding(e.target.checked)} className="form-checkbox bg-gray-600 border-gray-500 text-indigo-500 rounded focus:ring-indigo-500" />
                            <span className="text-sm">Use Google Search/Maps</span>
                        </label>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask Kaku anything..."
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

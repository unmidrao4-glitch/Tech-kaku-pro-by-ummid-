
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { GoogleGenAISession, LiveServerMessage } from '@google/genai';
import { connectLive } from '../../services/geminiService';

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
// --- End Audio Utility Functions ---


interface TranscriptionTurn {
    user: string;
    model: string;
}

export const LiveConversationDemo: React.FC = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [status, setStatus] = useState('Not Connected');
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionTurn[]>([]);
    const [currentTranscription, setCurrentTranscription] = useState<TranscriptionTurn>({ user: '', model: '' });

    const sessionPromiseRef = useRef<Promise<GoogleGenAISession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    
    // For output audio
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopSession = useCallback(async () => {
        if (!sessionPromiseRef.current) return;
        setIsSessionActive(false);
        setStatus('Disconnecting...');
        
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.error('Error closing session:', e);
        }

        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        
        audioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        sessionPromiseRef.current = null;
        setStatus('Not Connected');
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if(isSessionActive) {
                stopSession();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSessionActive]);


    const startSession = async () => {
        setIsSessionActive(true);
        setStatus('Connecting...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            const onMessage = async (message: LiveServerMessage) => {
                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscription += text;
                    setCurrentTranscription(prev => ({...prev, model: currentOutputTranscription}));
                } else if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscription += text;
                    setCurrentTranscription(prev => ({...prev, user: currentInputTranscription}));
                }

                if (message.serverContent?.turnComplete) {
                    setTranscriptionHistory(prev => [...prev, {user: currentInputTranscription, model: currentOutputTranscription}]);
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                    setCurrentTranscription({user: '', model: ''});
                }
                
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                    const source = outputAudioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContextRef.current.destination);
                    source.addEventListener('ended', () => sourcesRef.current.delete(source));
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }

                if (message.serverContent?.interrupted) {
                    for (const source of sourcesRef.current.values()) {
                        source.stop();
                    }
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            };
            
            sessionPromiseRef.current = connectLive({
                onopen: () => {
                    setStatus('Connected. Speak now!');
                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    mediaStreamSourceRef.current = source;
                    const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = processor;

                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(processor);
                    processor.connect(audioContextRef.current!.destination);
                },
                onmessage: onMessage,
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setStatus(`Error: ${e.message}`);
                    stopSession();
                },
                onclose: () => {
                    setStatus('Connection Closed');
                    setIsSessionActive(false);
                },
            });

            await sessionPromiseRef.current;
        } catch (error) {
            console.error('Failed to start session:', error);
            setStatus(`Failed to start: ${(error as Error).message}`);
            setIsSessionActive(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h3 className="text-2xl font-bold mb-4">Live Conversation with Kaku AI</h3>
            <p className="mb-6 text-gray-400">
                Press Start and speak into your microphone to have a real-time conversation.
            </p>

            <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105
                    ${isSessionActive ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}
                `}
            >
                {isSessionActive ? 'Stop Session' : 'Start Session'}
            </button>

            <p className="mt-4 text-sm font-mono p-2 bg-gray-900 rounded">
                Status: <span className={isSessionActive ? 'text-green-400' : 'text-yellow-400'}>{status}</span>
            </p>

            <div className="mt-6 w-full max-w-2xl h-64 bg-gray-900 rounded-lg p-4 overflow-y-auto text-left text-sm font-mono border border-gray-700">
                {transcriptionHistory.map((turn, i) => (
                    <div key={i} className="mb-3">
                        <p><strong className="text-indigo-400">You:</strong> {turn.user}</p>
                        <p><strong className="text-teal-400">Kaku:</strong> {turn.model}</p>
                    </div>
                ))}
                {isSessionActive && (
                    <div>
                        <p><strong className="text-indigo-400">You:</strong> {currentTranscription.user}<span className="animate-pulse">_</span></p>
                        <p><strong className="text-teal-400">Kaku:</strong> {currentTranscription.model}{currentTranscription.model && <span className="animate-pulse">_</span>}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
